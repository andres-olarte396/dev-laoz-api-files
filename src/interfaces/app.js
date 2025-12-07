const express = require('express');
const filesRouter = require('./routes/files.routes');

const app = express();
const path = require('path');
app.use(express.json());

// Serve static micro-frontend
app.use('/ui', express.static(path.join(__dirname, '../../public')));

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
