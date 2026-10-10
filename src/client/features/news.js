import { $, escape, validUrl } from "../core/dom.js";
function renderNews(data) {
  $("news-list").innerHTML = data.items.length ? data.items.map((n,index) => `<article class="news-item"><span class="news-index" aria-hidden="true">${String(data.page*data.pageSize+index+1).padStart(2,"0")}</span><div><div class="news-meta"><span class="badge">${escape(n.tema)}</span><time datetime="${escape(n.fecha)}">${escape(n.fecha)}</time><span>${escape(n.pais)}</span><span>${escape(n.medio)}</span><span>${escape(n.tipo||"")}</span></div><h3><a href="${escape(validUrl(n.url))}" target="_blank" rel="noopener noreferrer">${escape(n.titular)}</a></h3><p>${escape(n.extracto || "El feed no proporciona un extracto. Consulta la publicación original.")}</p><div class="news-footer"><span class="muted">${escape([n.entidad,...(n.segmentos||[]),n.fuente||n.medio].filter(Boolean).join(" · "))}</span><a href="${escape(validUrl(n.url))}" target="_blank" rel="noopener noreferrer">Abrir noticia ↗</a></div></div></article>`).join("") : '<div class="panel empty"><p class="eyebrow">SIN RESULTADOS</p><h2>No hay noticias con estos filtros.</h2><p>Prueba otra entidad, cambia la geografía o pulsa «Ver todo» para ampliar la selección.</p></div>';
  $("result-count").textContent = data.total + " publicaciones";
  $("page-label").textContent = data.total ? "Página " + (data.page + 1) + " de " + Math.ceil(data.total / data.pageSize) : "Sin resultados";
  $("previous").disabled = data.page === 0;
  $("next").disabled = (data.page + 1) * data.pageSize >= data.total;
}
export {
  renderNews
};
