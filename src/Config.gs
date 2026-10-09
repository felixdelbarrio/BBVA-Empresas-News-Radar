const RADAR = Object.freeze({
  timezone: 'Europe/Madrid', windowDays: 10, pageSize: 30, maxFeeds: 12,
  maxFeedBytes: 2000000, maxItems: 200, exportLimit: 10000, eventLimit: 20000, retentionDays: 90, searchBatch: 3, searchIterations: 12, searchRetryMinutes: 10, searchPauseMinutes: 5,
  sheets: {
    Noticias: ['id','fecha','pais','medio','entidad','titular','extracto','tema','url','estado','capturada','impacto','tipo_impacto','linea','criterio','evidencia'],
    Auditoria: ['ejecucion','fecha','fuente','url','resultado','motivo'],
    Ejecuciones: ['id','inicio','fin','estado','fuentes','evaluadas','nuevas','errores'],
    Telemetria: ['fecha','operacion','duracion_ms','estado','detalle'],
    Adopcion: ['fecha','correo','sesion','evento','vista','duracion_ms'],
    Busquedas: ['ciclo','pais','idioma','entidad','tema','iteracion','sin_nuevos','estado','fecha','resultados','error'],
    Candidatos: ['id','fecha','pais_objetivo','medio','titular','url_indice','url_editor','estado','capturada','consulta']
  },
  feeds: [{name:'BBVA · Empresas', url:'https://www.bbva.com/es/empresas/feed/', domain:'bbva.com', entity:'BBVA', country:'Sin determinar'}, {name:'BBVA · Información corporativa', url:'https://www.bbva.com/es/economia-y-finanzas/informacion-corporativa/feed/', domain:'bbva.com', entity:'BBVA', country:'Sin determinar'}],
  topics: [
    ['Continuidad de servicio', /(?:incidencia|interrupci[oó]n|ca[ií]da|outage).*(?:empresa|net cash|corporate)|(?:empresa|net cash|corporate).*(?:incidencia|interrupci[oó]n|ca[ií]da|outage)/i],
    ['Regulación y ratings', /regulaci[oó]n|sanci[oó]n|rating|calificaci[oó]n|regulator|downgrade|normativa|veri.?factu|supervisor/i],
    ['Financiación', /financia|pr[eé]stamo|sindicado|bono[s]?\b|project finance|loan|bond|financing|emisi[oó]n|certificados burs[aá]tiles|deuda|capital markets|\bDCM\b/i],
    ['Transaction banking', /cash management|transaction banking|tesorer[ií]a|comercio exterior|trade finance|pagos.*empresas/i],
    ['Resultados y capital', /recompra|dividendo|resultados|beneficio|capital ratio|earnings/i],
    ['Estrategia y alianzas', /alianza|adquisici[oó]n|fusi[oó]n|corporate|\bCIB\b|\bM&A\b/i],
    ['Empresas y pymes', /empresa|pyme|\bSME\b|\bB2B\b|business banking|emprendedor/i],
    ['Sostenibilidad', /sostenib|\bESG\b|sustainable/i]
  ]
});
const SEARCH = Object.freeze({
  countries: [['España','ES','es'],['México','MX','es'],['Turquía','TR','tr'],['Argentina','AR','es'],['Colombia','CO','es'],['Perú','PE','es'],['Uruguay','UY','es'],['Venezuela','VE','es'],['Estados Unidos','US','en'],['Reino Unido','GB','en'],['Francia','FR','fr'],['Portugal','PT','pt'],['Bélgica','BE','fr'],['Países Bajos','NL','en'],['Rumanía','RO','en']],
  countryNames: {'España':['España','Spain','Espagne'],'México':['México','Mexico'],'Turquía':['Turquía','Türkiye','Turkey','Turquie'],'Argentina':['Argentina','Argentine'],'Colombia':['Colombia','Colombie'],'Perú':['Perú','Peru','Pérou'],'Uruguay':['Uruguay'],'Venezuela':['Venezuela'],'Estados Unidos':['Estados Unidos','United States','USA'],'Reino Unido':['Reino Unido','United Kingdom','UK'],'Francia':['Francia','France'],'Portugal':['Portugal'],'Bélgica':['Bélgica','Belgium','Belgique','België'],'Países Bajos':['Países Bajos','Netherlands','Nederland','Pays-Bas'],'Rumanía':['Rumanía','Romania','România','Roumanie']},
  competitors: ['Santander','CaixaBank','Sabadell','BNP Paribas','Société Générale','Crédit Agricole','HSBC','Barclays','Deutsche Bank','ING','UniCredit','Intesa','Citi','JPMorgan','Bank of America','Wells Fargo','MUFG','SMBC','RBC','Scotiabank'],
  themes: ['Financiación','DCM','M&A','Regulación','Ratings','Nombramientos','Transaction banking'],
  terms: {
    es: [['financiación','préstamo sindicado','project finance'],['bonos','emisión deuda','obligaciones'],['adquisición','fusión','M&A'],['regulación','sanción','investigación'],['rating','calificación','perspectiva'],['nombramiento','directivo','CIB dirección'],['tesorería','cash management','trade finance']],
    en: [['financing','syndicated loan','project finance'],['bond','issuance','note'],['acquisition','merger','M&A'],['regulation','sanction','investigation'],['rating','outlook','credit rating'],['appointment','executive','CIB head'],['transaction banking','cash management','trade finance']],
    tr: [['finansman','sendikasyon kredisi','proje finansmanı'],['tahvil','borç ihracı','bono'],['satın alma','birleşme','M&A'],['düzenleme','yaptırım','soruşturma'],['kredi notu','görünüm','rating'],['atama','yönetici','CIB'],['işlem bankacılığı','nakit yönetimi','trade finance']],
    fr: [['financement','prêt syndiqué','project finance'],['obligation','émission','dette'],['acquisition','fusion','M&A'],['réglementation','sanction','enquête'],['notation','perspective','rating'],['nomination','dirigeant','CIB'],['transaction banking','trésorerie','trade finance']],
    pt: [['financiamento','empréstimo sindicalizado','project finance'],['obrigação','emissão','dívida'],['aquisição','fusão','M&A'],['regulação','sanção','investigação'],['rating','perspetiva','notação'],['nomeação','executivo','CIB'],['transaction banking','tesouraria','trade finance']]
  },
  domains: ['bbva.com','bbva.es','bbva.mx','bbva.com.ar','bbva.com.co','bbva.pe','garantibbva.com.tr','garantibbvainvestorrelations.com','ecb.europa.eu','eba.europa.eu','cnmv.es','bde.es','sec.gov','fca.org.uk','banxico.org.mx','cnbv.gob.mx','reuters.com','bloomberg.com','apnews.com','afp.com','ft.com','wsj.com','expansion.com','cincodias.elpais.com','eleconomista.es','larepublica.co','gestion.pe','eleconomista.com.mx','bnamericas.com']
});
const SCORE_RULES = Object.freeze([
  {id:'crisis',score:-5,label:'Crisis reputacional BBVA'},
  {id:'sancion',score:-4,label:'Sanción, investigación o downgrade BBVA'},
  {id:'competidor',score:-3,label:'Competidor: financiación ≥100M o M&A relevante'},
  {id:'regulacion',score:-2,label:'Regulación adversa para el sector'},
  {id:'liderazgo',score:5,label:'BBVA lidera financiación ≥100M o M&A estratégico'},
  {id:'despliegue',score:4,label:'Alianza o innovación B2B BBVA desplegada'},
  {id:'resultados',score:3,label:'Resultados sólidos o mejora rating/outlook BBVA'},
  {id:'esg',score:2,label:'ESG BBVA con KPI verificable'},
  {id:'neutral',score:0,label:'Resto: neutral'}
]);
