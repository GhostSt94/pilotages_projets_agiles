const { Role, User } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { PERMISSIONS } = require('../config/permissions');
const { invalidateRolesCache } = require('../services/roleService');

// GET /roles — liste des rôles (avec nb d'utilisateurs). Tout utilisateur authentifié.
const listRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().sort({ isSystem: -1, label: 1 });
  const counts = await User.aggregate([{ $group: { _id: '$role', n: { $sum: 1 } } }]);
  const byName = Object.fromEntries(counts.map((c) => [c._id, c.n]));
  res.json(roles.map((r) => ({ ...r.toJSON(), userCount: byName[r.name] || 0 })));
});

// GET /roles/permissions — catalogue des permissions disponibles.
const listPermissions = asyncHandler(async (req, res) => {
  res.json(PERMISSIONS);
});

// POST /roles  (role.manage)
const createRole = asyncHandler(async (req, res) => {
  const { name, label, color, description, permissions } = req.body;
  const slug = String(name).toLowerCase().trim();
  if (await Role.findOne({ name: slug })) throw ApiError.conflict('Un rôle porte déjà ce nom.');

  const role = await Role.create({ name: slug, label, color, description, permissions: permissions || [], isSystem: false });
  invalidateRolesCache();
  res.status(201).json(role);
});

// PATCH /roles/:id  (role.manage) — label/couleur/description/permissions (name figé).
const updateRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound('Rôle introuvable.');

  const { label, color, description, permissions } = req.body;
  if (label !== undefined) role.label = label;
  if (color !== undefined) role.color = color;
  if (description !== undefined) role.description = description;
  if (permissions !== undefined) role.permissions = permissions;

  await role.save();
  invalidateRolesCache();
  res.json(role);
});

// DELETE /roles/:id  (role.manage) — rôle non système et non utilisé uniquement.
const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound('Rôle introuvable.');
  if (role.isSystem) throw ApiError.badRequest('Les rôles système ne peuvent pas être supprimés.');

  const inUse = await User.countDocuments({ role: role.name });
  if (inUse > 0) throw ApiError.conflict(`Ce rôle est attribué à ${inUse} utilisateur(s). Réassignez-les d'abord.`);

  await role.deleteOne();
  invalidateRolesCache();
  res.json({ deleted: true, id: role._id });
});

module.exports = { listRoles, listPermissions, createRole, updateRole, deleteRole };
