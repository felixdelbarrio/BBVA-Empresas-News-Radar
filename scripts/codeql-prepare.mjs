import fs from 'node:fs';
import path from 'node:path';
import {readClientScript} from './source.mjs';

const root=path.resolve(import.meta.dirname,'..'), target=path.join(root,'codeql-source');
fs.mkdirSync(target,{recursive:true});
// CodeQL reconoce JavaScript, pero no la extensión .gs de Apps Script.
for(const name of ['Config','Core','News','Metrics']){
  fs.copyFileSync(path.join(root,'dist',name+'.gs'),path.join(target,name+'.js'));
}
fs.writeFileSync(path.join(target,'Client.js'),readClientScript());
console.log('Backend y cliente preparados en codeql-source/.');
