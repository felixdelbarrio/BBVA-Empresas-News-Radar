function searchText_(value) {
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
}
function selectNews_(rows, query) {
  const q=searchText_(String(query.search||'').slice(0,160));
  if(query.from && query.to && query.from>query.to)throw new Error('La fecha desde debe ser anterior o igual a la fecha hasta.');
  const entity=query.entity?entityKey_(query.entity):'';
  return rows.filter(r=>(!q || searchText_(r.titular+' '+r.extracto+' '+r.entidad+' '+r.medio).includes(q)) && (!query.country || r.pais===query.country) && (!entity || entityKey_(r.entidad)===entity) && (!query.source || r.medio===query.source) && (!query.topic || r.tema===query.topic) && (!query.from || r.fecha>=query.from) && (!query.to || r.fecha<=query.to)).sort((a,b)=>b.fecha.localeCompare(a.fecha));
}
function newsDashboard_(rows, query, feeds) {
  const selected=selectNews_(rows,query),page=Math.min(Math.max(0,Math.floor(Number(query.page)||0)),Math.max(0,Math.ceil(selected.length/RADAR.pageSize)-1));
  const values=items=>[...new Set(items.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  return {items:selected.slice(page*RADAR.pageSize,(page+1)*RADAR.pageSize),total:selected.length,page,pageSize:RADAR.pageSize,
    countries:values([...rows.map(r=>r.pais),...feeds.map(f=>f.country)]),entities:values([...rows.map(r=>entityKey_(r.entidad)),...feeds.map(f=>entityKey_(f.entity))]),sources:values(rows.map(r=>r.medio)),topics:values(rows.map(r=>r.tema)),insights:insights_(selected),
    stats:{news:selected.length,sources:new Set(selected.map(r=>r.medio)).size,countries:new Set(selected.map(r=>r.pais).filter(x=>x!=='Sin determinar')).size,signals:selected.filter(r=>r.tema==='Regulación y ratings').length}};
}
function newsCsv_(rows, query) {
  const selected=selectNews_(rows,query),keys=RADAR.sheets.Noticias.filter(k=>!['id','capturada'].includes(k));
  if(selected.length>RADAR.exportLimit)throw new Error('Reduce el período para exportar hasta '+RADAR.exportLimit+' publicaciones.');
  return {csv:'\ufeff'+[keys,...selected.map(r=>keys.map(k=>r[k]))].map(row=>row.map(value=>'"'+String(safeCell_(value)||'').replace(/"/g,'""')+'"').join(';')).join('\r\n'),count:selected.length};
}
function insights_(rows) {
  const counts={};rows.forEach(row=>counts[row.tema]=(counts[row.tema]||0)+1);
  const top=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0],countries=new Set(rows.map(row=>row.pais).filter(country=>country!=='Sin determinar')),publishers=new Set(rows.map(row=>row.medio));
  return [rows.length+' publicaciones en la selección.',top?'El tema más frecuente es '+top[0]+'.':'No hay publicaciones para identificar un tema predominante.',publishers.size+' medios con publicaciones en la selección.',countries.size+' ámbitos geográficos de seguimiento; el ámbito de la fuente no atribuye la operación a ese país.','Las noticias se incorporan automáticamente desde los feeds. Consulta el enlace de cada publicación para leer su contenido.'];
}
function entityKey_(entity) {
  if(NEWS_PROFILE.primary.name===entity||NEWS_PROFILE.primary.aliases.includes(entity))return 'BBVA';
  return String(entity||'').replace(/\s+Empresas$/i,'').trim();
}
