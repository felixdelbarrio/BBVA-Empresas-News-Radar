import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {readServerScript,renderIncludes} from './source.mjs';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
const context=vm.createContext({});vm.runInContext(readServerScript(),context);
const feeds=vm.runInContext('RADAR.feeds',context), now=new Date('2026-10-09T10:00:00+02:00');
const raw=JSON.parse(fs.readFileSync(path.join(root,'assets/feed-snapshot.json'),'utf8'));
const audit=[];const rows=raw.flatMap((item,i)=>{
  const feed=feeds[i<10?0:1], result=context.evaluate_(item,feed,now);
  audit.push({fecha:now.toISOString(),fuente:feed.name,url:item.url,resultado:result.item?'Incluida':'Excluida',motivo:result.reason||'Metadatos del feed'});
  if(!result.item)return [];
  const n=result.item;
  return [{id:String(i),fecha:n.date.toISOString().slice(0,10),pais:feed.country,medio:feed.name,entidad:feed.entity,titular:n.title,extracto:n.excerpt,tema:n.topic,url:n.url,fuente:feed.name}];
});
const shared=['searchText_','entityKey_','selectNews_','insights_','newsDashboard_','safeCell_','newsCsv_'].map(name=>context[name].toString()).join('\n');
const serialize=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const preview=`<script>(()=>{
const RADAR=${serialize(vm.runInContext('({pageSize:RADAR.pageSize,exportLimit:RADAR.exportLimit,sheets:RADAR.sheets})',context))};
const NEWS_PROFILE=${serialize(vm.runInContext('NEWS_PROFILE',context))};
const rows=${serialize(rows)},feeds=${serialize(context.defaultFeeds_())};
${shared}
window.RADAR_PREVIEW={async call(method,q={}){
  if(method==='recordEvents')return {saved:true};
  if(method==='getAudit')return ${serialize(audit)};
  if(method==='exportNews')return newsCsv_(rows,q);
  if(method!=='getDashboard')throw new Error('Esta acción necesita la instalación en Apps Script.');
  return {...newsDashboard_(rows,q,feeds),runs:[],lastRun:'',sourceCount:feeds.length,feeds:[],daily:false,admin:false,sheetUrl:''};
}};
})();</script>`;
const read=name=>fs.readFileSync(path.join(dist,name+'.html'),'utf8');
const html=renderIncludes(read('Index')).replace('<script id="radar-client">',preview+'<script id="radar-client">');
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
