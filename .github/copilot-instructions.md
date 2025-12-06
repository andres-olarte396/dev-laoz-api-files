# GitHub Copilot Instructions — dev-laoz-api-files

## Arquitectura y Estructura

Este proyecto sigue **Clean Architecture** con separación estricta de responsabilidades:

- **`/domain`** — Modelos de dominio (ej: `file.model.js` con Mongoose schemas). Nunca incluyas lógica de infraestructura aquí.
- **`/application`** — Casos de uso y servicios (ej: `file.service.js`). Orquesta operaciones entre dominio e infraestructura.
- **`/infrastructure`** — Implementaciones técnicas (DB, storage adapters). El patrón **StorageAdapter** permite múltiples backends (LOCAL, NETWORK, CLOUD).
- **`/interfaces`** — Controladores, rutas y middleware de Express. Punto de entrada HTTP.

### Patrón Storage Adapter

El sistema usa **StorageManager** (`src/infrastructure/storage/StorageManager.js`) como registry de adapters:

```javascript
// Todos los adapters heredan de StorageAdapter
// Métodos requeridos: save(), getStream(), delete(), exists(), move()
const adapter = storageManager.getAdapter('LOCAL'); // o 'NETWORK', 'CLOUD'
const meta = await adapter.save(relativePath, buffer);
```

**Regla clave**: Los metadatos del archivo (`File` model) guardan `storageType`, `basePath`, `relativePath` para permitir mover archivos entre storages sin romper referencias.

## Versionado de Archivos

- Cada upload del **mismo `originalName`** crea una nueva versión automáticamente (`currentVersion++`)
- El array `versions[]` en el modelo almacena metadata de cada versión
- Al descargar sin especificar versión, se usa `currentVersionData` (virtual helper)
- Las versiones **nunca se eliminan físicamente**, solo se marca `deleted: true` en el documento

## Convenciones de Código

### Naming y Estructura

- **Controladores**: Exportan objeto con métodos nombrados como el endpoint (`uploadFile`, `downloadFile`, etc.)
- **Rutas**: Usan prefix `/api/files` (configurado en `app.js`)
- **IDs**: Siempre valida con `mongoose.Types.ObjectId.isValid(id)` antes de queries
- **Nombres de archivo**: Usa `makeStoredName()` para generar nombres únicos con timestamp (`${Date.now()}-${safeName}`)

### Manejo de Errores

Todos los controladores siguen el patrón:
```javascript
try {
  // lógica
  res.status(200).json({ ... });
} catch (err) {
  console.error('Error detallado:', err);
  res.status(500).json({ error: 'Mensaje genérico al cliente' });
}
```

El middleware global de errores en `app.js` captura excepciones no manejadas.

## Testing

- Framework: **Jest** con `supertest` para tests de integración
- Setup global en `tests/setup.js` (conecta a MongoDB in-memory con `mongodb-memory-server`)
- Patrón de tests:
  ```javascript
  const res = await request(app)
    .post('/files')
    .attach('file', Buffer.from('...'), 'test.txt');
  expect(res.statusCode).toBe(201);
  ```

**Ejecutar tests**: `npm test`

## Workflows de Desarrollo

### Iniciar el servidor

```bash
# Desarrollo (requiere nodemon si se configura)
npm start

# El servidor escucha en PORT de .env (default: 3000)
# Conecta a MongoDB según MONGODB_URI en .env
```

### Variables de entorno requeridas

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/files-db
STORAGE_PATH=uploads  # Ruta base para LocalStorageAdapter
```

### Agregar nuevo Storage Adapter

1. Crea clase en `src/infrastructure/storage/` extendiendo `StorageAdapter`
2. Implementa métodos requeridos: `save()`, `getStream()`, `delete()`, `exists()`, `move()`
3. Registra en `StorageManager.js`:
   ```javascript
   this.registerAdapter('CLOUD', new CloudStorageAdapter(config));
   ```
4. Actualiza enum en `file.model.js` → `versionSchema.storageType`

## Integraciones Externas

- **Mongoose** → MongoDB para metadatos
- **Multer** → Parsing de multipart/form-data en rutas de upload
- **Express 5.x** → Async handlers nativos (no requiere `express-async-errors`)

## Notas Importantes

- **No uses `fs.unlinkSync` directamente** en controladores; delega a `storage.delete()`
- **Streaming**: Para archivos grandes, usa `adapter.getStream()` + `res.pipe()` (ver `downloadFile` controller)
- **Cross-storage moves**: `StorageManager.moveFile()` optimiza movimientos entre adapters iguales
- **Postman collection** en `/postman` para testing manual de la API

## Próximos Pasos Conocidos

- Implementar autenticación/autorización
- Agregar adapter para Azure Blob Storage o AWS S3
- Mejorar Swagger docs (existe stub en `src/interfaces/swagger.json`)
