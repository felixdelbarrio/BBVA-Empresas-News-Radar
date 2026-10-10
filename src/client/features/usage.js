import { call } from "../core/api.js";
function createUsage({ getView, isReady }) {
  const session = crypto.randomUUID(), events = [];
  function track(event, duration = 0) {
    events.push({ event, view: getView(), session, duration });
    if (events.length > 20) events.shift();
  }
  async function flush() {
    if (!events.length || !isReady()) return;
    const batch = events.splice(0, 20);
    try {
      const result = await call("recordEvents", batch);
      if (!result.saved) events.unshift(...batch);
    } catch {
      events.unshift(...batch);
    }
    if (events.length > 20) events.splice(0, events.length - 20);
  }
  setInterval(flush, 3e4);
  return { track, flush };
}
export {
  createUsage
};
