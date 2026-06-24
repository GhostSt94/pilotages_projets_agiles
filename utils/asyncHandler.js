// Enrobe un handler async pour propager les rejets vers le middleware d'erreurs.
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
