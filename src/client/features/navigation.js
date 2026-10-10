import { $, message } from "../core/dom.js";
import config from "../config.js";
function createNavigation({ isAdmin, track, onAdministration, onSubscriptions, onSelection }) {
  let current = "radar";
  async function show(view) {
    if (!(view in config.views) || view === "administration" && !isAdmin()) return;
    current = view;
    window.scrollTo({top:0,behavior:"auto"});
    track("vista");
    for (const name of Object.keys(config.views)) $(name + "-section").hidden = name !== view;
    $("filters-section").hidden = ["administration","subscriptions"].includes(view);
    $("sidebar-context-title").textContent=view==="administration"?"Gestión de News Radar":"Seguimiento personalizado";
    $("sidebar-context-copy").textContent=view==="administration"?"Gestiona el contenido recopilado, las suscripciones y el funcionamiento de la aplicación.":"Las suscripciones tienen sus propios filtros. Cambiar la selección de noticias no modifica lo que recibes por correo.";
    $("sidebar-context").hidden=!["administration","subscriptions"].includes(view);
    $("open-filters").hidden=["administration","subscriptions"].includes(view);
    $("export").hidden = ["administration","subscriptions"].includes(view);
    $("page-title").textContent = config.views[view];
    document.querySelectorAll("[data-view]").forEach((button) => {
      if (button.dataset.view === view) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    try{
      if(["radar","news","briefing"].includes(view))onSelection(view);
      if (view === "administration") await onAdministration();
      if(view === "subscriptions")await onSubscriptions();
    }catch(error){message(error.message||String(error),true);track("error");}
  }
  document.querySelector(".nav").addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (button) show(button.dataset.view);
  });
  return { show, get current() {
    return current;
  } };
}
export {
  createNavigation
};
