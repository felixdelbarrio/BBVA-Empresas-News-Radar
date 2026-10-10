import { $, escape, date, message, metricCards } from "../core/dom.js";
import { call } from "../core/api.js";
async function loadMetrics(view, isCurrent) {
  try {
    const data = await call(view === "adoption" ? "getAdoption" : "getTelemetry");
    if (!isCurrent()) return;
    if (view === "adoption") {
      $("adoption-metrics").innerHTML = metricCards([["DAU", data.dau, "Usuarios \xB7 24 horas"], ["WAU", data.wau, "Usuarios \xB7 7 d\xEDas"], ["MAU", data.mau, "Usuarios \xB7 30 d\xEDas"], ["Recurrentes", data.returning, "M\xE1s de una sesi\xF3n \xB7 30 d\xEDas"]]);
      $("adoption-note").textContent = data.sessions + " sesiones y " + data.events + " eventos en 30 d\xEDas. Incluye al administrador; sesiones identificadas por apertura del navegador. " + (data.limited ? "L\xEDmite de eventos alcanzado; m\xE9tricas parciales." : "");
      $("adoption-body").innerHTML = data.users.map((u) => `<tr><td>${escape(u.correo)}</td><td>${escape(date(u.first))}</td><td>${escape(date(u.last))}</td><td>${u.sessions}</td><td>${u.actions}</td></tr>`).join("") || '<tr><td colspan="5">Sin actividad registrada.</td></tr>';
      $("adoption-daily").innerHTML = data.daily.map((d) => `<tr><td>${escape(d.date)}</td><td>${d.users}</td><td>${d.sessions}</td></tr>`).join("");
    } else {
      $("telemetry-metrics").innerHTML = metricCards([["Latencia p95", data.latencyP95 == null ? "\u2014" : data.latencyP95 + " ms", "Cargas \xB7 30 d\xEDas"], ["Errores cliente", data.clientErrors, "Eventos recibidos \xB7 30 d\xEDas"], ["Fuentes consultadas", data.collection.processed, "Recopilaci\xF3n actual"], ["Pendientes", data.collection.pending, "Fuentes por consultar"]]);
      $("telemetry-body").innerHTML = data.rows.map((r) => `<tr><td>${escape(date(r.fecha))}</td><td>${escape(r.operacion)}</td><td>${escape(r.duracion_ms)} ms</td><td>${escape(r.estado)}</td><td>${escape(r.detalle)}</td></tr>`).join("") || '<tr><td colspan="5">Sin telemetr\xEDa de operaci\xF3n.</td></tr>';
    }
  } catch (e) {
    message(e.message, true);
  }
}
export {
  loadMetrics
};
