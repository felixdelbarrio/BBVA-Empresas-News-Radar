let calendarFormatterMemory_;
function calendarDate_(now){
  const timezone=settings_().timezone;
  if(calendarFormatterMemory_?.timezone!==timezone)calendarFormatterMemory_={timezone,formatter:new Intl.DateTimeFormat('en',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'})};
  const parts=Object.fromEntries(calendarFormatterMemory_.formatter.formatToParts(now).map(p=>[p.type,p.value]));
  return new Date(parts.year+'-'+parts.month+'-'+parts.day+'T00:00:00Z');
}
function currentMonth_(now=new Date()){
  const start=calendarDate_(now);start.setUTCDate(1);
  const end=new Date(start);end.setUTCMonth(end.getUTCMonth()+1);end.setUTCDate(0);
  return {from:start.toISOString().slice(0,10),to:end.toISOString().slice(0,10)};
}
function dashboardQuery_(query={},now=new Date()){
  const {view,initial,...filters}=query;
  if(view==='radar')return {entity:initial?'':filters.entity||'',segment:initial?'Empresas e instituciones':filters.segment||''};
  const selection=initial?{entity:settings_().defaultEntity,segment:settings_().defaultSegment,topic:settings_().defaultTopic,country:settings_().defaultCountry,...currentMonth_(now)}:filters;
  return view==='briefing'?{...selection,...currentMonth_(now)}:selection;
}
