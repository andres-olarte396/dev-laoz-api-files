const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();

// Controladores (a implementar)
const filesController = require('../controllers/files.controller');

router.post('/', upload.single('file'), filesController.uploadFile);
router.get('/:id', filesController.downloadFile);
router.get('/:id/versions', filesController.listVersions);
router.get('/:id/versions/:versionId', filesController.downloadVersion);
// Nuevas rutas de gestión de almacenamiento
router.put('/:id/move', filesController.moveFile);
router.post('/:id/copy', filesController.copyFile);

module.exports = router;
