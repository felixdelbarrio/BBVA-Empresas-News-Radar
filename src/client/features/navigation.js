import { $ } from "../core/dom.js";
import { loadMetrics } from "./metrics.js";
import { loadAudit } from "./audit.js";
function createNavigation({ isAdmin, track }) {
  let current = "radar";
  async function setView(view) {
    if (!["radar", "news"].includes(view) && !isAdmin()) return;
    current = view;
    track("vista");
    const isNews = view === "news" || view === "radar";
    $("news-section").hidden = !isNews;
    $("summary").hidden = view !== "radar";
    $("metrics").hidden = !isNews;
    ["audit", "sources", "telemetry", "adoption"].forEach((name) => $(name + "-section").hidden = view !== name);
    $("page-title").textContent = { radar: "Radar de actualidad", news: "Noticias", audit: "Auditor\xEDa", sources: "Fuentes y programaci\xF3n", telemetry: "Telemetr\xEDa", adoption: "Adopci\xF3n" }[view];
    document.querySelectorAll("[data-view]").forEach((el) => {
      if (el.dataset.view === view) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    });
    if (view === "telemetry" || view === "adoption") await loadMetrics(view, () => current === view);
    if (view === "audit") await loadAudit();
  }
  document.querySelector(".nav").addEventListener("click", (e) => {
    const button = e.target.closest("[data-view]");
    if (button) setView(button.dataset.view);
  });
  return { get current() {
    return current;
  } };
}
export {
  createNavigation
};
