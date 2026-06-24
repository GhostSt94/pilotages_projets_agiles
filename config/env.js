// Chargement et validation centralisés des variables d'environnement.
require('dotenv').config();

const env = {
  port: parseInt(process.env.PORT, 10) || 4000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cadence',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  nodeEnv: process.env.NODE_ENV || 'development',
};

if (env.nodeEnv === 'production' && env.jwtSecret === 'change-me-in-production') {
  // eslint-disable-next-line no-console
  console.warn('[env] ATTENTION : JWT_SECRET utilise la valeur par défaut en production.');
}

module.exports = env;
