const File = require('../domain/file.model');
const storage = require('../infrastructure/storage/local.storage');

class FileService {
  async uploadFile(file) {
    // Guardar archivo físico
    const filePath = storage.saveFile(file.filename, file.buffer);
    // Crear registro en DB
    const newFile = new File({
      originalName: file.originalname,
      currentVersion: 1,
      versions: [{
        version: 1,
        filename: file.filename,
        path: filePath,
      }],
    });
    await newFile.save();
    return newFile;
  }

  async listFiles() {
    return File.find({ deleted: false });
  }

  async getFileById(id) {
    return File.findById(id);
  }

  async listVersions(id) {
    const file = await File.findById(id);
    return file ? file.versions : null;
  }

  async addVersion(id, file) {
    const fileDoc = await File.findById(id);
    if (!fileDoc) return null;
    const newVersion = fileDoc.currentVersion + 1;
    const filePath = storage.saveFile(file.filename, file.buffer);
    fileDoc.versions.push({
      version: newVersion,
      filename: file.filename,
      path: filePath,
    });
    fileDoc.currentVersion = newVersion;
    await fileDoc.save();
    return fileDoc;
  }

  async deleteFile(id) {
    const file = await File.findById(id);
    if (!file) return false;
    file.deleted = true;
    await file.save();
    return true;
  }
}

module.exports = new FileService();
