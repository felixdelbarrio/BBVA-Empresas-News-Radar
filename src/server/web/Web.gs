function doGet() {
  authorize_();
  return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('News Radar · BBVA Empresas').addMetaTag('viewport','width=device-width, initial-scale=1');
}
function include_(name) {
  if(!['Tokens','Styles','Client'].includes(name))throw new Error('Fragmento desconocido.');
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}
