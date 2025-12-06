const request = require('supertest');
const app = require('../src/interfaces/app');

describe('File API - Validaciones y errores', () => {
  describe('POST /files', () => {
    it('debe rechazar la subida si no se adjunta archivo', async () => {
      const res = await request(app).post('/files');
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /files/:id', () => {
    it('debe devolver 400 si el id no es válido', async () => {
      const res = await request(app).get('/files/!@#');
      expect(res.statusCode).toBe(400);
    });
  });
});

describe('File API - Versionado', () => {
  it('debe crear una nueva versión al subir un archivo con el mismo nombre', async () => {
    // Simulación básica, requiere implementación real
    const fileBuffer = Buffer.from('contenido v1');
    const res1 = await request(app)
      .post('/files')
      .attach('file', fileBuffer, 'versionado.txt');
    expect(res1.statusCode).toBe(201);

    const fileBuffer2 = Buffer.from('contenido v2');
    const res2 = await request(app)
      .post('/files')
      .attach('file', fileBuffer2, 'versionado.txt');
    expect(res2.statusCode).toBe(201);

    // Listar versiones
    const id = res1.body.id || 'id-mock';
    const resVersions = await request(app).get(`/files/${id}/versions`);
    expect(resVersions.statusCode).toBe(200);
    expect(Array.isArray(resVersions.body)).toBe(true);
  });
});

describe('File API - Eliminación', () => {
  it('debe eliminar un archivo existente', async () => {
    // Simulación básica, requiere implementación real
    const fileBuffer = Buffer.from('contenido para eliminar');
    const res = await request(app)
      .post('/files')
      .attach('file', fileBuffer, 'eliminar.txt');
    expect(res.statusCode).toBe(201);
    const id = res.body.id || 'id-mock';
    const delRes = await request(app).delete(`/files/${id}`);
    expect([200, 204]).toContain(delRes.statusCode);
  });
});

describe('File API - Seguridad', () => {
  it('no debe permitir acceso a archivos de otros usuarios (mock)', async () => {
    // Simulación básica, requiere implementación de autenticación
    const res = await request(app)
      .get('/files/archivo-de-otro-usuario')
      .set('Authorization', 'Bearer token-invalido');
    expect([401, 403, 404]).toContain(res.statusCode);
  });
});
