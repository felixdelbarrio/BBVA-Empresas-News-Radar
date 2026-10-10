import fs from 'node:fs';
import path from 'node:path';
import {buildSync} from 'esbuild';

export const root=path.resolve(import.meta.dirname,'..');
export const read=file=>fs.readFileSync(path.join(root,file),'utf8');
export function files(dir){
  return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(dir,entry.name)):[path.join(dir,entry.name)]).sort();
}
export function readServerScript(dir='dist'){
  return files(dir).filter(file=>file.endsWith('.gs')).map(read).join('\n');
}
export function readClientScript(){
  return buildSync({entryPoints:[path.join(root,'src/client/app.js')],bundle:true,write:false,format:'iife',target:'es2022',minifySyntax:true,legalComments:'none'}).outputFiles[0].text;
}
export function renderIncludes(html){
  return html.replace(/<\?!= include_\('([\w]+)'\); \?>/g,(_,name)=>read('dist/'+name+'.html'));
}
