# API Reference — dev-laoz-api-files

Base URL: `http://localhost:3700`

Todos los endpoints bajo `/api/files` requieren autenticacion JWT via header `Authorization: Bearer <token>`. El token es validado por `authMiddleware` de `@dev-laoz/core`.

---

## POST /api/files/content

Guarda contenido de texto directamente en un adaptador de almacenamiento. Usado principalmente por el editor integrado para persistir cambios en archivos de codigo o markdown.

**Auth:** Si (JWT Bearer)

### Request body

```json
{
  "path": "dev-laoz-api-gateway/src/server.js",
  "content": "const express = require('express');\n// ...",
  "storageType": "REPOS"
}
```

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `path` | string | Si | Ruta relativa dentro del adaptador de almacenamiento |
| `content` | string | Si | Contenido del archivo (texto plano) |
| `storageType` | string | No | `LOCAL` (default) o `REPOS` |

### Response 200

```json
{
  "message": "Contenido guardado exitosamente",
  "path": "dev-laoz-api-gateway/src/server.js"
}
```

### Errores

| Codigo | Descripcion |
| --- | --- |
| `400` | `path` o `content` faltantes |
| `401` | Token JWT ausente o invalido |
| `500` | Error del adaptador de almacenamiento |

### curl

```bash
curl -X POST http://localhost:3700/api/files/content \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "notes/readme.md",
    "content": "# Nota importante\n\nContenido actualizado.",
    "storageType": "LOCAL"
  }'
```

---

## POST /api/files

Sube un archivo mediante `multipart/form-data`. Si ya existe un archivo con el mismo `originalName` (no eliminado), se crea una nueva version. De lo contrario se crea un nuevo registro.

**Auth:** Si (JWT Bearer)

### Request

- Content-Type: `multipart/form-data`
- Campo del formulario: `file` (binario)
- Campo opcional: `storageType` (`LOCAL` por defecto)

### Response 201

```json
{
  "id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "message": "Nueva version agregada",
  "version": 3
}
```

Para primer upload: `"message": "Archivo subido"`, `"version": 1`.

### Errores

| Codigo | Descripcion |
| --- | --- |
| `400` | No se adjunto ningun archivo |
| `401` | Token JWT ausente o invalido |
| `500` | Error al guardar en disco o en MongoDB |

### curl

```bash
curl -X POST http://localhost:3700/api/files \
  -H "Authorization: Bearer <token>" \
  -F "file=@/ruta/local/documento.pdf" \
  -F "storageType=LOCAL"
```

---

## GET /api/files/:id

Descarga la version actual (mas reciente) de un archivo. La respuesta es el contenido binario del archivo con los headers `Content-Type` y `Content-Disposition` apropiados.

**Auth:** Si (JWT Bearer)

### Path parameters

| Parametro | Descripcion |
| --- | --- |
| `id` | ObjectId de MongoDB del archivo |

### Response 200

Contenido binario del archivo.

```text
Content-Type: application/pdf
Content-Disposition: attachment; filename="documento.pdf"
```

### Errores

| Codigo | Descripcion |
| --- | --- |
| `400` | `id` no es un ObjectId valido |
| `401` | Token JWT ausente o invalido |
| `404` | Archivo no encontrado o marcado como eliminado |
| `500` | Error al leer desde el adaptador de almacenamiento |

### curl

```bash
curl -OJ http://localhost:3700/api/files/64f1a2b3c4d5e6f7a8b9c0d1 \
  -H "Authorization: Bearer <token>"
```

---

## GET /api/files/:id/versions

Lista todas las versiones registradas de un archivo, incluyendo metadatos de almacenamiento de cada version.

**Auth:** Si (JWT Bearer)

### Path parameters

| Parametro | Descripcion |
| --- | --- |
| `id` | ObjectId de MongoDB del archivo |

### Response 200

```json
[
  {
    "version": 1,
    "storageType": "LOCAL",
    "basePath": "uploads",
    "relativePath": "1718449200000-documento.pdf",
    "fullPath": "/app/uploads/1718449200000-documento.pdf",
    "filename": "1718449200000-documento.pdf",
    "mimeType": "application/pdf",
    "size": 204800,
    "uploadedAt": "2026-06-10T08:00:00.000Z"
  },
  {
    "version": 2,
    "storageType": "LOCAL",
    "basePath": "uploads",
    "relativePath": "1718535600000-documento.pdf",
    "fullPath": "/app/uploads/1718535600000-documento.pdf",
    "filename": "1718535600000-documento.pdf",
    "mimeType": "application/pdf",
    "size": 210944,
    "uploadedAt": "2026-06-11T08:00:00.000Z"
  }
]
```

### Errores

| Codigo | Descripcion |
| --- | --- |
| `401` | Token JWT ausente o invalido |
| `404` | Archivo no encontrado |

### curl

```bash
curl http://localhost:3700/api/files/64f1a2b3c4d5e6f7a8b9c0d1/versions \
  -H "Authorization: Bearer <token>"
```

---

## GET /api/files/:id/versions/:versionId

Descarga una version especifica de un archivo identificada por su numero de version.

**Auth:** Si (JWT Bearer)

### Path parameters

| Parametro | Descripcion |
| --- | --- |
| `id` | ObjectId de MongoDB del archivo |
| `versionId` | Numero de version (entero, ej. `1`, `2`) |

### Response 200

Contenido binario de la version solicitada.

```text
Content-Type: application/pdf
Content-Disposition: attachment; filename="documento.pdf"
```

### Errores

| Codigo | Descripcion |
| --- | --- |
| `400` | `id` invalido |
| `401` | Token JWT ausente o invalido |
| `404` | Archivo o version no encontrada |
| `500` | Error al leer desde el adaptador |

### curl

```bash
curl -OJ http://localhost:3700/api/files/64f1a2b3c4d5e6f7a8b9c0d1/versions/1 \
  -H "Authorization: Bearer <token>"
```

---

## PUT /api/files/:id/move

Mueve la version actual de un archivo a un adaptador de almacenamiento diferente. Actualiza los metadatos en MongoDB. La operacion es atomica: lee el origen, escribe en destino y elimina el origen.

**Auth:** Si (JWT Bearer)

### Path parameters

| Parametro | Descripcion |
| --- | --- |
| `id` | ObjectId de MongoDB del archivo |

### Request body

```json
{
  "targetStorageType": "NETWORK",
  "targetPath": "shared/documentos/documento.pdf"
}
```

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `targetStorageType` | string | Si | `LOCAL`, `NETWORK` o `CLOUD` |
| `targetPath` | string | Si | Ruta relativa dentro del adaptador destino |

### Response 200

```json
{
  "message": "Archivo movido exitosamente",
  "location": "/mnt/network/shared/documentos/documento.pdf"
}
```

### Errores

| Codigo | Descripcion |
| --- | --- |
| `400` | `targetStorageType` o `targetPath` faltantes |
| `401` | Token JWT ausente o invalido |
| `404` | Archivo no encontrado o eliminado |
| `500` | Error de lectura/escritura en adaptadores |

### curl

```bash
curl -X PUT http://localhost:3700/api/files/64f1a2b3c4d5e6f7a8b9c0d1/move \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "targetStorageType": "NETWORK",
    "targetPath": "shared/documentos/documento.pdf"
  }'
```

---

## POST /api/files/:id/copy

Copia la version actual de un archivo a un adaptador de almacenamiento (mismo o diferente). Crea un nuevo registro `File` en MongoDB para la copia.

**Auth:** Si (JWT Bearer)

### Path parameters

| Parametro | Descripcion |
| --- | --- |
| `id` | ObjectId de MongoDB del archivo origen |

### Request body

```json
{
  "targetStorageType": "LOCAL",
  "targetPath": "backups/documento-backup.pdf",
  "newName": "documento-backup.pdf"
}
```

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `targetStorageType` | string | Si | `LOCAL`, `NETWORK` o `CLOUD` |
| `targetPath` | string | Si | Ruta relativa en el adaptador destino |
| `newName` | string | No | Nombre original del archivo copiado (default: `Copy of <nombre>`) |

### Response 200

```json
{
  "id": "64f1a2b3c4d5e6f7a8b9c0d9",
  "message": "Archivo copiado exitosamente"
}
```

### Errores

| Codigo | Descripcion |
| --- | --- |
| `400` | Parametros incompletos |
| `401` | Token JWT ausente o invalido |
| `404` | Archivo origen no encontrado o eliminado |
| `500` | Error al leer origen o escribir destino |

### curl

```bash
curl -X POST http://localhost:3700/api/files/64f1a2b3c4d5e6f7a8b9c0d1/copy \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "targetStorageType": "LOCAL",
    "targetPath": "backups/documento-backup.pdf",
    "newName": "documento-backup.pdf"
  }'
```

---

## DELETE /api/files/:id

Marca el archivo como eliminado (`deleted: true`) en MongoDB. No elimina los archivos fisicos del sistema de almacenamiento. Los archivos eliminados no son accesibles mediante GET.

**Auth:** Si (JWT Bearer)

### Path parameters

| Parametro | Descripcion |
| --- | --- |
| `id` | ObjectId de MongoDB del archivo |

### Response 204

Sin cuerpo de respuesta.

### Errores

| Codigo | Descripcion |
| --- | --- |
| `401` | Token JWT ausente o invalido |
| `404` | Archivo no encontrado (si se valida) |

### curl

```bash
curl -X DELETE http://localhost:3700/api/files/64f1a2b3c4d5e6f7a8b9c0d1 \
  -H "Authorization: Bearer <token>"
```

---

## GET /health

Verificacion de salud del servicio. No requiere autenticacion. Definido en `server.js`.

**Auth:** No

### Response 200

```json
{
  "status": "ok"
}
```

### curl

```bash
curl http://localhost:3700/health
```
