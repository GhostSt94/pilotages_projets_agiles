const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { permissionsForUser } = require('../services/roleService');

// Vérifie le jeton JWT (header Authorization: Bearer <token>) et charge l'utilisateur.
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Jeton manquant ou mal formé.');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    throw ApiError.unauthorized('Jeton invalide ou expiré.');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw ApiError.unauthorized('Utilisateur introuvable.');
  }

  req.user = user;
  // Permissions effectives (selon le rôle dynamique courant).
  req.permissions = await permissionsForUser(user);
  next();
});

module.exports = { authenticate };
