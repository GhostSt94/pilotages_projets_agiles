const mongoose = require('mongoose');
const env = require('./env');

// Connexion à MongoDB via Mongoose. Lève une erreur fatale si la connexion échoue.
async function connectDB() {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(env.mongoUri);
    // eslint-disable-next-line no-console
    console.log(`[db] Connecté à MongoDB (${mongoose.connection.name})`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[db] Échec de connexion à MongoDB :', err.message);
    throw err;
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
