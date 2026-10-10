import { $, escape } from "../core/dom.js";
function createFilters({ onInvalidate, onChange }) {
  const form = $("filters");
  let page = 0;
  function options(name, values) {
    const el = form.elements[name], current = el.value, signature = JSON.stringify(values);
    if (el.dataset.options === signature) return;
    el.dataset.options = signature;
    el.innerHTML = '<option value="">Todos</option>' + values.map((x) => "<option>" + escape(x) + "</option>").join("");
    el.value = values.includes(current) ? current : "";
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
    queueMicrotask(() => filterChanged({ type: "reset" }));
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    filterChanged({ type: "submit" });
  });
  return {
    query: () => ({ ...Object.fromEntries(new FormData(form)), page }),
    isValid: () => form.reportValidity(),
    setPage: (value) => page = value,
    render: (data) => {
      page = data.page;
      for (const [name, key] of [["country", "countries"], ["entity", "entities"], ["source", "sources"], ["topic", "topics"]]) options(name, data[key]);
    }
  };
}
export {
  createFilters
};
