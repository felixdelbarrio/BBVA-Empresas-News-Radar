function plainText_(value) {
  return String(value || '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ').replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(Math.min(parseInt(n[0].toLowerCase()==='x'?n.slice(1):n,n[0].toLowerCase()==='x'?16:10),0x10ffff))).replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,m=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '})[m]).replace(/\s+/g,' ').trim();
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
  const title=plainText_(item.title), excerpt=plainText_(item.excerpt).slice(0,1500), url=canonicalUrl_(item.url), date=new Date(item.date);
  if (!title || !url || !domainMatches_(url,feed.domain) || !Number.isFinite(date.getTime())) return {reason:'Falta titular, URL del editor o fecha válida'};
  if (date > now || now-date > RADAR.windowDays*86400000) return {reason:'Fuera de la ventana de '+RADAR.windowDays+' días'};
  const topic=classify_(title,excerpt);
  if (!topic) return {reason:'Sin señal de empresas/CIB en el feed'};
  return {item:{date, title, excerpt, url, topic}};
}
function safeCell_(value) {
  return typeof value==='string' && /^[=+@-]/.test(value) ? "'"+value : value;
}
function selectNews_(rows, query) {
  const q=String(query.search||'').toLocaleLowerCase('es').slice(0,160);
  return rows.filter(r=>(!q || (r.titular+' '+r.extracto+' '+r.entidad).toLocaleLowerCase('es').includes(q)) && (!query.country || r.pais===query.country) && (!query.topic || r.tema===query.topic) && (!query.from || r.fecha>=query.from) && (!query.to || r.fecha<=query.to)).sort((a,b)=>b.fecha.localeCompare(a.fecha));
}
function insights_(rows) {
  const verified=rows.filter(r=>r.estado==='Verificada'), scored=verified.filter(r=>r.impacto!==''), positive=scored.filter(r=>Number(r.impacto)>0),negative=scored.filter(r=>Number(r.impacto)<0);
  const counts={};verified.forEach(r=>counts[r.tema]=(counts[r.tema]||0)+1);
  const top=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0],countries=new Set(verified.map(r=>r.pais).filter(x=>x!=='Sin determinar'));
  return [verified.length+' hechos verificados; '+(rows.length-verified.length)+' publicaciones pendientes de revisión.',top?'La actividad verificada se concentra en '+top[0]+'.':'Sin actividad verificada suficiente para establecer tendencias.',countries.size+' geografías verificadas; no se atribuyen países por la consulta utilizada.',negative.length+' amenazas y '+positive.length+' oportunidades con evidencia explícita; balance '+scored.reduce((sum,r)=>sum+Number(r.impacto),0)+'.',negative.length?'Revisar las amenazas verificadas y la cobertura pendiente antes de decidir.':'Sin alertas estratégicas verificadas; la ausencia de alertas no demuestra ausencia de riesgo.'];
}
function score_(criterion,line,evidence) {
  const rule=SCORE_RULES.find(r=>r.id===criterion);
  if(!rule || !['CIB','SMEs','ESG'].includes(line) || String(evidence||'').trim().length<30)throw new Error('Selecciona una regla, línea y evidencia explícita de al menos 30 caracteres.');
  return {impacto:rule.score,tipo_impacto:rule.score>0?'Oportunidad':rule.score<0?'Amenaza':'Neutral',linea:line,criterio:rule.label,evidencia:evidence};
}
function searchQuery_(task) {
  const index=SEARCH.themes.indexOf(task.tema),iteration=Number(task.iteracion);
  const terms=index>=0?SEARCH.terms[task.idioma][index]:task.tema.startsWith('Competidores')?['corporate financing','M&A','cash management']:task.tema==='Perfil empresas'?NEWS_PROFILE.topics:[task.tema,task.tema+' empresas',task.tema+' business'];
  const entity=task.entidad==='BBVA'?(task.pais==='Turquía'?'"Garanti BBVA"':'"BBVA"'): '"'+task.entidad+'"';
  const place={Turquía:'Türkiye',Francia:'France',Portugal:'Portugal','Reino Unido':'United Kingdom','Estados Unidos':'United States','Países Bajos':'Netherlands',Rumanía:'Romania',Bélgica:'Belgium'}[task.pais]||task.pais;
  return entity+' '+place+' '+terms[iteration%terms.length]+(iteration>=3?' corporate empresas CIB':'')+(iteration>=6?' "'+terms[(iteration+1)%terms.length]+'"':'')+' when:'+RADAR.windowDays+'d';
}

function countryMention_(text,country) {
  const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const value=normalize(text);
  return (SEARCH.countryNames[country]||[]).some(name=>new RegExp('(?:^|[^a-z])'+normalize(name).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:$|[^a-z])').test(value));
}
