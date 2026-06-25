const mongoose = require('mongoose');
const { User, Task, Role } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex, wantsPagination, parsePageParams, paginated } = require('../utils/pagination');

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

// GET /users  (admin) — liste, filtrable par ?role= et recherche ?q= (nom/email).
// Pagination opt-in : avec ?page= renvoie une enveloppe { items, total, … } ;
// sans ?page= renvoie le tableau complet (utilisé par les sélecteurs de membres).
const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q && req.query.q.trim()) {
    const rx = new RegExp(escapeRegex(req.query.q.trim()), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  if (wantsPagination(req)) {
    const { page, pageSize, skip } = parsePageParams(req, { defaultLimit: 8 });
    const [items, total] = await Promise.all([
      User.find(filter).sort({ name: 1 }).skip(skip).limit(pageSize),
      User.countDocuments(filter),
    ]);
    return res.json(paginated(items, total, page, pageSize));
  }

  const users = await User.find(filter).sort({ name: 1 });
  res.json(users);
});

// POST /users  (admin) — création d'un utilisateur avec rôle et capacité.
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, dailyCapacityHours, workingDays } = req.body;

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
  });
  await user.save();
  res.status(201).json(user);
});

// PATCH /users/:id  (admin) — capacité, jours travaillés, rôle, nom.
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Utilisateur introuvable.');

  const { dailyCapacityHours, workingDays, role, name } = req.body;
  await assertRoleExists(role);
  if (dailyCapacityHours !== undefined) user.dailyCapacityHours = dailyCapacityHours;
  if (workingDays !== undefined) user.workingDays = workingDays;
  if (role !== undefined) user.role = role;
  if (name !== undefined) user.name = name;

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

// GET /users/workload  (manager/admin) — heures réellement saisies par membre.
// Somme du journal de temps (timeLogs) de toutes les tâches, groupée par auteur de saisie.
// Paramètre optionnel ?project= pour limiter à un projet.
const getWorkload = asyncHandler(async (req, res) => {
  const match = {};
  if (req.query.project) match.project = new mongoose.Types.ObjectId(req.query.project);

  const rows = await Task.aggregate([
    { $match: match },
    { $unwind: '$timeLogs' },
    {
      $group: {
        _id: '$timeLogs.user',
        loggedHours: { $sum: '$timeLogs.hours' },
        tasks: { $addToSet: '$_id' },
      },
    },
    { $project: { loggedHours: 1, taskCount: { $size: '$tasks' } } },
  ]);
  res.json(rows.map((r) => ({ user: String(r._id), loggedHours: r.loggedHours, taskCount: r.taskCount })));
});

module.exports = { getMe, listUsers, updateUser, getWorkload, createUser, resetPassword };
