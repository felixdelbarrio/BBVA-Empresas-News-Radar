import { $, escape, validUrl, date, message } from "../core/dom.js";
import { call } from "../core/api.js";
function createSources({ getData, run }) {
  let busy = false, signature = "";
  function sourceFields(feeds) {
    $("source-fields").innerHTML = feeds.map((f, i) => `<fieldset class="source"><legend>Fuente ${i + 1}</legend>${[["name", "Nombre"], ["url", "URL del feed RSS"], ["domain", "Dominio del editor"], ["entity", "Entidad"], ["country", "Pa\xEDs / alcance"]].map(([key, label]) => `<label class="${key === "url" ? "wide" : ""}">${label}<input data-key="${key}" value="${escape(f[key] || "")}" ${key === "url" ? 'type="url"' : ""} required></label>`).join("")}<button class="button remove-source" type="button">Eliminar fuente</button></fieldset>`).join("");
    $("sources-form").querySelectorAll("input,button").forEach((el) => el.disabled = !getData()?.admin || busy);
  }
  function currentFeeds() {
    return [...$("source-fields").children].map((el) => Object.fromEntries([...el.querySelectorAll("[data-key]")].map((x) => [x.dataset.key, x.value])));
  }
  function collectionText(status) {
    return status.total ? status.processed + " de " + status.total + " fuentes consultadas; " + status.pending + " pendientes y " + status.failed + " con error. Las noticias se integran autom\xE1ticamente." : "Las fuentes est\xE1n activas. La pr\xF3xima recopilaci\xF3n las consultar\xE1 por lotes.";
  }
  $("collect").addEventListener("click", () => run(async () => {
    const result = await call("collectNow");
    message(result.added + " noticias nuevas. " + (result.pending || 0) + " fuentes pendientes; la recopilaci\xF3n contin\xFAa autom\xE1ticamente." + (result.errors.length ? " " + result.errors.join(" | ") : ""), result.errors.length > 0);
  }));
  $("sources-form").addEventListener("submit", (e) => {
    e.preventDefault();
    run(async () => {
      await call("saveFeeds", currentFeeds());
      message("Fuentes guardadas.");
    });
  });
  $("add-source").addEventListener("click", () => {
    const feeds = currentFeeds();
    if (feeds.length >= Number($("source-fields").dataset.max)) return message("M\xE1ximo " + $("source-fields").dataset.max + " fuentes adicionales.", true);
    sourceFields([...feeds, { country: "Sin determinar" }]);
  });
  $("source-fields").addEventListener("click", (e) => {
    if (e.target.closest(".remove-source")) e.target.closest("fieldset").remove();
  });
  $("toggle-daily").addEventListener("click", () => run(async () => {
    const enabled = getData().daily;
    await call(enabled ? "disableDaily" : "enableDaily");
    message(enabled ? "Recopilaci\xF3n diaria desactivada." : "Recopilaci\xF3n diaria activada entre las 07:00 y 08:00 de Madrid.");
  }));
  $("save-source-settings").addEventListener("click", () => run(async () => message(await call("saveSourceSettings", [...document.querySelectorAll(".source-enabled:checked")].map((input) => input.dataset.id)))));
  $("retry-collection").addEventListener("click", () => run(async () => message(await call("retryCollectionErrors"))));
  return { render(data) {
    const next = JSON.stringify([data.feeds, data.configuredFeeds]);
    if (next !== signature) {
      signature = next;
      sourceFields(data.feeds);
      $("configured-source-count").textContent = data.configuredFeeds.length + " fuentes configuradas \xB7 " + data.sourceCount + " activas";
      $("configured-sources-body").innerHTML = data.configuredFeeds.map((feed) => `<tr><td><input type="checkbox" class="source-enabled" data-id="${escape(feed.id)}" aria-label="Activar ${escape(feed.name)}" ${feed.enabled ? "checked" : ""}></td><td>${escape(feed.name)}</td><td>${escape(feed.country)}</td><td>${feed.kind === "profile" ? "Google News RSS" : "RSS del editor"}</td><td><a href="${escape(validUrl(feed.url))}" target="_blank" rel="noopener noreferrer">Abrir feed \u2197</a></td></tr>`).join("");
    }
    $("collection-status").textContent = collectionText(data.collection);
    $("runs-body").innerHTML = data.runs.map((r) => `<tr><td>${escape(date(r.inicio))}</td><td>${escape(r.estado)}</td><td>${escape(r.evaluadas)}</td><td>${escape(r.nuevas)}</td><td>${escape(r.errores || "\u2014")}</td></tr>`).join("") || '<tr><td colspan="5">Sin ejecuciones registradas.</td></tr>';
  }, setBusy(value) {
    busy = value;
    $("sources-form").querySelectorAll("input,button").forEach((el) => el.disabled = busy || !getData()?.admin);
  } };
}
export {
  createSources
};
