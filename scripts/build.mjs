import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {root,read,files,readClientScript,readServerScript} from './source.mjs';
import {designOutputs} from './design.mjs';

const dist=path.join(root,'dist');
fs.mkdirSync(dist,{recursive:true});
const c=vm.createContext({});vm.runInContext(readServerScript('src/server'),c);
const asset=(file,type)=>'data:'+type+';base64,'+fs.readFileSync(path.join(root,'assets',file)).toString('base64');
const parts={BbvaLogo:asset('bbva-logo.png','image/png'),BiaLogo:asset('bia.svg','image/svg+xml'),
  ...Object.fromEntries(['MaxFeeds','WindowDays','RetentionDays','EventLimit'].map((name,i)=>[name,vm.runInContext(['RADAR.maxCustomFeeds','RADAR.windowDays','RADAR.retentionDays','RADAR.eventLimit'][i],c)]))};
parts.EventLimit=Number(parts.EventLimit).toLocaleString('es-ES');
const views=files('src/views').filter(file=>file.endsWith('.html'));
for(const file of views)parts[path.basename(file,'.html')]=read(file);
function template(html){return html.replace(/\{\{(\w+)\}\}/g,(_,name)=>{if(!(name in parts))throw Error('Bloque desconocido: '+name);return template(String(parts[name]));});}
const design=designOutputs();
const output={
  'Profile.gs':'const NEWS_PROFILE = Object.freeze('+read('assets/news-profile.json').trim()+');\n',
  'Design.gs':design.sheet,
  'Index.html':template(parts.Index),
  'Tokens.html':design.tokens,
  'Styles.html':'<style>\n'+['base','layout','components','responsive'].map(name=>read('src/styles/'+name+'.css')).join('\n')+'\n</style>',
  'Client.html':'<script id="radar-client">\n'+readClientScript()+'</script>',
  'appsscript.json':read('src/appsscript.json')
};
for(const file of files('src/server')){
  const name=path.basename(file);if(name in output)throw Error('Nombre de módulo duplicado: '+name);output[name]=read(file);
}
new vm.Script(Object.entries(output).filter(([name])=>name.endsWith('.gs')).map(([,code])=>code).join('\n'));
for(const file of fs.readdirSync(dist))fs.unlinkSync(path.join(dist,file));
for(const [name,content] of Object.entries(output))fs.writeFileSync(path.join(dist,name),content);
console.log('Paquete modular generado: '+Object.keys(output).length+' archivos en dist/.');
