import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {readClientScript,readServerScript,files} from './source.mjs';
import {designTokens} from './design.mjs';

const root=path.resolve(import.meta.dirname,'..');
for(const file of [...files('scripts'),...files('tests'),...files('src/client')].filter(file=>file.match(/\.(mjs|js)$/))){
  execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'inherit'});
}
new vm.Script(readServerScript('src/server'));
new vm.Script(readClientScript());
const manifest=JSON.parse(fs.readFileSync(path.join(root,'src/appsscript.json')));
const scopes=['spreadsheets','script.external_request','script.scriptapp','userinfo.email','gmail.send','gmail.settings.basic'].map(name=>'https://www.googleapis.com/auth/'+name);
if(manifest.runtimeVersion!=='V8'||JSON.stringify([...manifest.oauthScopes].sort())!==JSON.stringify(scopes.sort()))throw Error('Manifiesto o permisos inesperados.');
const config=JSON.parse(fs.readFileSync(path.join(root,'assets/configuration-defaults.json')));
const validation=vm.createContext({});vm.runInContext(readServerScript('src/server'),validation);validation.validateConfiguration_(config);
if(!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/.test(vm.runInContext('RADAR.version',validation)))throw Error('RADAR.version debe indicar una versión major.minor.patch, opcionalmente con sufijo de prerelease.');
const {css}=designTokens();
for(const file of files('src/styles'))for(const token of fs.readFileSync(path.join(root,file),'utf8').matchAll(/var\(--([\w-]+)\)/g))if(!(token[1] in css))throw Error('Token desconocido: '+token[1]);
console.log('Sintaxis, diseño, perfil y permisos verificados.');
