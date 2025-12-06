const request = require('supertest');
const app = require('../src/interfaces/app');

describe('File API Endpoints', () => {
  describe('POST /files', () => {
    it('debe subir un archivo correctamente', async () => {
      // Aquí se debe simular la subida de un archivo
      // Por ahora solo se prueba el status
      const res = await request(app)
        .post('/files')
        .attach('file', Buffer.from('contenido de prueba'), 'test.txt');
      expect(res.statusCode).toBe(201);
    });
  });

  describe('GET /files/:id', () => {
    it('debe devolver 404 si el archivo no existe', async () => {
      const res = await request(app).get('/files/archivo-inexistente');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /files/:id/versions', () => {
    it('debe devolver 404 si el archivo no existe', async () => {
      const res = await request(app).get('/files/archivo-inexistente/versions');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /files/:id/versions/:versionId', () => {
    it('debe devolver 404 si la versión no existe', async () => {
      const res = await request(app).get('/files/archivo-inexistente/versions/version-inexistente');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /files/:id', () => {
    it('debe devolver 404 si el archivo no existe', async () => {
      const res = await request(app).delete('/files/archivo-inexistente');
      expect(res.statusCode).toBe(404);
    });
  });
});
