import {createFilterPanel} from './features/filter-panel.js';
import {createSubscriptions} from './features/subscriptions.js';
import {createNewsletterDelivery} from './features/newsletter-delivery.js';
import {createConfiguration} from './features/configuration.js';
import {createBriefing} from './features/briefing.js';
import { createRadar } from "./features/radar.js";
import { createAdministration } from "./features/administration.js";
import { $, message, setTimezone } from "./core/dom.js";
import { call } from "./core/api.js";
import { createFilters } from "./features/filters.js";
import { renderNews } from "./features/news.js";
import { renderShell } from "./features/shell.js";
import { createSources } from "./features/sources.js";
import { createUsage } from "./features/usage.js";
import { createNavigation } from "./features/navigation.js";
const state = { data: null, request: 0, busy: false };
const usage = createUsage({ getView: () => navigation.current === "administration" ? administration.current : navigation.current, isReady: () => Boolean(state.data) }), { track, flush } = usage;
const configuration = createConfiguration({run:action});
const subscriptions = createSubscriptions({run:action,onApply:query=>{filters.apply(query);navigation.show('briefing');}});
const newsletterDelivery=createNewsletterDelivery({run:action});
const administration = createAdministration({ isAdmin: () => Boolean(state.data?.admin), track, onConfiguration:()=>configuration.open(),onSubscribers:()=>Promise.all([subscriptions.open(true),newsletterDelivery.open()]) });
const navigation = createNavigation({ onSubscriptions:()=>subscriptions.open(), onAdministration: () => administration.open(), isAdmin: () => Boolean(state.data?.admin), track });
const filters = createFilters({ onInvalidate: () => ++state.request, onChange: () => {
  track("filtro");
  load();
} });
const briefing=createBriefing({query:()=>filters.query(),run:action});
$('briefing-signals').addEventListener('click',event=>{const button=event.target.closest('[data-signal]');if(button)filters.set('signal',button.dataset.signal);});
const radar = createRadar({ onCountry: (country) => filters.set("country", country), onEntity: (entity) => filters.set("entity", entity), onNews: () => navigation.show("news") });
const sources = createSources({ getData: () => state.data, run: action });
async function load() {
  const request = ++state.request, started = performance.now();
  $("loading").hidden = false;
  if (!filters.isValid()) {
    $("loading").hidden = true;
    return;
  }
  try {
    const data = await call("getDashboard", {...filters.query(),initial:request===1});
    if (request === state.request) {
      const first = !state.data;
      state.data = data;
      setTimezone(data.preferences?.timezone);
      if(window.RADAR_PREVIEW&&data.admin)$("preview-banner").textContent="Administración local · cambios en memoria, sin acceso a Google. Al recargar se restauran los valores iniciales.";
      filters.render(data);
      renderNews(data);
      radar.render(data);
      briefing.render(data);
      if(data.preferences){$("retention-days").textContent=data.preferences.retentionDays;$("event-limit").textContent=data.preferences.eventLimit;}
      renderShell(data);
      if (data.admin) sources.render(data);
      track("rendimiento", performance.now() - started);
      if (first) {
        navigation.show("subscriptions");
        track("acceso");
        track("vista");
        flush();
      }
    }
  } catch (error) {
    if (request === state.request) {
      track("error");
      message(error.message || String(error), true);
    }
  } finally {
    if (request === state.request) $("loading").hidden = true;
  }
}
async function action(fn, refresh = true) {
  if (state.busy) return;
  state.busy = true;
  sources.setBusy(true);
  document.querySelectorAll(".actions button,#sources-form button,#retry-collection,.recovery-range input,#save-source-settings,#catalog-form button,#catalog-reload,#personal-editor button,#admin-subscription-editor button,#subscriptions-list button,.newsletter-delivery button").forEach((el) => el.disabled = true);
  try {
    await fn();
    if (refresh) await load();
  } catch (e) {
    message(e.message || String(e), true);
  } finally {
    state.busy = false;
    document.querySelectorAll(".actions button,#retry-collection,.recovery-range input,#save-source-settings").forEach((el) => el.disabled = false);
    document.querySelectorAll("#personal-editor button,#admin-subscription-editor button,#subscriptions-list button,.newsletter-delivery button").forEach(el=>el.disabled=false);
    sources.setBusy(false);
    if (state.data) {
      $("previous").disabled = state.data.page === 0;
      $("next").disabled = (state.data.page + 1) * state.data.pageSize >= state.data.total;
    }
  }
}
$("previous").addEventListener("click", () => {
  filters.setPage(state.data.page - 1);
  load();
});
$("next").addEventListener("click", () => {
  filters.setPage(state.data.page + 1);
  load();
});
$("export").addEventListener("click", () => action(async () => {
  const result = await call("exportNews", filters.query());
  const url = URL.createObjectURL(new Blob([result.csv], { type: "text/csv;charset=utf-8" })), link = document.createElement("a");
  link.href = url;
  link.download = "news-radar.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
  track("exportacion");
  message(result.count + " publicaciones exportadas.");
}, false));
$("news-list").addEventListener("click", (event) => {
  if (event.target.closest("a")) track("lectura");
});
createFilterPanel();
if (window.RADAR_PREVIEW) $("preview-banner").hidden = false;
load();
