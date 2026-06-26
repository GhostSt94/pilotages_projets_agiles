const { Status, Project, Task } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { canManageProject, canAccessProject } = require('../utils/authz');
const { getProjectStatuses, slugify, toMeta } = require('../services/statusService');

// Charge le projet et contrôle l'accès en lecture.
async function loadProjectForRead(req) {
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound('Projet introuvable.');
  if (!canAccessProject(req, project)) throw ApiError.forbidden('Vous n\'êtes pas membre de ce projet.');
  return project;
}

// Charge le projet et contrôle le droit de gestion (admin global ou manager du projet).
async function loadProjectForManage(req) {
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound('Projet introuvable.');
  if (!canManageProject(req, project)) throw ApiError.forbidden('Vous ne gérez pas ce projet.');
  return project;
}

// GET /projects/:id/statuses
const listStatuses = asyncHandler(async (req, res) => {
  await loadProjectForRead(req);
  const statuses = await getProjectStatuses(req.params.id);
  res.json(statuses.map(toMeta));
});

// POST /projects/:id/statuses — { label, color?, isDone? }
const createStatus = asyncHandler(async (req, res) => {
  const project = await loadProjectForManage(req);
  const { label, color, isDone } = req.body;

  // Clé unique par projet (slug du libellé, suffixé si collision).
  const base = slugify(label);
  let key = base;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Status.findOne({ project: project._id, key })) {
    n += 1;
    key = `${base}_${n}`;
  }

  const last = await Status.findOne({ project: project._id }).sort({ order: -1 }).select('order');
  const order = (last?.order ?? -1) + 1;

  const status = await Status.create({
    project: project._id, key, label, color: color || 'slate', isDone: !!isDone, order,
  });
  res.status(201).json(toMeta(status));
});

// PATCH /projects/:id/statuses/:statusId — { label?, color?, isDone? } (clé immuable)
const updateStatus = asyncHandler(async (req, res) => {
  const project = await loadProjectForManage(req);
  const status = await Status.findOne({ _id: req.params.statusId, project: project._id });
  if (!status) throw ApiError.notFound('Statut introuvable.');

  const { label, color, isDone } = req.body;
  if (label !== undefined) status.label = label;
  if (color !== undefined) status.color = color;
  if (isDone !== undefined) status.isDone = !!isDone;
  await status.save();
  res.json(toMeta(status));
});

// PATCH /projects/:id/statuses/reorder — { order: [statusId, …] }
const reorderStatuses = asyncHandler(async (req, res) => {
  const project = await loadProjectForManage(req);
  const { order } = req.body;
  if (!Array.isArray(order)) throw ApiError.badRequest('order doit être un tableau d\'identifiants.');

  await Promise.all(
    order.map((id, i) => Status.updateOne({ _id: id, project: project._id }, { $set: { order: i } }))
  );
  const statuses = await getProjectStatuses(project._id);
  res.json(statuses.map(toMeta));
});

// DELETE /projects/:id/statuses/:statusId — réassigne les tâches au 1er statut restant.
const deleteStatus = asyncHandler(async (req, res) => {
  const project = await loadProjectForManage(req);
  const status = await Status.findOne({ _id: req.params.statusId, project: project._id });
  if (!status) throw ApiError.notFound('Statut introuvable.');

  const total = await Status.countDocuments({ project: project._id });
  if (total <= 1) throw ApiError.badRequest('Impossible de supprimer le dernier statut du projet.');

  // Statut de repli : le premier restant (ordre le plus bas).
  const fallback = await Status.findOne({ project: project._id, _id: { $ne: status._id } }).sort({ order: 1 });
  const moved = await Task.updateMany(
    { project: project._id, status: status.key },
    { $set: { status: fallback.key } }
  );

  await status.deleteOne();
  res.json({ deleted: true, id: status._id, movedTasks: moved.modifiedCount || 0, fallback: fallback.key });
});

module.exports = { listStatuses, createStatus, updateStatus, reorderStatuses, deleteStatus };
