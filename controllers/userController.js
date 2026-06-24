const mongoose = require('mongoose');
const { User, Task, Role } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Vérifie qu'un nom de rôle existe (validation applicative, rôles dynamiques).
async function assertRoleExists(role) {
  if (role === undefined) return;
  const exists = await Role.findOne({ name: role });
  if (!exists) throw ApiError.badRequest(`Rôle inconnu : « ${role} ».`);
}

// GET /users/me — profil courant + permissions effectives.
const getMe = asyncHandler(async (req, res) => {
  res.json({ ...req.user.toJSON(), permissions: req.permissions || [] });
});

// GET /users  (admin) — liste, filtrable par ?role=
const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  const users = await User.find(filter).sort({ name: 1 });
  res.json(users);
});

// POST /users  (admin) — création d'un utilisateur avec rôle et capacité.
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, dailyCapacityHours, workingDays, team } = req.body;

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw ApiError.conflict('Un compte existe déjà avec cet email.');
  await assertRoleExists(role);

  const user = new User({
    name,
    email,
    role: role || 'developer',
    password, // virtuel -> hash (hook pre-validate)
    ...(dailyCapacityHours !== undefined ? { dailyCapacityHours } : {}),
    ...(workingDays !== undefined ? { workingDays } : {}),
    ...(team !== undefined ? { team } : {}),
  });
  await user.save();
  res.status(201).json(user);
});

// PATCH /users/:id  (admin) — capacité, jours travaillés, rôle, équipe.
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Utilisateur introuvable.');

  const { dailyCapacityHours, workingDays, role, name, team } = req.body;
  await assertRoleExists(role);
  if (dailyCapacityHours !== undefined) user.dailyCapacityHours = dailyCapacityHours;
  if (workingDays !== undefined) user.workingDays = workingDays;
  if (role !== undefined) user.role = role;
  if (name !== undefined) user.name = name;
  if (team !== undefined) user.team = team;

  await user.save();
  res.json(user);
});

// PATCH /users/:id/password  (user.manage) — réinitialise le mot de passe.
const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Utilisateur introuvable.');
  user.password = req.body.password; // virtuel -> hash (hook pre-validate)
  await user.save();
  res.json({ ok: true });
});

// GET /users/workload  (manager/admin) — heures réalisées par membre.
// L'app n'a pas de suivi du temps réel : on somme les `estimate` des tâches « done ».
// Paramètre optionnel ?project= pour limiter à un projet.
const getWorkload = asyncHandler(async (req, res) => {
  const match = { status: 'done', assignee: { $ne: null } };
  if (req.query.project) match.project = new mongoose.Types.ObjectId(req.query.project);

  const rows = await Task.aggregate([
    { $match: match },
    { $group: { _id: '$assignee', doneHours: { $sum: '$estimate' }, doneTasks: { $sum: 1 } } },
  ]);
  res.json(rows.map((r) => ({ user: String(r._id), doneHours: r.doneHours, doneTasks: r.doneTasks })));
});

module.exports = { getMe, listUsers, updateUser, getWorkload, createUser, resetPassword };
