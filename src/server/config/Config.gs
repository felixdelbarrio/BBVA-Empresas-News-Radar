const RADAR = Object.freeze({
  timezone:'Europe/Madrid', windowDays:10, pageSize:30, maxCustomFeeds:12,
  maxFeedBytes:2000000, maxItems:200, exportLimit:10000, newsReadLimit:10000, eventLimit:20000, retentionDays:90,
  collectionBatch:3, retryMinutes:10, pauseMinutes:5,
  sheets:{
    Noticias:['id','fecha','pais','medio','entidad','titular','extracto','tema','url','capturada','fuente'],
    Auditoria:['ejecucion','fecha','fuente','url','resultado','motivo'],
    Ejecuciones:['id','inicio','fin','estado','fuentes','evaluadas','nuevas','errores'],
    Telemetria:['fecha','operacion','duracion_ms','estado','detalle'],
    Adopcion:['fecha','correo','sesion','evento','vista','duracion_ms'],
    Recopilacion:['ciclo','fuente','url','estado','intentos','actualizada','evaluadas','nuevas','error']
  },
  feeds:[
    {name:'BBVA · Empresas',url:'https://www.bbva.com/es/empresas/feed/',domain:'bbva.com',entity:'BBVA',country:'Sin determinar',kind:'rss'},
    {name:'BBVA · Información corporativa',url:'https://www.bbva.com/es/economia-y-finanzas/informacion-corporativa/feed/',domain:'bbva.com',entity:'BBVA',country:'Sin determinar',kind:'rss'}
  ],
  topics:[
    ['Continuidad de servicio',/(?:incidencia|interrupci[oó]n|ca[ií]da|outage|kesinti|arıza).*(?:empresa|net cash|corporate|banka)|(?:empresa|net cash|corporate|banka).*(?:incidencia|interrupci[oó]n|ca[ií]da|outage|kesinti|arıza)/i],
    ['Regulación y ratings',/regulaci[oó]n|sanci[oó]n|rating|calificaci[oó]n|regulator|downgrade|normativa|veri.?factu|supervisor|düzenleme|kredi notu/i],
    ['Financiación',/financia|pr[eé]stamo|sindicado|bono[s]?\b|project finance|loan|bond|financing|emisi[oó]n|certificados burs[aá]tiles|deuda|capital markets|\bDCM\b|finansman|kredi|tahvil/i],
    ['Transaction banking',/cash management|transaction banking|tesorer[ií]a|comercio exterior|trade finance|pagos|nakit yönetimi|ödeme|hazine/i],
    ['Resultados y capital',/recompra|dividendo|resultados|beneficio|capital ratio|earnings|kâr|sermaye/i],
    ['Estrategia y alianzas',/alianza|adquisici[oó]n|fusi[oó]n|corporate|\bCIB\b|\bM&A\b|birleşme|satın alma/i],
    ['Empresas y pymes',/empresa|pyme|\bSME\b|\bB2B\b|business banking|emprendedor|işletme|ticari|KOBİ/i],
    ['Sostenibilidad',/sostenib|\bESG\b|sustainable|sürdürülebilir/i]
  ]
});
const PROFILE_TERMS = Object.freeze({tr:{'banca empresas':['ticari bankacılık','işletme','KOBİ'],'cash management':['nakit yönetimi'],'tesorería':['hazine'],'pagos':['ödeme'],'incidencia':['kesinti','arıza']}});
