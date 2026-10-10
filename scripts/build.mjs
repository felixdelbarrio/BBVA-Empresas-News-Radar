import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {root,read,files,readClientScript} from './source.mjs';
import {worldMap} from './world-map.mjs';
import {designOutputs} from './design.mjs';

const dist=path.join(root,'dist');
const version=vm.runInNewContext(read('src/server/config/Config.gs')+';RADAR.version');
const asset=(file,type)=>'data:'+type+';base64,'+fs.readFileSync(path.join(root,'assets',file)).toString('base64');
const parts={WorldMap:worldMap(),BbvaLogo:asset('bbva-logo.png','image/png'),BiaLogo:asset('bia.svg','image/svg+xml'),ReleaseVersion:version};
for(const file of files('assets/icons'))parts['Icon'+path.basename(file,'.svg').split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join('')]=read(file).replace('<svg ','<svg class="icon" aria-hidden="true" focusable="false" ');
const views=files('src/views').filter(file=>file.endsWith('.html'));
for(const file of views)parts[path.basename(file,'.html')]=read(file);
function template(html){return html.replace(/\{\{(\w+)\}\}/g,(_,name)=>{if(!(name in parts))throw Error('Bloque desconocido: '+name);return template(String(parts[name]));});}
const design=designOutputs(),tokens=JSON.parse(read('src/design/tokens.json')).css;
const newsletterStyle=read('src/styles/newsletter.css').replace(/var\(--([\w-]+)\)/g,(_,key)=>tokens[key]);
const newsletterInline={};for(const [,selectors,rule] of newsletterStyle.matchAll(/([^{}]+)\{([^{}]*)\}/g))for(const selector of selectors.split(','))newsletterInline[selector.trim()]=(newsletterInline[selector.trim()]||'')+rule+';';
const output={
  'Defaults.gs':'const CONFIGURATION_DEFAULTS = Object.freeze('+read('assets/configuration-defaults.json').trim()+');\n',
  'Design.gs':design.sheet,
  'Newsletter.gs':'const NEWSLETTER_STYLE = '+JSON.stringify(newsletterStyle)+';\nconst NEWSLETTER_INLINE = '+JSON.stringify(newsletterInline)+';\n',
  'Index.html':template(parts.Index),
  'Tokens.html':design.tokens,
  'Styles.html':'<style>\n'+['base','layout','components','dashboard','briefing','responsive'].map(name=>read('src/styles/'+name+'.css')).join('\n')+'\n</style>',
  'Client.html':'<script id="radar-client">\n'+readClientScript()+'</script>',
  'appsscript.json':read('src/appsscript.json')
};
for(const file of files('src/server')){
  const name=path.basename(file);if(name in output)throw Error('Nombre de módulo duplicado: '+name);output[name]=read(file);
}
new vm.Script(Object.entries(output).filter(([name])=>name.endsWith('.gs')).map(([,code])=>code).join('\n'));
if(process.argv.includes('--check')){
  const stored=fs.existsSync(dist)?files('dist').map(file=>path.relative('dist',file)):[],expected=Object.keys(output);
  const changed=[...new Set([...stored,...expected])].filter(name=>!(name in output)||!fs.existsSync(path.join(dist,name))||fs.readFileSync(path.join(dist,name),'utf8')!==output[name]);
  if(changed.length)throw Error('Distribución desactualizada: '+changed.join(', ')+'. Ejecuta make build e incluye dist/ en el commit.');
  console.log('Distribución reproducible y actualizada · release '+version+'.');
}else{
  fs.mkdirSync(dist,{recursive:true});
  for(const file of fs.readdirSync(dist))fs.unlinkSync(path.join(dist,file));
  for(const [name,content] of Object.entries(output))fs.writeFileSync(path.join(dist,name),content);
  console.log('Paquete modular generado: '+Object.keys(output).length+' archivos en dist/ · release '+version+'.');
}
