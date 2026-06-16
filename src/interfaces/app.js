const express = require('express');
const path = require('path');
const cors = require('cors');
const { logger, rateLimitMiddleware, authMiddleware } = require('@dev-laoz/core');

const filesRouter = require('./routes/files.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(rateLimitMiddleware);

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
      logger.error(`Error sending file ${fullPath}`, err.stack);
      if (!res.headersSent) res.status(err.status || 404).send('File not found');
    }
  });
});

app.use('/api/files', authMiddleware, filesRouter);

// Swagger docs if available
try {
  const swagger = require('./swagger');
  swagger(app);
} catch (e) {
  console.warn('Swagger docs could not be loaded:', e.message);
}

app.use((err, req, res, next) => {
  logger.error('Unhandled error in api-files', err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

module.exports = app;
