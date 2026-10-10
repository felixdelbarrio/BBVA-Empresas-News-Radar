let radarBook_;
function book_() { return radarBook_ || (radarBook_=SpreadsheetApp.openById(properties_().getProperty('SPREADSHEET_ID'))); }
function setupRadar() {
  const p=properties_(), email=Session.getEffectiveUser().getEmail().toLowerCase();
  if (p.getProperty('OWNER_EMAIL') && p.getProperty('OWNER_EMAIL')!==email) throw new Error('Solo el propietario puede inicializar.');
  if(p.getProperty('OWNER_EMAIL'))authorize_(true);
  else if(Session.getActiveUser().getEmail().toLowerCase()!==email)throw new Error('Inicializa desde el editor con la cuenta propietaria.');
  const existing=p.getProperty('SPREADSHEET_ID');
  const book=existing?SpreadsheetApp.openById(existing):(SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create('BBVA Empresas · News Radar'));
  radarBook_=book;
  p.setProperties({OWNER_EMAIL:email,SPREADSHEET_ID:book.getId()});
  initializeConfiguration();
  book.setSpreadsheetTimeZone(settings_().timezone);
  Object.entries(RADAR.sheets).forEach(([name,headers])=>{
    let sheet=book.getSheetByName(name);
    if (sheet) {
      const actual=sheet.getRange(1,1,1,headers.length).getValues()[0];
      if (actual.some((value,i)=>value && value!==headers[i])) throw new Error('Estructura inesperada en '+name+'.');
      sheet.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold').setBackground(SHEET_THEME.background).setFontColor(SHEET_THEME.foreground);
      return;
    }
    sheet=book.insertSheet(name);sheet.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold').setBackground(SHEET_THEME.background).setFontColor(SHEET_THEME.foreground);sheet.setFrozenRows(1);
  });
  if(p.getProperty('DAILY_ENABLED')==='true')enableDaily();
  return 'News Radar preparado: fuentes predeterminadas, recopilación automática y métricas.';
}
function rows_(sheet, limit) {
  const s=book_().getSheetByName(sheet), count=s.getLastRow()-1;
  if (count<1) return [];
  const size=limit?Math.min(count,limit):count;
  return s.getRange(count-size+2,1,size,RADAR.sheets[sheet].length).getDisplayValues().map(r=>Object.fromEntries(RADAR.sheets[sheet].map((k,i)=>[k,r[i]])));
}
function append_(name, rows) {
  if (!rows.length) return;
  const s=book_().getSheetByName(name), start=s.getLastRow()+1, needed=start+rows.length-1;
  if (needed>s.getMaxRows()) s.insertRowsAfter(s.getMaxRows(),needed-s.getMaxRows());
  const range=s.getRange(start,1,rows.length,rows[0].length);range.setNumberFormat('@').setValues(rows.map(r=>r.map(safeCell_)));
}

function trim_(name,limit) {
  const sheet=book_().getSheetByName(name),excess=sheet.getLastRow()-1-limit;
  if(excess>0)sheet.deleteRows(2,excess);
}
