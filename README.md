# BBVA Empresas · News Radar

WebApp de Google Apps Script con Google Sheets como almacén, sin dependencias de ejecución ni claves API.

## Desarrollo local

Requisitos: Node.js 24 o superior, npm y GNU Make. `.nvmrc` fija la versión usada por CI; con nvm, ejecutar `nvm install`.

```sh
make install
make dev
```

Abrir `http://127.0.0.1:4173`. Se puede cambiar el puerto con `make dev PORT=4180` y detener el servidor con Ctrl+C. Tras editar el código, reiniciar `make dev` y recargar el navegador para regenerar la aplicación.

La vista local usa la instantánea pública de `assets/feed-snapshot.json`, del 9 de octubre de 2026. Filtros, clasificación, radar, CSV y newsletter ejecutan las mismas funciones puras del servidor. Solo hay noticias de los dos RSS oficiales; los demás países y entidades pueden no tener resultados. No se ejecutan activadores ni se escribe en Google.

Para probar Administración: `PREVIEW_ADMIN=1 make dev`. Los catálogos y suscripciones del modo local viven en memoria y se restauran al recargar. El modo normal es lector; la identidad corporativa se comprueba únicamente en la instalación real. Las pruebas de persistencia y permisos usan servicios controlados.
| Comando | Resultado |
| --- | --- |
| `make build` | Genera los archivos modulares instalables en `dist/` |
| `make check-dist` | Comprueba que la distribución versionada coincide exactamente con las fuentes, sin modificarla |
| `make check` | Comprueba sintaxis, perfil y permisos OAuth |
| `make test` | Compila y ejecuta las pruebas de servidor y vista local |
| `make verify` | Ejecuta las mismas comprobaciones de integridad que CI |
| `make preview` | Genera una vista autónoma en `output/preview.html` |
| `make codeql` | Prepara copias JavaScript para análisis CodeQL |
| `make clean` | Elimina los directorios generados |

Se versiona `dist/` para comparar la distribución de cada release en GitHub. Se genera exclusivamente desde `src/` y `assets/`; no se edita directamente. No se versionan capturas, credenciales ni metadatos de la instalación personal. CI comprueba la distribución antes de regenerarla y rechaza archivos desactualizados, ausentes o sobrantes; también publica `dist/` como artefacto.

## Versión de publicación

La versión de la release vive únicamente en **`src/server/config/Config.gs`**, en `RADAR.version` (actualmente `1.1.0`). Es metadato de la distribución, no una configuración de negocio de Sheets. Actualizarla antes de publicar: `1.0.1` para correcciones, `1.1.0` para funcionalidades compatibles y `2.0.0` para cambios incompatibles. Se admite un sufijo de prerelease, por ejemplo `1.1.0-rc.1`.

Después de cambiar código o versión, ejecutar `make build check-dist verify` e incluir `dist/` junto con las fuentes en el mismo commit de la rama de trabajo. El build copia `Config.gs` sin alterar su versión y la indica en su salida. Para publicar en Apps Script, copiar el contenido de esa distribución; un tag `v1.0.0` puede identificar el mismo commit en GitHub.

## GitFlow y checks

- `master`: versiones estables. Solo recibe pull requests desde `develop` del mismo repositorio.
- `develop`: rama predeterminada de integración. Recibe cambios mediante pull request desde otra rama, sin exigir prefijos en el nombre.
- Crear una rama de trabajo desde `develop`, integrar mediante PR en `develop` y publicar mediante PR `develop → master`. Las ramas de release y hotfix también se integran primero en `develop`.

CI ejecuta comprobaciones de sintaxis, integridad de permisos, build y pruebas en pushes y pull requests hacia ambas ramas. CodeQL analiza JavaScript y los propios workflows en cada cambio y semanalmente. Los módulos `.gs` y el cliente se preparan como `.js` exclusivamente para el análisis; no se mantiene otra implementación. CodeQL publica los hallazgos en Security; un análisis exitoso no implica ausencia de alertas. Dependabot propone actualizaciones semanales de las acciones fijadas por SHA. El check GitFlow valida las ramas y repositorios de origen y destino.

La licencia inicial del repositorio se conserva en `LICENSE`. Los logotipos y las tipografías aportadas mantienen los derechos de sus respectivos titulares.

Para bloquear pushes directos, las protecciones remotas de `master` y `develop` deben exigir pull request y los checks `Integrity and tests`, `Analyze (javascript-typescript)`, `Analyze (actions)` y `Branch policy`. Estas protecciones deben aplicarse también a administradores, sin bypass, y bloquear force push y eliminación de ramas. Un workflow no impide por sí solo los pushes directos. La actualización local del validador no modifica las protecciones en GitHub. No se exige aprobación de otro usuario mientras el repositorio tenga un único mantenedor.

## Organización y dependencias

- `src/design/tokens.json`: única fuente de colores, espaciado, tipografía, dimensiones y roles del tema de Sheets. El build genera `Tokens.html` y `Design.gs` desde este fichero; nunca se editan los archivos generados.
- `src/client/core/`: utilidades DOM, formateo y transporte RPC.
- `src/client/features/`: radar, gráficos, filtros, noticias, administración, fuentes, navegación, auditoría, métricas y eventos de uso. Cada módulo importa sus dependencias y recibe los callbacks que necesita.
- `src/client/app.js`: coordina cargas, concurrencia y acciones; las funciones de cada módulo conservan su propio estado. Los filtros controlan la consulta y paginación; navegación controla la vista; eventos controla su cola; fuentes controla sus formularios.
- `src/views/`: layout, filtros compartidos y vistas independientes de Radar, Noticias y Administración.
- `src/styles/`: estilos base, layout, componentes y reglas responsive, todos referenciando los tokens.
- `src/server/`: configuración, acceso, almacenamiento, noticias, fuentes, recopilación, métricas y entrada web, separados por responsabilidad.
- `src/server/news/Selection.gs`: filtros, opciones, paginación y CSV compartidos por Apps Script y la vista local.
- `src/server/metrics/Analytics.gs`: cálculos de adopción sin acceso a servicios de Google.
- `assets/app-config.json`: estructura de navegación del cliente. La selección inicial se recibe de Sheets al cargar.
- `assets/configuration-defaults.json`: valores usados únicamente al inicializar claves ausentes en Sheets.
- `assets/admin-schema.json`: campos y etiquetas del editor de catálogos; no contiene entidades, temas ni términos de negocio.
- `src/server/config/Configuration.gs`: lectura, validación, caché, inicialización y escritura de configuración.
- `src/server/briefing/Briefing.gs`: señales de novedades y renderizado HTML/texto de newsletter.
- `src/server/briefing/Mail.gs`: alias verificado, MIME, Gmail API y diagnóstico del remitente.
- `src/server/briefing/Delivery.gs`: programación, lotes y registro persistente de entregas.
- `src/server/briefing/Subscriptions.gs`: criterios personales, períodos naturales, validación y gestión administrativa.

Apps Script comparte un espacio global entre sus archivos `.gs`; las funciones internas terminan en `_` y los endpoints públicos aplican autorización. La lógica pura se mantiene separada de los módulos que acceden a Sheets y otros servicios. El servidor incorpora `Tokens.html`, `Styles.html` y `Client.html` al renderizar la página; el navegador recibe un único documento sin peticiones de fragmentos.

Los imports ES del cliente se empaquetan con esbuild, usado solo durante el desarrollo. No hay dependencias de ejecución. Exportar no vuelve a cargar el dashboard. Los formularios de fuentes se reconstruyen únicamente cuando cambia su configuración. El empaquetado elimina exports sin uso; el formateador de fechas se reutiliza en vez de crearse para cada fila. CodeQL analiza los módulos originales del cliente y copias `.js` de cada archivo de servidor.

El build conserva los módulos de servidor separados: actualmente genera 28 archivos, incluidos los cuatro HTML y el manifiesto. Las hojas operativas son Noticias, Auditoria, Ejecuciones, Recopilacion, Telemetria, Adopcion, Configuracion, Suscripciones y NewsletterEnvios.

## Configuración de negocio en Sheets

La pestaña `Configuracion` contiene una fila por catálogo: `settings`, `entities`, `geographies`, `topics`, `segments`, `signals` y `feeds`. `valor` almacena JSON; el editor de Administración ofrece formularios, activación, altas, bajas y ordenación para evitar editar JSON manualmente. `Config.gs` conserva únicamente esquemas de almacenamiento. `Defaults.gs` sustituye a `Profile.gs` y solo participa en la inicialización: el código de consulta y clasificación lee Sheets.

Se pueden configurar entidades y alias, tipos de entidad, países e idiomas, temas y términos, segmentos, señales de lanzamiento, términos de contexto, exclusiones y fuentes RSS. Operación incluye selección inicial, ventana temporal, hora y zona de recopilación, límites y tamaño de lote. Los límites técnicos máximos de validación protegen las cuotas, el tamaño de celda y la caché. La taxonomía de tipos es editorial: no acredita una licencia bancaria ni disponibilidad de productos.

La configuración inicial incluye 34 entidades, siete países, Empresas e instituciones —pymes, autónomos, empresas e instituciones— y Retail. Añade Revolut, N26, Qonto, Wise, Nubank, Mercado Pago, Ualá, Klar, Konfío y Yape a los bancos del perfil aportado. Todas comienzan activas. Son valores iniciales editables, no promesas de cobertura exhaustiva.

Sheets es el almacenamiento permanente. La caché de Apps Script dura como máximo seis horas y puede ser desalojada por Google; su revisión se conserva en Script Properties. Guardar desde Administración o editar manualmente `Configuracion` invalida esa revisión mediante un activador de edición. Los lectores que llegan después utilizan la nueva versión; las sesiones abiertas actualizan sus datos en su siguiente consulta. La revisión evita que una sesión antigua sobrescriba cambios nuevos. Los índices y términos normalizados se construyen una vez por ejecución; no se recompilan por noticia. No se mantiene una segunda copia permanente de los catálogos.

`initializeConfiguration` crea las pestañas nuevas y rellena solo claves inexistentes; no repone filas borradas de un catálogo ni sobrescribe valores guardados. Los cambios de hora o zona se aplican a la programación tras desactivarla y reactivarla desde Fuentes.

## Radar, Noticias y Novedades

Radar contiene KPIs, mapa y evolución. Noticias es el listado paginado. Novedades reúne únicamente señales de lanzamientos de producto, mejoras de oferta y alianzas. Los filtros compartidos permiten combinar entidad, país, segmento, tipo de entidad, tema, medio, novedad y fechas. La selección inicial procede de Sheets: BBVA, Empresas e instituciones, todos los países y temas. «Ver todo» elimina los filtros.

Las señales buscan por defecto en el titular y requieren contexto de producto cuando está definido. Las exclusiones reducen artículos educativos y genéricos. Administración puede elegir `headline` o `fullText`, cambiar los términos o desactivar señales. Una noticia puede pertenecer a varios segmentos y señales; lo desconocido no se asigna artificialmente. La clasificación se vuelve a calcular con los catálogos actuales al consultar el histórico. No hay puntuación ni verificación de productos: se muestran titular, extracto y enlace del editor. Las reglas pueden tener falsos positivos y omisiones.

El ámbito es el de la fuente de seguimiento, no una geolocalización confirmada de la operación. Las noticias sin país conocido quedan fuera del mapa. La geometría mundial se genera en el build; los países activos se asignan por identificador ISO numérico desde Sheets, sin SDK ni consultas externas en el navegador. El radar calcula toda la selección leída; la evolución limita intervalos y series según la configuración, agrupa el resto y conserva los días sin noticias.

Administración reúne configuración, fuentes, auditoría, telemetría, adopción, recopilar y abrir hoja. Se oculta al lector y sus endpoints exigen autorización en servidor.

## Autoservicio de newsletter

La entrada principal es **Mi newsletter**. La fecha disponible de la próxima entrega aparece en cada suscripción. Cada usuario crea, edita, pausa o da de baja sus suscripciones, asociadas exclusivamente al correo obtenido en el servidor. Los criterios de recepción son independientes de los filtros de exploración: abrir Noticias o cambiar sus filtros no cambia una suscripción guardada. El administrador ve correos, criterios, periodicidad, estado y última entrega; puede crear altas manuales y modificar cualquier suscripción del dominio. Los endpoints administrativos deniegan lectores.

Valores iniciales: **mensual, BBVA, Empresas e instituciones, todos los ámbitos y todas las novedades del canal**. La periodicidad puede ser diaria, semanal o mensual. Se envía el período natural completo anterior: ayer, lunes–domingo o mes anterior, en la zona configurada. Una suscripción nueva empieza en el siguiente cierre posterior a su alta; las modificaciones se aplican al siguiente cierre posterior a la edición. No se envían newsletters vacías. La vista previa HTML corresponde al último período completo; puede estar vacía si todavía no existe histórico para ese período.

Nombre y periodicidad iniciales, entidad, segmento, ámbito, límites y activación de entrega proceden de `Configuracion.settings`. El contenido se filtra por entidad o tipo —incluidos fintechs y neobancos—, segmento, ámbito, tema, novedad, fuente y palabras clave. Los catálogos proceden de Sheets. «Fuente» admite tanto el medio editorial como el feed de seguimiento.

El envío usa **Gmail API**, ejecutada por el propietario, con **news-radar.group@bbva.com** como `From` y `Reply-To`. Como en Market Pulse, el grupo debe estar verificado en Gmail → Cuentas → Enviar como. Cada newsletter va exclusivamente a su destinatario; no se copia al grupo. El mensaje pertenece al buzón del propietario: un Google Group no tiene una carpeta Enviados propia. `NewsletterEnvios` registra cada período antes de enviar; el estado impide repetirlo si se vuelve a ejecutar el activador. Un envío con resultado incierto queda en «Revisar» y no se reintenta automáticamente; el administrador debe contrastarlo con los envíos reales. El límite configurable en una ventana de 24 horas (100 inicialmente) y el tamaño de lote limitan el trabajo; no son una lectura de la cuota real de Google. Los destinatarios pendientes continúan en otro lote. Un error de Gmail detiene el lote y su continuación inmediata. Gmail ID queda guardado cuando Gmail acepta el mensaje; no confirma recepción en la bandeja del destinatario. Los rechazos explícitos quedan como «No enviado» y permiten reintento; los bloqueos previos al envío quedan como «Bloqueada». Los estados inciertos también reservan presupuesto. La entrega queda **desactivada inicialmente**. La clasificación se calcula una vez por lote y las selecciones idénticas comparten resultados en memoria. El registro de entregas es persistente en Sheets.

Los newsletters incluyen titulares, extractos, entidades, segmentos, señales y enlaces originales, tanto en HTML como en texto UTF-8. La URL publicada, configurable como `newsletterAppUrl`, añade el enlace para gestionar o dar de baja la suscripción. Los estilos de correo se generan desde los mismos tokens y se incrustan en cada elemento. El límite de novedades es configurable y se indica si se supera. La cobertura depende del histórico capturado; no se inventan productos o condiciones.

En escritorio, navegación superior fija y filtros verticales. En móvil, navegación inferior fija y un único formulario de filtros trasladado a una modal nativa, con cierre por Escape y conservación de valores al cambiar de tamaño. No se duplican formularios ni consultas al cambiar entre Radar y Noticias.

## Recuperación manual de noticias

Solo Administración ofrece **Recuperar noticias**, con **Hoy** seleccionado por defecto y **Último año** como alternativa. Los límites se calculan con la zona horaria guardada en Sheets; el año comprende los doce meses anteriores hasta hoy. Las búsquedas de perfil se dividen por meses, con límites de fecha explícitos; los RSS propios se consultan una vez y se filtran por el período solicitado. No se garantiza un archivo exhaustivo: cada proveedor decide qué histórico publica y cuántos resultados devuelve.

El período se guarda en Script Properties para que todos los lotes y reintentos usen el mismo rango. Si hay una recuperación pendiente no se inicia otra ni se sustituye su período. Desactivar una fuente sigue impidiendo nuevas consultas. Se comprueban URLs contra toda la columna de enlaces del histórico para no duplicar noticias antiguas. Solo se escriben las filas de estado que han cambiado; al finalizar se ordena el histórico por fecha una única vez, manteniendo las noticias recientes en la ventana de consulta. La programación diaria conserva su ventana operativa configurable.

En local, la acción muestra cuántas noticias de la instantánea corresponden al período. No consulta fuentes remotas ni simula noticias nuevas. No requiere permisos nuevos.

## Fuentes y recopilación automática

La configuración inicial genera 50 fuentes: dos RSS oficiales de BBVA y 48 búsquedas de Google News por entidad y país. Los alias se combinan en una consulta para evitar feeds redundantes. El número cambia al editar catálogos. Todas las URLs RSS son configurables; las búsquedas utilizan nombres, alias, países, idioma y términos de sector guardados en Sheets. No requieren claves API.

Desactivar una entidad, un país o una fuente evita consultas futuras sin eliminar el histórico. Las noticias de Google News mantienen el enlace agregado y el medio que declara el feed; no se atribuyen URLs canónicas ficticias. Las opciones de entidad y país incluyen el catálogo activo aunque todavía no haya noticias. Búsqueda sin acentos, fechas inclusivas, invalidación de respuestas antiguas y paginación se comparten con la vista local.

Las publicaciones se incorporan directamente a Noticias con fecha, medio, entidad, ámbito, tema y enlace, sin intervención manual. Los enlaces de Google News se mantienen como enlaces agregados, no se presentan como URLs canónicas de editores. La clasificación temática, el límite temporal y la deduplicación por URL se aplican al recibir el RSS. El cuadro de mando incluye las noticias disponibles sin intervención manual.

La captura diaria usa la hora y zona configuradas (inicialmente 07:00 Europe/Madrid). Consulta el tamaño de lote configurado (inicialmente tres fuentes por minuto) mediante una cola persistente. HTTP 429/503 se reintenta hasta tres veces con el intervalo configurado (inicialmente diez minutos); si fallan varias fuentes, se aplica la pausa configurada (inicialmente cinco minutos). Las fuentes desactivadas durante un ciclo se omiten. Un ciclo en curso se conserva al iniciar otro; su estado y sus errores son visibles al administrador. La disponibilidad y cobertura de Google News pueden variar.

Las escrituras de noticias, auditoría y estados se agrupan por lote. Los estados se guardan después de las noticias para que un fallo no marque como recopiladas publicaciones que no llegaron a almacenarse. Consultas y exportación leen el máximo configurado, con un techo técnico de 10.000 noticias; el histórico completo permanece en Sheets. No se mantienen colas de candidatos ni hojas de búsquedas.

## Instalación y actualización manual

El trabajo queda local: el Makefile no publica ni sube cambios a Google o GitHub.

1. Ejecutar `make build` y copiar los **28 archivos** de `dist/` al editor de Apps Script. Eliminar `Profile.gs`, que ha sido sustituido por `Defaults.gs`; eliminar también `Core.gs` si procede de una instalación antigua. No conservar módulos duplicados.
2. En una instalación existente, ejecutar **`initializeConfiguration`** como propietario antes de publicar la nueva versión. Crea Configuracion, Suscripciones, NewsletterEnvios y el activador de invalidación sin modificar noticias, auditoría, adopción ni la cola. No hace falta ejecutar `setupRadar` otra vez. Para una instalación nueva, `setupRadar` inicializa todo.
3. Revisar Administración: fuentes y ajustes antiguos guardados en las propiedades `FEEDS` y `DISABLED_SOURCES` **no se importan**. Copiar los RSS personalizados y la selección de activación que se quieran conservar desde la instalación anterior, y retirar esas propiedades obsoletas tras comprobar la actualización. Los catálogos nuevos comienzan con los valores de inicialización.
4. Publicar manualmente una versión y recopilar las fuentes. Si hay una cola de la versión anterior en curso, terminarla antes de actualizar o esperar al siguiente ciclo: el nuevo catálogo cambia las URLs de búsqueda.

Si ya existe una pestaña `Suscripciones` de la versión con selecciones por días, antes de inicializar cambia la cabecera de la columna E de `dias` a `periodicidad` y sus valores a `monthly`, `weekly` o `daily` (mensual por defecto). Se conservan IDs, correos, nombres, filtros, estado y fechas. El código no mantiene una segunda estructura ni lectura retrocompatible. `initializeConfiguration` incorpora los nuevos ajustes y retira ajustes operativos obsoletos, conservando los valores vigentes.

Para activar el envío después de tu despliegue manual:

1. En Gmail de **felix.delbarrio@bbva.com**, añadir **news-radar.group@bbva.com** en **Cuentas → Enviar como** y completar la verificación recibida en el grupo. El propietario debe poder recibir esa verificación y estar autorizado por Workspace para usar la dirección. Crear el grupo por sí solo no crea el alias de envío.
2. Habilitar **Gmail API** en el proyecto de Google Cloud asociado a Apps Script si no está habilitada. No se necesitan claves API ni cuentas de servicio.
3. Ejecutar `initializeConfiguration` desde el editor para crear únicamente los ajustes ausentes, conservando los valores configurados. El remitente, nombre visible, límite en 24 horas y URL publicada se guardan en **Configuracion → settings** y se editan desde Administración → Configuración de negocio.
4. Ejecutar `getNewsletterDeliveryStatus` desde el editor y autorizar los nuevos scopes con la cuenta propietaria. Comprobar `available: true`. En la aplicación, Administración → Suscripciones ofrece **Comprobar remitente**, **Enviar prueba a mi correo** (solo al administrador, con los criterios iniciales y la ventana reciente configurada) y **Programar entrega diaria**. El resultado se muestra en el propio panel, con destinatario, período, cantidad de novedades y Gmail ID. También se muestra el último intento y los tres requisitos: remitente verificado, entrega activada y programación instalada. **Procesar pendientes** ejecuta las entregas que ya han vencido; no adelanta la primera entrega de una suscripción nueva. Las pruebas aceptadas o inciertas se registran en `NewsletterEnvios` y consumen presupuesto.
5. Instalar la programación y activar **Activar entrega de newsletters** en Configuración de negocio → Operación y selección inicial → Newsletter. La entrega permanece desactivada inicialmente. Mantener la WebApp **ejecutada como propietario** y con acceso **dominio bbva.com**, según el manifiesto; los lectores no autorizan acceso a sus buzones.

Se sustituye `script.send_mail` por **`gmail.send`** (envío) y **`gmail.settings.basic`** (comprobación del alias). Son seis scopes en total; no se solicitan lectura de mensajes, modificación del buzón, acceso completo a Gmail ni administración del dominio. El código consulta únicamente el alias configurado y no crea ni modifica ajustes de Gmail. [Envío Gmail API](https://developers.google.com/workspace/gmail/api/guides/sending) · [Comprobación de alias y permisos](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.settings.sendAs/get).

La vista local identifica el remitente configurado, pero no simula que esté verificado ni envía correos. No se ha enviado ningún correo ni modificado producción durante el desarrollo local.

Implementar como **Yo (felix.delbarrio@bbva.com)** y permitir **usuarios de bbva.com**. Las seis autorizaciones del propietario son Sheets, peticiones externas, activadores, identidad de correo, envío Gmail y ajustes básicos Gmail para verificar el alias. No se añaden lectura de mensajes, Drive ni Directory. La hoja y el proyecto permanecen privados. Si Google Workspace oculta el correo activo, el servidor deniega acceso; no lo sustituye por el del propietario.

El administrador es exclusivamente `OWNER_EMAIL`. Auditoría, fuentes, hoja y métricas requieren autorización en el servidor además de ocultarse en la interfaz.

## Telemetría y adopción

Adopción almacena correo obtenido en el servidor, fecha, sesión, tipo de evento, vista y duración. No almacena términos de búsqueda ni contenido de formularios. Solo el administrador ve correos y agregaciones. Conservación máxima 90 días y 20.000 eventos, con limpieza diaria y tope por escritura. DAU/WAU/MAU son ventanas móviles 24 horas / 7 / 30 días; incluye al administrador. No se calcula porcentaje del dominio porque no se solicita acceso a Directory.

Telemetría registra duración y resultado de recopilación y p95 de cargas observado por el navegador. p95 incluye red y servidor. Los errores de cliente son eventos recibidos, no una medida de todos los fallos posibles.

Los cambios de perfiles, estilos y cálculo se hacen en su fuente única y se distribuyen con el build. La recopilación usa persistencia entre lotes y bloqueos de concurrencia; el HTML incrusta únicamente las fuentes tipográficas necesarias y los dos logos con transparencia.

## Interfaz 1.1.0

Todas las vistas comparten la rejilla de 8 px, gutters de 24 px (16 px en móvil), Benton Sans para lectura y controles y Tiempos para titulares. Los colores, dimensiones, tipografía y transiciones proceden de `src/design/tokens.json`. Los seis iconos SVG utilizados provienen del paquete BBVA Experience aportado por el usuario. La versión del pie se genera desde `RADAR.version` en Config.gs.

La navegación principal permanece arriba en escritorio y abajo en móvil; los filtros compartidos están en la columna lateral o en un diálogo móvil. Administración tiene navegación interna, catálogos desplegables, ajustes agrupados y búsqueda/paginación de fuentes que conserva cambios pendientes. El renderizado de suscripciones y la tabla de fuentes tienen módulos propios; los gráficos utilizan las agregaciones existentes.

`PREVIEW_ADMIN=1 make dev` permite revisar todas las secciones en local. Adopción y latencia usan los eventos reales de la sesión local, conservados en memoria hasta recargar; no muestran estadísticas de producción. Las pruebas de correo en local muestran un mensaje explícito y no envían emails. Los errores de Gmail y los estados de entrega se prueban con respuestas simuladas; la recepción real debe comprobarse tras publicar en Apps Script.
