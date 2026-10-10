function plainText_(value) {
  const html=String(value||''), parts=[];
  let cursor=0, hidden='';
  // Extrae texto para clasificación. El cliente escapa este texto al mostrarlo.
  for(const tag of html.matchAll(/<!--[\s\S]*?(?:-->|$)|<[^>]*(?:>|$)/g)){
    if(!hidden)parts.push(html.slice(cursor,tag.index),' ');
    const name=tag[0].match(/^<\s*(\/?)\s*(script|style)\b/i);
    if(name){
      const kind=name[2].toLowerCase();
      if(!name[1]&&!hidden)hidden=kind;
      else if(name[1]&&hidden===kind)hidden='';
    }
    cursor=tag.index+tag[0].length;
  }
  if(!hidden)parts.push(html.slice(cursor));
  return parts.join('').replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(Math.min(parseInt(n[0].toLowerCase()==='x'?n.slice(1):n,n[0].toLowerCase()==='x'?16:10),0x10ffff))).replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,m=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '})[m]).replace(/\s+/g,' ').trim();
}
function canonicalUrl_(value) {
  const match = String(value || '').trim().match(/^https:\/\/([a-z0-9.-]+)(?::443)?(\/[^#?]*)?(?:\?([^#]*))?(?:#.*)?$/i);
  if (!match) return '';
  const query = (match[3] || '').split('&').filter(x=>x&&!/^(utm_\w+|fbclid|gclid)=/i.test(x)).sort().join('&');
  return 'https://' + match[1].toLowerCase() + (match[2] || '/') + (query?'?'+query:'');
}
function domainMatches_(url, domain) {
  const host = (url.match(/^https:\/\/([^/]+)/)||[])[1] || '';
  return host === domain || host.endsWith('.'+domain);
}
let businessIndexMemory_;
function businessIndex_(){
  const config=configuration_();if(businessIndexMemory_?.config===config)return businessIndexMemory_;
  const entities=new Map();for(const row of config.entities)for(const name of [row.name,...row.aliases])entities.set(searchText_(name),row);
  const rules=key=>config[key].filter(row=>row.enabled).map(row=>({...row,terms:row.terms.map(searchText_),context:(row.context||[]).map(searchText_),exclude:(row.exclude||[]).map(searchText_)}));
  return businessIndexMemory_={config,entities,topics:rules('topics'),segments:rules('segments'),signals:rules('signals')};
}
function termsMatch_(text,terms){return terms.some(term=>text.includes(term));}
function classify_(title,excerpt){
  const text=searchText_(title+' '+excerpt);
  return businessIndex_().topics.find(topic=>termsMatch_(text,topic.terms))?.name||'';
}
function annotateNews_(rows){
  const index=businessIndex_();
  return rows.map(row=>{
    const title=searchText_(row.titular),text=searchText_(row.titular+' '+row.extracto),catalog=index.entities.get(searchText_(row.entidad));
    return {...row,entidad:catalog?.name||row.entidad,tipo:catalog?.type||'',tema:index.topics.find(item=>termsMatch_(text,item.terms))?.name||index.config.settings.unclassifiedTopic,
      segmentos:index.segments.filter(item=>termsMatch_(text,item.terms)).map(item=>item.name),
      senales:index.signals.filter(item=>termsMatch_(item.scope==='headline'?title:text,item.terms)&&!termsMatch_(title,item.exclude)&&(!item.context.length||termsMatch_(text,item.context))).map(item=>item.name)};
  });
}
function evaluate_(item, feed, now) {
  const publisher=plainText_(item.source),rawTitle=plainText_(item.title);
  const title=publisher&&rawTitle.endsWith(' - '+publisher)?rawTitle.slice(0,-publisher.length-3):rawTitle;
  let excerpt=plainText_(item.excerpt).slice(0,1500);
  if(feed.kind==='profile'&&excerpt.startsWith(title))excerpt='';
  const url=canonicalUrl_(item.url),date=new Date(item.date);
  if (!title || !url || !domainMatches_(url,feed.domain) || !Number.isFinite(date.getTime())) return {reason:'Falta titular, URL del editor o fecha válida'};
  if(date>now)return {reason:'Fecha futura'};
  if(feed.range){const day=calendarDate_(date).toISOString().slice(0,10);if(day<feed.range.from||day>feed.range.to)return {reason:'Fuera del período de recuperación'};}
  else if(now-date>settings_().windowDays*86400000)return {reason:'Fuera de la ventana de '+settings_().windowDays+' días'};
  const topic=classify_(title,excerpt);
  if (!topic) return {reason:'Sin coincidencia con los temas configurados'};
  return {item:{date,title,excerpt,url,topic,publisher:feed.kind==='profile'?publisher:''}};
}
function safeCell_(value) {
  return typeof value==='string' && /^[=+@-]/.test(value) ? "'"+value : value;
}
