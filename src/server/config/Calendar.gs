let calendarFormatterMemory_;
function calendarDate_(now){
  const timezone=settings_().timezone;
  if(calendarFormatterMemory_?.timezone!==timezone)calendarFormatterMemory_={timezone,formatter:new Intl.DateTimeFormat('en',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'})};
  const parts=Object.fromEntries(calendarFormatterMemory_.formatter.formatToParts(now).map(p=>[p.type,p.value]));
  return new Date(parts.year+'-'+parts.month+'-'+parts.day+'T00:00:00Z');
}
