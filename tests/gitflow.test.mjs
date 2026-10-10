import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const repository='felixdelbarrio/BBVA-Empresas-News-Radar';
const check=(...args)=>spawnSync(process.execPath,['scripts/gitflow-check.mjs',...args]).status;
test('develop admite PRs desde otras ramas sin exigir prefijos; master solo admite develop',()=>{
  for(const [base,head,expected] of [
    ['develop','feature/search',0],['develop','bugfix/feeds',0],['develop','release/1.0.0',0],
    ['develop','hotfix/auth',0],['develop','master',0],['develop','codex/newsletter',0],
    ['develop','ajustes-newsletter',0],['master','release/1.0.0',1],['master','hotfix/auth',1],
    ['master','develop',0],['master','feature/search',1],['develop','develop',1],
    ['master','master',1],['main','develop',1],['develop','',1]
  ])assert.equal(check(base,head,repository,repository),expected,base+' ← '+head);
});
test('una rama develop de un fork no puede publicar en master y faltan datos implica rechazo',()=>{
  assert.equal(check('master','develop',repository,'other/BBVA-Empresas-News-Radar'),1);
  assert.equal(check('develop','feature/search',repository,'other/BBVA-Empresas-News-Radar'),0);
  assert.equal(check('master','develop'),1);assert.equal(check('develop','feature/search'),1);
});
