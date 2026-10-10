function briefing_(rows){
  const counts=new Map(configuration_().signals.filter(row=>row.enabled).map(row=>[row.name,0])),items=[];let total=0;
  for(const row of rows){if(!row.senales.length)continue;total++;if(items.length<settings_().briefingLimit)items.push(row);for(const signal of row.senales)counts.set(signal,(counts.get(signal)||0)+1);}
  return {total,bySignal:[...counts].map(([name,total])=>({name,total})),items,limited:total>items.length};
}
function newsletter_(rows,query,title,now){
  return newsletterContent_(selectNews_(rows,query),query,title,now);
}
function newsletterContent_(selected,query,title,now){
  const briefing=briefing_(selected);
  const escape=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const html='<!doctype html><html lang="es"><meta charset="utf-8"><title>'+escape(title)+'</title><style>'+NEWSLETTER_STYLE+'</style><body><header><p>BBVA · Banca de Empresas e Instituciones</p><h2>News Radar</h2></header><h1>'+escape(title)+'</h1><p>'+escape(Object.entries(query).filter(([key,value])=>value&&key!=='page').map(([,value])=>value).join(' · ')||'Todo el sector')+'</p><p>'+escape(now.toISOString().slice(0,10))+' · Novedades detectadas: '+briefing.total+'. Señales por coincidencia de términos; consulta cada fuente antes de comunicar condiciones comerciales.</p>'+briefing.items.map(row=>'<article><h2><a href="'+escape(canonicalUrl_(row.url))+'">'+escape(row.titular)+'</a></h2><p>'+escape(row.entidad+' · '+row.tipo+' · '+row.pais+' · '+row.fecha+' · '+row.medio)+'</p><p>'+escape([...row.senales,...row.segmentos,row.tema].join(' · '))+'</p><p>'+escape(row.extracto)+'</p></article>').join('')+(briefing.limited?'<p>Se muestra un máximo de '+settings_().briefingLimit+' novedades; reduce la selección para incluirlas todas.</p>':'')+'<footer><p>Has recibido esta selección por tu suscripción a News Radar. '+(settings_().newsletterAppUrl?'<a href="'+escape(settings_().newsletterAppUrl)+'">Gestionar o dar de baja mi suscripción</a>':'Gestiona o da de baja tu suscripción desde Newsletter en News Radar.')+'</p></footer></body></html>';
  const styled=html.replace(/<(body|header|footer|p|h1|h2|article|a)(\s[^>]*|)>/g,(_,tag,attributes)=>'<'+tag+' style="'+escape(NEWSLETTER_INLINE[tag]||'')+'"'+attributes+'>');
  const text=[title,Object.values(query).filter(Boolean).join(' · '),'Novedades detectadas: '+briefing.total,...briefing.items.map(row=>[row.titular,row.entidad+' · '+row.pais+' · '+row.fecha+' · '+row.medio,row.extracto,canonicalUrl_(row.url)].join('\n')),briefing.limited?'Se muestra un máximo de '+settings_().briefingLimit+' novedades.':'','Gestiona o da de baja tu suscripción desde Newsletter en News Radar.'+(settings_().newsletterAppUrl?' '+settings_().newsletterAppUrl:'')].filter(Boolean).join('\n\n');
  return {html:styled,text,count:briefing.items.length,total:briefing.total};
}
function exportNewsletter(input){
  const session=authorize_(),now=new Date();let query=dashboardQuery_(input?.filters),title=plainText_(input?.title||'Briefing de novedades').slice(0,100);
  if(input?.subscriptionId){
    const subscription=subscriptionRows_(session.email).find(row=>row.id===input.subscriptionId);
    if(!subscription)throw Error('Selección no encontrada.');
    query=subscriptionQuery_(subscription,now);title=subscription.nombre;
  }
  return newsletter_(rows_('Noticias',settings_().newsReadLimit),query,title,now);
}
