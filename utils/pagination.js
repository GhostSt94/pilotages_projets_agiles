// Outils de pagination/recherche côté serveur (opt-in).

// Échappe les caractères spéciaux d'une recherche utilisateur pour un usage en RegExp.
function escapeRegex(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Vrai si la requête demande une pagination serveur (présence de ?page).
function wantsPagination(req) {
  return req.query.page !== undefined;
}

// Normalise page/limit depuis la query (1-indexé, bornes saines).
function parsePageParams(req, { defaultLimit = 8, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit, 10) || defaultLimit));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

// Enveloppe paginée standard.
function paginated(items, total, page, pageSize) {
  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

module.exports = { escapeRegex, wantsPagination, parsePageParams, paginated };
