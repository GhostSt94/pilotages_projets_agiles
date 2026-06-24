const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// À placer après une chaîne de règles express-validator : agrège les erreurs.
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));
  return next(ApiError.badRequest('Données de requête invalides.', details));
}

module.exports = { validate };
