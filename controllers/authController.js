const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { permissionsForUser } = require('../services/roleService');

function signToken(user) {
  return jwt.sign({ sub: user._id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

// Sérialise l'utilisateur avec ses permissions effectives.
async function userResponse(user) {
  const permissions = await permissionsForUser(user);
  return { ...user.toJSON(), permissions };
}

// POST /auth/register
// Inscription publique : crée toujours un compte « developer ».
// La promotion en manager/admin se fait via PATCH /users/:id (admin) ou le seed.
const register = asyncHandler(async (req, res) => {
  const { name, email, password, dailyCapacityHours, workingDays } = req.body;

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw ApiError.conflict('Un compte existe déjà avec cet email.');

  const user = new User({
    name,
    email,
    role: 'developer',
    password, // virtuel -> hash
    ...(dailyCapacityHours !== undefined ? { dailyCapacityHours } : {}),
    ...(workingDays !== undefined ? { workingDays } : {}),
  });
  await user.save();

  const token = signToken(user);
  res.status(201).json({ user: await userResponse(user), token });
});

// POST /auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Email ou mot de passe incorrect.');

  const ok = await user.comparePassword(password);
  if (!ok) throw ApiError.unauthorized('Email ou mot de passe incorrect.');

  const token = signToken(user);
  res.json({ user: await userResponse(user), token });
});

module.exports = { register, login };
