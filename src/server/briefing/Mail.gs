function newsletterEmail_(value){
  const email=String(value||'').trim().toLowerCase();
  if(!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@bbva\.com$/.test(email))throw Error('El correo de newsletter debe pertenecer al dominio bbva.com.');
  return email;
}
function gmailRequest_(path,payload){
  const response=UrlFetchApp.fetch('https://gmail.googleapis.com/gmail/v1/users/me/'+path,{method:payload?'post':'get',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},...(payload?{contentType:'application/json',payload:JSON.stringify(payload)}:{}),muteHttpExceptions:true});
  const status=response.getResponseCode();
  if(status<200||status>=300)throw Error('Gmail API ('+status+'). '+(status===404?'Añade y verifica el grupo en Gmail → Cuentas → Enviar como.':status===401||status===403?'Revisa los permisos del propietario y que Gmail API esté habilitada en el proyecto de Google Cloud.':status===429?'Límite de envío alcanzado; revisa las cuotas de Google.':'No se ha confirmado la entrega. Revisa Gmail antes de reintentar.'));
  return JSON.parse(response.getContentText());
}
function newsletterSender_(){
  const settings=settings_(),address=newsletterEmail_(settings.newsletterSender),alias=gmailRequest_('settings/sendAs/'+encodeURIComponent(address));
  if(alias.sendAsEmail?.toLowerCase()!==address||alias.verificationStatus!=='accepted')throw Error('El remitente '+address+' debe estar verificado en Gmail → Cuentas → Enviar como.');
  return {address,name:settings.newsletterSenderName};
}
function newsletterBudget_(deliveries,now){
  return Math.max(0,settings_().newsletterDailyLimit-deliveries.filter(row=>['Enviando','Enviada','Revisar'].includes(row.estado)&&new Date(row.fecha).getTime()>now.getTime()-86400000).length);
}
function getNewsletterDeliveryStatus(){
  authorize_(true);const settings=settings_(),status={address:settings.newsletterSender,name:settings.newsletterSenderName,enabled:settings.newsletterEnabled,scheduled:newsletterEnabled_(),remaining:newsletterBudget_(rows_('NewsletterEnvios'),new Date())};
  try{return {...status,...newsletterSender_(),available:true,error:''};}
  catch(error){return {...status,available:false,error:error.message};}
}
function mailHeader_(value){
  if(/[\r\n]/.test(value))throw Error('Cabecera de correo no válida.');
  const words=[];let word='',bytes=0;
  for(const char of String(value)){
    const size=encodeURIComponent(char).replace(/%[A-F\d]{2}/gi,'x').length;
    if(bytes+size>45){words.push('=?UTF-8?B?'+Utilities.base64Encode(word,Utilities.Charset.UTF_8)+'?=');word='';bytes=0;}
    word+=char;bytes+=size;
  }
  if(word)words.push('=?UTF-8?B?'+Utilities.base64Encode(word,Utilities.Charset.UTF_8)+'?=');
  return words.join('\r\n ');
}
function sendNewsletterMail_(sender,recipient,subject,content){
  const boundary='news_radar_'+Utilities.getUuid().replace(/-/g,''),body=value=>Utilities.base64Encode(value,Utilities.Charset.UTF_8).match(/.{1,76}/g)?.join('\r\n')||'';
  const mime=['From: '+mailHeader_(sender.name)+' <'+newsletterEmail_(sender.address)+'>','Reply-To: '+newsletterEmail_(sender.address),'To: '+newsletterEmail_(recipient),'Subject: '+mailHeader_(subject),'Date: '+new Date().toUTCString(),'MIME-Version: 1.0','Content-Type: multipart/alternative; boundary="'+boundary+'"','','--'+boundary,'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',body(content.text),'--'+boundary,'Content-Type: text/html; charset=UTF-8','Content-Transfer-Encoding: base64','',body(content.html),'--'+boundary+'--',''].join('\r\n');
  const result=gmailRequest_('messages/send',{raw:Utilities.base64EncodeWebSafe(mime,Utilities.Charset.UTF_8).replace(/=+$/,'')});
  if(!result.id)throw Error('Gmail no ha confirmado el identificador del mensaje. Revisa el envío antes de reintentar.');
  return result.id;
}
function sendNewsletterTest(){
  const session=authorize_(true),lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const now=new Date();if(!newsletterBudget_(rows_('NewsletterEnvios'),now))throw Error('Se ha alcanzado el límite configurado de newsletters en 24 horas.');
    const sender=newsletterSender_(),defaults=subscriptionDefaults_(),query=subscriptionQuery_({periodicidad:defaults.periodicity,filtros:defaults.filters},now),content=newsletter_(rows_('Noticias',settings_().newsReadLimit),query,defaults.name,now);
    append_('NewsletterEnvios',[['prueba:'+Utilities.getUuid(),'',session.email,query.from,query.to,'Enviando',now.toISOString(),'Prueba del administrador']]);
    const sheet=book_().getSheetByName('NewsletterEnvios'),id=completeNewsletterDelivery_(sheet,sheet.getLastRow(),sender,session.email,'Prueba · '+defaults.name,content);
    return 'Prueba enviada únicamente a '+session.email+' desde '+sender.address+'. Gmail ID: '+id+'.';
  }finally{lock.releaseLock();}
}
function completeNewsletterDelivery_(sheet,index,sender,recipient,subject,content){
  try{
    const id=sendNewsletterMail_(sender,recipient,subject,content);
    sheet.getRange(index,6,1,3).setValues([['Enviada',new Date().toISOString(),'Gmail ID: '+id]]);return id;
  }catch(error){
    sheet.getRange(index,6,1,3).setValues([['Revisar',new Date().toISOString(),String(error.message).slice(0,500)]]);throw error;
  }
}
