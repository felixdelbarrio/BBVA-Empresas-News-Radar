import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {read,readServerScript} from '../scripts/source.mjs';
function mail(){
  const calls=[],settings=JSON.parse(read('assets/configuration-defaults.json')).settings;
  let response={sendAsEmail:settings.newsletterSender,verificationStatus:'accepted'},code=200,admin=true;
  const c=vm.createContext({Utilities:{Charset:{UTF_8:'UTF-8'},getUuid:()=> 'test-boundary',base64Encode:value=>Buffer.from(value).toString('base64'),base64EncodeWebSafe:value=>Buffer.from(value).toString('base64url')},ScriptApp:{getOAuthToken:()=> 'private-token'},UrlFetchApp:{fetch(url,options){calls.push({url,options});return {getResponseCode:()=>code,getContentText:()=>JSON.stringify(response)};}}});
  vm.runInContext(readServerScript(),c);c.settings_=()=>settings;c.authorize_=()=>{if(!admin)throw Error('administrador');return {email:'owner@bbva.com'};};
  return {c,calls,settings,setResponse(value,status=200){response=value;code=status;},setAdmin(value){admin=value;}};
}
test('el grupo requiere alias aceptado; errores de permisos y alias pendientes bloquean el envío',()=>{
  const m=mail(),{c}=m;assert.equal(c.newsletterSender_().address,'news-radar.group@bbva.com');assert.match(m.calls[0].url,/settings\/sendAs\/news-radar.group%40bbva.com$/);
  m.setResponse({sendAsEmail:m.settings.newsletterSender,verificationStatus:'pending'});assert.throws(()=>c.newsletterSender_(),/verificado/);
  m.setResponse({},403);assert.throws(()=>c.newsletterSender_(),/permisos del propietario/);m.setResponse({},404);assert.throws(()=>c.newsletterSender_(),/Añade y verifica/);
  assert.ok(m.calls.every(call=>call.options.method==='get'));
});
test('MIME preserva Unicode, usa destinatario individual y Reply-To del grupo sin CC ni BCC',()=>{
  const m=mail(),{c}=m;m.setResponse({id:'gmail-confirmed'});
  const sender={address:m.settings.newsletterSender,name:m.settings.newsletterSenderName},content={text:'Financiación para pequeñas empresas · España',html:'<h1>Novedades México</h1>'};
  assert.equal(c.sendNewsletterMail_(sender,'user@bbva.com','Novedades · México 💡 '+('á'.repeat(80)),content),'gmail-confirmed');
  const request=m.calls[0],raw=JSON.parse(request.options.payload).raw,mime=Buffer.from(raw,'base64url').toString('utf8');
  assert.match(mime,/From: .* <news-radar.group@bbva.com>/);assert.match(mime,/Reply-To: news-radar.group@bbva.com\r\nTo: user@bbva.com/);assert.doesNotMatch(mime,/\r\n(?:Cc|Bcc):/i);
  assert.match(mime,/multipart\/alternative/);assert.ok(!/[+=/]/.test(raw));
  for(const header of mime.matchAll(/=\?UTF-8\?B\?([^?]+)\?=/g))assert.ok(header[0].length<=75);
  const bodies=[...mime.matchAll(/Content-Transfer-Encoding: base64\r\n\r\n([A-Za-z0-9+/=\r\n]+)(?=--)/g)].map(match=>Buffer.from(match[1],'base64').toString('utf8'));
  assert.deepEqual(bodies,[content.text,content.html]);assert.equal(request.options.headers.Authorization,'Bearer private-token');
});
test('cabeceras inyectadas, correos externos y respuestas sin confirmación no se aceptan',()=>{
  const m=mail(),{c}=m,sender={address:m.settings.newsletterSender,name:'News Radar'},content={text:'Hola',html:'<p>Hola</p>'};
  assert.throws(()=>c.sendNewsletterMail_(sender,'user@bbva.com','Tema\r\nBcc: attacker@bbva.com',content),/Cabecera/);
  assert.throws(()=>c.sendNewsletterMail_(sender,'external@example.com','Tema',content),/dominio/);assert.equal(m.calls.length,0);
  m.setResponse({});assert.throws(()=>c.sendNewsletterMail_(sender,'user@bbva.com','Tema',content),/identificador/);
});
test('el límite persistente de 24 horas reserva envíos inciertos y excluye períodos vacíos y antiguos',()=>{
  const m=mail(),now=new Date('2026-10-10T10:00:00Z');m.settings.newsletterDailyLimit=4;
  const rows=['Enviada','Enviando','Revisar','Sin novedades'].map(estado=>({estado,fecha:'2026-10-10T09:00:00Z'}));rows.push({estado:'Enviada',fecha:'2026-10-09T09:00:00Z'});
  assert.equal(m.c.newsletterBudget_(rows,now),1);rows.push({estado:'Enviada',fecha:'2026-10-10T09:00:00Z'});assert.equal(m.c.newsletterBudget_(rows,now),0);
});
test('diagnóstico, pruebas y programación son exclusivos del administrador',()=>{
  const m=mail();m.setAdmin(false);for(const name of ['getNewsletterDeliveryStatus','sendNewsletterTest','installNewsletterSchedule','sendPendingNewsletters'])assert.throws(()=>m.c[name](),/administrador/);assert.equal(m.calls.length,0);
});
test('la prueba usa el correo del administrador y registra Gmail ID; no consume suscripciones reales',()=>{
  const m=mail(),{c}=m,log=[];let destination;
  c.LockService={getScriptLock:()=>({waitLock(){},releaseLock(){}})};c.rows_=()=>[];
  c.newsletterSender_=()=>({address:m.settings.newsletterSender,name:m.settings.newsletterSenderName});c.subscriptionDefaults_=()=>({name:'Mi canal',periodicity:'monthly',filters:{entity:'BBVA'}});c.subscriptionQuery_=()=>({from:'2026-09-01',to:'2026-09-30'});c.newsletter_=()=>({count:2,text:'Prueba',html:'<p>Prueba</p>'});
  c.append_=(name,rows)=>log.push(...rows);c.book_=()=>({getSheetByName:()=>({getLastRow:()=>log.length+1,getRange:()=>({setValues(values){log[0].splice(5,3,...values[0]);}})})});
  c.sendNewsletterMail_=(_sender,recipient)=>{destination=recipient;return 'gmail-test';};
  const result=c.sendNewsletterTest();assert.equal(result.recipient,'owner@bbva.com');assert.equal(result.messageId,'gmail-test');assert.equal(result.count,2);assert.equal(result.accepted,true);assert.equal(destination,'owner@bbva.com');assert.equal(log[0][1],'');assert.equal(log[0][5],'Enviada');assert.match(log[0][7],/gmail-test/);
});

test('rechazos explícitos conservan la causa de Gmail y permiten reintento; errores inciertos requieren revisión',()=>{
  const m=mail(),{c}=m,states=[],sheet={getRange:()=>({setValues:rows=>states.push(rows[0])})},sender={address:m.settings.newsletterSender,name:'News Radar'},content={text:'Prueba',html:'<p>Prueba</p>'};
  m.setResponse({error:{message:'Recipient address rejected'}},400);
  assert.throws(()=>c.completeNewsletterDelivery_(sheet,2,sender,'user@bbva.com','Tema',content),/Recipient address rejected/);assert.equal(states[0][0],'No enviado');
  m.setResponse({error:{message:'Backend error'}},503);
  assert.throws(()=>c.completeNewsletterDelivery_(sheet,2,sender,'user@bbva.com','Tema',content),/Backend error/);assert.equal(states[1][0],'Revisar');
});
test('una prueba bloqueada antes de enviar queda registrada sin consumir presupuesto',()=>{
  const m=mail(),{c}=m,log=[];c.LockService={getScriptLock:()=>({waitLock(){},releaseLock(){}})};c.rows_=()=>[];c.append_=(_name,rows)=>log.push(...rows);c.newsletterSender_=()=>{throw Error('Alias no verificado');};
  assert.throws(()=>c.sendNewsletterTest(),/Alias no verificado/);assert.equal(log[0][2],'owner@bbva.com');assert.equal(log[0][5],'Bloqueada');assert.equal(c.newsletterBudget_(log.map(row=>({estado:row[5],fecha:row[6]})),new Date()),m.settings.newsletterDailyLimit);assert.equal(m.calls.length,0);
});
