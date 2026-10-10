import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {read,files} from '../scripts/source.mjs';
import {designTokens} from '../scripts/design.mjs';

test('CSS, fuentes y tema de Sheets proceden del único fichero de tokens',()=>{
  const {css,fonts,sheet}=designTokens(),html=read('dist/Tokens.html');
  for(const [name,value] of Object.entries(css))assert.ok(html.includes('--'+name+': '+value+';'));
  assert.equal((html.match(/@font-face/g)||[]).length,fonts.length);
  const theme=vm.runInNewContext(read('dist/Design.gs')+';SHEET_THEME');assert.equal(theme.background,css[sheet.background]);assert.equal(theme.foreground,css[sheet.foreground]);
  for(const file of files('src/styles'))assert.doesNotMatch(read(file),/#[\da-f]{3,8}\b|--[\w-]+\s*:/i,'Estilos sin colores ni tokens duplicados: '+file);
  assert.doesNotMatch(read('src/server/storage/Store.gs'),/#[\da-f]{3,8}\b/i);
});
