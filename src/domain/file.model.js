const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  version: { type: Number, required: true },
  storageType: { type: String, enum: ['LOCAL', 'NETWORK', 'CLOUD'], default: 'LOCAL' },
  basePath: { type: String }, // Contexto del adapter
  relativePath: { type: String, required: true }, // Ruta dentro del adapter
  fullPath: { type: String }, // Ruta absoluta física (si aplica)
  filename: { type: String, required: true },
  mimeType: { type: String },
  size: { type: Number },
  uploadedAt: { type: Date, default: Date.now },
});

const fileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  currentVersion: { type: Number, default: 1 },
  versions: [versionSchema],
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
});

// Virtual helper para obtener la versión actual
fileSchema.virtual('currentVersionData').get(function () {
  return this.versions.find(v => v.version === this.currentVersion);
});

module.exports = mongoose.model('File', fileSchema);
