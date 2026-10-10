import {$,escape,date} from '../core/dom.js';
import {call} from '../core/api.js';
export function createNewsletterDelivery({run}){
  function feedback(text,error=false){const target=$('newsletter-test-result');target.hidden=false;target.textContent=text;target.classList.toggle('error',error);}
  async function open(){
    const status=await call('getNewsletterDeliveryStatus');
    $('newsletter-sender').textContent=status.name+' <'+status.address+'>';
    $('newsletter-checks').innerHTML=[['Remitente',status.available?'Verificado':'Pendiente'],['Entrega',status.enabled?'Activada':'Desactivada'],['Programación',status.scheduled?'Instalada':'Sin activador']].map(([name,value])=>`<div class="delivery-check"><strong>${name}</strong><span>${value}</span></div>`).join('');
    $('newsletter-sender-status').textContent=status.available?'Gmail permite usar el remitente configurado.':status.error;
    $('newsletter-budget').textContent=status.remaining+' envíos disponibles dentro del límite configurado de 24 horas.';
    const last=status.last;
    $('newsletter-history').innerHTML=last?`<strong>Último intento · ${escape(date(last.fecha))}</strong><span>${escape(last.estado)} · ${escape(last.correo)}</span><span>${escape(last.detalle)}</span>`:'<span>No hay intentos de envío registrados.</span>';
  }
  function execute(method,describe){run(async()=>{
    feedback('Procesando solicitud…');
    try{const result=await call(method);feedback(describe(result),result.state==='error');}
    catch(error){feedback(error.message||String(error),true);}
    await open();
  },false);}
  $('validate-newsletter-sender').addEventListener('click',()=>run(open,false));
  $('test-newsletter').addEventListener('click',()=>execute('sendNewsletterTest',result=>`Gmail ha aceptado la prueba para ${result.recipient}. Remitente: ${result.sender}. Gmail ID: ${result.messageId}. Incluye ${result.count} novedades del ${result.from} al ${result.to}. Si no aparece en la bandeja de entrada, revisa Spam y la cuarentena de Workspace; la aceptación no confirma la recepción.`));
  $('install-newsletter').addEventListener('click',()=>execute('installNewsletterSchedule',result=>result));
  $('send-pending-newsletters').addEventListener('click',()=>execute('sendPendingNewsletters',result=>result.state==='no_due'?'No hay entregas pendientes. Las suscripciones nuevas comienzan en el siguiente cierre de su período.':result.state==='busy'?'Hay otro envío en ejecución.':result.state==='limit'?'Se ha alcanzado el límite de envíos en 24 horas.':`${result.accepted} correos aceptados por Gmail · ${result.empty} selecciones sin novedades · ${result.pending} pendientes.${result.error?' '+result.error:''}`));
  return {open};
}
