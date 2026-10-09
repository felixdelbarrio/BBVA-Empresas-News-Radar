import fs from 'node:fs';
import path from 'node:path';

export function readClientScript(){
  const source=fs.readFileSync(path.resolve(import.meta.dirname,'../src/Client.html'),'utf8').trim();
  if(!source.startsWith('<script>')||!source.endsWith('</script>'))throw Error('Client.html debe contener un único bloque de script.');
  return source.slice('<script>'.length,-'</script>'.length);
}
