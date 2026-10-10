function searchText_(value) {
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
}
function selectNews_(rows,query){return selectAnnotatedNews_(annotateNews_(rows),query);}
function selectAnnotatedNews_(rows, query) {
  const q=searchText_(String(query.search||'').slice(0,160));
  if(query.from && query.to && query.from>query.to)throw new Error('La fecha desde debe ser anterior o igual a la fecha hasta.');
  const entity=query.entity?entityKey_(query.entity):'';
  return rows.filter(r=>(!q || searchText_(r.titular+' '+r.extracto+' '+r.entidad+' '+r.medio).includes(q)) && (!query.country || r.pais===query.country) && (!entity || entityKey_(r.entidad)===entity) && (!query.type || r.tipo===query.type) && (!query.segment || r.segmentos.includes(query.segment)) && (!query.signal || r.senales.includes(query.signal)) && (!query.source || (r.medio===query.source||r.fuente===query.source)) && (!query.topic || r.tema===query.topic) && (!query.from || r.fecha>=query.from) && (!query.to || r.fecha<=query.to)).sort((a,b)=>b.fecha.localeCompare(a.fecha));
}
function newsDashboard_(rows, query, feeds) {
  const selected=selectNews_(rows,query),radar=radarMetrics_(selected,query),page=Math.min(Math.max(0,Math.floor(Number(query.page)||0)),Math.max(0,Math.ceil(selected.length/settings_().pageSize)-1));
  const values=items=>[...new Set(items.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  return {items:selected.slice(page*settings_().pageSize,(page+1)*settings_().pageSize),total:selected.length,page,pageSize:settings_().pageSize,
    countries:values([...rows.map(r=>r.pais),...feeds.map(f=>f.country)]),entities:values([...rows.map(r=>entityKey_(r.entidad)),...feeds.map(f=>entityKey_(f.entity))]),sources:values(rows.map(r=>r.medio)),topics:values([...configuration_().topics.filter(row=>row.enabled).map(row=>row.name),settings_().unclassifiedTopic]),types:values(configuration_().entities.filter(row=>row.enabled).map(row=>row.type)),segments:configuration_().segments.filter(row=>row.enabled).map(row=>row.name),signals:configuration_().signals.filter(row=>row.enabled).map(row=>row.name),radar,stats:radar.summary,briefing:briefing_(selected)};
}
function newsCsv_(rows, query) {
  const selected=selectNews_(rows,query),keys=[...RADAR.sheets.Noticias.filter(k=>!['id','capturada'].includes(k)),'tipo','segmentos','senales'];
  if(selected.length>settings_().exportLimit)throw new Error('Reduce el período para exportar hasta '+settings_().exportLimit+' publicaciones.');
  return {csv:'\ufeff'+[keys,...selected.map(r=>keys.map(k=>r[k]))].map(row=>row.map(value=>'"'+String(safeCell_(value)||'').replace(/"/g,'""')+'"').join(';')).join('\r\n'),count:selected.length};
}
function entityKey_(entity){return businessIndex_().entities.get(searchText_(entity))?.name||String(entity||'').trim();}
