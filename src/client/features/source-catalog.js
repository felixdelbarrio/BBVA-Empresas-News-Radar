import {$,escape,validUrl} from '../core/dom.js';
export function createSourceCatalog(){
  let feeds=[],enabled=new Set(),page=0,pageSize=0;
  function render(){
    const term=$('source-search').value.trim().toLocaleLowerCase(),rows=feeds.filter(feed=>[feed.name,feed.entity,feed.country].join(' ').toLocaleLowerCase().includes(term)),pages=Math.max(1,Math.ceil(rows.length/pageSize));
    page=Math.min(page,pages-1);
    $('configured-sources-body').innerHTML=rows.slice(page*pageSize,(page+1)*pageSize).map(feed=>`<tr><td><input type="checkbox" class="source-enabled" data-id="${escape(feed.id)}" aria-label="Activar ${escape(feed.name)}" ${enabled.has(feed.id)?'checked':''}></td><td>${escape(feed.name)}</td><td>${escape(feed.country)}</td><td>${feed.kind==='profile'?'Google News RSS':'RSS del editor'}</td><td><a href="${escape(validUrl(feed.url))}" target="_blank" rel="noopener noreferrer">Abrir feed ↗</a></td></tr>`).join('')||'<tr><td colspan="5">No hay fuentes con este criterio.</td></tr>';
    $('source-page').textContent=rows.length+' fuentes · página '+(page+1)+' de '+pages;
    $('source-prev').disabled=page===0;$('source-next').disabled=page>=pages-1;
    $('configured-source-count').textContent=feeds.length+' fuentes configuradas · '+enabled.size+' activas';
  }
  $('source-search').addEventListener('input',()=>{page=0;render();});
  $('source-prev').addEventListener('click',()=>{page--;render();});$('source-next').addEventListener('click',()=>{page++;render();});
  $('configured-sources-body').addEventListener('change',event=>{const input=event.target;if(!input.matches('.source-enabled'))return;if(input.checked)enabled.add(input.dataset.id);else enabled.delete(input.dataset.id);$('configured-source-count').textContent=feeds.length+' fuentes configuradas · '+enabled.size+' activas';});
  return {update(rows,size){feeds=rows;pageSize=size;enabled=new Set(rows.filter(row=>row.enabled).map(row=>row.id));render();},selected:()=>[...enabled]};
}
