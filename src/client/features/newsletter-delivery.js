import {$,message} from '../core/dom.js';
import {call} from '../core/api.js';
export function createNewsletterDelivery({run}){
  async function open(){
    const status=await call('getNewsletterDeliveryStatus');
    $('newsletter-sender').textContent=status.name+' <'+status.address+'>';
    $('newsletter-sender-status').textContent=status.available?'Remitente verificado. '+(status.scheduled?'Entrega periódica activa.':'Entrega periódica pendiente de activación o programación.'):status.error;
    $('newsletter-budget').textContent=status.remaining+' envíos disponibles dentro del límite configurado de 24 horas.';
    $('newsletter-sender-status').classList.toggle('error',!status.available);
  }
  $('validate-newsletter-sender').addEventListener('click',()=>run(open,false));
  for(const [id,method] of [['test-newsletter','sendNewsletterTest'],['install-newsletter','installNewsletterSchedule']])$(id).addEventListener('click',()=>run(async()=>{message(await call(method));await open();},false));
  return {open};
}
