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
  assert.equal((await fetch(url+'/src/Config.gs')).status,404);
  assert.equal((await fetch(url,{method:'POST'})).status,405);
  assert.equal(await (await fetch(url,{method:'HEAD'})).text(),'');
});
