# Documento de Requerimientos — dev-laoz-api-files

## Requerimientos Funcionales

### RF-FILE-001 — Subida de archivo multipart
El sistema debe aceptar archivos a través de `POST /api/files` usando `multipart/form-data` (campo `file`). Si ya existe un registro con el mismo `originalName` (no eliminado), se debe agregar una nueva versión. Si no existe, se crea un nuevo registro. La respuesta debe incluir el `id` del registro, un mensaje descriptivo y el número de versión creado.

### RF-FILE-002 — Almacenamiento por tipo de storage
El sistema debe soportar tres tipos de adaptadores de almacenamiento: `LOCAL`, `NETWORK` y `CLOUD`. El tipo se indica mediante el campo `storageType` en el cuerpo de la solicitud. El adaptador correspondiente gestiona la persistencia física del archivo.

### RF-FILE-003 — Versionado automático
Cada vez que se sube un archivo con el mismo `originalName`, el sistema incrementa automáticamente el número de versión (`currentVersion`) y agrega la nueva entrada al array `versions` del documento File en MongoDB.

### RF-FILE-004 — Guardado de contenido de texto
El sistema debe aceptar contenido de texto plano vía `POST /api/files/content` con campos `path` (ruta relativa en el adaptador) y `content` (contenido completo del archivo). El campo `storageType` es opcional, con valor por defecto `REPOS`. Usado principalmente por el editor integrado.

### RF-FILE-005 — Descarga de versión actual
El sistema debe permitir descargar la versión más reciente de un archivo mediante `GET /api/files/:id`. La respuesta incluye el contenido binario del archivo con cabeceras `Content-Type` y `Content-Disposition` correctas.

### RF-FILE-006 — Descarga de versión específica
El sistema debe permitir descargar una versión particular de un archivo mediante `GET /api/files/:id/versions/:versionId`, donde `versionId` es el número entero de versión.

### RF-FILE-007 — Listado de versiones
El sistema debe retornar todas las versiones registradas de un archivo mediante `GET /api/files/:id/versions`. La respuesta incluye metadatos completos por versión: `storageType`, `basePath`, `relativePath`, `fullPath`, `filename`, `mimeType`, `size` y `uploadedAt`.

### RF-FILE-008 — Mover archivo entre tipos de storage
El sistema debe permitir mover un archivo de un adaptador de almacenamiento a otro mediante `PUT /api/files/:id/move`, recibiendo `targetStorageType` y `targetPath`. La operación lee el origen, escribe en el destino, elimina el origen y actualiza los metadatos en MongoDB.

### RF-FILE-009 — Copiar archivo
El sistema debe permitir copiar un archivo a otro adaptador (o al mismo) mediante `POST /api/files/:id/copy`, recibiendo `targetStorageType`, `targetPath` y opcionalmente `newName`. Se crea un nuevo registro `File` independiente en MongoDB para la copia. El archivo original no es modificado.

### RF-FILE-010 — Borrado lógico (soft delete)
El sistema debe implementar borrado lógico vía `DELETE /api/files/:id`, marcando el campo `deleted: true` en el registro MongoDB sin eliminar el archivo físico. Los archivos marcados como eliminados no son devueltos en búsquedas ni descargas.

### RF-FILE-011 — Healthcheck implícito
El servicio debe responder a través de la aplicación Express expuesta; la ruta `/health` o el endpoint raíz puede verificar disponibilidad del servicio.

---

## Requerimientos No Funcionales

### RNF-FILE-001 — Autenticación obligatoria
Todas las rutas bajo `/api/files` deben estar protegidas por `authMiddleware` de `@dev-laoz/core`. Las peticiones sin token Bearer válido deben recibir respuesta `401 Unauthorized`.

### RNF-FILE-002 — Rate limiting
El middleware `rateLimitMiddleware` de `@dev-laoz/core` debe aplicarse a nivel de aplicación, limitando a 100 peticiones cada 15 minutos por IP de origen.

### RNF-FILE-003 — Soporte de storageType
El sistema debe soportar los valores `LOCAL`, `NETWORK` y `CLOUD` como tipos de almacenamiento. Cualquier tipo no reconocido debe resultar en un error controlado del adaptador.

### RNF-FILE-004 — Límite de tamaño de archivo
El sistema debe configurar `multer` sin límite explícito de tamaño en desarrollo, pero la configuración de producción debe imponer un límite razonable (configurable vía variable de entorno) para prevenir ataques de denegación de servicio.

### RNF-FILE-005 — Validación de ObjectId de MongoDB
Antes de consultar MongoDB por `id`, el sistema debe validar que el valor sea un ObjectId de Mongoose válido, retornando `400 Bad Request` si no lo es.

### RNF-FILE-006 — Manejo de errores centralizado
El servicio debe incluir un middleware de manejo de errores que capture errores no controlados, registre el stack trace mediante `logger.error` y retorne una respuesta JSON con el status correspondiente.

### RNF-FILE-007 — Logging de eventos
Todos los errores relevantes deben registrarse mediante el `logger` de `@dev-laoz/core`, que los transmite al servicio `api-insights` de forma fire-and-forget.

### RNF-FILE-008 — Persistencia en MongoDB
El modelo `File` usa Mongoose y debe conectarse a MongoDB mediante variable de entorno `MONGO_URI`. Las conexiones deben gestionarse en `src/server.js`.

### RNF-FILE-009 — Documentación Swagger
El servicio debe exponer documentación interactiva Swagger en `/api-docs` usando `createSwaggerDocs` de `@dev-laoz/core`. Si la carga de Swagger falla, el error no debe interrumpir el arranque del servicio.

### RNF-FILE-010 — Seguridad ante directory traversal
El endpoint `/api/file` (servicio de archivos estáticos) debe validar que la ruta solicitada permanezca dentro de `staticPath`, retornando `403 Forbidden` ante intentos de traversal.
