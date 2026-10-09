function getDashboard(query) {
  const session=authorize_();query=query||{};
  const rows=rows_('Noticias',RADAR.newsReadLimit), selected=selectNews_(rows,query), page=Math.max(0,Math.floor(Number(query.page)||0));
  return {items:selected.slice(page*RADAR.pageSize,(page+1)*RADAR.pageSize),total:selected.length,page,pageSize:RADAR.pageSize,
    countries:[...new Set(rows.map(r=>r.pais))].sort(),entities:[...new Set(rows.map(r=>entityKey_(r.entidad)))].sort(),sources:[...new Set(rows.map(r=>r.medio))].sort(), topics:[...new Set(rows.map(r=>r.tema))].sort(), insights:insights_(selected),
    stats:{news:selected.length,sources:new Set(selected.map(r=>r.medio)).size,countries:new Set(selected.map(r=>r.pais).filter(x=>x!=='Sin determinar')).size,signals:selected.filter(r=>r.tema==='Regulación y ratings').length},
    lastRun:rows_('Ejecuciones',1)[0]?.inicio||'',sourceCount:feeds_().length,daily:properties_().getProperty('DAILY_ENABLED')==='true',admin:session.admin,
    ...(session.admin?{runs:rows_('Ejecuciones',10).reverse(),feeds:customFeeds_(),configuredFeeds:configuredFeeds_(),sheetUrl:book_().getUrl(),collection:collectionStatus_()}:{} )};
}
function getAudit() { authorize_(true); return rows_('Auditoria',100).reverse(); }
function exportNews(query) {
  authorize_();
  const rows=selectNews_(rows_('Noticias',RADAR.newsReadLimit),query||{}), keys=RADAR.sheets.Noticias.filter(k=>!['id','capturada'].includes(k));
  if (rows.length>RADAR.exportLimit) throw new Error('Reduce el período para exportar hasta '+RADAR.exportLimit+' publicaciones.');
  const csv='\ufeff'+[keys,...rows.map(r=>keys.map(k=>r[k]))].map(row=>row.map(value=>'"'+String(safeCell_(value)||'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
  return {csv,count:rows.length};
}
