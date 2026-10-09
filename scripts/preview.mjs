import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
const context=vm.createContext({});vm.runInContext(['Config.gs','Core.gs','News.gs'].map(name=>fs.readFileSync(path.join(dist,name),'utf8')).join('\n'),context);
const feeds=vm.runInContext('RADAR.feeds',context), now=new Date('2026-10-09T10:00:00+02:00');
const raw=JSON.parse(fs.readFileSync(path.join(root,'assets/feed-snapshot.json'),'utf8'));
const audit=[];const rows=raw.flatMap((item,i)=>{
  const feed=feeds[i<10?0:1], result=context.evaluate_(item,feed,now);
  audit.push({fecha:now.toISOString(),fuente:feed.name,url:item.url,resultado:result.item?'Incluida':'Excluida',motivo:result.reason||'Metadatos del feed; revisión pendiente'});
  if(!result.item)return [];
  const n=result.item;
  return [{id:String(i),fecha:n.date.toISOString().slice(0,10),pais:feed.country,medio:feed.name,entidad:feed.entity,titular:n.title,extracto:n.excerpt,tema:n.topic,url:n.url,fuente:feed.name}];
});
const preview=`<script>window.RADAR_PREVIEW={async call(method,q={}){const rows=${JSON.stringify(rows).replace(/</g,'\\u003c')};const feeds=${JSON.stringify(feeds)};if(method==='recordEvents')return {saved:true};if(method==='getAudit')return ${JSON.stringify(audit).replace(/</g,'\\u003c')};if(method==='exportNews'){const keys=['fecha','pais','medio','entidad','titular','extracto','tema','url','fuente'];return {csv:[keys,...rows.map(r=>keys.map(k=>r[k]))].map(r=>r.map(v=>JSON.stringify(v)).join(';')).join('\\r\\n'),count:rows.length};}if(method!=='getDashboard')throw new Error('Esta acción necesita la instalación en Apps Script.');const selected=rows.filter(r=>(!q.search||(r.titular+' '+r.extracto).toLowerCase().includes(q.search.toLowerCase()))&&(!q.country||r.pais===q.country)&&(!q.entity||r.entidad===q.entity)&&(!q.source||r.medio===q.source)&&(!q.topic||r.tema===q.topic)&&(!q.from||r.fecha>=q.from)&&(!q.to||r.fecha<=q.to)).sort((a,b)=>b.fecha.localeCompare(a.fecha));return {items:selected.slice((q.page||0)*30,((q.page||0)+1)*30),total:selected.length,page:q.page||0,pageSize:30,entities:[...new Set(rows.map(r=>r.entidad))],sources:[...new Set(rows.map(r=>r.medio))],countries:[...new Set(rows.map(r=>r.pais))],topics:[...new Set(rows.map(r=>r.tema))],stats:{news:selected.length,sources:new Set(selected.map(r=>r.medio)).size,countries:0,signals:selected.filter(r=>r.tema==='Regulación y ratings').length},insights:[selected.length+' publicaciones en esta selección.','Instantánea real de los feeds oficiales descargada el 9 de octubre de 2026.','La cobertura de partida incluye Empresas e Información corporativa de BBVA.','Las noticias se incorporan automáticamente desde las fuentes activas.','Activa la programación al instalar la aplicación en Google.'],runs:[],lastRun:'',sourceCount:${context.defaultFeeds_().length},feeds,daily:false,admin:false,sheetUrl:''};}};</script>`;
const read=name=>fs.readFileSync(path.join(dist,name+'.html'),'utf8');
const html=read('Index').replace('<script>\n(() => {',preview+'<script>\n(() => {');
fs.mkdirSync(path.join(root,'output'),{recursive:true});fs.writeFileSync(path.join(root,'output/preview.html'),html);
export function createPreviewServer(){
  return http.createServer((req,res)=>{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
    if(!['/','/favicon.ico'].includes(req.url)){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
    res.end(req.method==='HEAD'||req.url==='/favicon.ico'?'':html);
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)&&!process.argv.includes('--write-only')){
  const port=Number(process.env.PORT??4173);
  if(!Number.isInteger(port)||port<0||port>65535)throw Error('PORT debe ser un puerto válido.');
  const server=createPreviewServer();
  server.on('error',error=>{console.error('No se pudo iniciar la vista local: '+error.message);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log('Vista previa: http://127.0.0.1:'+server.address().port+' · '+rows.length+' publicaciones reales'));
}
