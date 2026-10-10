function telemetry_(operation,duration,status,detail) {
  append_('Telemetria',[[new Date().toISOString(),operation,Math.max(0,Math.round(duration)),status,String(detail||'').slice(0,200)]]);
  trim_('Telemetria',RADAR.eventLimit);
}
function recordEvents(events) {
  const session=authorize_(),now=new Date();
  if(!Array.isArray(events)||!events.length||events.length>20)throw new Error('Lote de eventos no válido.');
  const allowed=['acceso','vista','filtro','lectura','exportacion','rendimiento','error'],views=['radar','news','audit','sources','telemetry','adoption'];
  const cleaned=events.map(event=>{
    if(!allowed.includes(event.event)||!views.includes(event.view)||!/^[a-z0-9-]{16,80}$/i.test(event.session))throw new Error('Evento no válido.');
    if(['audit','sources','telemetry','adoption'].includes(event.view)&&!session.admin)throw new Error('Vista restringida.');
    return [now.toISOString(),session.email,event.session,event.event,event.view,Math.max(0,Math.min(3600000,Math.round(Number(event.duration)||0)))];
  });
  const lock=LockService.getScriptLock();if(!lock.tryLock(3000))return {saved:false};
  try {
    const cache=CacheService.getScriptCache(),key='events:'+session.email+':'+events[0]?.session;
    if(cache.get(key))return {saved:false};
    pruneEvents_();append_('Adopcion',cleaned);trim_('Adopcion',RADAR.eventLimit);cache.put(key,'1',10);
    return {saved:true};
  } finally {lock.releaseLock();}
}
function getAdoption() {
  authorize_(true);const events=rows_('Adopcion',RADAR.eventLimit),now=Date.now();
  return {...metrics_(events,now),retentionDays:RADAR.retentionDays,limited:events.length===RADAR.eventLimit};
}
function getTelemetry() {
  authorize_(true);const rows=rows_('Telemetria',100).reverse(),usage=metrics_(rows_('Adopcion',RADAR.eventLimit),Date.now());
  return {rows,latencyP95:usage.latencyP95,clientErrors:usage.failures,collection:collectionStatus_()};
}
function maintenance_() {
  const lock=LockService.getScriptLock();lock.waitLock(10000);try{pruneEvents_();}finally{lock.releaseLock();}
}
function pruneEvents_() {
  const p=properties_(),today=new Date().toISOString().slice(0,10);if(p.getProperty('RETENTION_DATE')===today)return;
  const cutoff=new Date(Date.now()-RADAR.retentionDays*86400000).toISOString();
  ['Adopcion','Telemetria'].forEach(name=>{
    const sheet=book_().getSheetByName(name),count=sheet.getLastRow()-1;
    if(!count)return;
    const dates=sheet.getRange(2,1,count,1).getDisplayValues();let expired=0;
    while(expired<dates.length&&dates[expired][0]<cutoff)expired++;
    if(expired)sheet.deleteRows(2,expired);
  });
  p.setProperty('RETENTION_DATE',today);
}
