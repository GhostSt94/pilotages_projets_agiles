const ApiError = require('../utils/ApiError');

// Restreint l'accès aux rôles indiqués. Ex. : requireRole('manager', 'admin').
function requireRole(...roles) {
  return function check(req, res, next) {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Rôle requis : ${roles.join(' ou ')}.`));
    }
    return next();
  };
}

// Restreint l'accès aux porteurs d'au moins une des permissions indiquées.
function requirePermission(...perms) {
  return function check(req, res, next) {
    if (!req.user) return next(ApiError.unauthorized());
    const granted = req.permissions || [];
    if (!perms.some((p) => granted.includes(p))) {
      return next(ApiError.forbidden('Permission insuffisante.'));
    }
    return next();
  };
}

module.exports = { requireRole, requirePermission };
