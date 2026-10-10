import { $, escape, message } from '../core/dom.js';
import { call } from '../core/api.js';
import schema from '../../../assets/admin-schema.json';
export function createConfiguration({run}){
  let config,revision,category='entities';
  async function fetchConfig(){const snapshot=await call('getConfiguration');config=snapshot.config;revision=snapshot.revision;}
  function readFields(){
    if(!config)return;
    if(category==='settings'){
      for(const input of $('catalog-fields').querySelectorAll('[data-key]'))config.settings[input.dataset.key]=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.dataset.list==='true'?input.value.split(';').map(value=>value.trim()).filter(Boolean):input.value;
    }else config[category]=[...$('catalog-fields').children].map(row=>Object.fromEntries([...row.querySelectorAll('[data-key]')].map(input=>[input.dataset.key,input.type==='checkbox'?input.checked:input.dataset.list==='true'?input.value.split(';').map(value=>value.trim()).filter(Boolean):input.value])));
  }
  function fields(fields,row){return fields.map(([key,label,type])=>`<label>${escape(label)}${type==='boolean'?`<input type="checkbox" data-key="${key}" ${row[key]?'checked':''}>`:`<input data-key="${key}" ${type==='list'?'data-list="true"':''} type="${type==='number'?'number':'text'}" value="${escape(type==='list'?(row[key]||[]).join('; '):row[key]??'')}">`}</label>`).join('');}
  function render(){
    const meta=schema[category];$('catalog-help').textContent=meta.help;$('catalog-add').hidden=category==='settings';
    $('catalog-fields').innerHTML=category==='settings'?schema.settings.groups.map(group=>`<fieldset class="catalog-group"><legend>${escape(group.label)}</legend><div class="catalog-settings">${group.keys.map(key=>{const value=config.settings[key];return fields([[key,schema.settings.labels[key],Array.isArray(value)?'list':typeof value==='number'?'number':typeof value==='boolean'?'boolean':'text']],config.settings);}).join('')}</div></fieldset>`).join(''):config[category].map(row=>`<details class="catalog-row" ${row.name?"":"open"}><summary><strong>${escape(row.name||"Nueva entrada")}</strong><span>${escape(row.type||"")} · ${row.enabled?"Activa":"Inactiva"}</span></summary><div class="catalog-grid">${fields(meta.fields,row)}</div><div class="actions"><button type="button" class="button" data-move="-1">Subir</button><button type="button" class="button" data-move="1">Bajar</button><button type="button" class="button" data-remove>Eliminar</button></div></details>`).join('');
  }
  $('catalog-category').innerHTML=Object.entries(schema).map(([key,meta])=>`<option value="${key}">${escape(meta.label)}</option>`).join('');
  $('catalog-category').addEventListener('change',()=>{readFields();category=$('catalog-category').value;render();});
  $('catalog-fields').addEventListener('click',event=>{const remove=event.target.closest('[data-remove]');if(remove)remove.closest('.catalog-row').remove();const move=event.target.closest('[data-move]');if(move){const row=move.closest('.catalog-row'),index=[...$('catalog-fields').children].indexOf(row),target=index+Number(move.dataset.move);readFields();if(target>=0&&target<config[category].length){[config[category][index],config[category][target]]=[config[category][target],config[category][index]];render();}}});
  $('catalog-add').addEventListener('click',()=>{readFields();config[category].push(Object.fromEntries(schema[category].fields.map(([key,,type])=>[key,type==='list'?[]:type==='boolean'?true:''])));render();});
  $('catalog-form').addEventListener('submit',event=>{event.preventDefault();readFields();run(async()=>{message(await call('saveConfiguration',{config,revision}));await fetchConfig();render();});});
  $('catalog-reload').addEventListener('click',()=>run(async()=>{await fetchConfig();render();},false));
  return {async open(){if(!config){await fetchConfig();render();}}};
}
