import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {read,readServerScript} from '../scripts/source.mjs';
const seed=()=>JSON.parse(read('assets/configuration-defaults.json'));
function storage(){
  const sheets=new Map(),properties={OWNER_EMAIL:'owner@bbva.com',SPREADSHEET_ID:'book'},cache=new Map(),triggers=[];let email='owner@bbva.com',reads=0,id=0;
  function sheet(name){
    const grid=[];return {grid,getName:()=>name,getLastRow:()=>{let size=grid.length;while(size&&!(grid[size-1]||[]).some(value=>value!==''&&value!=null))size--;return size;},getMaxRows:()=>10000,setFrozenRows(){},
      getRange(row,column,height,width){const range={getValues(){reads++;return Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>grid[row-1+i]?.[column-1+j]??''));},getDisplayValues(){return this.getValues().map(values=>values.map(String));},setValues(values){values.forEach((values,i)=>{grid[row-1+i]??=[];values.forEach((value,j)=>grid[row-1+i][column-1+j]=value);});return range;},clearContent(){return this.setValues(Array.from({length:height},()=>Array(width).fill('')));}};for(const method of ['setFontWeight','setBackground','setFontColor','setNumberFormat'])range[method]=()=>range;return range;},deleteRow(row){grid.splice(row-1,1);}};
  }
  const book={getSheetByName:name=>sheets.get(name),insertSheet:name=>{const value=sheet(name);sheets.set(name,value);return value;}};
  const c=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:key=>properties[key]||null,setProperty:(key,value)=>properties[key]=value})},CacheService:{getScriptCache:()=>({get:key=>cache.get(key),put:(key,value)=>cache.set(key,value),remove:key=>cache.delete(key)})},SpreadsheetApp:{openById:()=>book},Session:{getActiveUser:()=>({getEmail:()=>email})},LockService:{getScriptLock:()=>({waitLock(){},tryLock:()=>true,releaseLock(){}})},Utilities:{getUuid:()=>String(++id)},ScriptApp:{getProjectTriggers:()=>triggers,newTrigger:handler=>{const trigger={forSpreadsheet:()=>trigger,onEdit:()=>trigger,create:()=>triggers.push({getHandlerFunction:()=>handler})};return trigger;}}});
  vm.runInContext(readServerScript(),c);
  return {c,sheets,cache,book,setEmail:value=>email=value,get reads(){return reads;}};
}
test('inicializa solo claves ausentes, persiste en Sheets y reutiliza e invalida la caché versionada',()=>{
  const s=storage(),{c}=s;c.initializeConfiguration();assert.equal(s.sheets.size,3);const config=c.getConfiguration().config,reads=s.reads;c.getConfiguration();assert.equal(s.reads,reads);
  config.settings.defaultEntity='Qonto';config.topics.push({name:'Prueba editorial',terms:['innovación verificable'],enabled:true});c.saveConfiguration({config,revision:c.getConfiguration().revision});assert.equal(c.getConfiguration().config.settings.defaultEntity,'Qonto');
  c.initializeConfiguration();assert.equal(c.getConfiguration().config.settings.defaultEntity,'Qonto');assert.ok(c.getConfiguration().config.topics.some(row=>row.name==='Prueba editorial'));
  const sheet=s.sheets.get('Configuracion'),index=sheet.grid.findIndex(row=>row[0]==='settings'),settings=JSON.parse(sheet.grid[index][1]);settings.defaultEntity='Revolut';sheet.grid[index][1]=JSON.stringify(settings);
  c.configurationEdited_({range:{getSheet:()=>sheet}});assert.equal(c.getConfiguration().config.settings.defaultEntity,'Revolut');assert.ok(s.cache.size>=2);
});
test('configuración deniega lectores y rechaza catálogos incoherentes antes de escribir',()=>{
  const s=storage();s.c.initializeConfiguration();const original=JSON.stringify(s.sheets.get('Configuracion').grid);s.setEmail('reader@bbva.com');assert.throws(()=>s.c.getConfiguration(),/administrador/);assert.throws(()=>s.c.saveConfiguration({config:seed(),revision:'0'}),/administrador/);assert.throws(()=>s.c.initializeConfiguration(),/administrador/);
  s.setEmail('owner@bbva.com');for(const edit of [config=>config.entities[1].aliases.push('BBVA'),config=>config.entities[0].countries.push('País inexistente'),config=>config.settings.trendSeries=99,config=>config.signals[0].context='invalid',config=>config.feeds[0].domain='evil.com']){const config=seed();edit(config);assert.throws(()=>s.c.saveConfiguration({config,revision:s.c.getConfiguration().revision}),/Alias|País|trendSeries|contexto|Fuente|términos/);assert.equal(JSON.stringify(s.sheets.get('Configuracion').grid),original);}
});
test('cambiar catálogos modifica clasificación, tipos, segmentos y filtros del histórico sin recompilar',()=>{
  const s=storage(),{c}=s;c.initializeConfiguration();const rows=[{fecha:'2026-10-09',pais:'España',entidad:'Qonto',medio:'Editor',titular:'Qonto lanza una nueva cuenta para autónomos',extracto:'',url:'https://example.com/q'}, {fecha:'2026-10-09',pais:'España',entidad:'N26',medio:'Editor',titular:'N26 lanza tarjeta para particulares',extracto:'',url:'https://example.com/n'},{fecha:'2026-10-09',pais:'España',entidad:'Revolut',medio:'Editor',titular:'Nuevo director de Revolut',extracto:'',url:'https://example.com/r'}];
  assert.equal(c.selectNews_(rows,{type:'Fintech',segment:'Empresas e instituciones',signal:'Lanzamiento de producto'}).length,1);assert.equal(c.selectNews_(rows,{type:'Neobanco',segment:'Retail',signal:'Lanzamiento de producto'}).length,1);assert.equal(c.newsDashboard_(rows,{},c.feeds_()).briefing.total,2);
  const config=c.getConfiguration().config;config.signals[0].terms=['comunicado inexistente'];c.saveConfiguration({config,revision:c.getConfiguration().revision});assert.equal(c.newsDashboard_(rows,{},c.feeds_()).briefing.total,0);
  config.entities.find(row=>row.name==='Qonto').type='Categoría propia';c.saveConfiguration({config,revision:c.getConfiguration().revision});assert.equal(c.selectNews_(rows,{type:'Categoría propia'}).length,1);
});
test('desactivar entidades o países elimina consultas futuras sin borrar noticias históricas',()=>{
  const s=storage(),{c}=s;c.initializeConfiguration();const config=c.getConfiguration().config;config.entities.find(row=>row.name==='Qonto').enabled=false;config.geographies.find(row=>row.name==='México').enabled=false;c.saveConfiguration({config,revision:c.getConfiguration().revision});
  assert.ok(!c.feeds_().some(row=>row.entity==='Qonto'||row.country==='México'));assert.ok(c.configuredFeeds_().some(row=>row.entity==='Qonto'&&!row.enabled));
});
test('selecciones personales impiden suplantación y acceso cruzado; newsletter conserva fuentes y escapa HTML',()=>{
  const s=storage(),{c}=s;c.initializeConfiguration();s.setEmail('a@bbva.com');c.saveSubscription({name:'Mi canal',periodicity:'monthly',email:'forged@bbva.com',filters:{entity:'Qonto',segment:'Empresas e instituciones'}});const own=c.getSubscriptions();assert.equal(own[0].correo,'a@bbva.com');
  c.rows_=name=>name==='Noticias'?[{fecha:c.subscriptionQuery_(own[0],new Date()).from,pais:'España',entidad:'Qonto',medio:'Editor',titular:'Qonto lanza cuenta para autónomos <script>',extracto:'Texto de la fuente',url:'https://example.com/product'}]:s.sheets.get(name).grid.slice(1).map(row=>Object.fromEntries(['id','correo','nombre','filtros','periodicidad','activa','actualizada'].map((key,i)=>[key,String(row[i])])));
  const result=c.exportNewsletter({subscriptionId:own[0].id});assert.equal(result.count,1);assert.match(result.html,/href="https:\/\/example.com\/product"/);assert.match(result.html,/&lt;script&gt;/);assert.doesNotMatch(result.html,/<script>/);
  s.setEmail('b@bbva.com');assert.equal(c.getSubscriptions().length,0);assert.throws(()=>c.exportNewsletter({subscriptionId:own[0].id}),/no encontrada/);assert.throws(()=>c.deleteSubscription(own[0].id),/no encontrada/);s.setEmail('a@bbva.com');c.deleteSubscription(own[0].id);assert.equal(c.getSubscriptions().length,0);
});

test('una edición antigua no sobrescribe cambios guardados desde otra sesión',()=>{
  const s=storage(),{c}=s;c.initializeConfiguration();const old=JSON.parse(JSON.stringify(c.getConfiguration())),fresh=JSON.parse(JSON.stringify(old));fresh.config.settings.defaultEntity='Qonto';c.saveConfiguration(fresh);old.config.settings.defaultEntity='Revolut';assert.throws(()=>c.saveConfiguration(old),/otra sesión/);assert.equal(c.getConfiguration().config.settings.defaultEntity,'Qonto');
});
test('las señales de titular evitan confundir artículos educativos o promesas del extracto con novedades',()=>{
  const s=storage(),{c}=s;c.initializeConfiguration();const rows=[{titular:'Qué son las finanzas de género',extracto:'Buscan reducir barreras de acceso a la financiación',entidad:'BBVA'}, {titular:'La cuenta para empresas de Qonto',extracto:'Qonto lanza nueva tarjeta para empresas',entidad:'Qonto'}, {titular:'BBVA y el municipio acuerdan impulsar la financiación de empresas',extracto:'Convenio de colaboración',entidad:'BBVA'}];
  rows.push({titular:'BBVA gana un premio por formación tecnológica para colaboradores',extracto:'Colaboración con una universidad',entidad:'BBVA'});
  const result=c.annotateNews_(rows);assert.equal(result[3].senales.length,0);assert.equal(result[0].senales.length,0);assert.equal(result[1].senales.length,0);assert.ok(result[2].senales.includes('Alianza estratégica'));
  const config=JSON.parse(JSON.stringify(c.getConfiguration()));config.config.signals[0].scope='fullText';c.saveConfiguration(config);assert.ok(c.annotateNews_(rows)[1].senales.includes('Lanzamiento de producto'));
});

test('las ventanas de newsletter usan meses y semanas naturales en la zona configurada',()=>{
 const s=storage(),{c}=s;c.initializeConfiguration();const q=c.subscriptionQuery_({periodicidad:'monthly',filtros:{entity:'BBVA'}},new Date('2026-10-25T23:30:00Z'));assert.equal(q.to,'2026-09-30');assert.equal(q.from,'2026-09-01');assert.equal(q.entity,'BBVA');
 const leap=c.newsletterPeriod_('monthly',new Date('2024-03-01T10:00:00Z'));assert.equal(leap.from,'2024-02-01');assert.equal(leap.to,'2024-02-29');const week=c.newsletterPeriod_('weekly',new Date('2026-10-12T10:00:00Z'));assert.equal(week.from,'2026-10-05');assert.equal(week.to,'2026-10-11');
});
test('administración da altas y edita suscripciones; lectores no acceden a otros usuarios',()=>{
 const s=storage(),{c}=s;c.initializeConfiguration();s.book.insertSheet('Noticias').grid.push([]);const defaults=c.getNewsletterOptions().defaults;assert.equal(defaults.periodicity,'monthly');assert.equal(defaults.filters.entity,'BBVA');assert.equal(defaults.filters.segment,'Empresas e instituciones');assert.equal(defaults.filters.country,'');
 c.saveAdminSubscription({email:'equipo@bbva.com',name:'Equipo',filters:defaults.filters});let rows=c.getAdminSubscriptions();assert.equal(rows.length,1);c.saveAdminSubscription({id:rows[0].id,email:'equipo@bbva.com',name:'Pausada',active:false,periodicity:'weekly',filters:defaults.filters});rows=c.getAdminSubscriptions();assert.equal(rows[0].activa,false);assert.equal(rows[0].periodicidad,'weekly');
 assert.throws(()=>c.saveAdminSubscription({email:'outside@example.com',name:'Fuera',filters:{}}),/dominio/);s.setEmail('equipo@bbva.com');assert.equal(c.getSubscriptions().length,1);assert.throws(()=>c.getAdminSubscriptions(),/administrador/);assert.throws(()=>c.saveAdminSubscription({}),/administrador/);c.saveSubscription({id:rows[0].id,name:'Mía',periodicity:'monthly',active:true,filters:{}});assert.equal(c.getSubscriptions()[0].nombre,'Mía');
});

test('la entrega registra cada período antes de enviar y no duplica ni reintenta envíos inciertos',()=>{
 const s=storage(),{c}=s;c.initializeConfiguration();const defaults=c.getConfiguration();defaults.config.settings.newsletterEnabled=true;c.saveConfiguration(defaults);
 const period=c.newsletterPeriod_('monthly',new Date());let sent=0;c.newsletterSender_=()=>({address:'news-radar.group@bbva.com',name:'News Radar'});c.sendNewsletterMail_=()=>{sent++;return 'gmail-'+sent;};
 c.subscriptionRows_=()=>[{id:'uno',correo:'equipo@bbva.com',nombre:'Canal',periodicidad:'monthly',activa:true,actualizada:'2020-01-01T00:00:00Z',filtros:{entity:'BBVA'}},{id:'pausada',activa:false}];
 s.book.insertSheet('Noticias').grid.push([]);c.rows_=name=>name==='Noticias'?[{fecha:period.from,pais:'España',entidad:'BBVA',medio:'BBVA',titular:'BBVA lanza cuenta para empresas',extracto:'Nueva cuenta',url:'https://example.com/product'}]:s.sheets.get(name).grid.slice(1).map(row=>Object.fromEntries(['id','suscripcion','correo','desde','hasta','estado','fecha','detalle'].map((key,i)=>[key,row[i]])));
 c.deliverNewsletters_();c.deliverNewsletters_();assert.equal(sent,1);assert.equal(s.sheets.get('NewsletterEnvios').grid[1][5],'Enviada');
 c.subscriptionRows_=()=>[{id:'fallo',correo:'equipo@bbva.com',nombre:'Canal',periodicidad:'monthly',activa:true,actualizada:'2020-01-01T00:00:00Z',filtros:{entity:'BBVA'}}];c.sendNewsletterMail_=()=>{sent++;throw Error('Resultado incierto');};c.deliverNewsletters_();c.deliverNewsletters_();assert.equal(sent,2);assert.equal(s.sheets.get('NewsletterEnvios').grid[2][5],'Revisar');
 c.newsletterBudget_=()=>0;c.subscriptionRows_=()=>[{id:'quota',activa:true}];c.deliverNewsletters_();assert.equal(sent,2);
});
