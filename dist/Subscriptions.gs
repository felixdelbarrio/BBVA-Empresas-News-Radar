function newsletterEnabled_(){return settings_().newsletterEnabled&&ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='deliverNewsletters_');}
function subscriptionRows_(email){return rows_('Suscripciones').filter(row=>!email||row.correo===email).map(row=>({...row,filtros:JSON.parse(row.filtros),activa:String(row.activa)==='true'}));}
function subscriptionDefaults_(){const s=settings_();return {name:s.defaultNewsletterName,periodicity:s.defaultPeriodicity,active:true,filters:{entity:s.defaultEntity,segment:s.defaultSegment,country:s.defaultCountry,topic:s.defaultTopic}};}
function getSubscriptions(){return subscriptionRows_(authorize_().email).map(row=>({...row,query:subscriptionQuery_(row,new Date())}));}
function getNewsletterOptions(){const session=authorize_(),c=configuration_();return {email:session.email,defaults:subscriptionDefaults_(),enabled:newsletterEnabled_(),catalogs:{type:[...new Set(c.entities.filter(r=>r.enabled).map(r=>r.type))],entity:c.entities.filter(r=>r.enabled).map(r=>r.name),segment:c.segments.filter(r=>r.enabled).map(r=>r.name),country:c.geographies.filter(r=>r.enabled).map(r=>r.name),topic:c.topics.filter(r=>r.enabled).map(r=>r.name),signal:c.signals.filter(r=>r.enabled).map(r=>r.name),source:[...new Set([...rows_('Noticias',settings_().newsReadLimit).map(r=>r.medio),...feeds_().map(r=>r.name)])].filter(Boolean).sort()}};}
function getAdminSubscriptions(){authorize_(true);const deliveries=new Map();for(const row of rows_('NewsletterEnvios'))deliveries.set(row.suscripcion,row);return subscriptionRows_().map(row=>({...row,ultimaEntrega:deliveries.get(row.id)||null}));}
function subscriptionRecord_(input,email,id,now,count){
  const name=plainText_(input.name).trim(),periodicity=input.periodicity||settings_().defaultPeriodicity;
  if(!name||name.length>100||/[\r\n]/.test(name)||!['monthly','weekly','daily'].includes(periodicity))throw Error('Indica un nombre y una periodicidad válida.');
  if(count>=settings_().maxSubscriptions)throw Error('Máximo '+settings_().maxSubscriptions+' suscripciones por usuario.');
  const filters={};for(const key of ['entity','country','source','topic','type','segment','signal','search']){const value=String(input.filters?.[key]||'');if(value.length>160)throw Error('Filtro demasiado largo.');filters[key]=value;}
  const catalogs={entity:'entities',country:'geographies',topic:'topics',segment:'segments',signal:'signals'};
  for(const [key,catalog] of Object.entries(catalogs))if(filters[key]&&!configuration_()[catalog].some(r=>r.enabled&&r.name===filters[key]))throw Error('Filtro no disponible: '+key);
  return {id,correo:email,nombre:name,filtros:filters,periodicidad:periodicity,activa:input.active!==false,actualizada:now.toISOString()};
}
function newsletterPeriod_(periodicity,now){
  const end=calendarDate_(now),start=new Date(end);
  if(periodicity==='monthly'){end.setUTCDate(1);start.setUTCDate(1);start.setUTCMonth(start.getUTCMonth()-1);}
  else if(periodicity==='weekly'){end.setUTCDate(end.getUTCDate()-(end.getUTCDay()+6)%7);start.setTime(end.getTime());start.setUTCDate(start.getUTCDate()-7);}
  else start.setUTCDate(start.getUTCDate()-1);
  const cutoff=end.toISOString();end.setUTCDate(end.getUTCDate()-1);
  return {from:start.toISOString().slice(0,10),to:end.toISOString().slice(0,10),cutoff};
}
function subscriptionQuery_(subscription,now){const period=newsletterPeriod_(subscription.periodicidad,now);return {...subscription.filtros,from:period.from,to:period.to};}
function writeSubscription_(input,admin){
  const session=authorize_(admin),email=admin?String(input.email||'').trim().toLowerCase():session.email;
  newsletterEmail_(email);
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const rows=subscriptionRows_(),index=input.id?rows.findIndex(r=>r.id===input.id&&(admin||r.correo===email)):-1;
    if(input.id&&index<0)throw Error('Suscripción no encontrada.');
    const record=subscriptionRecord_(input,email,input.id||Utilities.getUuid(),new Date(),rows.filter(r=>r.correo===email&&r.id!==input.id).length),values=RADAR.sheets.Suscripciones.map(key=>key==='filtros'?JSON.stringify(record[key]):record[key]);
    if(index<0)append_('Suscripciones',[values]);else book_().getSheetByName('Suscripciones').getRange(index+2,1,1,values.length).setValues([values]);
    return 'Suscripción guardada'+(newsletterEnabled_()?'. Recibirás las novedades del período completo.':'. La entrega está pendiente de activación por el administrador.');
  }finally{lock.releaseLock();}
}
function saveSubscription(input){return writeSubscription_(input,false);}
function saveAdminSubscription(input){return writeSubscription_(input,true);}
function deleteSubscription(id){
  const session=authorize_(),lock=LockService.getScriptLock();lock.waitLock(10000);
  try{const index=rows_('Suscripciones').findIndex(row=>row.id===id&&row.correo===session.email);if(index<0)throw Error('Suscripción no encontrada.');book_().getSheetByName('Suscripciones').deleteRow(index+2);return 'Suscripción eliminada.';}finally{lock.releaseLock();}
}
