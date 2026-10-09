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

`master` y `develop` requieren pull request y los checks `Integrity and tests`, `Analyze (javascript-typescript)`, `Analyze (actions)` y `Branch policy`. Las protecciones también se aplican a administradores; no permiten force push ni eliminar estas ramas. No se exige aprobación de otro usuario mientras el repositorio tenga un único mantenedor.

## Módulos

- `src/Config.gs`: parámetros, esquemas y clasificación temática.
- `assets/news-profile.json`: perfil completo de entidades, alias, temas y siete geografías.
- `src/Access.gs`: identidad activa y autorización de dominio/administrador.
- `src/Store.gs`: almacenamiento por lotes e inicialización.
- `src/Rules.gs`: limpieza, clasificación, filtros y resumen centralizados.
- `src/Sources.gs`: las fuentes predeterminadas, las adicionales y su activación.
- `src/Feeds.gs`: lectura RSS y conversión automática a noticias.
- `src/Collection.gs`: cola persistente, activadores y reintentos por fuente.
- `src/News.gs`: consultas y exportación.
- `src/Metrics.gs`: telemetría y adopción.
- `src/Index.html`, `Client.html`, `Tokens.html`, `Styles.html`: estructura, comportamiento, tokens y estilos centralizados.

El build genera cuatro módulos Apps Script (`Config.gs`, `Core.gs`, `News.gs`, `Metrics.gs`), un HTML autónomo y un manifiesto. Las hojas operativas son Noticias, Auditoria, Ejecuciones, Recopilacion, Telemetria y Adopcion.

## Fuentes y recopilación automática

Hay 57 fuentes predeterminadas: los dos RSS oficiales de BBVA y 55 feeds RSS de Google News que combinan las entidades del JSON con cada geografía. Se incluyen BBVA Empresas, sus tres alias y las 27 referencias a competidores. Todas comienzan activas. El JSON no aporta URLs RSS de los bancos: las fuentes del perfil son agregadas y la interfaz indica su proveedor.

Cada feed agregado consulta la entidad y el país, con los cinco temas del perfil y sus equivalentes en turco. La activación se puede cambiar desde Fuentes; las opciones se guardan en el servidor y no alteran noticias ya incorporadas. Se admiten hasta 12 feeds RSS 2.0 adicionales. Entidad, ámbito, medio, tema y fechas se pueden combinar para filtrar noticias. Los alias de BBVA se agrupan bajo BBVA y los nombres de entidades se centralizan. El ámbito geográfico es el seguimiento de la fuente; no certifica la jurisdicción de una operación.

Las publicaciones se incorporan directamente a Noticias con fecha, medio, entidad, ámbito, tema y enlace, sin aprobación, formularios de verificación ni puntuaciones. Los enlaces de Google News se mantienen como enlaces agregados, no se presentan como URLs canónicas de editores. La clasificación temática, el límite temporal y la deduplicación por URL se aplican al recibir el RSS. El resumen incluye las noticias disponibles sin intervención manual.

La captura diaria empieza entre 07:00–08:00 Europe/Madrid. Consulta hasta tres fuentes secuenciales por minuto mediante una cola persistente. HTTP 429/503 se reintenta hasta tres veces con diez minutos de separación; si falla la mayoría del lote, se pausa cinco minutos. Las fuentes desactivadas durante un ciclo se omiten. Un ciclo en curso se conserva al iniciar otro; su estado y sus errores son visibles al administrador. La disponibilidad y cobertura de Google News pueden variar.

Las escrituras de noticias, auditoría y estados se agrupan por lote. Los estados se guardan después de las noticias para que un fallo no marque como recopiladas publicaciones que no llegaron a almacenarse. Consultas y exportación leen como máximo las últimas 10.000 noticias; el histórico completo permanece en Sheets. No se mantienen colas de candidatos ni hojas de búsquedas.

## Instalación

Copiar los seis archivos de `dist/` al proyecto de Apps Script y ejecutar `setupRadar` con la cuenta propietaria sobre una hoja con los esquemas actuales. La instalación existente se ha actualizado una vez, fuera del código de ejecución, para retirar las columnas y pestañas del flujo anterior y conservar las noticias útiles.

Implementar como **Yo (felix.delbarrio@bbva.com)** y permitir **usuarios de bbva.com**. Las cuatro autorizaciones del propietario son Sheets, peticiones externas, activadores e identidad de correo. No se añaden Gmail, Drive ni Directory. La hoja y el proyecto permanecen privados. Si Google Workspace oculta el correo activo, el servidor deniega acceso; no lo sustituye por el del propietario.

El administrador es exclusivamente `OWNER_EMAIL`. Auditoría, fuentes, hoja y métricas requieren autorización en el servidor además de ocultarse en la interfaz.

## Telemetría y adopción

Adopción almacena correo obtenido en el servidor, fecha, sesión, tipo de evento, vista y duración. No almacena términos de búsqueda ni contenido de formularios. Solo el administrador ve correos y agregaciones. Conservación máxima 90 días y 20.000 eventos, con limpieza diaria y tope por escritura. DAU/WAU/MAU son ventanas móviles 24 horas / 7 / 30 días; incluye al administrador. No se calcula porcentaje del dominio porque no se solicita acceso a Directory.

Telemetría registra duración y resultado de recopilación/búsqueda y p95 de cargas observado por el navegador. p95 incluye red y servidor. Los errores de cliente son eventos recibidos, no una medida de todos los fallos posibles.

Los cambios de perfiles, estilos y cálculo se hacen en su fuente única y se distribuyen con el build. La recopilación usa persistencia entre lotes y bloqueos de concurrencia; el HTML incrusta únicamente las fuentes tipográficas necesarias y los dos logos con transparencia.
