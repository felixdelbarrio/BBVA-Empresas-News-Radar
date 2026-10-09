# BBVA Empresas · News Radar

WebApp de Google Apps Script con Google Sheets como almacén, sin dependencias de ejecución ni claves API.

## Desarrollo local

Requisitos: Node.js 24 o superior, npm y GNU Make. `.nvmrc` fija la versión usada por CI; con nvm, ejecutar `nvm install`.

```sh
make install
make dev
```

Abrir `http://127.0.0.1:4173`. Se puede cambiar el puerto con `make dev PORT=4180` y detener el servidor con Ctrl+C. Tras editar el código, reiniciar `make dev` para regenerar la aplicación.

La vista local usa la instantánea pública de `assets/feed-snapshot.json`, fechada el 9 de octubre de 2026. Permite probar diseño, filtros, paginación y exportación como lector, sin OAuth ni llamadas externas. No ejecuta activadores, escribe en Google Sheets ni simula la identidad corporativa o los módulos administrativos. Las pruebas del servidor ejercitan estos módulos con servicios controlados.

| Comando | Resultado |
| --- | --- |
| `make build` | Genera los seis archivos instalables en `dist/` |
| `make check` | Comprueba sintaxis, perfil y permisos OAuth |
| `make test` | Compila y ejecuta las pruebas de servidor y vista local |
| `make verify` | Ejecuta las mismas comprobaciones de integridad que CI |
| `make preview` | Genera una vista autónoma en `output/preview.html` |
| `make codeql` | Prepara copias JavaScript para análisis CodeQL |
| `make clean` | Elimina los directorios generados |

No se versionan paquetes compilados, capturas, credenciales ni metadatos de la instalación personal. La fuente está en `src/` y `assets/`; CI publica `dist/` como artefacto.

## GitFlow y checks

- `master`: versiones estables. Recibe pull requests desde `release/*` y `hotfix/*`.
- `develop`: rama predeterminada de integración. Recibe `feature/*`, `bugfix/*`, `release/*`, `hotfix/*` y sincronizaciones desde `master`.
- Crear funcionalidades desde `develop`. Crear `release/*` desde `develop`, publicar en `master` y reincorporar la release a `develop`. Crear `hotfix/*` desde `master` y aplicar la corrección a ambas ramas.

CI ejecuta comprobaciones de sintaxis, integridad de permisos, build y pruebas en pushes y pull requests hacia ambas ramas. CodeQL analiza JavaScript y los propios workflows en cada cambio y semanalmente. Los módulos `.gs` y el cliente se preparan como `.js` exclusivamente para el análisis; no se mantiene otra implementación. CodeQL publica los hallazgos en Security; un análisis exitoso no implica ausencia de alertas. Dependabot propone actualizaciones semanales de las acciones fijadas por SHA. El check GitFlow valida las ramas de origen y destino de las pull requests.

La licencia inicial del repositorio se conserva en `LICENSE`. Los logotipos y las tipografías aportadas mantienen los derechos de sus respectivos titulares.

## Módulos

- `src/Config.gs`: parámetros, esquemas, países, reglas estratégicas y dominios permitidos.
- `assets/news-profile.json`: perfil aportado, conservado completo: 7 geografías, 3 alias, 5 temas y 27 referencias a competidores locales.
- `src/Access.gs`: identidad activa y autorización de dominio/administrador.
- `src/Store.gs`: almacenamiento por lotes e inicialización idempotente.
- `src/Rules.gs`: funciones puras de clasificación, filtrado, puntuación, consultas y resumen.
- `src/Feeds.gs`: RSS oficiales y activador diario.
- `src/Search.gs`: plan de búsqueda, candidatos y verificación de artículos.
- `src/News.gs`: consultas y exportación de noticias.
- `src/Metrics.gs`: telemetría, eventos y agregaciones de adopción.
- `src/Index.html`, `Client.html`, `Tokens.html`, `Styles.html`: estructura, comportamiento, tokens y estilos centralizados.

`npm run build` valida la sintaxis y genera cuatro módulos Apps Script por responsabilidad (`Config.gs`, `Core.gs`, `News.gs`, `Metrics.gs`), un HTML autónomo y el manifiesto. No hay implementaciones duplicadas ni adaptadores para versiones antiguas. `npm test` comprueba autorización, privacidad, perfiles completos, reglas estratégicas, evidencia, métricas y deduplicación.

## Instalación

Copiar los seis archivos de `dist` al proyecto de Apps Script. Ejecutar `setupRadar` desde el editor con la cuenta propietaria. Conserva las noticias existentes y añade las columnas de impacto y nuevas hojas. Si la programación diaria ya estaba activa, actualiza su activador.

Implementar como **Yo (felix.delbarrio@bbva.com)** y permitir **usuarios de bbva.com**. Las cuatro autorizaciones del propietario son Sheets, peticiones externas, activadores e identidad de correo. No se añaden Gmail, Drive ni Directory. Los visitantes ejecutan con las autorizaciones del propietario; no se comparte la hoja. Google Workspace debe revelar el correo activo dentro del dominio: si su política lo oculta, el servidor deniega acceso en vez de atribuirles la identidad del propietario.

El administrador es exclusivamente `OWNER_EMAIL`. Auditoría, fuentes, hoja, verificación y métricas requieren autorización en el servidor, además de ocultarse en la interfaz. La hoja y el proyecto deben permanecer privados.

## Búsqueda sin API

Se generan 488 líneas de búsqueda: 105 país/tema core, 300 país/competidor del complemento y las 83 combinaciones adicionales del JSON. Las consultas se ejecutan contra RSS de Google News, hasta 3 secuenciales por minuto, con pausa de 5 minutos cuando falla la mayoría del lote y hasta 3 intentos espaciados 10 minutos para HTTP 429/503. Temas core: mínimo 3 consultas; otras líneas: mínimo 2. Continúan hasta 3 iteraciones sin URLs nuevas o un máximo de 12. Cada consulta y candidato se audita; errores y límites no se consideran cobertura completa. Los perfiles del JSON no contienen URLs RSS: se incorporan como búsquedas, sin inventar direcciones de editores.

El agotamiento de un índice público **no garantiza todas las noticias ni reproduce la verificación semántica autónoma del agente del complemento**. Google puede limitar, omitir resultados o cambiar su RSS. Las URLs de Google News se conservan como enlaces de candidatos; nunca se presentan como URL canónica del editor. El país objetivo de una búsqueda no se atribuye a la noticia.

Para publicar y puntuar un candidato, el administrador aporta su URL canónica, titular, fecha, entidad, país y una cita literal que demuestre el criterio elegido. Se valida dominio permitido, respuesta HTTP, fecha del editor, titular, entidad, país y cita. El administrador valida la relevancia semántica, el rol, importe y KPI; el servidor aplica determinísticamente las reglas –5 a +5. No se infieren importes ni roles, y los pendientes no forman parte del resumen estratégico. La deduplicación automática se limita a URLs; no fusiona operaciones por similitud.

La captura diaria se realiza entre 07:00–08:00 Europe/Madrid. El plan de búsqueda continúa mediante su activador por lotes. Si un plan sigue en curso, la siguiente captura no lo reemplaza.

## Telemetría y adopción

Adopción almacena correo obtenido en el servidor, fecha, sesión, tipo de evento, vista y duración. No almacena términos de búsqueda ni contenido de formularios. Solo el administrador ve correos y agregaciones. Conservación máxima 90 días y 20.000 eventos, con limpieza diaria y tope por escritura. DAU/WAU/MAU son ventanas móviles 24 horas / 7 / 30 días; incluye al administrador. No se calcula porcentaje del dominio porque no se solicita acceso a Directory.

Telemetría registra duración y resultado de recopilación/búsqueda y p95 de cargas observado por el navegador. p95 incluye red y servidor. Los errores de cliente son eventos recibidos, no una medida de todos los fallos posibles.

Los cambios de perfiles, estilos y cálculo se hacen en su fuente única y se distribuyen con el build. La búsqueda usa persistencia entre lotes y bloqueos de concurrencia; el HTML incrusta únicamente las fuentes tipográficas necesarias y los dos logos con transparencia.
