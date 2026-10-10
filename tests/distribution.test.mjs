import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {root,read} from '../scripts/source.mjs';

test('la distribución coincide con el código fuente y comprobarla detecta cambios sin reescribirla',()=>{
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'news-radar-distribution-'));
  try{
    for(const dir of ['scripts','src','assets','dist'])fs.cpSync(path.join(root,dir),path.join(temporary,dir),{recursive:true});
    fs.symlinkSync(path.join(root,'node_modules'),path.join(temporary,'node_modules'),'dir');
    const check=()=>spawnSync(process.execPath,['scripts/build.mjs','--check'],{cwd:temporary,encoding:'utf8'});
    const initial=check();assert.equal(initial.status,0,initial.stderr);
    const config=path.join(temporary,'dist/Config.gs'),changed=read('src/server/config/Config.gs')+'\n// Distribución modificada\n';
    fs.writeFileSync(config,changed);fs.writeFileSync(path.join(temporary,'dist/Obsolete.gs'),'');fs.unlinkSync(path.join(temporary,'dist/Tokens.html'));
    const result=check();assert.equal(result.status,1);for(const name of ['Config.gs','Obsolete.gs','Tokens.html'])assert.ok(result.stderr.includes(name));
    assert.equal(fs.readFileSync(config,'utf8'),changed);assert.equal(fs.existsSync(path.join(temporary,'dist/Tokens.html')),false);
    assert.equal(read('dist/Config.gs'),read('src/server/config/Config.gs'));
  }finally{fs.rmSync(temporary,{recursive:true,force:true});}
});
