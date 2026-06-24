const ApiError = require('../utils/ApiError');
const env = require('../config/env');

// Route inexistante.
function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route inconnue : ${req.method} ${req.originalUrl}`));
}

// Middleware d'erreurs centralisé (toujours en dernier).
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erreur interne du serveur';
  let details = err.details;

  // Erreurs de validation Mongoose.
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation du modèle échouée.';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }

  // Identifiant Mongo mal formé.
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Identifiant invalide pour le champ « ${err.path} ».`;
  }

  // Erreurs d'upload Multer (ex. fichier trop volumineux).
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Image trop volumineuse (5 Mo maximum).' : `Upload impossible : ${err.message}.`;
  }

  // Violation d'unicité (ex. email ou clé projet déjà pris).
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'champ';
    message = `Valeur déjà utilisée pour « ${field} ».`;
  }

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  const body = { error: message };
  if (details) body.details = details;
  if (env.nodeEnv !== 'production' && statusCode >= 500) body.stack = err.stack;

  res.status(statusCode).json(body);
}

module.exports = { notFoundHandler, errorHandler };
