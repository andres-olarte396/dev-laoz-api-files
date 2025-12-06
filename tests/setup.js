jest.setTimeout(20000);
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/infrastructure/database');

beforeEach(async () => {
  try {
    const File = require('../src/domain/file.model');
    await File.deleteMany({});
  } catch (err) {
    // Ignorar si la colección no existe aún
  }
});

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});
