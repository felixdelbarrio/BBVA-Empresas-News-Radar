function telemetry_(operation,duration,status,detail) {
  append_('Telemetria',[[new Date().toISOString(),operation,Math.max(0,Math.round(duration)),status,String(detail||'').slice(0,200)]]);
  trim_('Telemetria',RADAR.eventLimit);
}
function trim_(name,limit) {
  const sheet=book_().getSheetByName(name),excess=sheet.getLastRow()-1-limit;
  if(excess>0)sheet.deleteRows(2,excess);
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
function metrics_(events,now) {
  const start=now-30*86400000,week=now-7*86400000,day=now-86400000;
  const selected=events.filter(e=>new Date(e.fecha).getTime()>=start),users=new Map(),sessions=new Set(),byDay={},views={},latencies=[];
  let failures=0;
  selected.forEach(e=>{
    const time=new Date(e.fecha).getTime(),entry=users.get(e.correo)||{correo:e.correo,first:e.fecha,last:e.fecha,sessions:new Set(),actions:0};
    entry.first=entry.first<e.fecha?entry.first:e.fecha;entry.last=entry.last>e.fecha?entry.last:e.fecha;entry.sessions.add(e.sesion);entry.actions++;users.set(e.correo,entry);sessions.add(e.correo+'|'+e.sesion);
    const key=e.fecha.slice(0,10);if(!byDay[key])byDay[key]={sessions:new Set(),users:new Set()};byDay[key].sessions.add(e.correo+'|'+e.sesion);byDay[key].users.add(e.correo);
    if(e.evento==='vista')views[e.vista]=(views[e.vista]||0)+1;
    if(e.evento==='rendimiento')latencies.push(Number(e.duracion_ms));
    if(e.evento==='error')failures++;
  });
  latencies.sort((a,b)=>a-b);
  const list=[...users.values()].map(e=>({...e,sessions:e.sessions.size})).sort((a,b)=>b.last.localeCompare(a.last));
  return {mau:users.size,wau:list.filter(e=>new Date(e.last).getTime()>=week).length,dau:list.filter(e=>new Date(e.last).getTime()>=day).length,sessions:sessions.size,returning:list.filter(e=>e.sessions>1).length,users:list,daily:Object.entries(byDay).sort(([a],[b])=>a.localeCompare(b)).map(([date,value])=>({date,users:value.users.size,sessions:value.sessions.size})),views,latencyP95:latencies.length?latencies[Math.ceil(latencies.length*.95)-1]:null,failures,events:selected.length};
}
function getAdoption() {
  authorize_(true);const events=rows_('Adopcion',RADAR.eventLimit),now=Date.now();
  return {...metrics_(events,now),retentionDays:RADAR.retentionDays,limited:events.length===RADAR.eventLimit};
}
function getTelemetry() {
  authorize_(true);const rows=rows_('Telemetria',100).reverse(),usage=metrics_(rows_('Adopcion',RADAR.eventLimit),Date.now());
  return {rows,latencyP95:usage.latencyP95,clientErrors:usage.failures,search:searchStatus_()};
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
