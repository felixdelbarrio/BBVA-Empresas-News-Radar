import { $, escape, validUrl, metricCards } from "../core/dom.js";
function renderNews(data) {
  const metrics = [["Publicaciones", data.stats.news, "En el per\xEDodo seleccionado"], ["Fuentes", data.stats.sources, "Editores con publicaciones"], ["\xC1mbitos", data.stats.countries, "Geograf\xEDas de seguimiento"], ["Regulaci\xF3n y ratings", data.stats.signals, "Publicaciones en la selecci\xF3n"]];
  $("metrics").innerHTML = metricCards(metrics);
  $("insights").innerHTML = data.insights.map((x) => "<li>" + escape(x) + "</li>").join("");
  $("coverage").textContent = data.sourceCount + " fuentes activas. Los feeds oficiales y las fuentes de Google News se recopilan autom\xE1ticamente; sus publicaciones se integran en este radar.";
  $("news-list").innerHTML = data.items.length ? data.items.map((n) => `<article class="news-item"><div class="news-meta"><span class="badge">${escape(n.tema)}</span><time datetime="${escape(n.fecha)}">${escape(n.fecha)}</time><span>${escape(n.pais)}</span><span>${escape(n.medio)}</span></div><h3><a href="${escape(validUrl(n.url))}" target="_blank" rel="noopener noreferrer">${escape(n.titular)}</a></h3><p>${escape(n.extracto || "El feed no proporciona un extracto. Consulta la publicaci\xF3n original.")}</p><div class="news-footer"><span class="muted">${escape(n.entidad)} \xB7 ${escape(n.fuente || n.medio)}</span><a href="${escape(validUrl(n.url))}" target="_blank" rel="noopener noreferrer">Abrir noticia \u2197</a></div></article>`).join("") : '<div class="panel empty"><p class="eyebrow">Tu radar est\xE1 preparado</p><h2>A\xFAn no hay noticias en esta selecci\xF3n.</h2><p>Recopila las fuentes configuradas o ajusta los filtros. Las publicaciones fuera del \xE1mbito de empresas/CIB quedan registradas en la auditor\xEDa.</p></div>';
  $("result-count").textContent = data.total + " publicaciones";
  $("page-label").textContent = data.total ? "P\xE1gina " + (data.page + 1) + " de " + Math.ceil(data.total / data.pageSize) : "Sin resultados";
  $("previous").disabled = data.page === 0;
  $("next").disabled = (data.page + 1) * data.pageSize >= data.total;
}
export {
  renderNews
};
