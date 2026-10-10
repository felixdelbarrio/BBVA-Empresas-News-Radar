function collectionStatus_() {
  const cache=CacheService.getScriptCache(),cached=cache.get('collection-status');if(cached)return JSON.parse(cached);
  const tasks=rows_('Recopilacion');
  const status={total:tasks.length,processed:tasks.filter(task=>task.estado==='Completada').length,pending:tasks.filter(task=>['Pendiente','Reintento programado'].includes(task.estado)).length,skipped:tasks.filter(task=>task.estado==='Omitida').length,failed:tasks.filter(task=>task.estado==='Error').length,added:tasks.reduce((sum,task)=>sum+Number(task.nuevas||0),0)};
  cache.put('collection-status',JSON.stringify(status),15);return status;
}
function ensureCollectionTrigger_() {
  if(!ScriptApp.getProjectTriggers().some(trigger=>trigger.getHandlerFunction()==='collectionTick_'))ScriptApp.newTrigger('collectionTick_').timeBased().everyMinutes(1).create();
}
function startCollection_() {
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    CacheService.getScriptCache().remove('collection-status');
    if(collectionStatus_().pending){ensureCollectionTrigger_();return;}
    const cycle=Utilities.getUuid(),sheet=book_().getSheetByName('Recopilacion');
    if(sheet.getLastRow()>1)sheet.getRange(2,1,sheet.getLastRow()-1,RADAR.sheets.Recopilacion.length).clearContent();
    append_('Recopilacion',feeds_().map(feed=>[cycle,feed.name,feed.url,'Pendiente',0,'',0,0,'']));
    properties_().deleteProperty('COLLECTION_AFTER');CacheService.getScriptCache().remove('collection-status');ensureCollectionTrigger_();
  }finally{lock.releaseLock();}
}
function collectNow() {authorize_(true);startCollection_();return collectionTick_();}
function dailyRadar_() {maintenance_();startCollection_();collectionTick_();}
function collectionTick_() {
  const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return {added:0,evaluated:0,errors:[],busy:true};
  const started=Date.now(),news=[],audit=[],errors=[];let evaluated=0;
  try{
    if(started<Number(properties_().getProperty('COLLECTION_AFTER')||0))return {...collectionStatus_(),added:0,evaluated:0,errors:[],paused:true};
    const tasks=rows_('Recopilacion'),pending=tasks.map((task,index)=>({...task,row:index+2})).filter(task=>task.estado==='Pendiente'||(task.estado==='Reintento programado'&&started-new Date(task.actualizada).getTime()>=RADAR.retryMinutes*60000)).slice(0,RADAR.collectionBatch);
    if(!pending.length){
      if(!tasks.some(task=>task.estado==='Reintento programado'))ScriptApp.getProjectTriggers().filter(trigger=>trigger.getHandlerFunction()==='collectionTick_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));
      return {...collectionStatus_(),added:0,evaluated:0,errors:[]};
    }
    const feeds=new Map(feeds_().map(feed=>[feed.url,feed])),known=knownUrls_(),now=new Date(),updates=tasks.map(task=>[task.estado,task.intentos,task.actualizada,task.evaluadas,task.nuevas,task.error]);
    for(const task of pending){
      const attempts=Number(task.intentos)+1;let status='Completada',count=0,added=0,error='';
      try{
        const feed=feeds.get(task.url);if(!feed){status='Omitida';audit.push([task.ciclo,now.toISOString(),task.fuente,task.url,status,'Fuente desactivada o eliminada']);}
        else{const result=ingestFeed_(feed,known,task.ciclo,now);news.push(...result.news);audit.push(...result.audit);count=result.evaluated;added=result.news.length;evaluated+=count;}
      }catch(e){error=String(e.message).slice(0,180);status=/HTTP (429|503)/.test(error)&&attempts<3?'Reintento programado':'Error';errors.push(task.fuente+': '+error);audit.push([task.ciclo,now.toISOString(),task.fuente,task.url,status,error]);}
      updates[task.row-2]=[status,attempts,now.toISOString(),count,added,error];
    }
    append_('Noticias',news);append_('Auditoria',audit);
    book_().getSheetByName('Recopilacion').getRange(2,4,updates.length,6).setNumberFormat('@').setValues(updates.map(row=>row.map(safeCell_)));
    append_('Ejecuciones',[[pending[0].ciclo,now.toISOString(),new Date().toISOString(),errors.length?'Parcial':'Completada',pending.length,evaluated,news.length,errors.join(' | ')]]);
    if(errors.length>=2)properties_().setProperty('COLLECTION_AFTER',String(Date.now()+RADAR.pauseMinutes*60000));
    CacheService.getScriptCache().remove('collection-status');telemetry_('recopilacion',Date.now()-started,errors.length?'Parcial':'OK',pending.length+' fuentes; '+news.length+' nuevas');
    return {...collectionStatus_(),added:news.length,evaluated,errors};
  }catch(error){telemetry_('recopilacion',Date.now()-started,'Error',error.message);throw error;}
  finally{lock.releaseLock();}
}
function retryCollectionErrors() {
  authorize_(true);const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const tasks=rows_('Recopilacion');let count=0;
    const values=tasks.map(task=>{if(task.estado==='Error'){task.estado='Pendiente';task.intentos=0;task.error='';count++;}return [task.estado,task.intentos,task.actualizada,task.evaluadas,task.nuevas,task.error];});
    if(count){book_().getSheetByName('Recopilacion').getRange(2,4,values.length,6).setNumberFormat('@').setValues(values.map(row=>row.map(safeCell_)));ensureCollectionTrigger_();}
    properties_().deleteProperty('COLLECTION_AFTER');CacheService.getScriptCache().remove('collection-status');
    return count+' fuentes preparadas para reintentar.';
  }finally{lock.releaseLock();}
}
