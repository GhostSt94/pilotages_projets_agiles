// Erreur applicative portant un code HTTP, traitée par le middleware d'erreurs.
class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(msg, details) {
    return new ApiError(400, msg || 'Requête invalide', details);
  }

  static unauthorized(msg) {
    return new ApiError(401, msg || 'Authentification requise');
  }

  static forbidden(msg) {
    return new ApiError(403, msg || 'Accès refusé');
  }

  static notFound(msg) {
    return new ApiError(404, msg || 'Ressource introuvable');
  }

  static conflict(msg) {
    return new ApiError(409, msg || 'Conflit');
  }
}

module.exports = ApiError;
