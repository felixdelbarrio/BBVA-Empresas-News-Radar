import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

test('GitFlow permite desarrollo, releases y hotfixes; rechaza accesos directos a master',()=>{
  for(const [base,head,expected] of [
    ['develop','feature/search',0],['develop','bugfix/feeds',0],['develop','release/1.0.0',0],
    ['develop','hotfix/auth',0],['develop','master',0],['master','release/1.0.0',0],
    ['master','hotfix/auth',0],['master','develop',1],['master','feature/search',1],
    ['develop','main',1],['develop','feature/',1]
  ])assert.equal(spawnSync(process.execPath,['scripts/gitflow-check.mjs',base,head]).status,expected,base+' ← '+head);
});
