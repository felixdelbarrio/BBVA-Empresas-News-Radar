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
function classify_(title, excerpt) {
  const text = title+' '+excerpt;
  const topic = RADAR.topics.find(([,pattern])=>pattern.test(text));
  if (!topic) return '';
  if (/sostenib|\bESG\b/i.test(text) && !/empresa|corporate|financia|pyme|\bCIB\b|\bB2B\b/i.test(text) && topic[0]==='Sostenibilidad') return '';
  return topic[0];
}
function evaluate_(item, feed, now) {
  const publisher=plainText_(item.source),rawTitle=plainText_(item.title);
  const title=publisher&&rawTitle.endsWith(' - '+publisher)?rawTitle.slice(0,-publisher.length-3):rawTitle;
  let excerpt=plainText_(item.excerpt).slice(0,1500);
  if(feed.kind==='profile'&&excerpt.startsWith(title))excerpt='';
  const url=canonicalUrl_(item.url),date=new Date(item.date);
  if (!title || !url || !domainMatches_(url,feed.domain) || !Number.isFinite(date.getTime())) return {reason:'Falta titular, URL del editor o fecha válida'};
  if (date > now || now-date > RADAR.windowDays*86400000) return {reason:'Fuera de la ventana de '+RADAR.windowDays+' días'};
  const topic=classify_(title,excerpt);
  if (!topic) return {reason:'Sin señal de empresas/CIB en el feed'};
  return {item:{date,title,excerpt,url,topic,publisher:feed.kind==='profile'?publisher:''}};
}
function safeCell_(value) {
  return typeof value==='string' && /^[=+@-]/.test(value) ? "'"+value : value;
}
function selectNews_(rows, query) {
  const q=String(query.search||'').toLocaleLowerCase('es').slice(0,160);
  return rows.filter(r=>(!q || (r.titular+' '+r.extracto+' '+r.entidad).toLocaleLowerCase('es').includes(q)) && (!query.country || r.pais===query.country) && (!query.entity || entityKey_(r.entidad)===query.entity) && (!query.source || r.medio===query.source) && (!query.topic || r.tema===query.topic) && (!query.from || r.fecha>=query.from) && (!query.to || r.fecha<=query.to)).sort((a,b)=>b.fecha.localeCompare(a.fecha));
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
