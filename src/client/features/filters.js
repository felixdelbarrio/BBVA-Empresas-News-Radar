import { $, escape } from "../core/dom.js";
function createFilters({ onInvalidate, onChange }) {
  const form = $("filters");
  let page = 0;
  function options(name, values) {
    const el = form.elements[name], current = el.value;
    if(current&&!values.includes(current))values=[...values,current];
    const signature = JSON.stringify(values);
    if (el.dataset.options === signature) return;
    el.dataset.options = signature;
    el.innerHTML = '<option value="">Todos</option>' + values.map((x) => "<option>" + escape(x) + "</option>").join("");
    el.value = current || "";
  }
  let timer;
  function filterChanged(event) {
    clearTimeout(timer);
    page = 0;
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
    query: () => ({ ...Object.fromEntries(new FormData(form)), page }),
    isValid: () => form.reportValidity(),
    set: (name, value) => {
      form.elements[name].value = value;
      filterChanged({ type: "change" });
    },
    apply:query=>{for(const input of form.elements)if(input.name){const value=query[input.name]||'';if(value&&input.tagName==='SELECT')options(input.name,[value]);input.value=value;}filterChanged({type:'change'});},
    setPage: (value) => page = value,
    render: (data) => {
      page = data.page;
      for (const [name, key] of [["country", "countries"], ["entity", "entities"], ["source", "sources"], ["topic", "topics"], ["type","types"], ["segment","segments"], ["signal","signals"]]) options(name, data[key]||[]);
      if(data.initial)for(const [name,value] of Object.entries(data.selection))if(form.elements[name])form.elements[name].value=value;
    }
  };
}
export {
  createFilters
};
