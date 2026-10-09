function feeds_() { return JSON.parse(properties_().getProperty('FEEDS')||'[]'); }
function saveFeeds(feeds) {
  authorize_(true);
  if (!Array.isArray(feeds) || !feeds.length || feeds.length>RADAR.maxFeeds) throw new Error('Configura entre 1 y '+RADAR.maxFeeds+' fuentes RSS.');
  const cleaned=feeds.map(f=>{
    const url=canonicalUrl_(f.url),domain=String(f.domain||'').toLowerCase().trim();
    if (!url || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(domain) || !domainMatches_(url,domain) || !f.name || !f.entity) throw new Error('Cada fuente necesita nombre, URL HTTPS, dominio del editor y entidad.');
    return {name:plainText_(f.name).slice(0,100),url,domain,entity:plainText_(f.entity).slice(0,80),country:plainText_(f.country||'Sin determinar').slice(0,60)};
  });
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try { properties_().setProperty('FEEDS',JSON.stringify(cleaned)); } finally {lock.releaseLock();}
}
function enableDaily() {
  authorize_(true);disableDaily();
  ScriptApp.newTrigger('dailyRadar_').timeBased().atHour(7).everyDays(1).inTimezone(RADAR.timezone).create();
  properties_().setProperty('DAILY_ENABLED','true');
  return 'Recopilación diaria activada entre las 07:00 y las 08:00 (Madrid).';
}
function disableDaily() { authorize_(true);ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='dailyRadar_').forEach(t=>ScriptApp.deleteTrigger(t));properties_().setProperty('DAILY_ENABLED','false'); }
function collectNow() { authorize_(true);const result=collect_();startSearch_();return result; }
function parseFeed_(xml) {
  const channel=XmlService.parse(xml).getRootElement().getChild('channel');
  if (!channel) throw new Error('Formato no admitido. Se requiere RSS 2.0 con channel/item.');
  const items=channel.getChildren('item');
  if (items.length>RADAR.maxItems) throw new Error('Feed demasiado grande: divide la fuente (máximo '+RADAR.maxItems+' entradas).');
  return items.map(x=>({title:x.getChildText('title'),url:x.getChildText('link'),date:x.getChildText('pubDate'),excerpt:x.getChildText('description'),source:x.getChildText('source')}));
}
function dailyRadar_() { maintenance_();collect_();startSearch_(); }
function collect_() {
  const lock=LockService.getScriptLock();
  if (!lock.tryLock(1000)) throw new Error('Ya hay una recopilación en curso.');
  try {
    const id=Utilities.getUuid(), now=new Date(), start=now.toISOString(), feeds=feeds_(), known=knownUrls_();
    const news=[],audit=[],errors=[];let evaluated=0;
    feeds.forEach(feed=>{
      try {
        const response=UrlFetchApp.fetch(feed.url,{muteHttpExceptions:true,followRedirects:false,headers:{Accept:'application/rss+xml, application/xml'}});
        if (response.getResponseCode()!==200) throw new Error('HTTP '+response.getResponseCode());
        const xml=response.getContentText();
        if (xml.length>RADAR.maxFeedBytes) throw new Error('Feed excede el tamaño máximo permitido.');
        const items=parseFeed_(xml);
        audit.push([id,start,feed.name,feed.url,'Fuente consultada',items.length+' candidatos RSS']);
        items.forEach(raw=>{
          evaluated++;const result=evaluate_(raw,feed,now), item=result.item;
          let reason=result.reason, state='Excluida';
          if (item) {
            if (known.has(item.url)) {state='Duplicada';reason='Misma URL canónica; no se fusionan operaciones por similitud';}
            else {
              known.add(item.url);state='Incluida';reason='Metadatos RSS del editor; revisión de contenido pendiente';
              news.push([Utilities.getUuid(),Utilities.formatDate(item.date,RADAR.timezone,'yyyy-MM-dd'),feed.country,feed.name,feed.entity,item.title,item.excerpt,item.topic,item.url,'Pendiente de revisión',start,'','','','','']);
            }
          }
          audit.push([id,start,feed.name,item?item.url:String(raw.url||''),state,reason]);
        });
      } catch(error) {errors.push(feed.name+': '+error.message);audit.push([id,start,feed.name,feed.url,'Error',error.message]);}
    });
    append_('Noticias',news);append_('Auditoria',audit);
    append_('Ejecuciones',[[id,start,new Date().toISOString(),errors.length?(errors.length===feeds.length?'Error':'Parcial'):'Completada',feeds.length,evaluated,news.length,errors.join(' | ')]]);
    telemetry_('recopilacion',Date.now()-now.getTime(),errors.length?'Parcial':'OK',news.length+' nuevas');
    return {added:news.length,evaluated,errors};
  } finally {lock.releaseLock();}
}

function knownUrls_() {
  const s=book_().getSheetByName('Noticias'), count=s.getLastRow()-1;
  return new Set(count>0?s.getRange(2,9,count,1).getDisplayValues().flat():[]);
}

