import { $, escape, date, validUrl, message } from "../core/dom.js";
import { call } from "../core/api.js";
async function loadAudit() {
  try {
    const rows = await call("getAudit");
    $("audit-body").innerHTML = rows.map((r) => `<tr><td>${escape(date(r.fecha))}</td><td>${escape(r.fuente)}</td><td>${escape(r.resultado)}</td><td>${escape(r.motivo)} ${validUrl(r.url) ? `<a href="${escape(r.url)}" target="_blank" rel="noopener noreferrer">Fuente \u2197</a>` : ""}</td></tr>`).join("") || '<tr><td colspan="4">Sin entradas de auditor\xEDa.</td></tr>';
  } catch (e) {
    message(e.message, true);
  }
}
export {
  loadAudit
};
