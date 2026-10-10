import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readClientScript} from '../scripts/source.mjs';

function client(responses={}){
  const elements=new Map(),timers=new Map(),requests=[];
  const element=id=>{
    if(!elements.has(id))elements.set(id,{value:'',dataset:{},listeners:{},hidden:false,disabled:false,textContent:'',innerHTML:'',children:[],querySelectorAll:()=>[],classList:{toggle(){}},
      addEventListener(type,fn){this.listeners[type]=fn;},setCustomValidity(value){this.validation=value;},reportValidity(){return !this.elements?.to.validation;}});
    return elements.get(id);
  };
  const form=element('filters');form.elements=Object.fromEntries(['search','country','entity','source','topic','from','to'].map(name=>[name,element(name)]));
  for(const name of ['country','entity','source','topic']){
    const select=form.elements[name];let html='';
    Object.defineProperty(select,'innerHTML',{get:()=>html,set(value){html=value;select.value='';}});
  }
  const context=vm.createContext({document:{getElementById:element,querySelector:element,querySelectorAll:()=>[],createElement:()=>({click(){}})},
    Blob,URL:{createObjectURL:()=> 'blob:local',revokeObjectURL(){}},
    window:{RADAR_PREVIEW:{call(method,query){if(method!=='getDashboard')return Promise.resolve(responses[method]||{saved:true});return new Promise(resolve=>requests.push({query,resolve}));}}},
    FormData:class {constructor(){return Object.entries(form.elements).map(([name,input])=>[name,input.value]);}},
    crypto:{randomUUID:()=> 'test-session'},performance:{now:()=>0},setInterval(){},queueMicrotask,
    setTimeout(fn){const id=timers.size+1;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id)});
  vm.runInContext(readClientScript(),context);
  return {form,element,requests,change(name,value,type='change'){form.elements[name].value=value;form.listeners[type]({type,target:{name}});},
    debounce(){const pending=[...timers.values()];timers.clear();pending.forEach(fn=>fn());}};
}
const dashboard=title=>({items:[{titular:title,fecha:'2026-10-08',pais:'México',entidad:'Santander Empresas',medio:'El País',tema:'Financiación',url:'https://example.com/news'}],
  page:0,pageSize:30,total:1,countries:['España','México'],entities:['BBVA','Santander'],sources:['El País'],topics:['Financiación'],
  stats:{news:1,sources:1,countries:1,signals:0},insights:[],sourceCount:57,daily:false,admin:false});
const settle=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};

test('cambios de desplegable combinan los filtros y conservan sus selecciones',async()=>{
  const c=client();c.requests[0].resolve(dashboard('Inicial'));await settle();
  c.change('country','México');c.change('entity','Santander');c.change('source','El País');
  const latest=c.requests.at(-1);assert.equal(latest.query.country,'México');assert.equal(latest.query.entity,'Santander');assert.equal(latest.query.source,'El País');
  latest.resolve(dashboard('Santander en México'));await settle();
  assert.match(c.element('news-list').innerHTML,/Santander en México/);assert.equal(c.form.elements.entity.value,'Santander');assert.equal(c.form.elements.source.value,'El País');
  c.requests[1].resolve(dashboard('Respuesta antigua'));await settle();assert.doesNotMatch(c.element('news-list').innerHTML,/Respuesta antigua/);
});
test('editar un filtro invalida la respuesta anterior antes de vencer el debounce',async()=>{
  const c=client();c.change('search','tesoreria','input');
  c.requests[0].resolve(dashboard('Obsoleta'));await settle();assert.equal(c.element('news-list').innerHTML,'');
  c.debounce();assert.equal(c.requests.at(-1).query.search,'tesoreria');c.requests.at(-1).resolve(dashboard('Actual'));await settle();assert.match(c.element('news-list').innerHTML,/Actual/);
});
test('fechas invertidas impiden la consulta y limpiar filtros elimina la validación',async()=>{
  const c=client();c.requests[0].resolve(dashboard('Inicial'));await settle();
  c.change('from','2026-10-09');const count=c.requests.length;c.change('to','2026-10-01');
  assert.equal(c.requests.length,count);assert.match(c.form.elements.to.validation,/posterior/);
  for(const input of Object.values(c.form.elements))input.value='';c.form.listeners.reset();await settle();
  assert.equal(c.form.elements.to.validation,'');assert.equal(c.requests.at(-1).query.from,'');assert.equal(c.requests.at(-1).query.to,'');
});


test('módulos administrativos renderizan fuentes y métricas sin depender del radar',async()=>{
  const c=client({getAdoption:{dau:1,wau:1,mau:1,returning:0,sessions:1,events:2,users:[{correo:'owner@bbva.com',first:'2026-10-08',last:'2026-10-09',sessions:1,actions:2}],daily:[]}});
  c.requests[0].resolve({...dashboard('Inicial'),admin:true,feeds:[],configuredFeeds:[{id:'a',name:'Fuente activa',country:'México',kind:'profile',url:'https://example.com/rss',enabled:true}],runs:[],collection:{total:1,processed:1,pending:0,failed:0}});await settle();
  assert.match(c.element('configured-sources-body').innerHTML,/Fuente activa/);
  const edited='Edición sin guardar';c.element('source-fields').innerHTML=edited;
  c.change('entity','Santander');c.requests.at(-1).resolve({...dashboard('Filtrada'),admin:true,feeds:[],configuredFeeds:[{id:'a',name:'Fuente activa',country:'México',kind:'profile',url:'https://example.com/rss',enabled:true}],runs:[],collection:{total:1,processed:1,pending:0,failed:0}});await settle();
  assert.equal(c.element('source-fields').innerHTML,edited);
  await c.element('.nav').listeners.click({target:{closest:()=>({dataset:{view:'adoption'}})}});await settle();
  assert.match(c.element('adoption-body').innerHTML,/owner@bbva.com/);assert.equal(c.element('news-section').hidden,true);
});


test('exportar no vuelve a consultar el dashboard ni reconstruye los formularios',async()=>{
  const c=client({exportNews:{csv:'fecha;entidad',count:1}});c.requests[0].resolve(dashboard('Inicial'));await settle();
  await c.element('export').listeners.click();await settle();assert.equal(c.requests.length,1);assert.match(c.element('message').textContent,/1 publicaciones exportadas/);
});
