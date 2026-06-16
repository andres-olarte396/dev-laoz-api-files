const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();

const filesController = require('../controllers/files.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     FileVersion:
 *       type: object
 *       properties:
 *         version:
 *           type: integer
 *           example: 2
 *         storageType:
 *           type: string
 *           enum: [LOCAL, NETWORK, CLOUD]
 *           example: LOCAL
 *         basePath:
 *           type: string
 *           example: uploads
 *         relativePath:
 *           type: string
 *           example: 1718449200000-documento.pdf
 *         fullPath:
 *           type: string
 *           example: /app/uploads/1718449200000-documento.pdf
 *         filename:
 *           type: string
 *           example: 1718449200000-documento.pdf
 *         mimeType:
 *           type: string
 *           example: application/pdf
 *         size:
 *           type: integer
 *           description: Tamano en bytes
 *           example: 204800
 *         uploadedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-06-10T08:00:00.000Z"
 *     FileRecord:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d1
 *         originalName:
 *           type: string
 *           example: documento.pdf
 *         currentVersion:
 *           type: integer
 *           example: 2
 *         versions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FileVersion'
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["contrato", "2026"]
 *         deleted:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/files/content:
 *   post:
 *     summary: Guardar contenido de texto en almacenamiento
 *     description: >
 *       Guarda o sobreescribe un archivo de texto en el adaptador de almacenamiento indicado.
 *       Usado principalmente por el editor integrado para persistir cambios en archivos de
 *       codigo o markdown sin necesidad de subida multipart.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [path, content]
 *             properties:
 *               path:
 *                 type: string
 *                 description: Ruta relativa dentro del adaptador de almacenamiento
 *                 example: dev-laoz-api-gateway/src/server.js
 *               content:
 *                 type: string
 *                 description: Contenido completo del archivo en texto plano
 *                 example: "const express = require('express');\n// ..."
 *               storageType:
 *                 type: string
 *                 enum: [LOCAL, REPOS]
 *                 default: LOCAL
 *                 description: Adaptador de destino
 *                 example: REPOS
 *           example:
 *             path: notes/readme.md
 *             content: "# Nota\n\nContenido actualizado."
 *             storageType: LOCAL
 *     responses:
 *       200:
 *         description: Contenido guardado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contenido guardado exitosamente
 *                 path:
 *                   type: string
 *                   example: notes/readme.md
 *       400:
 *         description: path o content faltantes en el body
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Path and content are required
 *       401:
 *         description: Token JWT ausente o invalido
 *       500:
 *         description: Error del adaptador de almacenamiento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ENOENT: no such file or directory"
 */
console.log('Registering /content route');
router.post('/content', filesController.saveContent);

/**
 * @swagger
 * /api/files:
 *   post:
 *     summary: Subir archivo (multipart/form-data)
 *     description: >
 *       Sube un archivo via multipart/form-data. Si ya existe un registro con el mismo
 *       originalName (no eliminado), se agrega una nueva version. De lo contrario, se crea
 *       un nuevo registro. El archivo se almacena en el adaptador indicado por storageType.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo a subir
 *               storageType:
 *                 type: string
 *                 enum: [LOCAL, NETWORK, CLOUD]
 *                 default: LOCAL
 *                 description: Adaptador de almacenamiento destino
 *     responses:
 *       201:
 *         description: Archivo subido o nueva version creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: ObjectId del registro File en MongoDB
 *                   example: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 message:
 *                   type: string
 *                   example: Nueva version agregada
 *                 version:
 *                   type: integer
 *                   description: Numero de la version creada
 *                   example: 3
 *       400:
 *         description: No se adjunto ningun archivo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No se adjunto ningun archivo
 *       401:
 *         description: Token JWT ausente o invalido
 *       500:
 *         description: Error al guardar en disco o en MongoDB
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error al subir archivo
 */
router.post('/', upload.single('file'), filesController.uploadFile);

/**
 * @swagger
 * /api/files/{id}:
 *   get:
 *     summary: Descargar version actual del archivo
 *     description: >
 *       Retorna el contenido binario de la version mas reciente del archivo.
 *       Los headers Content-Type y Content-Disposition son establecidos automaticamente
 *       segun el mimeType y originalName registrados en MongoDB.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de MongoDB del archivo
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *     responses:
 *       200:
 *         description: Contenido binario del archivo
 *         headers:
 *           Content-Type:
 *             schema:
 *               type: string
 *             example: application/pdf
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             example: attachment; filename="documento.pdf"
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: id no es un ObjectId valido de MongoDB
 *       401:
 *         description: Token JWT ausente o invalido
 *       404:
 *         description: Archivo no encontrado o marcado como eliminado
 *       500:
 *         description: Error al leer desde el adaptador de almacenamiento
 */
router.get('/:id', filesController.downloadFile);

/**
 * @swagger
 * /api/files/{id}/versions:
 *   get:
 *     summary: Listar todas las versiones de un archivo
 *     description: >
 *       Retorna el array completo de versiones del archivo incluyendo metadatos
 *       de almacenamiento (tipo de storage, rutas, mimeType, tamano, fecha).
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de MongoDB del archivo
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *     responses:
 *       200:
 *         description: Lista de versiones del archivo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FileVersion'
 *             example:
 *               - version: 1
 *                 storageType: LOCAL
 *                 basePath: uploads
 *                 relativePath: 1718449200000-documento.pdf
 *                 fullPath: /app/uploads/1718449200000-documento.pdf
 *                 filename: 1718449200000-documento.pdf
 *                 mimeType: application/pdf
 *                 size: 204800
 *                 uploadedAt: "2026-06-10T08:00:00.000Z"
 *               - version: 2
 *                 storageType: LOCAL
 *                 basePath: uploads
 *                 relativePath: 1718535600000-documento.pdf
 *                 fullPath: /app/uploads/1718535600000-documento.pdf
 *                 filename: 1718535600000-documento.pdf
 *                 mimeType: application/pdf
 *                 size: 210944
 *                 uploadedAt: "2026-06-11T08:00:00.000Z"
 *       401:
 *         description: Token JWT ausente o invalido
 *       404:
 *         description: Archivo no encontrado
 */
router.get('/:id/versions', filesController.listVersions);

/**
 * @swagger
 * /api/files/{id}/versions/{versionId}:
 *   get:
 *     summary: Descargar una version especifica del archivo
 *     description: >
 *       Retorna el contenido binario de la version identificada por su numero de version.
 *       Permite recuperar versiones anteriores del archivo.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de MongoDB del archivo
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numero de version (entero, comenzando en 1)
 *         example: 1
 *     responses:
 *       200:
 *         description: Contenido binario de la version solicitada
 *         headers:
 *           Content-Type:
 *             schema:
 *               type: string
 *             example: application/pdf
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             example: attachment; filename="documento.pdf"
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: id invalido
 *       401:
 *         description: Token JWT ausente o invalido
 *       404:
 *         description: Archivo o version no encontrada
 *       500:
 *         description: Error al leer desde el adaptador de almacenamiento
 */
router.get('/:id/versions/:versionId', filesController.downloadVersion);

/**
 * @swagger
 * /api/files/{id}/move:
 *   put:
 *     summary: Mover archivo a otro adaptador de almacenamiento
 *     description: >
 *       Mueve la version actual del archivo a un adaptador de almacenamiento diferente.
 *       La operacion es atomica: lee el archivo origen, lo escribe en el destino y elimina
 *       el origen. Los metadatos en MongoDB se actualizan con la nueva ubicacion.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de MongoDB del archivo
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetStorageType, targetPath]
 *             properties:
 *               targetStorageType:
 *                 type: string
 *                 enum: [LOCAL, NETWORK, CLOUD]
 *                 description: Adaptador de almacenamiento destino
 *                 example: NETWORK
 *               targetPath:
 *                 type: string
 *                 description: Ruta relativa dentro del adaptador destino
 *                 example: shared/documentos/documento.pdf
 *           example:
 *             targetStorageType: NETWORK
 *             targetPath: shared/documentos/documento.pdf
 *     responses:
 *       200:
 *         description: Archivo movido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Archivo movido exitosamente
 *                 location:
 *                   type: string
 *                   description: Ruta fisica completa en el destino
 *                   example: /mnt/network/shared/documentos/documento.pdf
 *       400:
 *         description: targetStorageType o targetPath faltantes
 *       401:
 *         description: Token JWT ausente o invalido
 *       404:
 *         description: Archivo no encontrado o eliminado
 *       500:
 *         description: Error de lectura en origen o escritura en destino
 */
router.put('/:id/move', filesController.moveFile);

/**
 * @swagger
 * /api/files/{id}/copy:
 *   post:
 *     summary: Copiar archivo a otro adaptador de almacenamiento
 *     description: >
 *       Copia la version actual del archivo a un adaptador de almacenamiento (mismo o diferente).
 *       Crea un nuevo registro File independiente en MongoDB para la copia.
 *       El archivo original no es modificado.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de MongoDB del archivo origen
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetStorageType, targetPath]
 *             properties:
 *               targetStorageType:
 *                 type: string
 *                 enum: [LOCAL, NETWORK, CLOUD]
 *                 description: Adaptador destino para la copia
 *                 example: LOCAL
 *               targetPath:
 *                 type: string
 *                 description: Ruta relativa en el adaptador destino
 *                 example: backups/documento-backup.pdf
 *               newName:
 *                 type: string
 *                 description: Nombre para el registro de la copia (default "Copy of <nombre>")
 *                 example: documento-backup.pdf
 *           example:
 *             targetStorageType: LOCAL
 *             targetPath: backups/documento-backup.pdf
 *             newName: documento-backup.pdf
 *     responses:
 *       200:
 *         description: Archivo copiado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: ObjectId del nuevo registro File creado para la copia
 *                   example: 64f1a2b3c4d5e6f7a8b9c0d9
 *                 message:
 *                   type: string
 *                   example: Archivo copiado exitosamente
 *       400:
 *         description: Parametros incompletos
 *       401:
 *         description: Token JWT ausente o invalido
 *       404:
 *         description: Archivo origen no encontrado o eliminado
 *       500:
 *         description: Error al leer el origen o escribir el destino
 */
router.post('/:id/copy', filesController.copyFile);

module.exports = router;
