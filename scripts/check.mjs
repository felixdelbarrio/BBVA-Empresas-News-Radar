import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {readClientScript} from './source.mjs';

const root=path.resolve(import.meta.dirname,'..');
const files=dir=>fs.readdirSync(path.join(root,dir)).map(name=>path.join(dir,name));
for(const file of [...files('scripts'),...files('tests')].filter(file=>file.endsWith('.mjs'))){
  execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'inherit'});
}
const source=files('src').filter(file=>file.endsWith('.gs'));
new vm.Script(source.map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n'));
new vm.Script(readClientScript());
const manifest=JSON.parse(fs.readFileSync(path.join(root,'src/appsscript.json')));
const scopes=['spreadsheets','script.external_request','script.scriptapp','userinfo.email'].map(name=>'https://www.googleapis.com/auth/'+name);
if(manifest.runtimeVersion!=='V8'||JSON.stringify([...manifest.oauthScopes].sort())!==JSON.stringify(scopes.sort()))throw Error('Manifiesto o permisos inesperados.');
const profile=JSON.parse(fs.readFileSync(path.join(root,'assets/news-profile.json')));
if(!profile.primary?.aliases?.length||!profile.topics?.length||!profile.geographies?.every(geo=>geo.name&&geo.competitors?.length))throw Error('Perfil incompleto.');
console.log('Sintaxis, perfil y permisos verificados.');
