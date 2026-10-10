import fs from 'node:fs';
import path from 'node:path';
import {root,read} from './source.mjs';

export function designTokens(){
  const tokens=JSON.parse(read('src/design/tokens.json'));
  for(const [key,value] of Object.entries(tokens.css)){
    if(!/^[\w-]+$/.test(key)||typeof value!=='string'||/[{};<>]/.test(value))throw Error('Token inválido: '+key);
  }
  for(const key of Object.values(tokens.sheet))if(!/^#[\da-f]{6}$/i.test(tokens.css[key]||''))throw Error('Token de Sheets inválido: '+key);
  for(const font of tokens.fonts)if(!font.family||!Number.isInteger(font.weight)||!fs.existsSync(path.join(root,'assets/fonts',font.file)))throw Error('Fuente tipográfica inválida.');
  return tokens;
}
export function designOutputs(){
  const {css,fonts,sheet}=designTokens();
  const rules=fonts.map(({file,family,weight})=>`@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url('data:font/woff2;base64,${fs.readFileSync(path.join(root,'assets/fonts',file)).toString('base64')}') format('woff2');}`);
  return {tokens:'<style>\n'+rules.join('\n')+'\n:root{\n'+Object.entries(css).map(([name,value])=>'  --'+name+': '+value+';').join('\n')+'\n}\n</style>',
    sheet:'const SHEET_THEME = Object.freeze('+JSON.stringify(Object.fromEntries(Object.entries(sheet).map(([role,key])=>[role,css[key]])))+');\n'};
}
