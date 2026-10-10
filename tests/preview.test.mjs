import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createPreviewServer} from '../scripts/preview.mjs';

test('servidor local entrega la WebApp autónoma y limita rutas y métodos',async t=>{
  const server=createPreviewServer();
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  const url='http://127.0.0.1:'+server.address().port;
  const response=await fetch(url);
  assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,/News Radar/);
  assert.match(html,/window.RADAR_PREVIEW/);
  assert.match(html,/data:image\/svg\+xml;base64,/);
  assert.match(html,/data:font\/woff2;base64,/);
  assert.doesNotMatch(html,/\{\{\w+\}\}/);
  assert.equal((await fetch(url+'/src/server/config/Config.gs')).status,404);
  assert.equal((await fetch(url,{method:'POST'})).status,405);
  assert.equal(await (await fetch(url,{method:'HEAD'})).text(),'');
});

test('vista autónoma comparte filtros, normalización de entidades y CSV con Apps Script',async()=>{
  const {default:fs}=await import('node:fs');const {default:vm}=await import('node:vm');
  const html=fs.readFileSync('output/preview.html','utf8');const adapter=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(match=>match[1].includes('window.RADAR_PREVIEW='))[1];
  const c=vm.createContext({window:{}});vm.runInContext(adapter,c);const preview=c.window.RADAR_PREVIEW;
  const all=await preview.call('getDashboard'),filtered=await preview.call('getDashboard',{search:'BBVA',entity:'BBVA',source:all.sources[0]});
  assert.ok(filtered.total>0);assert.ok(filtered.total<all.total);assert.equal((await preview.call('exportNews',{search:'BBVA',entity:'BBVA',source:all.sources[0]})).count,filtered.total);
  const empty=await preview.call('getDashboard',{entity:'Santander',country:'México'});assert.equal(empty.total,0);assert.ok(empty.entities.includes('Santander'));assert.ok(empty.countries.includes('México'));
});

test('vista local registra actividad real de la sesión y bloquea el correo remoto',async()=>{
 const fs=await import('node:fs'),vm=await import('node:vm');const html=fs.readFileSync('output/preview.html','utf8'),adapter=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(match=>match[1].includes('window.RADAR_PREVIEW='))[1].replace('admin=false','admin=true');
 const c=vm.createContext({window:{}});vm.runInContext(adapter,c);const preview=c.window.RADAR_PREVIEW;assert.equal((await preview.call('getAdoption')).events,0);
 await preview.call('recordEvents',[{session:'local-session',event:'rendimiento',view:'radar',duration:120}]);const activity=await preview.call('getAdoption');assert.equal(activity.events,1);assert.equal(activity.dau,1);assert.equal((await preview.call('getTelemetry')).latencyP95,120);assert.equal((await preview.call('getAudit')).length,0);
 await assert.rejects(preview.call('sendNewsletterTest'),/No se envían correos/);
});
