function profileFeed_(geo,entity) {
  const language=geo.language,terms=NEWS_PROFILE.topics.flatMap(topic=>[topic,...(PROFILE_TERMS[language.split('-')[0]]?.[topic]||[])]);
  const names=[...new Set([entity,entity.replace(/\s+(Empresas|Business)$/i,'')])];
  const quote=value=>'"'+value.replace(/"/g,'')+'"';
  const country=geo.country==='TR'?'Türkiye':geo.name;
  const query='('+names.map(quote).join(' OR ')+') '+quote(country)+' ('+terms.map(quote).join(' OR ')+') when:'+RADAR.windowDays+'d';
  const url=canonicalUrl_('https://news.google.com/rss/search?q='+encodeURIComponent(query)+'&hl='+language+'&gl='+geo.country+'&ceid='+geo.country+':'+language);
  return {id:'profile/'+geo.country+'/'+entity,name:entity+' · '+geo.name,url,domain:'news.google.com',entity,country:geo.name,kind:'profile'};
}
function defaultFeeds_() {
  return RADAR.feeds.map(feed=>({...feed,id:'rss/'+feed.url})).concat(NEWS_PROFILE.geographies.flatMap(geo=>[NEWS_PROFILE.primary.name,...NEWS_PROFILE.primary.aliases,...geo.competitors].map(entity=>profileFeed_(geo,entity))));
}
function customFeeds_() {
  const defaults=new Set(defaultFeeds_().map(feed=>feed.url));
  return JSON.parse(properties_().getProperty('FEEDS')||'[]').filter(feed=>!defaults.has(feed.url)).map(feed=>({...feed,id:'rss/'+feed.url,kind:'rss'}));
}
function configuredFeeds_() {
  const disabled=new Set(JSON.parse(properties_().getProperty('DISABLED_SOURCES')||'[]'));
  return defaultFeeds_().concat(customFeeds_()).map(feed=>({...feed,enabled:!disabled.has(feed.id)}));
}
function feeds_() {return configuredFeeds_().filter(feed=>feed.enabled);}
function saveSourceSettings(enabledIds) {
  authorize_(true);const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const ids=configuredFeeds_().map(feed=>feed.id),known=new Set(ids);
    if(!Array.isArray(enabledIds)||enabledIds.length>ids.length||enabledIds.some(id=>!known.has(id)))throw Error('Configuración de fuentes no válida.');
    const enabled=new Set(enabledIds);
    properties_().setProperty('DISABLED_SOURCES',JSON.stringify(ids.filter(id=>!enabled.has(id))));
    return enabled.size+' fuentes activas. Los cambios se aplican a las próximas consultas.';
  }finally{lock.releaseLock();}
}
function saveFeeds(feeds) {
  authorize_(true);
  if(!Array.isArray(feeds)||feeds.length>RADAR.maxCustomFeeds)throw Error('Máximo '+RADAR.maxCustomFeeds+' fuentes adicionales.');
  const defaults=new Set(defaultFeeds_().map(feed=>feed.url)),seen=new Set();
  const cleaned=feeds.map(feed=>{
    const url=canonicalUrl_(feed.url),domain=String(feed.domain||'').toLowerCase().trim();
    if(!url||!domainMatches_(url,domain)||!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(domain)||!feed.name||!feed.entity||defaults.has(url)||seen.has(url))throw Error('Cada fuente necesita nombre, URL HTTPS única, dominio y entidad.');
    seen.add(url);
    return {name:plainText_(feed.name).slice(0,100),url,domain,entity:plainText_(feed.entity).slice(0,80),country:plainText_(feed.country||'Sin determinar').slice(0,60),kind:'rss'};
  });
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{properties_().setProperty('FEEDS',JSON.stringify(cleaned));}finally{lock.releaseLock();}
}
function enableDaily() {
  authorize_(true);disableDaily();
  ScriptApp.newTrigger('dailyRadar_').timeBased().atHour(7).everyDays(1).inTimezone(RADAR.timezone).create();
  properties_().setProperty('DAILY_ENABLED','true');
  return 'Recopilación diaria activada entre las 07:00 y las 08:00 (Madrid).';
}
function disableDaily() {authorize_(true);ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='dailyRadar_').forEach(t=>ScriptApp.deleteTrigger(t));properties_().setProperty('DAILY_ENABLED','false');}
