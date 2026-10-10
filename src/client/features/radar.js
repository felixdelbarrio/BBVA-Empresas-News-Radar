import { $, escape, metricCards } from "../core/dom.js";
import { trendChart } from "./trend-chart.js";
function createRadar({ onCountry, onEntity, onNews }) {
  let signature = "", geographySignature="", trend, chartWidth=0;
  function renderTrend(width){
    if(!trend||!width)return;
    chartWidth=width;$('trend-chart').innerHTML=trendChart(trend,width);
  }
  const chartObserver=new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width&&Math.abs(width-chartWidth)>1)renderTrend(width);});
  chartObserver.observe($('trend-chart'));
  $("map-panel").addEventListener("click", (event) => {
    const target = event.target.closest("[data-country]");
    if (target) onCountry(target.dataset.country);
  });
  $("world-map").addEventListener("keydown", (event) => {
    if (["Enter", " "].includes(event.key)) {
      const target = event.target.closest("[data-country]");
      if (target) {
        event.preventDefault();
        onCountry(target.dataset.country);
      }
    }
  });
  $("entity-ranking").addEventListener("click", (event) => {
    const target = event.target.closest("[data-entity]");
    if (target) onEntity(target.dataset.entity);
  });
  $("radar-open-news").addEventListener("click", onNews);
  return { render(data) {
    const geography=JSON.stringify(data.geographies||[]);
    if(geography!==geographySignature){
      geographySignature=geography;
      const scopes=new Map((data.geographies||[]).map(row=>[Number(row.mapId),row.name]));
      $("world-map").querySelectorAll("[data-code]").forEach(node=>{
        const country=scopes.get(Number(node.dataset.code)),marker=node.classList.contains('map-marker');
        if(country){node.dataset.country=country;node.removeAttribute('aria-hidden');node.setAttribute('role','button');node.setAttribute('tabindex',marker?'0':'-1');if(marker)node.style.display='';}
        else{delete node.dataset.country;node.setAttribute('aria-hidden','true');node.removeAttribute('role');node.removeAttribute('tabindex');if(marker)node.style.display='none';}
        node.removeAttribute('hidden');
      });
    }
    const radar = data.radar, next = JSON.stringify([radar,data.countries,geography]);
    if (next === signature) return;
    signature = next;
    $("metrics").innerHTML = metricCards([["Publicaciones", data.stats.news, "En la selección"], ["Entidades", data.stats.entities, "Con presencia en medios"], ["Medios", data.stats.sources, "Editores distintos"], ["Ámbitos", data.stats.countries, "Con publicaciones en la selección"]]);
    $("radar-focus").textContent = radar.ranking.length === 1 ? radar.ranking[0].entity : "Panorama de entidades";
    $("radar-headline").textContent = radar.summary.news ? radar.summary.news + " publicaciones. Una visión conectada." : "Tu próximo movimiento empieza aquí.";
    $("radar-context").textContent = radar.summary.news ? "Explora dónde se concentra la actualidad y cómo evoluciona la presencia de las entidades en medios." : "Amplía los filtros para descubrir nuevas publicaciones y su distribución.";
    $("radar-latest").textContent = radar.latest || "Sin publicaciones";
    $("map-selection").textContent = radar.ranking.length === 1 ? radar.ranking[0].entity : "Todas las entidades de la selección";
    const max = Math.max(1, ...radar.geographies.map((area) => area.total)), areas = new Map(radar.geographies.map((area) => [area.country, area]));
    $("world-map").querySelectorAll("[data-country]").forEach((node) => {
      const area = areas.get(node.dataset.country), count = area?.total || 0, level = count ? Math.ceil(count / max * 4) : 0;
      node.style.setProperty("--map-fill", "var(--heat-" + level + ")");
      node.setAttribute("aria-label", node.dataset.country + ": " + count + " publicaciones. Filtrar por este ámbito.");
      const title = node.querySelector("title");
      if (title) title.textContent = node.dataset.country + " · " + count + " publicaciones" + (area ? " · " + area.entities.map((row) => row.entity + ": " + row.count).join(", ") : "");
    });
    const countries = (data.geographies||[]).map(row=>row.name);
    $("map-countries").innerHTML = countries.map((country) => {
      const count = areas.get(country)?.total || 0;
      return `<button type="button" class="geo-row" data-country="${escape(country)}"><span>${escape(country)}</span><span class="geo-count">${count}</span><span class="geo-track"><span style="width:${count / max * 100}%"></span></span></button>`;
    }).join("");
    $("map-note").textContent = radar.unlocated ? radar.unlocated + " publicaciones sin ámbito conocido, excluidas del mapa." : "Todas las publicaciones de la selección tienen un ámbito conocido.";
    trend=radar.trend;renderTrend($("trend-chart").clientWidth||900);
    $("trend-period").textContent = radar.trend.buckets.length ? radar.trend.from + " — " + radar.trend.to : "Sin publicaciones";
    $("trend-note").textContent = radar.trend.intervalDays > 1 ? "Volumen agrupado en intervalos de " + radar.trend.intervalDays + " días." : "Número de publicaciones por día, incluidos los días sin noticias.";
    $("entity-ranking").innerHTML = radar.ranking.length ? radar.ranking.slice(0, 6).map((row, i) => `<button type="button" class="ranking-row" data-entity="${escape(row.entity)}"><span class="ranking-index">${String(i + 1).padStart(2, "0")}</span><span class="ranking-name">${escape(row.entity)}<span class="ranking-track"><span style="width:${row.total / Math.max(1, radar.summary.news) * 100}%"></span></span></span><strong>${row.total}</strong></button>`).join("") : '<p class="muted">Las entidades aparecerán al ampliar tu selección.</p>';
    $("ranking-note").textContent = radar.ranking.length > 6 ? "Se muestran las seis entidades con más publicaciones." : "Selecciona una entidad para explorar su actualidad.";
    $("radar-publisher").textContent = radar.topPublisher || "Sin publicaciones";
  } };
}
export {
  createRadar
};
