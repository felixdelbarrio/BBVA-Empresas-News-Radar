function searchStatus_() {
  const cache=CacheService.getScriptCache(),cached=cache.get('search-status');if(cached)return JSON.parse(cached);
  const tasks=rows_('Busquedas'),pending=tasks.filter(t=>['Pendiente','Reintento programado'].includes(t.estado)),candidates=rows_('Candidatos');
  const status={tasks:tasks.length,pending:pending.length,queries:tasks.reduce((n,t)=>n+Number(t.iteracion),0),failed:tasks.filter(t=>t.estado==='Error').length,limited:tasks.filter(t=>t.estado==='Límite de iteraciones').length,candidates:candidates.filter(c=>c.estado==='Pendiente').length,cycle:tasks[0]?.ciclo||'',running:pending.length>0};
  cache.put('search-status',JSON.stringify(status),15);return status;
}
function startSearch() {authorize_(true);return startSearch_();}
function startSearch_() {
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    CacheService.getScriptCache().remove('search-status');
    if(searchStatus_().running)return 'El plan de búsqueda ya está en curso.';
    const cycle=Utilities.getUuid(),tasks=[];
    const push=(country,language,entity,topic)=>tasks.push([cycle,country,language,entity,topic,0,0,'Pendiente','','','']);
    SEARCH.countries.forEach(([country,,language])=>{
      SEARCH.themes.forEach(topic=>push(country,language,'BBVA',topic));
      SEARCH.competitors.forEach(entity=>push(country,language,entity,'Competidores'));
    });
    NEWS_PROFILE.geographies.forEach(geo=>{
      const language=geo.language.split('-')[0];
      NEWS_PROFILE.topics.forEach(topic=>push(geo.name,language,NEWS_PROFILE.primary.name,topic));
      NEWS_PROFILE.primary.aliases.forEach(entity=>push(geo.name,language,entity,'Perfil empresas'));
      geo.competitors.forEach(entity=>push(geo.name,language,entity,'Competidores locales'));
    });
    const sheet=book_().getSheetByName('Busquedas');
    if(sheet.getLastRow()>1)sheet.getRange(2,1,sheet.getLastRow()-1,RADAR.sheets.Busquedas.length).clearContent();
    append_('Busquedas',tasks);CacheService.getScriptCache().remove('search-status');
    if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='searchTick_'))ScriptApp.newTrigger('searchTick_').timeBased().everyMinutes(1).create();
    return tasks.length+' líneas de búsqueda preparadas; avance automático por lotes.';
  }finally{lock.releaseLock();}
}
function searchUrl_(task) {
  const geo=SEARCH.countries.find(c=>c[0]===task.pais),language=task.idioma,country=geo?geo[1]:'ES';
  return 'https://news.google.com/rss/search?q='+encodeURIComponent(searchQuery_(task))+'&hl='+language+'&gl='+country+'&ceid='+country+':'+language;
}
function searchTick_() {
  const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
  const started=Date.now();
  try {
    if(started<Number(properties_().getProperty('SEARCH_AFTER')||0))return;
    const tasks=rows_('Busquedas'),pending=tasks.map((t,i)=>({...t,row:i+2})).filter(t=>t.estado==='Pendiente'||(t.estado==='Reintento programado'&&started-new Date(t.fecha).getTime()>=RADAR.searchRetryMinutes*60000)).slice(0,RADAR.searchBatch);
    if(!pending.length){if(tasks.some(t=>t.estado==='Reintento programado'))return;ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='searchTick_').forEach(t=>ScriptApp.deleteTrigger(t));return;}
    const sheet=book_().getSheetByName('Candidatos'),count=sheet.getLastRow()-1,known=new Set(count?sheet.getRange(2,6,count,1).getDisplayValues().flat():[]),candidates=[],audit=[],date=new Date().toISOString();
    let failures=0;
    const responses=pending.map(task=>{try{return UrlFetchApp.fetch(searchUrl_(task),{muteHttpExceptions:true,followRedirects:false});}catch(e){return {error:String(e.message)};}});
    pending.forEach((task,i)=>{
      let added=0,count=0,error='',status='Pendiente',iteration=Number(task.iteracion)+1,quiet=Number(task.sin_nuevos);
      const query=searchQuery_(task),response=responses[i];
      try {
        if(response.error)throw new Error('Red: '+response.error);
        if(response.getResponseCode()!==200)throw new Error('HTTP '+response.getResponseCode());
        const xml=response.getContentText();if(xml.length>RADAR.maxFeedBytes)throw new Error('Respuesta demasiado grande.');
        const items=parseFeed_(xml);count=items.length;
        items.forEach(raw=>{
          const url=canonicalUrl_(raw.url),published=new Date(raw.date),valid=Number.isFinite(published.getTime())&&published<=new Date(date)&&new Date(date)-published<=RADAR.windowDays*86400000;
          const duplicate=known.has(url),title=plainText_(raw.title);
          const reason=!valid?'Fuera de ventana o sin fecha':!url||!title?'Metadatos incompletos':duplicate?'URL de índice ya registrada':'Pendiente de URL canónica, fuente original y verificación';
          if(valid&&url&&title&&!duplicate){known.add(url);added++;candidates.push([Utilities.getUuid(),Utilities.formatDate(published,RADAR.timezone,'yyyy-MM-dd'),task.pais,plainText_(raw.source||''),title,url,'','Pendiente',date,query]);}
          audit.push([task.ciclo,date,task.pais+' · '+task.tema,url,duplicate?'Duplicada':'Candidato',reason]);
        });
        quiet=added?0:quiet+1;
        const minimum=SEARCH.themes.includes(task.tema)?3:2;
        if(iteration>=minimum&&quiet>=3)status='Índice agotado';
        else if(iteration>=RADAR.searchIterations)status='Límite de iteraciones';
      }catch(e){failures++;iteration=Number(task.iteracion);const attempts=Number((String(task.error).match(/^\[(\d+)\]/)||[])[1]||0)+1;error='['+attempts+'] '+String(e.message).slice(0,180);status=/HTTP (429|503)/.test(error)&&attempts<3?'Reintento programado':'Error';}
      audit.push([task.ciclo,date,task.pais+' · '+task.tema,searchUrl_(task),status,'Consulta: '+query+' | '+count+' resultados; '+added+' nuevos. '+error]);
      book_().getSheetByName('Busquedas').getRange(task.row,6,1,6).setNumberFormat('@').setValues([[iteration,quiet,status,date,count,error]]);
    });
    append_('Candidatos',candidates);append_('Auditoria',audit);if(failures>=2)properties_().setProperty('SEARCH_AFTER',String(Date.now()+RADAR.searchPauseMinutes*60000));
    CacheService.getScriptCache().remove('search-status');telemetry_('busqueda',Date.now()-started,failures?'Parcial':'OK',pending.length+' consultas; '+candidates.length+' candidatos; '+failures+' errores');
  }catch(e){telemetry_('busqueda',Date.now()-started,'Error',e.message);throw e;}
  finally{lock.releaseLock();}
}
function getCandidates() {authorize_(true);return rows_('Candidatos').filter(c=>c.estado==='Pendiente').slice(-50).reverse();}
function verifyNews(input) {
  const session=authorize_(true),scoring=score_(input.criterion,input.line,String(input.evidence||'').trim()),url=canonicalUrl_(input.url);
  if(!url||!SEARCH.domains.concat(feeds_().map(f=>f.domain)).some(domain=>domainMatches_(url,domain)))throw new Error('URL original de un editor permitido requerida. Añade el dominio en la configuración si corresponde.');
  const response=UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:false});
  if(response.getResponseCode()!==200)throw new Error('No se pudo verificar el editor: HTTP '+response.getResponseCode()+'. Usa su URL canónica final.');
  const html=response.getContentText();if(html.length>RADAR.maxFeedBytes)throw new Error('Artículo demasiado grande para verificar.');
  const text=plainText_(html),evidence=plainText_(input.evidence);
  if(!text.includes(evidence))throw new Error('La cita debe aparecer literalmente en el artículo original.');
  const date=String(input.date||''),published=new Date(date+'T12:00:00Z'),now=new Date();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(published.getTime())||published.toISOString().slice(0,10)!==date||date>Utilities.formatDate(now,RADAR.timezone,'yyyy-MM-dd')||date<Utilities.formatDate(new Date(now.getTime()-RADAR.windowDays*86400000),RADAR.timezone,'yyyy-MM-dd'))throw new Error('Fecha fuera de la ventana permitida.');
  const articleDate=articleDate_(html);
  if(articleDate!==date)throw new Error('El editor no permite confirmar esa fecha de publicación en sus metadatos.');
  const title=plainText_(input.title),entity=plainText_(input.entity),country=String(input.country||''),topic=classify_(title,evidence);
  if(!title||!text.toLowerCase().includes(title.toLowerCase())||!entity||!text.toLowerCase().includes(entity.toLowerCase())||!topic||!SEARCH.countries.some(c=>c[0]===country)||!countryMention_(text,country))throw new Error('Titular, entidad, tema y país explícito en el artículo son obligatorios.');
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    const rows=rows_('Noticias'),index=rows.findIndex(n=>n.id===input.id),duplicate=rows.findIndex(n=>n.url===url);
    if(duplicate>=0&&duplicate!==index)throw new Error('Esta URL ya está en Noticias. Verifica la publicación existente.');
    const host=url.match(/^https:\/\/([^/]+)/)[1],record={id:index>=0?rows[index].id:Utilities.getUuid(),fecha:date,pais:country,medio:host,entidad:entity,titular:title,extracto:evidence,tema:topic,url,estado:'Verificada',capturada:new Date().toISOString(),...scoring};
    const values=RADAR.sheets.Noticias.map(key=>record[key]);
    if(index>=0)book_().getSheetByName('Noticias').getRange(index+2,1,1,values.length).setNumberFormat('@').setValues([values.map(safeCell_)]);else append_('Noticias',[values]);
    const candidates=rows_('Candidatos'),candidate=candidates.findIndex(c=>c.id===input.id);
    if(candidate>=0)book_().getSheetByName('Candidatos').getRange(candidate+2,7,1,2).setValues([[url,'Verificada']]);
    append_('Auditoria',[[Utilities.getUuid(),new Date().toISOString(),session.email,url,'Verificada',scoring.criterio+'; cita literal, fecha, entidad y país comprobados; puntuación validada por administrador']]);
    CacheService.getScriptCache().remove('search-status');
    return 'Artículo verificado y puntuación '+scoring.impacto+' registrada.';
  }finally{lock.releaseLock();}
}

function articleDate_(html) {
  const json=html.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/i);if(json)return json[1];
  const tags=html.match(/<meta\b[^>]*>/gi)||[];
  for(const tag of tags){if(!/(?:property|name)=["']article:published_time["']/i.test(tag))continue;const date=tag.match(/content=["'](\d{4}-\d{2}-\d{2})/i);if(date)return date[1];}
  return '';
}

function retrySearchErrors() {
  authorize_(true);const lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    const sheet=book_().getSheetByName('Busquedas'),tasks=rows_('Busquedas');let count=0;
    const updates=tasks.map(task=>{if(task.estado==='Error'){count++;return ['Pendiente',task.fecha,task.resultados,''];}return [task.estado,task.fecha,task.resultados,task.error];});
    if(count)sheet.getRange(2,8,updates.length,4).setNumberFormat('@').setValues(updates.map(row=>row.map(safeCell_)));
    if(count&&!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='searchTick_'))ScriptApp.newTrigger('searchTick_').timeBased().everyMinutes(1).create();
    CacheService.getScriptCache().remove('search-status');return count+' líneas fallidas preparadas para reintentar.';
  }finally{lock.releaseLock();}
}
