import { $, date, validUrl } from "../core/dom.js";
function renderShell(data) {
  $("last-run").textContent = date(data.lastRun);
  const daily = data.daily ? "Diaria \xB7 07:00\u201308:00 Madrid" : "Recopilaci\xF3n diaria desactivada";
  $("daily-status").textContent = daily;
  $("daily-sidebar").textContent = daily;
  $("toggle-daily").textContent = data.daily ? "Desactivar recopilaci\xF3n diaria" : "Activar recopilaci\xF3n diaria";
  document.querySelectorAll("[data-admin]").forEach((el) => el.hidden = !data.admin);
  $("sheet-link").hidden = true;
  if (data.admin && validUrl(data.sheetUrl)) {
    $("sheet-link").href = data.sheetUrl;
    $("sheet-link").hidden = false;
  }
}
export {
  renderShell
};
