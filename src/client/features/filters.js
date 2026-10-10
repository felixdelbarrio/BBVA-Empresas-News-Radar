import { $, escape } from "../core/dom.js";
function createFilters({ onInvalidate, onChange }) {
  const form = $("filters");
  let page = 0, view="radar", defaults={};
  const selections=new Map(),initialized=new Set();
  function options(name, values) {
    const el = form.elements[name], current = el.value;
    if(current&&!values.includes(current))values=[...values,current];
    const signature = JSON.stringify(values);
    if (el.dataset.options === signature) return;
    el.dataset.options = signature;
    el.innerHTML = '<option value="">Todos</option>' + values.map((x) => "<option>" + escape(x) + "</option>").join("");
    el.value = current || "";
  }
  function layout(){
      $('geography-filter').hidden=view==='radar';
      $('advanced-filters').hidden=view==='radar';
      for(const id of ['from-filter','to-filter'])$(id).hidden=view==='briefing';
      $('filter-description').textContent=view==='radar'?'Entidad y segmento del Radar.':view==='briefing'?'Novedades del mes en curso.':'Selección de noticias y período de consulta.';
  }
  layout();
  let timer;
  function filterChanged(event) {
    clearTimeout(timer);
    page = 0;
    initialized.add(view);
    onInvalidate();
    const from = form.elements.from.value, to = form.elements.to.value;
    form.elements.to.setCustomValidity(from && to && from > to ? "La fecha hasta debe ser posterior o igual a la fecha desde." : "");
    $("message").hidden = true;
    if (event.type === "input") timer = setTimeout(onChange, 250);
    else onChange();
  }
  form.addEventListener("input", filterChanged);
  form.addEventListener("change", filterChanged);
  form.addEventListener("reset", () => {
    clearTimeout(timer);
    onInvalidate();
    queueMicrotask(() => {
      for (const name of [...form.elements].filter(input=>input.name).map(input=>input.name)) form.elements[name].value = "";
      filterChanged({ type: "reset" });
    });
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    filterChanged({ type: "submit" });
  });
  return {
    query: () => ({ ...Object.fromEntries(new FormData(form)), page,view,initial:!initialized.has(view) }),
    show: next => {
      if(next===view)return false;
      clearTimeout(timer);onInvalidate();
      selections.set(view,Object.fromEntries(new FormData(form)));view=next;page=0;layout();
      for(const input of form.elements)if(input.name)input.value=(selections.get(view)||defaults)[input.name]||'';
      form.elements.to.setCustomValidity('');
      return true;
    },
    isValid: () => form.reportValidity(),
    set: (name, value) => {
      initialized.add(view);
      form.elements[name].value = value;
      filterChanged({ type: "change" });
    },
    apply:query=>{initialized.add(view);for(const input of form.elements)if(input.name){const value=query[input.name]||'';if(value&&input.tagName==='SELECT')options(input.name,[value]);input.value=value;}filterChanged({type:'change'});},
    setPage: (value) => page = value,
    render: (data) => {
      page = data.page;
      defaults=data.defaults||defaults;
      initialized.add(view);
      for (const [name, key] of [["country", "countries"], ["entity", "entities"], ["source", "sources"], ["topic", "topics"], ["type","types"], ["segment","segments"], ["signal","signals"]]) options(name, data[key]||[]);
      if(data.selection)for(const input of form.elements)if(input.name)input.value=data.selection[input.name]||'';
    }
  };
}
export {
  createFilters
};
