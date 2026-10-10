import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {readServerScript,renderIncludes,read,files} from '../scripts/source.mjs';
const source=readServerScript();
function context(email='felix.delbarrio@bbva.com'){
  const c=vm.createContext({console}),properties={OWNER_EMAIL:'felix.delbarrio@bbva.com',SPREADSHEET_ID:'book'},cache=new Map();
  c.PropertiesService={getScriptProperties:()=>({getProperty:key=>properties[key]||null,setProperty:(key,value)=>properties[key]=value,deleteProperty:key=>delete properties[key]})};
  c.Session={getActiveUser:()=>({getEmail:()=>email}),getEffectiveUser:()=>({getEmail:()=> 'felix.delbarrio@bbva.com'})};
  c.CacheService={getScriptCache:()=>({get:key=>cache.get(key),put:(key,value)=>cache.set(key,value),remove:key=>cache.delete(key)})};
  c.LockService={getScriptLock:()=>({tryLock:()=>true,waitLock(){},releaseLock(){}})};
  c.Utilities={getUuid:()=> 'id',formatDate:date=>date.toISOString().slice(0,10)};
  vm.runInContext(source,c);return c;
}
const feed={name:'BBVA',domain:'bbva.com',entity:'BBVA',country:'Sin determinar',kind:'rss'},now=new Date('2026-10-09T12:00:00Z'),item={title:'BBVA financia a empresas',excerpt:'Operación de financiación corporativa',url:'https://www.bbva.com/es/noticia/?utm_source=rss',date:'2026-10-08T11:00:00Z'};
test('extrae texto sin scripts, estilos ni comentarios y no recompone etiquetas',()=>{
  const c=context();assert.equal(c.plainText_('Antes<!-- <script>oculto</script> --><SCRIPT>x()</SCRIPT><style>css</style><p>Después</p>'),'Antes Después');
  assert.equal(c.plainText_('Visible<script>sin cierre'),'Visible');assert.equal(c.plainText_('<scr<script>ipt>oculto</scr</script>ipt>'),'ipt>oculto ipt>');assert.equal(c.plainText_('A<br>B &amp; &#243;'),'A B & ó');
});
test('clasifica fecha y dominio, rechaza ruido y no genera estados ni puntuaciones',()=>{
  const c=context(),result=c.evaluate_(item,feed,now);assert.equal(result.item.topic,'Financiación');assert.equal(result.item.url,'https://www.bbva.com/es/noticia/');
  for(const change of [{date:''},{url:'https://bbva.com.evil.net/a'},{date:'2026-10-10'},{date:'2026-09-01'}])assert.ok(c.evaluate_({...item,...change},feed,now).reason);
  assert.equal(c.classify_('Cómo ahorrar en vacaciones',''),'');assert.equal(c.classify_('Incidencia en BBVA Net Cash para empresas',''),'Continuidad de servicio');assert.equal(c.classify_('Akbank KOBİ finansman',''),'Financiación');
  assert.equal(result.item.impacto,undefined);assert.equal(result.item.estado,undefined);
});
test('canonicalización y exportación protegen URLs y fórmulas',()=>{
  const c=context();assert.equal(c.canonicalUrl_('https://BBVA.com/a?z=1&utm_source=x&id=2#x'),'https://bbva.com/a?id=2&z=1');assert.equal(c.canonicalUrl_('javascript:alert(1)'),'');assert.equal(c.canonicalUrl_('https://user:pass@bbva.com/a'),'');assert.equal(c.domainMatches_('https://evilbbva.com/a','bbva.com'),false);assert.equal(c.safeCell_('=IMPORTXML("x")'),'\'=IMPORTXML("x")');
  c.rows_=()=>[{...item,fecha:'2026-10-08',titular:'=HYPERLINK("x")',extracto:'texto',entidad:'BBVA',url:item.url}];const csv=c.exportNews({}).csv;assert.match(csv,/'=HYPERLINK/);assert.doesNotMatch(csv,/impacto|evidencia|criterio/);
});
test('autoriza con identidad activa y restringe administración y métricas',()=>{
  for(const email of ['reader@bbva.com','felix.delbarrio@bbva.com'])assert.doesNotThrow(()=>context(email).authorize_());
  for(const email of ['','reader@evilbbva.com','reader@bbva.com.evil'])assert.throws(()=>context(email).authorize_());
  const reader=context('reader@bbva.com');for(const name of ['getAudit','getAdoption','getTelemetry','collectNow','retryCollectionErrors','setupRadar'])assert.throws(()=>reader[name](),/no autorizado/);assert.throws(()=>reader.saveFeeds([]),/no autorizado/);
});
test('dashboard de lector no expone fuentes configurables, hoja ni datos de otros usuarios',()=>{
  const c=context('reader@bbva.com');c.rows_=()=>[];c.book_=()=>{throw Error('No debe leer URL de hoja');};const result=c.getDashboard({});
  for(const key of ['sheetUrl','runs','feeds','configuredFeeds','collection','email'])assert.equal(key in result,false);assert.equal(result.sourceCount,57);assert.equal(result.admin,false);
});
test('los dos feeds oficiales y todo el perfil forman 57 fuentes predeterminadas únicas',()=>{
  const c=context(),feeds=c.defaultFeeds_(),profile=JSON.parse(fs.readFileSync('assets/news-profile.json'));assert.equal(feeds.length,57);assert.equal(new Set(feeds.map(feed=>feed.url)).size,57);assert.equal(feeds.filter(feed=>feed.kind==='rss').length,2);
  for(const geo of profile.geographies)for(const entity of [profile.primary.name,...profile.primary.aliases,...geo.competitors]){
    const feed=feeds.find(feed=>feed.country===geo.name&&feed.entity===entity);assert.ok(feed);const query=new URL(feed.url).searchParams.get('q');for(const topic of profile.topics)assert.ok(query.includes(topic));assert.equal(new URL(feed.url).hostname,'news.google.com');assert.equal(new URL(feed.url).searchParams.get('gl'),geo.country);
  }
  assert.ok(decodeURIComponent(feeds.find(feed=>feed.country==='Turquía').url).includes('nakit yönetimi'));
});
test('fuentes adicionales no eliminan defaults y rechazan duplicados y dominios falsos',()=>{
  const c=context();c.saveFeeds([{...feed,url:'https://bbva.com/extra'}]);assert.equal(c.feeds_().length,58);c.saveFeeds([]);assert.equal(c.feeds_().length,57);
  assert.throws(()=>c.saveFeeds([{...feed,url:'https://evilbbva.com/a'}]));assert.throws(()=>c.saveFeeds([{...feed,url:feed.url||'https://bbva.com/a'},{...feed,url:feed.url||'https://bbva.com/a'}]));
});
test('noticias agregadas se integran sin intervención y mantienen medio y enlace de Google News',()=>{
  const c=context(),profile=c.defaultFeeds_().find(feed=>feed.entity==='Santander Empresas'&&feed.country==='España');
  const raw={title:'Santander financia empresas - Diario',source:'Diario',excerpt:'Santander financia empresas Diario',date:'2026-10-08',url:'https://news.google.com/rss/articles/123'};
  const result=c.evaluate_(raw,profile,now);assert.equal(result.item.title,'Santander financia empresas');assert.equal(result.item.publisher,'Diario');assert.equal(result.item.excerpt,'');assert.equal(result.item.url,raw.url);
  const record=c.newsRecord_(result.item,profile,now);assert.equal(record.length,11);assert.equal(record[3],'Diario');assert.equal(record[10],profile.name);
});
test('recopila por lotes, integra automáticamente, deduplica y conserva reintentos parciales',()=>{
  const c=context(),saved={},writes=[];let released=false;
  c.LockService={getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>released=true})};
  c.rows_=()=>[{ciclo:'cycle',fuente:'BBVA',url:'good',estado:'Pendiente',intentos:'0'},{ciclo:'cycle',fuente:'Error',url:'bad',estado:'Pendiente',intentos:'0'}];
  c.feeds_=()=>[{...feed,url:'good'},{...feed,url:'bad'}];c.knownUrls_=()=>new Set();c.book_=()=>({getSheetByName:()=>({getRange:()=>({setNumberFormat(){return this;},setValues:rows=>writes.push(rows)})})});
  c.UrlFetchApp={fetch:url=>url==='good'?{getResponseCode:()=>200,getContentText:()=>'<rss/>'}:{getResponseCode:()=>503}};
  c.parseFeed_=()=>[{...item,date:new Date(Date.now()-86400000).toISOString()},{...item,date:new Date(Date.now()-86400000).toISOString()}];c.append_=(name,rows)=>saved[name]=rows;c.telemetry_=()=>{};
  const result=c.collectionTick_();assert.equal(result.added,1);assert.equal(result.errors.length,1);assert.equal(saved.Noticias[0].length,11);assert.equal(writes.length,1);assert.equal(writes[0][1][0],'Reintento programado');assert.equal(saved.Ejecuciones[0][3],'Parcial');assert.ok(saved.Auditoria.some(row=>row[4]==='Duplicada'));assert.equal(released,true);
});
test('agotados tres intentos registra error y la recuperación escribe un único lote',()=>{
  const c=context(),tasks=[{ciclo:'cycle',fuente:'Error',url:'bad',estado:'Pendiente',intentos:'2',actualizada:'2026-10-09',evaluadas:'0',nuevas:'0',error:''}];let rows,writes=0;
  c.rows_=()=>tasks;c.feeds_=()=>[{...feed,url:'bad'}];c.knownUrls_=()=>new Set();c.book_=()=>({getSheetByName:()=>({getRange:()=>({setNumberFormat(){return this;},setValues:value=>{rows=value;writes++;}})})});c.UrlFetchApp={fetch:()=>({getResponseCode:()=>503})};c.append_=()=>{};c.telemetry_=()=>{};c.collectionTick_();assert.equal(rows[0][0],'Error');
  tasks[0].estado='Error';writes=0;c.ScriptApp={getProjectTriggers:()=>[{getHandlerFunction:()=> 'collectionTick_'}]};assert.match(c.retryCollectionErrors(),/^1 fuentes/);assert.equal(writes,1);assert.equal(rows[0][0],'Pendiente');assert.equal(rows[0][1],0);
});
test('resumen incluye todas las noticias sin requerir etiquetas de validación',()=>{
  const c=context(),insights=c.insights_([{tema:'Financiación',pais:'México',medio:'Diario'}]);assert.equal(insights.length,5);assert.match(insights[0],/^1 publicaciones/);assert.match(insights[1],/Financiación/);assert.ok(insights.every(text=>text.split(/\s+/).length<=40));
});
test('adopción calcula ventanas y sesiones y obtiene el correo exclusivamente del servidor',()=>{
  const c=context(),events=[{fecha:'2026-10-09T10:00:00Z',correo:'a@bbva.com',sesion:'1',evento:'vista',vista:'radar'},{fecha:'2026-10-07T10:00:00Z',correo:'a@bbva.com',sesion:'2',evento:'rendimiento',duracion_ms:'100'},{fecha:'2026-09-15T10:00:00Z',correo:'b@bbva.com',sesion:'3',evento:'error'}],metrics=c.metrics_(events,now.getTime());assert.equal(metrics.dau,1);assert.equal(metrics.wau,1);assert.equal(metrics.mau,2);assert.equal(metrics.returning,1);assert.equal(metrics.sessions,3);assert.equal(metrics.latencyP95,100);
  let saved;c.append_=(name,rows)=>saved=rows;c.trim_=()=>{};c.pruneEvents_=()=>{};c.recordEvents([{session:'test-session-123456',event:'acceso',view:'radar',email:'forged@bbva.com'}]);assert.equal(saved[0][1],'felix.delbarrio@bbva.com');assert.throws(()=>context('reader@bbva.com').recordEvents([{session:'test-session-123456',event:'vista',view:'adoption'}]),/restringida/);
});
test('distribución no contiene flujo manual, estilos obsoletos ni permisos adicionales',()=>{
  const c=context();for(const name of ['verifyNews','score_','getCandidates','startSearch','searchTick_','articleDate_'])assert.equal(typeof c[name],'undefined');
  const html=renderIncludes(read('dist/Index.html'));assert.doesNotMatch(html,/verify-form|verification-form|candidates-body|Verificar|puntuar|puntuación/);assert.ok(files('src/server').every(file=>!file.endsWith('/Search.gs')));
  const manifest=JSON.parse(fs.readFileSync('src/appsscript.json'));assert.equal(manifest.oauthScopes.length,4);assert.ok(!manifest.oauthScopes.some(scope=>/gmail|drive|admin.directory/.test(scope)));
});

test('filtros combinan entidad normalizada, ámbito y medio sin mezclar otras noticias',()=>{
  const c=context(),rows=[{fecha:'2026-10-08',pais:'México',entidad:'Santander Empresas',medio:'El País',titular:'Financiación de empresas',extracto:''},{fecha:'2026-10-08',pais:'España',entidad:'Santander Empresas',medio:'El País',titular:'Otra noticia',extracto:''},{fecha:'2026-10-08',pais:'México',entidad:'BBVA Net Cash',medio:'Otro diario',titular:'Otra noticia',extracto:''}];
  const selected=c.selectNews_(rows,{entity:'Santander',country:'México',source:'El País'});assert.equal(selected.length,1);assert.equal(selected[0].medio,'El País');assert.equal(c.entityKey_('BBVA Net Cash'),'BBVA');assert.equal(c.selectNews_(rows,{entity:'BBVA',source:'Otro diario'}).length,1);
});
test('todas las fuentes nacen activas y la configuración desactiva solo las seleccionadas',()=>{
  const c=context(),all=c.configuredFeeds_();assert.equal(all.filter(feed=>feed.enabled).length,57);
  c.saveSourceSettings(all.slice(1).map(feed=>feed.id));assert.equal(c.feeds_().length,56);assert.equal(c.configuredFeeds_()[0].enabled,false);
  c.saveSourceSettings(all.map(feed=>feed.id));assert.equal(c.feeds_().length,57);assert.throws(()=>c.saveSourceSettings(['unknown']));assert.throws(()=>context('reader@bbva.com').saveSourceSettings([]),/no autorizado/);
});

test('filtros y CSV coinciden para banco, país, medio, tema y fechas inclusivas',()=>{
  const c=context(),rows=[{fecha:'2026-10-08',pais:'México',entidad:'Santander Empresas',medio:'El País',tema:'Financiación',titular:'Tesorería corporativa',extracto:''},
    {fecha:'2026-10-07',pais:'España',entidad:'Santander Empresas',medio:'El País',tema:'Financiación',titular:'España',extracto:''},
    {fecha:'2026-10-09',pais:'México',entidad:'BBVA Business',medio:'El País',tema:'Financiación',titular:'BBVA',extracto:''}];
  const query={entity:'Santander',country:'México',source:'El País',topic:'Financiación',from:'2026-10-08',to:'2026-10-08',search:'  tesoreria  '};
  const result=c.newsDashboard_(rows,query,c.defaultFeeds_()),csv=c.newsCsv_(rows,query);assert.equal(result.total,1);assert.equal(csv.count,1);assert.match(csv.csv,/Tesorería corporativa/);assert.doesNotMatch(csv.csv,/"España"/);
  assert.throws(()=>c.selectNews_(rows,{from:'2026-10-09',to:'2026-10-01'}),/fecha desde/);
});
test('opciones incluyen el perfil sin noticias y la paginación se ajusta al resultado',()=>{
  const c=context(),empty=c.newsDashboard_([],{page:99},c.defaultFeeds_());assert.equal(empty.page,0);assert.ok(empty.entities.includes('Santander'));assert.ok(empty.countries.includes('México'));
  const row={fecha:'2026-10-08',pais:'México',entidad:'Santander Empresas',medio:'El País',tema:'Financiación',titular:'Santander',extracto:''};
  const result=c.newsDashboard_(Array.from({length:31},()=>row),{page:99},[]);assert.equal(result.page,1);assert.equal(result.items.length,1);
});

test('entrada web evalúa la plantilla y limita los fragmentos internos',()=>{
  const c=context();let evaluated=false;
  const output={setTitle(){return this;},addMetaTag(){return this;}};
  c.HtmlService={createTemplateFromFile:name=>{assert.equal(name,'Index');return {evaluate(){evaluated=true;return output;}};},createHtmlOutputFromFile:name=>({getContent:()=>read('dist/'+name+'.html')})};
  assert.equal(c.doGet(),output);assert.equal(evaluated,true);assert.match(c.include_('Tokens'),/:root/);assert.throws(()=>c.include_('Config'),/desconocido/);
  assert.equal(fs.existsSync('dist/Core.gs'),false);assert.equal(fs.existsSync('src/Client.html'),false);
  const html=renderIncludes(read('dist/Index.html'));assert.doesNotMatch(html,/<\?!=|\{\{/);assert.match(html,/<script id="radar-client">/);
});
