# Tareas de Desarrollo — dev-laoz-api-files

## US-FILE-001 — Subida de archivo vía multipart
**Como** operador del sistema,  
**quiero** subir archivos binarios mediante `POST /api/files` con `multipart/form-data`,  
**para** almacenarlos en el adaptador de storage indicado y registrar sus metadatos en MongoDB.

**Criterios de aceptación:**
- El campo `file` es obligatorio; sin él se retorna `400 Bad Request`.
- El campo `storageType` es opcional, por defecto `LOCAL`.
- Si ya existe un registro con el mismo `originalName` (no eliminado), se crea una nueva versión.
- Si no existe, se crea un nuevo registro con `currentVersion: 1`.
- La respuesta `201` incluye `id`, `message` y `version`.

**Subtareas:**
- [ ] Verificar configuración de `multer` para recibir `single('file')`.
- [ ] Implementar lógica de upsert en el controller `uploadFile`.
- [ ] Escribir tests unitarios para casos exitosos y error 400.

---

## US-FILE-002 — Guardado de contenido de texto
**Como** editor integrado del ecosistema,  
**quiero** guardar contenido de texto directamente vía `POST /api/files/content`,  
**para** persistir cambios en archivos de código o markdown sin necesidad de subida multipart.

**Criterios de aceptación:**
- Los campos `path` y `content` son obligatorios; sin ellos se retorna `400 Bad Request`.
- El campo `storageType` es opcional (por defecto `REPOS`).
- La respuesta `200` incluye `{ message: 'Contenido guardado exitosamente', path }`.
- Errores del adaptador retornan `500`.

**Subtareas:**
- [ ] Implementar `saveContent` en el controller.
- [ ] Registrar la ruta `POST /content` antes de `POST /` en el router.
- [ ] Escribir tests unitarios para casos exitosos y error 400.

---

## US-FILE-003 — Descarga de versión actual
**Como** cliente del API,  
**quiero** descargar la versión más reciente de un archivo mediante `GET /api/files/:id`,  
**para** obtener su contenido binario con las cabeceras correctas.

**Criterios de aceptación:**
- El `id` debe ser un ObjectId de MongoDB válido; si no lo es se retorna `400`.
- Si el archivo no existe o está eliminado, se retorna `404`.
- La respuesta incluye cabeceras `Content-Type` y `Content-Disposition` correctas.
- El contenido se transmite como stream desde el adaptador.

**Subtareas:**
- [ ] Implementar `downloadFile` con validación de ObjectId y manejo de stream.
- [ ] Obtener el adaptador correcto según `version.storageType`.
- [ ] Escribir tests unitarios y de integración.

---

## US-FILE-004 — Listado de versiones de un archivo
**Como** administrador,  
**quiero** listar todas las versiones registradas de un archivo mediante `GET /api/files/:id/versions`,  
**para** conocer el historial de cambios y metadatos de cada versión.

**Criterios de aceptación:**
- Si el archivo no existe, retorna `404` con `{ error: 'No encontrado' }`.
- La respuesta es un array de objetos con todos los campos de `versionSchema`.

**Subtareas:**
- [ ] Implementar `listVersions` en el controller.
- [ ] Escribir tests unitarios para lista no vacía y archivo no encontrado.

---

## US-FILE-005 — Descarga de versión específica
**Como** cliente del API,  
**quiero** descargar una versión particular mediante `GET /api/files/:id/versions/:versionId`,  
**para** recuperar versiones anteriores de un archivo.

**Criterios de aceptación:**
- `id` debe ser un ObjectId válido; si no, retorna `400`.
- Si el archivo no existe o está eliminado, retorna `404`.
- Si el número de versión no existe, retorna `404` con `{ error: 'Versión no encontrada' }`.
- La respuesta incluye el contenido binario con cabeceras correctas.

**Subtareas:**
- [ ] Implementar `downloadVersion` en el controller.
- [ ] Usar `file.versions.find(v => v.version == versionId)` para localizar la versión.
- [ ] Escribir tests unitarios para los cuatro escenarios.

---

## US-FILE-006 — Mover archivo entre tipos de storage
**Como** administrador de infraestructura,  
**quiero** mover un archivo a un adaptador de almacenamiento diferente vía `PUT /api/files/:id/move`,  
**para** redistribuir archivos entre storage local, network y cloud.

**Criterios de aceptación:**
- `targetStorageType` y `targetPath` son obligatorios; sin ellos retorna `400`.
- Si el archivo no existe o está eliminado, retorna `404`.
- La operación es atómica: lee origen, escribe destino, elimina origen.
- Los metadatos en MongoDB se actualizan con la nueva ubicación.
- Respuesta `200` con `{ message: 'Archivo movido exitosamente', location }`.

**Subtareas:**
- [ ] Implementar `moveFile` usando `storageManager.moveFile`.
- [ ] Actualizar los campos `storageType`, `basePath`, `relativePath`, `fullPath` del version data.
- [ ] Escribir tests para movimiento exitoso y parámetros faltantes.

---

## US-FILE-007 — Copiar archivo
**Como** usuario,  
**quiero** copiar un archivo a otro destino vía `POST /api/files/:id/copy`,  
**para** crear una copia independiente sin modificar el original.

**Criterios de aceptación:**
- `targetStorageType` y `targetPath` son obligatorios; sin ellos retorna `400`.
- Si el archivo origen no existe o está eliminado, retorna `404`.
- Se crea un nuevo registro `File` en MongoDB para la copia.
- `newName` es opcional; por defecto es `Copy of <originalName>`.
- Respuesta con `{ id: newFile._id, message: 'Archivo copiado exitosamente' }`.

**Subtareas:**
- [ ] Implementar `copyFile` usando el stream del adaptador origen.
- [ ] Crear nuevo documento `File` con `currentVersion: 1`.
- [ ] Escribir tests unitarios para copia exitosa y origen no encontrado.

---

## US-FILE-008 — Borrado lógico de archivo
**Como** administrador,  
**quiero** marcar un archivo como eliminado vía `DELETE /api/files/:id`,  
**para** ocultarlo del sistema sin eliminar físicamente los datos.

**Criterios de aceptación:**
- Si el archivo existe, se marca `deleted: true` y retorna `204 No Content`.
- Si el archivo no existe, retorna `404 Not Found`.
- Los archivos eliminados no aparecen en búsquedas ni descargas posteriores.

**Subtareas:**
- [ ] Implementar `deleteFile` usando `File.findByIdAndUpdate(id, { deleted: true })`.
- [ ] Añadir la ruta `DELETE /:id` al router.
- [ ] Escribir tests para eliminación exitosa y 404.

---

## US-FILE-009 — Protección de rutas con authMiddleware
**Como** arquitecto del sistema,  
**quiero** que todas las rutas bajo `/api/files` requieran autenticación Bearer,  
**para** garantizar que solo usuarios autorizados accedan al sistema de archivos.

**Criterios de aceptación:**
- El middleware `authMiddleware` se aplica en `app.use('/api/files', authMiddleware, filesRouter)`.
- Peticiones sin header `Authorization` reciben `401 Unauthorized`.
- Peticiones con token inválido reciben `401` o `403` según la respuesta de `authorization-api`.

**Subtareas:**
- [ ] Verificar configuración en `src/interfaces/app.js`.
- [ ] Escribir tests de integración para rutas sin token.

---

## US-FILE-010 — Documentación Swagger
**Como** desarrollador consumidor del API,  
**quiero** acceder a documentación interactiva en `/api-docs`,  
**para** explorar y probar todos los endpoints disponibles.

**Criterios de aceptación:**
- La documentación se genera a partir de los comentarios JSDoc en `files.routes.js`.
- Si la carga de Swagger falla, el servicio arranca igualmente con un warning en consola.
- El endpoint `/api-docs` retorna la UI de Swagger correctamente.

**Subtareas:**
- [ ] Verificar configuración en `src/interfaces/swagger.js` o similar.
- [ ] Confirmar que el try/catch en `app.js` protege el arranque ante fallos de Swagger.
