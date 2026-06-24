const { Sprint, Task, Project } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { computeSprintCapacity } = require('../services/capacityService');
const { canAccessProject } = require('../utils/authz');

// GET /dashboard?sprint= — avancement du sprint et charge par membre.
const getDashboard = asyncHandler(async (req, res) => {
  const sprintId = req.query.sprint;
  if (!sprintId) throw ApiError.badRequest('Paramètre « sprint » requis.');

  const sprint = await Sprint.findById(sprintId).populate('project', 'name key');
  if (!sprint) throw ApiError.notFound('Sprint introuvable.');

  // Accès réservé aux membres du projet (ou accès global admin).
  const project = await Project.findById(sprint.project?._id || sprint.project);
  if (!project) throw ApiError.notFound('Projet du sprint introuvable.');
  if (!canAccessProject(req, project)) throw ApiError.forbidden('Vous n\'êtes pas membre de ce projet.');

  const tasks = await Task.find({ sprint: sprint._id }).populate('assignee', 'name email');

  // Avancement : tâches et heures par statut.
  const byStatus = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
  let totalEstimate = 0;
  let doneEstimate = 0;
  for (const t of tasks) {
    if (byStatus[t.status] !== undefined) byStatus[t.status] += 1;
    totalEstimate += t.estimate || 0;
    if (t.status === 'done') doneEstimate += t.estimate || 0;
  }

  // Charge par membre (toutes les tâches du sprint, assignées).
  const loadByMember = new Map();
  for (const t of tasks) {
    if (!t.assignee) continue;
    const key = String(t.assignee._id);
    if (!loadByMember.has(key)) {
      loadByMember.set(key, {
        user: { _id: t.assignee._id, name: t.assignee.name, email: t.assignee.email },
        taskCount: 0,
        estimateHours: 0,
        doneHours: 0,
      });
    }
    const entry = loadByMember.get(key);
    entry.taskCount += 1;
    entry.estimateHours += t.estimate || 0;
    if (t.status === 'done') entry.doneHours += t.estimate || 0;
  }

  // Capacité (réutilise le service) pour le taux d'occupation par membre.
  const capacity = await computeSprintCapacity(sprintId);
  const capByUser = new Map(capacity.members.map((m) => [String(m.user._id), m]));
  const memberLoad = Array.from(loadByMember.values()).map((entry) => {
    const cap = capByUser.get(String(entry.user._id));
    const availableHours = cap ? cap.availableHours : null;
    return {
      ...entry,
      availableHours,
      utilizationRate:
        availableHours && availableHours > 0
          ? Math.round((entry.estimateHours / availableHours) * 100)
          : null,
    };
  });

  res.json({
    sprint: {
      _id: sprint._id,
      name: sprint.name,
      status: sprint.status,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      project: sprint.project,
    },
    progress: {
      tasksByStatus: byStatus,
      totalTasks: tasks.length,
      doneTasks: byStatus.done,
      totalEstimateHours: totalEstimate,
      doneEstimateHours: doneEstimate,
      remainingEstimateHours: totalEstimate - doneEstimate,
      completionRate: totalEstimate > 0 ? Math.round((doneEstimate / totalEstimate) * 100) : 0,
    },
    capacity: {
      availableCapacityHours: capacity.availableCapacityHours,
      committedHours: capacity.committedHours,
      overload: capacity.overload,
      utilizationRate: capacity.utilizationRate,
    },
    memberLoad,
  });
});

module.exports = { getDashboard };
