function profileFeed_(geo,entity,range) {
  const quote=value=>'"'+value.replace(/"/g,'')+'"';
  const before=range?new Date(range.to+'T00:00:00Z'):null;if(before)before.setUTCDate(before.getUTCDate()+1);
  const after=range?new Date(range.from+'T00:00:00Z'):null;if(after)after.setUTCDate(after.getUTCDate()-1);
  const period=range?'after:'+after.toISOString().slice(0,10)+' before:'+before.toISOString().slice(0,10):'when:'+settings_().windowDays+'d';
  const query='('+[entity.name,...entity.aliases].map(quote).join(' OR ')+') '+quote(geo.searchName)+' ('+settings_().searchTerms.map(quote).join(' OR ')+') '+period;
  const url=canonicalUrl_('https://news.google.com/rss/search?q='+encodeURIComponent(query)+'&hl='+geo.language+'&gl='+geo.code+'&ceid='+geo.code+':'+geo.language);
  return {id:'profile/'+geo.code+'/'+entity.name,name:entity.name+' · '+geo.name,url,domain:'news.google.com',entity:entity.name,country:geo.name,kind:'profile',enabled:entity.enabled&&geo.enabled};
}
function defaultFeeds_(range) {
  const config=configuration_(),disabled=new Set(config.settings.disabledSources);
  return config.feeds.map(feed=>({...feed,kind:'rss'})).concat(config.entities.flatMap(entity=>config.geographies.filter(geo=>entity.countries.includes(geo.name)).map(geo=>{const feed=profileFeed_(geo,entity,range);return {...feed,enabled:feed.enabled&&!disabled.has(feed.id)};})));
}
function customFeeds_(){return configuration_().feeds;}
let configuredFeedMemory_;
function configuredFeeds_(){const config=configuration_();if(configuredFeedMemory_?.config!==config)configuredFeedMemory_={config,feeds:defaultFeeds_()};return configuredFeedMemory_.feeds;}
function feeds_(){return configuredFeeds_().filter(feed=>feed.enabled);}
function saveSourceSettings(enabledIds){
  authorize_(true);const config=JSON.parse(JSON.stringify(configuration_())),all=configuredFeeds_(),known=new Set(all.map(feed=>feed.id));
  if(!Array.isArray(enabledIds)||enabledIds.length>all.length||enabledIds.some(id=>!known.has(id)))throw Error('Configuración de fuentes no válida.');
  const enabled=new Set(enabledIds);config.feeds.forEach(feed=>feed.enabled=enabled.has(feed.id));config.settings.disabledSources=all.filter(feed=>feed.kind==='profile'&&!enabled.has(feed.id)).map(feed=>feed.id);
  writeConfiguration_(config,configurationRevision_());return enabled.size+' fuentes seleccionadas. Entidades y países desactivados permanecen desactivados.';
}
function saveFeeds(feeds){
  authorize_(true);const config=JSON.parse(JSON.stringify(configuration_()));
  if(!Array.isArray(feeds)||feeds.length>settings_().maxCustomFeeds)throw Error('Máximo '+settings_().maxCustomFeeds+' fuentes RSS.');
  config.feeds=feeds.map(feed=>({id:'rss/'+canonicalUrl_(feed.url),name:plainText_(feed.name).slice(0,100),url:canonicalUrl_(feed.url),domain:String(feed.domain||'').toLowerCase().trim(),entity:plainText_(feed.entity).slice(0,80),country:plainText_(feed.country||settings_().unknownCountry).slice(0,60),enabled:feed.enabled!==false}));
  return writeConfiguration_(config,configurationRevision_());
}
function enableDaily() {
  authorize_(true);disableDaily();
  ScriptApp.newTrigger('dailyRadar_').timeBased().atHour(settings_().dailyHour).everyDays(1).inTimezone(settings_().timezone).create();
  properties_().setProperty('DAILY_ENABLED','true');
  return 'Recopilación diaria activada a partir de las '+settings_().dailyHour+':00 ('+settings_().timezone+').';
}
function disableDaily() {authorize_(true);ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='dailyRadar_').forEach(t=>ScriptApp.deleteTrigger(t));properties_().setProperty('DAILY_ENABLED','false');}
