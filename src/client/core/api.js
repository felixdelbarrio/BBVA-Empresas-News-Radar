function call(method, ...args) {
  if (window.RADAR_PREVIEW) return window.RADAR_PREVIEW.call(method, ...args);
  return new Promise((resolve, reject) => google.script.run.withSuccessHandler(resolve).withFailureHandler(reject)[method](...args));
}
export {
  call
};
