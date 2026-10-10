import fs from 'node:fs';
import path from 'node:path';
import {files} from './source.mjs';

const root=path.resolve(import.meta.dirname,'..'), target=path.join(root,'codeql-source');
fs.mkdirSync(target,{recursive:true});
// CodeQL reconoce JavaScript, pero no la extensión .gs de Apps Script.
for(const file of fs.readdirSync(target))fs.rmSync(path.join(target,file),{recursive:true});
for(const file of files('dist').filter(file=>file.endsWith('.gs'))){
  fs.copyFileSync(path.join(root,file),path.join(target,path.basename(file,'.gs')+'.js'));
}
fs.cpSync(path.join(root,'src/client'),path.join(target,'client'),{recursive:true});
console.log('Backend y cliente preparados en codeql-source/.');
