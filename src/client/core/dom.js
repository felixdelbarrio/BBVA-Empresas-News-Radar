const $ = (id) => document.getElementById(id);
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const validUrl = (value) => /^https:\/\//i.test(value || "") ? value : "";
let dateFormat = new Intl.DateTimeFormat("es-ES", {dateStyle:"short",timeStyle:"short"}),timezone;
function setTimezone(value){if(value&&value!==timezone){timezone=value;dateFormat=new Intl.DateTimeFormat("es-ES",{dateStyle:"short",timeStyle:"short",timeZone:value});}}
const date = (value) => value ? dateFormat.format(new Date(value)) : "Sin ejecuciones";
function message(text, error = false) {
  $("message").textContent = text;
  $("message").classList.toggle("error", error);
  $("message").hidden = false;
}
function metricCards(values) {
  return values.map(([label, value, note]) => `<article class="metric"><p class="eyebrow">${escape(label)}</p><strong>${escape(value ?? "—")}</strong><span class="small muted">${escape(note)}</span></article>`).join("");
}
export {
  $,
  date,
  setTimezone,
  escape,
  message,
  metricCards,
  validUrl
};
