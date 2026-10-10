function getDashboard(query) {
  const session=authorize_(),feeds=feeds_();
  return {...newsDashboard_(rows_('Noticias',RADAR.newsReadLimit),query||{},feeds),
    lastRun:rows_('Ejecuciones',1)[0]?.inicio||'',sourceCount:feeds.length,daily:properties_().getProperty('DAILY_ENABLED')==='true',admin:session.admin,
    ...(session.admin?{runs:rows_('Ejecuciones',10).reverse(),feeds:customFeeds_(),configuredFeeds:configuredFeeds_(),sheetUrl:book_().getUrl(),collection:collectionStatus_()}:{} )};
}
function getAudit() { authorize_(true); return rows_('Auditoria',100).reverse(); }
function exportNews(query) {
  authorize_();return newsCsv_(rows_('Noticias',RADAR.newsReadLimit),query||{});
}
