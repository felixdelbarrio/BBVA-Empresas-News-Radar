function installNewsletterSchedule(){
  authorize_(true);newsletterSender_();
  for(const trigger of ScriptApp.getProjectTriggers())if(trigger.getHandlerFunction()==='deliverNewsletters_')ScriptApp.deleteTrigger(trigger);
  ScriptApp.newTrigger('deliverNewsletters_').timeBased().everyDays(1).atHour(settings_().dailyHour).inTimezone(settings_().timezone).create();
  return 'Programación instalada. Activa la entrega en Configuración de negocio → Newsletter.';
}
function sendPendingNewsletters(){
  authorize_(true);
  if(!settings_().newsletterEnabled)throw Error('La entrega está desactivada. Actívala en Configuración de negocio → Newsletter.');
  return deliverNewsletters_();
}
function deliverNewsletters_(){
  const result={accepted:0,empty:0,pending:0,state:'disabled'};
  if(!settings_().newsletterEnabled)return result;
  const now=new Date(),lock=LockService.getScriptLock();if(!lock.tryLock(1000))return {...result,state:'busy'};
  try{
    const deliveries=rows_('NewsletterEnvios'),sent=new Set(deliveries.filter(row=>!['No enviado','Bloqueada'].includes(row.estado)).map(row=>row.id)),periods=new Map();
    const due=subscriptionRows_().filter(row=>row.activa).flatMap(row=>{
      if(!periods.has(row.periodicidad))periods.set(row.periodicidad,newsletterPeriod_(row.periodicidad,now));
      const period=periods.get(row.periodicidad),id=row.id+':'+row.periodicidad+':'+period.from;
      return sent.has(id)||new Date(row.actualizada)>=new Date(period.cutoff)?[]:[{row,period,id}];
    });
    result.pending=due.length;result.state='no_due';if(!due.length)return result;
    let remaining=settings_().newsletterBatch,quota=newsletterBudget_(deliveries,now);
    if(!quota)return {...result,state:'limit'};
    let sender;try{sender=newsletterSender_();}catch(error){recordNewsletterBlock_(error,properties_().getProperty('OWNER_EMAIL'));throw error;}
    const news=annotateNews_(rows_('Noticias',settings_().newsReadLimit)),prepared=new Map(),sheet=book_().getSheetByName('NewsletterEnvios');
    result.state='processed';
    for(const {row,period,id} of due){
      if(!remaining||!quota)break;
      const query={...row.filtros,from:period.from,to:period.to},key=JSON.stringify([query,row.nombre]);
      if(!prepared.has(key))prepared.set(key,newsletterContent_(selectAnnotatedNews_(news,query),query,row.nombre,now));
      const content=prepared.get(key);
      append_('NewsletterEnvios',[[id,row.id,row.correo,period.from,period.to,content.count?'Enviando':'Sin novedades',now.toISOString(),'']]);
      remaining--;result.pending--;
      if(!content.count){result.empty++;continue;}
      quota--;
      try{completeNewsletterDelivery_(sheet,sheet.getLastRow(),sender,row.correo,row.nombre+' · '+period.from+' / '+period.to,content);result.accepted++;}
      catch(error){result.state='error';result.error=error.message;if(error.rejected)result.pending++;break;}
    }
    if(result.state!=='error'&&quota&&result.pending&&!ScriptApp.getProjectTriggers().some(trigger=>trigger.getHandlerFunction()==='newsletterTick_'))ScriptApp.newTrigger('newsletterTick_').timeBased().after(settings_().pauseMinutes*60000).create();
    return result;
  }finally{lock.releaseLock();}
}
function newsletterTick_(){for(const trigger of ScriptApp.getProjectTriggers())if(trigger.getHandlerFunction()==='newsletterTick_')ScriptApp.deleteTrigger(trigger);deliverNewsletters_();}
