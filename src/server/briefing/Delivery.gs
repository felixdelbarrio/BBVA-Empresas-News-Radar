function installNewsletterSchedule(){
  authorize_(true);
  newsletterSender_();
  for(const trigger of ScriptApp.getProjectTriggers())if(trigger.getHandlerFunction()==='deliverNewsletters_')ScriptApp.deleteTrigger(trigger);
  ScriptApp.newTrigger('deliverNewsletters_').timeBased().everyDays(1).atHour(settings_().dailyHour).inTimezone(settings_().timezone).create();
  return 'Programación instalada. Activa newsletterEnabled desde Administración para habilitar la entrega.';
}
function deliverNewsletters_(){
  if(!settings_().newsletterEnabled)return;
  const now=new Date(),lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
  try{
    const deliveries=rows_('NewsletterEnvios'),sent=new Set(deliveries.map(r=>r.id)),subscriptions=subscriptionRows_().filter(r=>r.activa);
    let remaining=settings_().newsletterBatch,quota=newsletterBudget_(deliveries,now),failed=false;
    if(!quota||!subscriptions.length)return;
    const sender=newsletterSender_(),news=annotateNews_(rows_('Noticias',settings_().newsReadLimit));
    const prepared=new Map();
    for(const row of subscriptions){
      if(!remaining||!quota)break;
      const period=newsletterPeriod_(row.periodicidad,now),id=row.id+':'+row.periodicidad+':'+period.from;
      if(sent.has(id)||new Date(row.actualizada)>=new Date(period.cutoff))continue;
      const query=subscriptionQuery_(row,now),key=JSON.stringify(query),selected=prepared.get(key)||selectAnnotatedNews_(news,query);prepared.set(key,selected);
      const result=newsletterContent_(selected,query,row.nombre,now),sheet=book_().getSheetByName('NewsletterEnvios');
      append_('NewsletterEnvios',[[id,row.id,row.correo,period.from,period.to,result.count?'Enviando':'Sin novedades',now.toISOString(),'']]);
      sent.add(id);remaining--;if(!result.count)continue;quota--;
      const index=sheet.getLastRow();
      try{completeNewsletterDelivery_(sheet,index,sender,row.correo,row.nombre+' · '+period.from+' / '+period.to,result);}
      catch(_){failed=true;break;}
    }
    if(!failed&&quota&&subscriptions.some(row=>{const p=newsletterPeriod_(row.periodicidad,now);return !sent.has(row.id+':'+row.periodicidad+':'+p.from)&&new Date(row.actualizada)<new Date(p.cutoff);})&&!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='newsletterTick_'))ScriptApp.newTrigger('newsletterTick_').timeBased().after(settings_().pauseMinutes*60000).create();
  }finally{lock.releaseLock();}
}
function newsletterTick_(){for(const trigger of ScriptApp.getProjectTriggers())if(trigger.getHandlerFunction()==='newsletterTick_')ScriptApp.deleteTrigger(trigger);deliverNewsletters_();}
