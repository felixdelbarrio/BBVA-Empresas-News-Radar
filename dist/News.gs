function getDashboard(query) {
  const session=authorize_(),feeds=feeds_(),config=configuration_();
  const initial=Boolean(query?.initial);if(initial)query={entity:config.settings.defaultEntity,segment:config.settings.defaultSegment,topic:config.settings.defaultTopic,country:config.settings.defaultCountry};
  return {...newsDashboard_(rows_('Noticias',settings_().newsReadLimit),query||{},feeds),
    initial,selection:query||{},preferences:{timezone:config.settings.timezone,retentionDays:config.settings.retentionDays,eventLimit:config.settings.eventLimit,unknownCountry:config.settings.unknownCountry,dailyLabel:config.settings.dailyHour+':00 · '+config.settings.timezone},geographies:config.geographies,
    lastRun:rows_('Ejecuciones',1)[0]?.inicio||'',sourceCount:feeds.length,daily:properties_().getProperty('DAILY_ENABLED')==='true',admin:session.admin,
    ...(session.admin?{maxFeeds:settings_().maxCustomFeeds,schedule:'Ventana: últimos '+settings_().windowDays+' días. Recopilación diaria a partir de las '+settings_().dailyHour+':00 ('+settings_().timezone+').',runs:rows_('Ejecuciones',10).reverse(),feeds:customFeeds_(),configuredFeeds:configuredFeeds_(),sheetUrl:book_().getUrl(),collection:collectionStatus_()}:{} )};
}
function getAudit() { authorize_(true); return rows_('Auditoria',100).reverse(); }
function exportNews(query) {
  authorize_();return newsCsv_(rows_('Noticias',settings_().newsReadLimit),query||{});
}
