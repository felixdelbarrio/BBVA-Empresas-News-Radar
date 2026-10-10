import { $, escape, validUrl, message } from '../core/dom.js';
import {call} from '../core/api.js';
export function downloadNewsletter(result){
  const url=URL.createObjectURL(new Blob([result.html],{type:'text/html;charset=utf-8'})),link=document.createElement('a');
  link.href=url;link.download='news-radar-newsletter.html';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  message('Novedades exportadas: '+result.count+(result.total>result.count?' de '+result.total+'. Reduce los filtros para incluirlas todas.':'.'));
}
export function createBriefing({query,run}){
  $('newsletter-export').addEventListener('click',()=>run(async()=>downloadNewsletter(await call('exportNewsletter',{filters:query(),title:'Briefing de novedades'})),false));
  return {render(data){
    const briefing=data.briefing||{total:0,bySignal:[],items:[]};
    $('briefing-count').textContent='Novedades detectadas: '+briefing.total;
    $('briefing-signals').innerHTML=briefing.bySignal.map(row=>`<button type="button" class="signal-card" data-signal="${escape(row.name)}"><strong>${row.total}</strong><span>${escape(row.name)}</span></button>`).join('');
    $('briefing-list').innerHTML=briefing.items.map(row=>`<article class="panel novelty-card"><div class="news-meta">${row.senales.map(signal=>`<span class="badge">${escape(signal)}</span>`).join('')}<time>${escape(row.fecha)}</time></div><h3><a href="${escape(validUrl(row.url))}" target="_blank" rel="noopener noreferrer">${escape(row.titular)}</a></h3><p class="novelty-context">${escape(row.entidad)} · ${escape(row.tipo)} · ${escape(row.pais)} · ${escape(row.medio)}</p><p>${escape(row.extracto||'Consulta la fuente original para conocer la oferta y sus condiciones.')}</p><div class="novelty-use"><span class="eyebrow">PARA TU SEGUIMIENTO COMERCIAL</span><p>${escape(row.segmentos.length?row.segmentos.join(' · '):'Segmento no identificado')} · ${escape(row.tema)}</p></div><a class="button" href="${escape(validUrl(row.url))}" target="_blank" rel="noopener noreferrer">Consultar anuncio ↗</a></article>`).join('')||'<div class="panel empty"><h2>No hay novedades detectadas en esta selección.</h2><p>Amplía entidades, segmentos o fechas. Una noticia sin señales de producto permanece disponible en Noticias.</p></div>';
    $('briefing-limit').hidden=!briefing.limited;
  }};
}
