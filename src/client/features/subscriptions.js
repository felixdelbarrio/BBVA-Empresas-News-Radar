import {$,message} from '../core/dom.js';
import {call} from '../core/api.js';
import {downloadNewsletter} from './briefing.js';
import {periods,subscriptionForm,subscriptionCards} from './subscription-templates.js';
export function createSubscriptions({run,onApply}){
  let options,own=[],all=[];
  const editorId=admin=>admin?'admin-subscription-editor':'personal-editor';
  function edit(admin,row){const target=$(editorId(admin));target.hidden=false;target.innerHTML=subscriptionForm(options,admin,row);}
  async function open(admin=false){
    const [settings,rows]=await Promise.all([call('getNewsletterOptions'),call(admin?'getAdminSubscriptions':'getSubscriptions')]);options=settings;
    if(admin){all=rows;$('subscribers-count').textContent=new Set(rows.map(r=>r.correo)).size+' suscriptores · '+rows.length+' suscripciones';$('admin-subscriptions-list').innerHTML=subscriptionCards(rows,true);}
    else{own=rows;$('subscriptions-count').textContent=rows.length+' suscripciones · '+rows.filter(row=>row.activa).length+' activas';$('subscriptions-list').innerHTML=subscriptionCards(rows,false);$('newsletter-delivery-status').textContent=options.enabled?'Entrega periódica activa. Recibirás únicamente las novedades de tu selección.':'Puedes guardar tu suscripción. El administrador todavía debe activar la entrega.';}
    edit(admin);if(admin)$(editorId(admin)).hidden=true;if(!admin)$('newsletter-default-period').textContent=periods[options.defaults.periodicity]+' por defecto';
  }
  for(const admin of [false,true]){
    const target=$(editorId(admin));
    target.addEventListener('click',event=>{if(event.target.closest('[data-close-editor]'))target.hidden=true;});
    target.addEventListener('submit',event=>{event.preventDefault();const form=event.target,data=new FormData(form),filters={};for(const key of [...Object.keys(options.catalogs),'search'])filters[key]=String(data.get(key)||'');run(async()=>{message(await call(admin?'saveAdminSubscription':'saveSubscription',{id:form.dataset.id||undefined,email:data.get('email'),name:data.get('name'),periodicity:data.get('periodicity'),active:data.has('active'),filters}));await open(admin);},false);});
    $(admin?'new-admin-subscription':'new-subscription').addEventListener('click',()=>edit(admin));
    $(admin?'admin-subscriptions-list':'subscriptions-list').addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(!button)return;const row=(admin?all:own).find(r=>r.id===button.dataset.id);if(!row)return;if(button.dataset.action==='edit')edit(admin,row);if(button.dataset.action==='apply')onApply(row.query);if(button.dataset.action==='export')run(async()=>downloadNewsletter(await call('exportNewsletter',{subscriptionId:row.id})),false);if(button.dataset.action==='delete')run(async()=>{message(await call('deleteSubscription',row.id));await open();},false);});
  }
  return {open};
}
