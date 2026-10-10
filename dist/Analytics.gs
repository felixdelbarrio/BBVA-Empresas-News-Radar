function metrics_(events,now) {
  const start=now-30*86400000,week=now-7*86400000,day=now-86400000;
  const selected=events.filter(e=>new Date(e.fecha).getTime()>=start),users=new Map(),sessions=new Set(),byDay={},latencies=[];
  let failures=0;
  selected.forEach(e=>{
    const entry=users.get(e.correo)||{correo:e.correo,first:e.fecha,last:e.fecha,sessions:new Set(),actions:0};
    entry.first=entry.first<e.fecha?entry.first:e.fecha;entry.last=entry.last>e.fecha?entry.last:e.fecha;entry.sessions.add(e.sesion);entry.actions++;users.set(e.correo,entry);sessions.add(e.correo+'|'+e.sesion);
    const key=e.fecha.slice(0,10);if(!byDay[key])byDay[key]={sessions:new Set(),users:new Set()};byDay[key].sessions.add(e.correo+'|'+e.sesion);byDay[key].users.add(e.correo);
    if(e.evento==='rendimiento')latencies.push(Number(e.duracion_ms));
    if(e.evento==='error')failures++;
  });
  latencies.sort((a,b)=>a-b);
  const list=[...users.values()].map(e=>({...e,sessions:e.sessions.size})).sort((a,b)=>b.last.localeCompare(a.last));
  return {mau:users.size,wau:list.filter(e=>new Date(e.last).getTime()>=week).length,dau:list.filter(e=>new Date(e.last).getTime()>=day).length,sessions:sessions.size,returning:list.filter(e=>e.sessions>1).length,users:list,daily:Object.entries(byDay).sort(([a],[b])=>a.localeCompare(b)).map(([date,value])=>({date,users:value.users.size,sessions:value.sessions.size})),latencyP95:latencies.length?latencies[Math.ceil(latencies.length*.95)-1]:null,failures,events:selected.length};
}
