const mongoose = require('mongoose');
let mongoServer = null;

const connectDB = async () => {
  try {
    if (process.env.NODE_ENV === 'test') {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log('Conectado a MongoDB en memoria para tests');
    } else {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fileapi');
      console.log('Conectado a MongoDB');
    }
  } catch (err) {
    console.error('Error conectando a MongoDB:', err.message);
    throw err;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null;
    }
  } catch (err) {
    // no-op
  }
};

module.exports = { connectDB, disconnectDB };
