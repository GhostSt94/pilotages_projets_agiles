const { Sprint, Project, Task } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { computeSprintCapacity } = require('../services/capacityService');
const { canManageProject, canAccessProject } = require('../utils/authz');

// Charge un sprint et son projet (pour les contrôles d'accès scopés).
async function loadSprintWithProject(sprintId) {
  const sprint = await Sprint.findById(sprintId);
  if (!sprint) throw ApiError.notFound('Sprint introuvable.');
  const project = await Project.findById(sprint.project);
  if (!project) throw ApiError.notFound('Projet du sprint introuvable.');
  return { sprint, project };
}

// POST /sprints  (manager/admin)
const createSprint = asyncHandler(async (req, res) => {
  const { project, name, goal, startDate, endDate } = req.body;

  const proj = await Project.findById(project);
  if (!proj) throw ApiError.notFound('Projet introuvable.');
  if (!canManageProject(req, proj)) throw ApiError.forbidden('Vous ne gérez pas ce projet.');

  if (new Date(endDate) < new Date(startDate)) {
    throw ApiError.badRequest('La date de fin doit être postérieure à la date de début.');
  }

  const sprint = await Sprint.create({
    project,
    name,
    goal,
    startDate,
    endDate,
    status: 'planned',
  });
  res.status(201).json(sprint);
});

// GET /projects/:id/sprints
const listProjectSprints = asyncHandler(async (req, res) => {
  const proj = await Project.findById(req.params.id);
  if (!proj) throw ApiError.notFound('Projet introuvable.');
  if (!canAccessProject(req, proj)) throw ApiError.forbidden('Vous n\'êtes pas membre de ce projet.');

  const sprints = await Sprint.find({ project: req.params.id }).sort({ startDate: -1 });
  res.json(sprints);
});

// GET /sprints/:id
const getSprint = asyncHandler(async (req, res) => {
  const { sprint, project } = await loadSprintWithProject(req.params.id);
  if (!canAccessProject(req, project)) throw ApiError.forbidden('Vous n\'êtes pas membre de ce projet.');
  await sprint.populate('project', 'name key');
  res.json(sprint);
});

// PATCH /sprints/:id/start  (manager/admin) — planned -> active (un seul actif/projet).
const startSprint = asyncHandler(async (req, res) => {
  const { sprint, project } = await loadSprintWithProject(req.params.id);
  if (!canManageProject(req, project)) throw ApiError.forbidden('Vous ne gérez pas ce projet.');

  if (sprint.status !== 'planned') {
    throw ApiError.badRequest(`Seul un sprint « planned » peut démarrer (statut actuel : ${sprint.status}).`);
  }

  const alreadyActive = await Sprint.findOne({ project: sprint.project, status: 'active' });
  if (alreadyActive) {
    throw ApiError.conflict('Un sprint est déjà actif pour ce projet. Clôturez-le d\'abord.');
  }

  sprint.status = 'active';
  await sprint.save();
  res.json(sprint);
});

// PATCH /sprints/:id/complete  (manager/admin) — active -> completed.
const completeSprint = asyncHandler(async (req, res) => {
  const { sprint, project } = await loadSprintWithProject(req.params.id);
  if (!canManageProject(req, project)) throw ApiError.forbidden('Vous ne gérez pas ce projet.');

  if (sprint.status !== 'active') {
    throw ApiError.badRequest(`Seul un sprint « active » peut être clôturé (statut actuel : ${sprint.status}).`);
  }

  sprint.status = 'completed';
  await sprint.save();

  // Renvoie les tâches non terminées (candidates au report dans le backlog).
  const unfinished = await Task.countDocuments({
    sprint: sprint._id,
    status: { $ne: 'done' },
  });
  res.json({ sprint, unfinishedTasks: unfinished });
});

// PATCH /sprints/:id  (manager/admin) — mise à jour des métadonnées.
const updateSprint = asyncHandler(async (req, res) => {
  const { sprint, project } = await loadSprintWithProject(req.params.id);
  if (!canManageProject(req, project)) throw ApiError.forbidden('Vous ne gérez pas ce projet.');

  const { name, goal, startDate, endDate } = req.body;
  if (name !== undefined) sprint.name = name;
  if (goal !== undefined) sprint.goal = goal;
  if (startDate !== undefined) sprint.startDate = startDate;
  if (endDate !== undefined) sprint.endDate = endDate;

  if (new Date(sprint.endDate) < new Date(sprint.startDate)) {
    throw ApiError.badRequest('La date de fin doit être postérieure à la date de début.');
  }

  await sprint.save();
  res.json(sprint);
});

// GET /sprints/:id/capacity — point central.
const getCapacity = asyncHandler(async (req, res) => {
  const { project } = await loadSprintWithProject(req.params.id);
  if (!canAccessProject(req, project)) throw ApiError.forbidden('Vous n\'êtes pas membre de ce projet.');
  const capacity = await computeSprintCapacity(req.params.id);
  res.json(capacity);
});

module.exports = {
  createSprint,
  listProjectSprints,
  getSprint,
  startSprint,
  completeSprint,
  updateSprint,
  getCapacity,
};
