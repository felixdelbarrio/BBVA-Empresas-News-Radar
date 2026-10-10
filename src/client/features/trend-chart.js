import { escape } from "../core/dom.js";
const dateFormat = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" });
function trendChart({ buckets, series }, availableWidth = 900) {
  if (!buckets.length) return '<div class="chart-empty"><span class="empty-orbit" aria-hidden="true">◎</span><p>La evolución aparecerá cuando haya publicaciones en esta selección.</p></div>';
  const width = Math.max(320, Math.min(900, availableWidth || 900)), height = 260, left = 38, right = 20, top = 24, bottom = 42, max = Math.max(1, ...series.flatMap((row) => row.values)), ceiling = Math.max(4, Math.ceil(max / 4) * 4);
  const x = (index) => left + (buckets.length === 1 ? 0.5 : index / (buckets.length - 1)) * (width - left - right), y = (value) => height - bottom - value / ceiling * (height - top - bottom);
  const ticks = Array.from({ length: 5 }, (_, i) => {
    const value = ceiling * i / 4;
    return `<line x1="${left}" x2="${width - right}" y1="${y(value)}" y2="${y(value)}" class="chart-grid"/><text x="${left - 12}" y="${y(value) + 4}" text-anchor="end">${value}</text>`;
  }).join("");
  const labels = [.../* @__PURE__ */ new Set([0, Math.floor((buckets.length - 1) / 2), buckets.length - 1])].map((i) => `<text x="${x(i)}" y="${height - 12}" text-anchor="${i === 0 ? "start" : i === buckets.length - 1 ? "end" : "middle"}">${dateFormat.format(new Date(buckets[i]))}</text>`).join("");
  const lines = series.map((row, i) => {
    const points = row.values.map((value, index) => [x(index), y(value)]), path = points.map(([px, py], index) => (index ? "L" : "M") + px.toFixed(1) + "," + py.toFixed(1)).join(" "), color = "var(--chart-series-" + (i + 1) + ")";
    const area = series.length === 1 ? `<path d="${path} L${x(buckets.length - 1)},${y(0)} L${x(0)},${y(0)} Z" class="chart-area"/>` : "";
    return area + `<path d="${path}" stroke="${color}" class="chart-line"><title>${escape(row.entity)} · ${row.total} publicaciones</title></path>` + points.map(([px, py], j) => `<circle cx="${px}" cy="${py}" r="${buckets.length > 30 ? 2 : 4}" fill="${color}"><title>${escape(row.entity)} · ${buckets[j]} · ${row.values[j]} publicaciones</title></circle>`).join("");
  }).join("");
  const legend = series.map((row, i) => `<span><i style="background:var(--chart-series-${i + 1})"></i>${escape(row.entity)}<strong>${row.total}</strong></span>`).join("");
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Evolución del número de publicaciones por entidad"><title>Evolución de publicaciones por entidad</title>${ticks}${labels}${lines}</svg><div class="chart-legend">${legend}</div>`;
}
export {
  trendChart
};
