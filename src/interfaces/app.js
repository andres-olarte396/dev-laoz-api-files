const express = require('express');
const filesRouter = require('./routes/files.routes');

const app = express();
const path = require('path');
const cors = require('cors');

app.use(cors());
app.use(express.json());

// Serve static micro-frontend
app.use('/ui', express.static(path.join(__dirname, '../../public')));
// Serving aggregated docs content via API Files as requested
app.use('/api/docs-content', express.static(path.join(__dirname, '../../../dev-laoz-markdown-project/public/content')));

// New endpoint: Serve files manually to ensure correct path resolution
const staticPath = path.join(__dirname, '../../../dev-laoz-markdown-project/public/content');

// Middleware (safer than regex route in Express 5)
app.use('/api/file', (req, res) => {
  const relativePath = req.path; // e.g. /dev-laoz-api-gateway/README.md
  // Remove leading slash if present for join
  const cleanRelPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  const fullPath = path.join(staticPath, cleanRelPath);

  // Security check to prevent directory traversal out of staticPath
  if (!fullPath.startsWith(staticPath)) {
    return res.status(403).send('Forbidden');
  }

  res.sendFile(fullPath, (err) => {
    if (err) {
      console.error(`Error sending file ${fullPath}:`, err);
      if (!res.headersSent) res.status(err.status || 404).send('File not found');
    }
  });
});

app.use('/api/files', filesRouter);

// Swagger docs if available
try {
  const swagger = require('./swagger');
  swagger(app);
} catch (e) {
  console.warn('Swagger docs could not be loaded:', e.message);
}

// Manejo de errores global
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

module.exports = app;
