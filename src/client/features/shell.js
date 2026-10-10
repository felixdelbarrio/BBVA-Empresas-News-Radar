import { $, date, validUrl } from "../core/dom.js";
function renderShell(data) {
  $("last-run").textContent = date(data.lastRun);
  const daily = data.daily ? "Diaria · "+data.preferences.dailyLabel : "Recopilación diaria desactivada";
  $("daily-status").textContent = daily;
  $("daily-sidebar").textContent = daily;
  $("toggle-daily").textContent = data.daily ? "Desactivar recopilación diaria" : "Activar recopilación diaria";
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
