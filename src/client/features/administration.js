import { $, message } from "../core/dom.js";
import config from "../config.js";
import { loadMetrics } from "./metrics.js";
import { loadAudit } from "./audit.js";
function createAdministration({ isAdmin, track, onConfiguration, onSubscribers }) {
  let current = "configuration";
  async function open(view = current) {
    if (!isAdmin() || !(view in config.adminViews)) return;
    current = view;
    track("vista");
    for (const name of Object.keys(config.adminViews)) $(name + "-section").hidden = name !== view;
    $("admin-tabs").querySelectorAll("[data-admin-view]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.adminView === view));
      button.tabIndex = button.dataset.adminView === view ? 0 : -1;
    });
    if(view === "subscribers")await onSubscribers();
    if(view === "configuration")try{await onConfiguration();}catch(error){message(error.message||String(error),true);}
    if (view === "audit") await loadAudit();
    if (view === "telemetry" || view === "adoption") await loadMetrics(view, () => current === view && !$("administration-section").hidden);
  }
  $("admin-tabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-admin-view]");
    if (button) open(button.dataset.adminView).catch(error=>message(error.message,true));
  });
  $("admin-tabs").addEventListener("keydown", (event) => {
    const views = Object.keys(config.adminViews), index = views.indexOf(current);
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? views.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + views.length) % views.length;
    open(views[next]).catch(error=>message(error.message,true));
    $("admin-tabs").querySelector('[data-admin-view="' + views[next] + '"]').focus();
  });
  return { open, get current() {
    return current;
  } };
}
export {
  createAdministration
};
