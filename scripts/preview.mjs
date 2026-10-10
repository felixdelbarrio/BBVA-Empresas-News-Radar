import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {readServerScript,renderIncludes} from './source.mjs';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
const seed=JSON.parse(fs.readFileSync(path.join(root,'assets/configuration-defaults.json'),'utf8'));
const context=vm.createContext({});vm.runInContext(readServerScript(),context);context.configuration_=()=>seed;
const feeds=seed.feeds,now=new Date('2026-10-09T10:00:00+02:00');
const raw=JSON.parse(fs.readFileSync(path.join(root,'assets/feed-snapshot.json'),'utf8'));
const rows=raw.flatMap((item,i)=>{
  const feed=feeds[i<10?0:1],result=context.evaluate_(item,feed,now);if(!result.item)return [];
  const n=result.item;return [{id:String(i),fecha:n.date.toISOString().slice(0,10),pais:feed.country,medio:feed.name,entidad:feed.entity,titular:n.title,extracto:n.excerpt,tema:n.topic,url:n.url,fuente:feed.name}];
});
const names=['settings_','searchText_','businessIndex_','termsMatch_','classify_','annotateNews_','entityKey_','selectNews_','selectAnnotatedNews_','radarMetrics_','briefing_','newsDashboard_','safeCell_','newsCsv_','canonicalUrl_','domainMatches_','plainText_','validateConfiguration_','profileFeed_','defaultFeeds_','customFeeds_','configuredFeeds_','feeds_','saveFeeds','saveSourceSettings','newsletter_','newsletterContent_','subscriptionRecord_','subscriptionQuery_','subscriptionDefaults_','calendarDate_','collectionRange_','newsletterPeriod_','newsletterEmail_','newsletterNextDate_','metrics_'];
const shared=names.map(name=>context[name].toString()).join('\n'),serialize=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const preview=`<script>(()=>{
const NEWSLETTER_INLINE=${serialize(vm.runInContext('NEWSLETTER_INLINE',context))};
const RADAR=${serialize(vm.runInContext('RADAR',context))},NEWSLETTER_STYLE=${serialize(vm.runInContext('NEWSLETTER_STYLE',context))};
let configuration=${serialize(seed)},businessIndexMemory_,configuredFeedMemory_,revision='0',calendarFormatterMemory_;const selections=[],usage=[];
const configuration_=()=>configuration,rows=${serialize(rows)},admin=${process.env.PREVIEW_ADMIN==='1'};
const authorize_=()=>{if(!admin)throw Error('Acción de administrador.');};
const configurationRevision_=()=>revision;
function writeConfiguration_(config,version){authorize_();if(version!==revision)throw Error('La configuración ha cambiado. Recarga los catálogos.');validateConfiguration_(config);configuration=JSON.parse(JSON.stringify(config));revision=String(Number(revision)+1);return 'Configuración local guardada en memoria. No se ha escrito en Google.';}
${shared}
window.RADAR_PREVIEW={async call(method,q={}){
 if(method==='collectNow'){authorize_();const range=collectionRange_(q||'today',new Date()),available=rows.filter(row=>row.fecha>=range.from&&row.fecha<=range.to).length;return {added:0,pending:0,errors:[],notice:'Vista local: '+available+' noticias de la instantánea en el período '+range.from+' / '+range.to+'. La consulta remota se ejecuta únicamente en Apps Script.'};}
 if(method==='recordEvents'){usage.push(...q.map(event=>({fecha:new Date().toISOString(),correo:'usuario@bbva.com',sesion:event.session,evento:event.event,vista:event.view,duracion_ms:event.duration})));if(usage.length>settings_().eventLimit)usage.splice(0,usage.length-settings_().eventLimit);return {saved:true};}
 if(method==='getAudit'){authorize_();return [];}
 if(method==='getAdoption'){authorize_();return {...metrics_(usage,Date.now()),retentionDays:settings_().retentionDays,limited:usage.length===settings_().eventLimit};}
 if(method==='getTelemetry'){authorize_();const metrics=metrics_(usage,Date.now());return {rows:[],latencyP95:metrics.latencyP95,clientErrors:metrics.failures,collection:{processed:0,pending:0}};}
 if(method==='getConfiguration'){authorize_();return {config:JSON.parse(JSON.stringify(configuration)),revision};}
 if(method==='saveConfiguration')return writeConfiguration_(q.config,q.revision);
 if(method==='saveSourceSettings')return saveSourceSettings(q);
 if(method==='saveFeeds')return saveFeeds(q);
 if(method==='exportNews')return newsCsv_(rows,q);
 if(method==='getNewsletterOptions')return {email:'usuario@bbva.com',defaults:subscriptionDefaults_(),enabled:settings_().newsletterEnabled,catalogs:{type:[...new Set(configuration.entities.filter(r=>r.enabled).map(r=>r.type))],entity:configuration.entities.filter(r=>r.enabled).map(r=>r.name),segment:configuration.segments.filter(r=>r.enabled).map(r=>r.name),country:configuration.geographies.filter(r=>r.enabled).map(r=>r.name),topic:configuration.topics.filter(r=>r.enabled).map(r=>r.name),signal:configuration.signals.filter(r=>r.enabled).map(r=>r.name),source:[...new Set([...rows.map(r=>r.medio),...feeds_().map(r=>r.name)])].filter(Boolean).sort()}};
 if(['sendNewsletterTest','sendPendingNewsletters','installNewsletterSchedule'].includes(method)){authorize_();throw Error('Estás en la vista local. No se envían correos ni se instalan activadores: utiliza estas acciones en la WebApp de Google Apps Script.');}
 if(method==='getNewsletterDeliveryStatus'){authorize_();return {address:settings_().newsletterSender,name:settings_().newsletterSenderName,available:false,enabled:settings_().newsletterEnabled,scheduled:false,remaining:settings_().newsletterDailyLimit,error:'Vista local: verifica el remitente y los permisos en la instalación de Apps Script.'};}
 if(method==='getAdminSubscriptions'){authorize_();return JSON.parse(JSON.stringify(selections.map(row=>({...row,nextDelivery:newsletterNextDate_(row,new Date())}))));}
 if(method==='getSubscriptions')return JSON.parse(JSON.stringify(selections.filter(row=>row.correo==='usuario@bbva.com').map(row=>({...row,query:subscriptionQuery_(row,new Date()),nextDelivery:newsletterNextDate_(row,new Date())}))));
 if(method==='saveSubscription'||method==='saveAdminSubscription'){if(method==='saveAdminSubscription')authorize_();const index=q.id?selections.findIndex(r=>r.id===q.id):-1;const row=subscriptionRecord_(q,method==='saveAdminSubscription'?q.email:'usuario@bbva.com',q.id||String(selections.length+1)+'-'+Date.now(),new Date(),selections.filter(r=>r.id!==q.id).length);if(index<0)selections.push(row);else selections[index]=row;return 'Suscripción local guardada en memoria, sin envío de correo.';}
 if(method==='deleteSubscription'){const index=selections.findIndex(row=>row.id===q);if(index<0)throw Error('Selección no encontrada.');selections.splice(index,1);return 'Selección local eliminada.';}
 if(method==='exportNewsletter'){const now=new Date(),selection=q.subscriptionId?selections.find(row=>row.id===q.subscriptionId):null;if(q.subscriptionId&&!selection)throw Error('Selección no encontrada.');return newsletter_(rows,selection?subscriptionQuery_(selection,now):q.filters||{},selection?selection.nombre:q.title||'Briefing de novedades',now);}
 if(method!=='getDashboard')throw Error('Esta acción necesita la instalación en Apps Script.');
 const initial=Boolean(q.initial),settings=settings_();if(initial)q={entity:settings.defaultEntity,segment:settings.defaultSegment,topic:settings.defaultTopic,country:settings.defaultCountry};
 const feeds=feeds_();return {...newsDashboard_(rows,q,feeds),initial,selection:q,preferences:{timezone:settings.timezone,retentionDays:settings.retentionDays,eventLimit:settings.eventLimit,unknownCountry:settings.unknownCountry,dailyLabel:settings.dailyHour+':00 · '+settings.timezone},geographies:configuration.geographies,runs:[],lastRun:'',sourceCount:feeds.length,daily:false,admin,...(admin?{maxFeeds:settings.maxCustomFeeds,feeds:customFeeds_(),configuredFeeds:configuredFeeds_(),collection:{total:0,processed:0,pending:0,failed:0}}:{})};
}};
})();</script>`;
const read=name=>fs.readFileSync(path.join(dist,name+'.html'),'utf8');
const html=renderIncludes(read('Index')).replace('<script id="radar-client">',preview+'<script id="radar-client">');
fs.mkdirSync(path.join(root,'output'),{recursive:true});fs.writeFileSync(path.join(root,'output/preview.html'),html);
export function createPreviewServer(){
 return http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
  if(!['/','/favicon.ico'].includes(req.url)){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(req.method==='HEAD'||req.url==='/favicon.ico'?'':html);
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)&&!process.argv.includes('--write-only')){
 const port=Number(process.env.PORT??4173);if(!Number.isInteger(port)||port<0||port>65535)throw Error('PORT debe ser un puerto válido.');
 const server=createPreviewServer();server.on('error',error=>{console.error('No se pudo iniciar la vista local: '+error.message);process.exitCode=1;});
 server.listen(port,'127.0.0.1',()=>console.log('Vista previa: http://127.0.0.1:'+server.address().port+' · '+rows.length+' publicaciones reales'));
}
