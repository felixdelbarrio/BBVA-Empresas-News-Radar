import test from 'node:test';
import assert from 'node:assert/strict';
import {trendChart} from '../src/client/features/trend-chart.js';

test('la evolución adapta su geometría al móvil, conserva días vacíos y escapa las etiquetas',()=>{
  const chart=trendChart({buckets:['2026-10-07','2026-10-08','2026-10-09'],series:[{entity:'Banco <script>',total:3,values:[1,0,2]}]},330);
  assert.match(chart,/viewBox="0 0 330 260"/);
  assert.match(chart,/2026-10-08 · 0 publicaciones/);
  assert.match(chart,/Banco &lt;script&gt;/);
  assert.doesNotMatch(chart,/<script>/);
  assert.match(trendChart({buckets:[],series:[]}),/cuando haya publicaciones/);
});
