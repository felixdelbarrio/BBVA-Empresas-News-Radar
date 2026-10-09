import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..'),src=path.join(root,'src'),dist=path.join(root,'dist');
fs.mkdirSync(dist,{recursive:true});
const read=file=>fs.readFileSync(path.join(src,file),'utf8');
const data=(file,type)=>'data:'+type+';base64,'+fs.readFileSync(path.join(root,'assets',file)).toString('base64');
const fonts=[['BentonSansBBVA-Book.woff2','BBVA Benton Sans',400],['BentonSansBBVA-Medium.woff2','BBVA Benton Sans',500],['tiempos-headline-bold.woff2','Tiempos Headline',700]];
const tokens=read('Tokens.html'),color=name=>tokens.match(new RegExp('--'+name+':\\s*(#[a-f0-9]+)','i'))[1];
const c=vm.createContext({});vm.runInContext(read('Config.gs')+'\n'+read('Rules.gs'),c);
const parts={
  Fonts:'<style>'+fonts.map(([file,family,weight])=>`@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url('${data('fonts/'+file,'font/woff2')}') format('woff2');}`).join('\n')+'</style>',
  Tokens:tokens,Styles:read('Styles.html'),Client:read('Client.html'),
  BbvaLogo:data('bbva-logo.png','image/png'),BiaLogo:data('bia.svg','image/svg+xml'),MaxFeeds:vm.runInContext('RADAR.maxFeeds',c),WindowDays:vm.runInContext('RADAR.windowDays',c),RetentionDays:vm.runInContext('RADAR.retentionDays',c),EventLimit:Number(vm.runInContext('RADAR.eventLimit',c)).toLocaleString('es-ES')
};
const html=read('Index.html').replace(/\{\{(\w+)\}\}/g,(_,name)=>{if(!(name in parts))throw Error('Bloque desconocido: '+name);return parts[name];});
const theme='const SHEET_THEME = Object.freeze('+JSON.stringify({background:color('color-primary-bg-action-pressed'),foreground:color('color-primary-text-on-main')})+');\n';
const profile='const NEWS_PROFILE = Object.freeze('+fs.readFileSync(path.join(root,'assets/news-profile.json'),'utf8').trim()+');\n';
const modules={Config:theme+profile+read('Config.gs'),Core:read('Rules.gs')+'\n'+read('Access.gs')+'\n'+read('Store.gs'),News:read('News.gs')+'\n'+read('Feeds.gs')+'\n'+read('Search.gs'),Metrics:read('Metrics.gs')};
new vm.Script(Object.values(modules).join('\n'));
for(const file of fs.readdirSync(dist))fs.unlinkSync(path.join(dist,file));
fs.writeFileSync(path.join(dist,'Index.html'),html);for(const [name,code] of Object.entries(modules))fs.writeFileSync(path.join(dist,name+'.gs'),code);fs.writeFileSync(path.join(dist,'appsscript.json'),read('appsscript.json'));
console.log('Paquete autónomo generado: Config.gs, Core.gs, News.gs, Metrics.gs, Index.html y appsscript.json.');
