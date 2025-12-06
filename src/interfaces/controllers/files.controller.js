const mongoose = require('mongoose');
const path = require('path');
const File = require('../../domain/file.model');
const storageManager = require('../../infrastructure/storage/StorageManager');

// Helper para generar nombres únicos
const makeStoredName = (orig) => {
  const base = path.basename(orig || 'file');
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${Date.now()}-${safe}`;
};

module.exports = {
  uploadFile: async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No se adjuntó ningún archivo' });
    }

    try {
      const storageType = req.body.storageType || 'LOCAL';
      const adapter = storageManager.getAdapter(storageType);

      const storedName = makeStoredName(req.file.originalname);
      // Por defecto subimos a carpeta raíz del adapter (o 'uploads' si queremos organizar)
      const relativePath = storedName;

      const savedMeta = await adapter.save(relativePath, req.file.buffer);

      let fileDoc = await File.findOne({ originalName: req.file.originalname, deleted: false });

      const newVersionData = {
        version: fileDoc ? fileDoc.currentVersion + 1 : 1,
        storageType: storageType,
        basePath: savedMeta.basePath,
        relativePath: savedMeta.relativePath,
        fullPath: savedMeta.fullPath,
        filename: storedName,
        mimeType: req.file.mimetype,
        size: req.file.size
      };

      if (!fileDoc) {
        fileDoc = new File({
          originalName: req.file.originalname,
          currentVersion: 1,
          versions: [newVersionData],
        });
      } else {
        fileDoc.versions.push(newVersionData);
        fileDoc.currentVersion = newVersionData.version;
        fileDoc.updatedAt = Date.now();
      }

      await fileDoc.save();
      res.status(201).json({
        id: fileDoc._id,
        message: fileDoc.versions.length === 1 ? 'Archivo subido' : 'Nueva versión agregada',
        version: fileDoc.currentVersion
      });

    } catch (err) {
      console.error('Error al subir archivo:', err);
      res.status(500).json({ error: 'Error al subir archivo' });
    }
  },

  downloadFile: async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'ID inválido' });

    try {
      const file = await File.findById(id);
      if (!file || file.deleted) return res.status(404).json({ error: 'Archivo no encontrado' });

      const version = file.currentVersionData || file.versions[file.versions.length - 1]; // Fallback

      // Obtener adapter correcto
      const adapter = storageManager.getAdapter(version.storageType || 'LOCAL');

      // Stream
      const stream = await adapter.getStream(version.relativePath);

      res.setHeader('Content-Type', version.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      stream.pipe(res);

    } catch (err) {
      console.error('Error al descargar:', err);
      res.status(500).json({ error: 'Error al procesar descarga' });
    }
  },

  moveFile: async (req, res) => {
    const { id } = req.params;
    const { targetStorageType, targetPath } = req.body; // targetPath relativo al nuevo storage

    if (!targetStorageType || !targetPath) {
      return res.status(400).json({ error: 'Se requiere targetStorageType y targetPath' });
    }

    try {
      const file = await File.findById(id);
      if (!file || file.deleted) return res.status(404).json({ error: 'Archivo no encontrado' });

      const version = file.currentVersionData;

      // Mover físicamente
      const result = await storageManager.moveFile(
        version.storageType || 'LOCAL',
        version.relativePath,
        targetStorageType,
        targetPath
      );

      // Actualizar referencia en DB
      version.storageType = targetStorageType;
      version.basePath = result.basePath;
      version.relativePath = result.relativePath;
      version.fullPath = result.fullPath;

      // Mongo array update needs verify
      await file.save();

      res.json({ message: 'Archivo movido exitosamente', location: result.fullPath });
    } catch (err) {
      console.error('Error moving file:', err);
      res.status(500).json({ error: err.message });
    }
  },

  copyFile: async (req, res) => {
    const { id } = req.params;
    const { targetStorageType, targetPath, newName } = req.body;

    if (!targetStorageType || !targetPath) return res.status(400).json({ error: 'Parámetros incompletos' });

    try {
      const sourceFile = await File.findById(id);
      if (!sourceFile || sourceFile.deleted) return res.status(404).json({ error: 'Archivo origen no encontrado' });

      const version = sourceFile.currentVersionData;

      // Leer origen
      const sourceAdapter = storageManager.getAdapter(version.storageType || 'LOCAL');
      const readStream = await sourceAdapter.getStream(version.relativePath);

      // Escribir destino
      const targetAdapter = storageManager.getAdapter(targetStorageType);
      const meta = await targetAdapter.save(targetPath, readStream);

      // Crear nuevo registro de archivo
      const newFile = new File({
        originalName: newName || `Copy of ${sourceFile.originalName}`,
        versions: [{
          version: 1,
          storageType: targetStorageType,
          basePath: meta.basePath,
          relativePath: meta.relativePath,
          fullPath: meta.fullPath,
          filename: path.basename(meta.relativePath),
          mimeType: version.mimeType,
          size: meta.size
        }]
      });

      await newFile.save();
      res.json({ id: newFile._id, message: 'Archivo copiado exitosamente' });

    } catch (err) {
      console.error('Error copying file:', err);
      res.status(500).json({ error: err.message });
    }
  },

  listVersions: async (req, res) => {
    // Implementación similar a la original pero devolviendo info de storage
    const { id } = req.params;
    const file = await File.findById(id);
    if (!file) return res.status(404).json({ error: 'No encontrado' });
    res.json(file.versions);
  },

  deleteFile: async (req, res) => {
    // Soft delete no borra físico por seguridad inmediata, o sí?
    // Mantenemos soft delete
    const { id } = req.params;
    await File.findByIdAndUpdate(id, { deleted: true });
    res.status(204).send();
  }
};
