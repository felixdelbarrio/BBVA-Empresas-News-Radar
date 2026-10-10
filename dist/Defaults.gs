const CONFIGURATION_DEFAULTS = Object.freeze({
  "settings": {
    "timezone": "Europe/Madrid",
    "windowDays": 10,
    "pageSize": 30,
    "maxCustomFeeds": 30,
    "maxFeedBytes": 2000000,
    "maxItems": 200,
    "exportLimit": 10000,
    "newsReadLimit": 10000,
    "eventLimit": 20000,
    "retentionDays": 90,
    "trendPoints": 60,
    "trendSeries": 6,
    "collectionBatch": 3,
    "retryMinutes": 10,
    "pauseMinutes": 5,
    "dailyHour": 7,
    "briefingLimit": 50,
    "unclassifiedTopic": "Sin clasificar",
    "defaultEntity": "BBVA",
    "defaultSegment": "Empresas e instituciones",
    "defaultTopic": "",
    "defaultCountry": "",
    "searchTerms": [
      "banca",
      "banking",
      "empresa",
      "pyme",
      "autónomo",
      "retail",
      "cuenta",
      "tarjeta",
      "financiación",
      "pagos",
      "producto",
      "lanzamiento",
      "ticari bankacılık",
      "nakit yönetimi",
      "KOBİ",
      "kredi"
    ],
    "disabledSources": [],
    "maxSubscriptions": 20,
    "unknownCountry": "Sin determinar",
    "defaultPeriodicity": "monthly",
    "newsletterEnabled": false,
    "newsletterBatch": 20,
    "defaultNewsletterName": "Novedades de mi canal",
    "newsletterSender": "news-radar.group@bbva.com",
    "newsletterSenderName": "News Radar · BBVA Empresas",
    "newsletterDailyLimit": 100,
    "newsletterAppUrl": ""
  },
  "entities": [
    {
      "name": "BBVA",
      "type": "Banco tradicional",
      "aliases": [
        "BBVA Empresas",
        "BBVA Business",
        "BBVA Net Cash",
        "Garanti BBVA"
      ],
      "countries": [
        "España",
        "México",
        "Perú",
        "Colombia",
        "Argentina",
        "Turquía",
        "Uruguay"
      ],
      "enabled": true
    },
    {
      "name": "Santander",
      "type": "Banco tradicional",
      "aliases": [
        "Santander Empresas"
      ],
      "countries": [
        "España",
        "México",
        "Argentina",
        "Uruguay"
      ],
      "enabled": true
    },
    {
      "name": "CaixaBank",
      "type": "Banco tradicional",
      "aliases": [
        "CaixaBank Empresas"
      ],
      "countries": [
        "España"
      ],
      "enabled": true
    },
    {
      "name": "Sabadell",
      "type": "Banco tradicional",
      "aliases": [
        "Sabadell Empresas"
      ],
      "countries": [
        "España"
      ],
      "enabled": true
    },
    {
      "name": "Bankinter",
      "type": "Banco tradicional",
      "aliases": [
        "Bankinter Empresas"
      ],
      "countries": [
        "España"
      ],
      "enabled": true
    },
    {
      "name": "Banorte",
      "type": "Banco tradicional",
      "aliases": [
        "Banorte Empresas"
      ],
      "countries": [
        "México"
      ],
      "enabled": true
    },
    {
      "name": "Banco del Bajío",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "México"
      ],
      "enabled": true
    },
    {
      "name": "HSBC",
      "type": "Banco tradicional",
      "aliases": [
        "HSBC Empresas"
      ],
      "countries": [
        "México"
      ],
      "enabled": true
    },
    {
      "name": "BCP",
      "type": "Banco tradicional",
      "aliases": [
        "BCP Empresas"
      ],
      "countries": [
        "Perú"
      ],
      "enabled": true
    },
    {
      "name": "Interbank",
      "type": "Banco tradicional",
      "aliases": [
        "Interbank Empresas"
      ],
      "countries": [
        "Perú"
      ],
      "enabled": true
    },
    {
      "name": "Scotiabank",
      "type": "Banco tradicional",
      "aliases": [
        "Scotiabank Empresas"
      ],
      "countries": [
        "Perú",
        "Uruguay"
      ],
      "enabled": true
    },
    {
      "name": "Bancolombia",
      "type": "Banco tradicional",
      "aliases": [
        "Bancolombia Empresas"
      ],
      "countries": [
        "Colombia"
      ],
      "enabled": true
    },
    {
      "name": "Banco de Bogotá",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Colombia"
      ],
      "enabled": true
    },
    {
      "name": "Banco de Occidente",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Colombia"
      ],
      "enabled": true
    },
    {
      "name": "Davivienda",
      "type": "Banco tradicional",
      "aliases": [
        "Davivienda Empresas"
      ],
      "countries": [
        "Colombia"
      ],
      "enabled": true
    },
    {
      "name": "Banco Galicia",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Argentina"
      ],
      "enabled": true
    },
    {
      "name": "Banco Nación",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Argentina"
      ],
      "enabled": true
    },
    {
      "name": "Banco Macro",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Argentina"
      ],
      "enabled": true
    },
    {
      "name": "Akbank",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Turquía"
      ],
      "enabled": true
    },
    {
      "name": "İşbank",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Turquía"
      ],
      "enabled": true
    },
    {
      "name": "Yapı Kredi",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Turquía"
      ],
      "enabled": true
    },
    {
      "name": "Halkbank",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Turquía"
      ],
      "enabled": true
    },
    {
      "name": "BROU",
      "type": "Banco tradicional",
      "aliases": [],
      "countries": [
        "Uruguay"
      ],
      "enabled": true
    },
    {
      "name": "Itaú",
      "type": "Banco tradicional",
      "aliases": [
        "Itaú Empresas"
      ],
      "countries": [
        "Uruguay"
      ],
      "enabled": true
    },
    {
      "name": "Revolut",
      "type": "Neobanco",
      "aliases": [],
      "countries": [
        "España"
      ],
      "enabled": true
    },
    {
      "name": "N26",
      "type": "Neobanco",
      "aliases": [],
      "countries": [
        "España"
      ],
      "enabled": true
    },
    {
      "name": "Qonto",
      "type": "Fintech",
      "aliases": [],
      "countries": [
        "España"
      ],
      "enabled": true
    },
    {
      "name": "Wise",
      "type": "Fintech",
      "aliases": [],
      "countries": [
        "España"
      ],
      "enabled": true
    },
    {
      "name": "Nubank",
      "type": "Neobanco",
      "aliases": [
        "Nu"
      ],
      "countries": [
        "México",
        "Colombia"
      ],
      "enabled": true
    },
    {
      "name": "Mercado Pago",
      "type": "Fintech",
      "aliases": [],
      "countries": [
        "México",
        "Argentina",
        "Uruguay"
      ],
      "enabled": true
    },
    {
      "name": "Ualá",
      "type": "Fintech",
      "aliases": [],
      "countries": [
        "México",
        "Argentina"
      ],
      "enabled": true
    },
    {
      "name": "Klar",
      "type": "Fintech",
      "aliases": [],
      "countries": [
        "México"
      ],
      "enabled": true
    },
    {
      "name": "Konfío",
      "type": "Fintech",
      "aliases": [],
      "countries": [
        "México"
      ],
      "enabled": true
    },
    {
      "name": "Yape",
      "type": "Fintech",
      "aliases": [],
      "countries": [
        "Perú"
      ],
      "enabled": true
    }
  ],
  "geographies": [
    {
      "name": "España",
      "code": "ES",
      "language": "es",
      "mapId": "724",
      "enabled": true,
      "searchName": "España"
    },
    {
      "name": "México",
      "code": "MX",
      "language": "es-419",
      "mapId": "484",
      "enabled": true,
      "searchName": "México"
    },
    {
      "name": "Perú",
      "code": "PE",
      "language": "es-419",
      "mapId": "604",
      "enabled": true,
      "searchName": "Perú"
    },
    {
      "name": "Colombia",
      "code": "CO",
      "language": "es-419",
      "mapId": "170",
      "enabled": true,
      "searchName": "Colombia"
    },
    {
      "name": "Argentina",
      "code": "AR",
      "language": "es-419",
      "mapId": "032",
      "enabled": true,
      "searchName": "Argentina"
    },
    {
      "name": "Turquía",
      "code": "TR",
      "language": "tr",
      "mapId": "792",
      "enabled": true,
      "searchName": "Türkiye"
    },
    {
      "name": "Uruguay",
      "code": "UY",
      "language": "es-419",
      "mapId": "858",
      "enabled": true,
      "searchName": "Uruguay"
    }
  ],
  "topics": [
    {
      "name": "Continuidad de servicio",
      "terms": [
        "incidencia",
        "interrupción",
        "caída",
        "outage",
        "kesinti",
        "arıza"
      ],
      "enabled": true
    },
    {
      "name": "Regulación y ratings",
      "terms": [
        "regulación",
        "sanción",
        "rating",
        "calificación",
        "regulator",
        "downgrade",
        "normativa",
        "verifactu",
        "supervisor",
        "düzenleme",
        "kredi notu"
      ],
      "enabled": true
    },
    {
      "name": "Financiación",
      "terms": [
        "financia",
        "préstamo",
        "sindicado",
        "bono",
        "project finance",
        "loan",
        "bond",
        "emisión",
        "deuda",
        "capital markets",
        "finansman",
        "kredi",
        "tahvil",
        "leasing",
        "factoring",
        "confirming",
        "crédito",
        "aval"
      ],
      "enabled": true
    },
    {
      "name": "Transaction banking",
      "terms": [
        "cash management",
        "transaction banking",
        "tesorería",
        "comercio exterior",
        "trade finance",
        "pagos",
        "nakit yönetimi",
        "ödeme",
        "hazine"
      ],
      "enabled": true
    },
    {
      "name": "Resultados y capital",
      "terms": [
        "recompra",
        "dividendo",
        "resultados",
        "beneficio",
        "capital ratio",
        "earnings",
        "kâr",
        "sermaye"
      ],
      "enabled": true
    },
    {
      "name": "Estrategia y alianzas",
      "terms": [
        "alianza",
        "adquisición",
        "fusión",
        "corporate",
        "cib",
        "m&a",
        "birleşme",
        "satın alma"
      ],
      "enabled": true
    },
    {
      "name": "Empresas y pymes",
      "terms": [
        "empresa",
        "pyme",
        "sme",
        "b2b",
        "business banking",
        "emprendedor",
        "işletme",
        "ticari",
        "kobi"
      ],
      "enabled": true
    },
    {
      "name": "Sostenibilidad",
      "terms": [
        "sostenib",
        "esg",
        "sustainable",
        "sürdürülebilir"
      ],
      "enabled": true
    },
    {
      "name": "Productos y experiencia",
      "terms": [
        "cuenta",
        "tarjeta",
        "depósito",
        "hipoteca",
        "app",
        "plataforma",
        "producto",
        "servicio",
        "account",
        "card",
        "product",
        "mevduat",
        "seguro",
        "inversión",
        "fondo",
        "monedero",
        "wallet",
        "terminal",
        "tpv",
        "factura",
        "programa"
      ],
      "enabled": true
    }
  ],
  "segments": [
    {
      "name": "Empresas e instituciones",
      "terms": [
        "empresa",
        "pyme",
        "sme",
        "autónom",
        "emprendedor",
        "corporat",
        "institucion",
        "business",
        "b2b",
        "cib",
        "comercio exterior",
        "tesorería",
        "trade finance",
        "işletme",
        "ticari",
        "kobi",
        "municipio",
        "administración pública",
        "universidad",
        "organismo",
        "ayuntamiento",
        "profesional",
        "independiente",
        "freelanc",
        "self-employed",
        "smb"
      ],
      "enabled": true
    },
    {
      "name": "Retail",
      "terms": [
        "particular",
        "consumidor",
        "familia",
        "retail",
        "minorista",
        "personal",
        "hipoteca",
        "nómina",
        "ahorro",
        "consumer",
        "bireysel",
        "tasarruf",
        "maaş"
      ],
      "enabled": true
    }
  ],
  "signals": [
    {
      "name": "Lanzamiento de producto",
      "terms": [
        "lanza",
        "lanzamiento",
        "estrena",
        "presenta",
        "nuevo",
        "nueva",
        "launch",
        "introduce",
        "unveils",
        "yeni"
      ],
      "context": [
        "cuenta",
        "tarjeta",
        "plataforma",
        "producto",
        "servicio",
        "financia",
        "préstamo",
        "pago",
        "depósito",
        "hipoteca",
        "app",
        "account",
        "card",
        "product",
        "loan",
        "leasing",
        "factoring",
        "confirming",
        "crédito",
        "aval",
        "seguro",
        "inversión",
        "fondo",
        "monedero",
        "wallet",
        "terminal",
        "tpv",
        "programa"
      ],
      "enabled": true,
      "scope": "headline",
      "exclude": [
        "qué es",
        "qué son",
        "cómo",
        "guía",
        "premio",
        "reskilling",
        "formación tecnológica",
        "colaboradores"
      ]
    },
    {
      "name": "Mejora de oferta",
      "terms": [
        "amplía",
        "mejora",
        "renueva",
        "incorpora",
        "reduce",
        "aumenta",
        "enhances",
        "expands"
      ],
      "context": [
        "cuenta",
        "tarjeta",
        "producto",
        "servicio",
        "comisión",
        "tipo",
        "plataforma",
        "pago",
        "financia"
      ],
      "enabled": true,
      "scope": "headline",
      "exclude": [
        "qué es",
        "qué son",
        "cómo",
        "guía",
        "premio",
        "reskilling",
        "formación tecnológica",
        "colaboradores"
      ]
    },
    {
      "name": "Alianza estratégica",
      "terms": [
        "alianza",
        "acuerdo",
        "partnership",
        "acuerd",
        "colabora con",
        "colaboración"
      ],
      "context": [],
      "enabled": true,
      "scope": "headline",
      "exclude": [
        "qué es",
        "qué son",
        "cómo",
        "guía",
        "premio",
        "reskilling",
        "formación tecnológica",
        "colaboradores"
      ]
    }
  ],
  "feeds": [
    {
      "id": "bbva-empresas",
      "name": "BBVA · Empresas",
      "url": "https://www.bbva.com/es/empresas/feed/",
      "domain": "bbva.com",
      "entity": "BBVA",
      "country": "Sin determinar",
      "enabled": true
    },
    {
      "id": "bbva-corporativo",
      "name": "BBVA · Información corporativa",
      "url": "https://www.bbva.com/es/economia-y-finanzas/informacion-corporativa/feed/",
      "domain": "bbva.com",
      "entity": "BBVA",
      "country": "Sin determinar",
      "enabled": true
    }
  ]
});
