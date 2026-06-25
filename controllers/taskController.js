const fs = require('fs');
const path = require('path');
const { Task, Project, Sprint } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { canModifyTask, isProjectMember, hasPermission } = require('../utils/authz');
const { UPLOAD_DIR } = require('../middlewares/upload');
const { notify } = require('../services/notificationService');

// Vérifie qu'un sprint (s'il est fourni) appartient bien au projet.
async function assertSprintBelongsToProject(sprintId, projectId) {
  if (!sprintId) return;
  const sprint = await Sprint.findById(sprintId);
  if (!sprint) throw ApiError.notFound('Sprint introuvable.');
  if (String(sprint.project) !== String(projectId)) {
    throw ApiError.badRequest('Le sprint n\'appartient pas au projet de la tâche.');
  }
}

// GET /tasks?project=&sprint=  (sprint=null|backlog => backlog)
const listTasks = asyncHandler(async (req, res) => {
  const { project, sprint, status, assignee } = req.query;
  const filter = {};

  if (project) filter.project = project;
  if (status) filter.status = status;
  if (assignee) filter.assignee = assignee;

  if (sprint === 'null' || sprint === 'backlog') {
    filter.sprint = null;
  } else if (sprint) {
    filter.sprint = sprint;
  }

  // Sans la permission « gérer les projets », on ne voit que ses projets.
  if (!hasPermission(req, 'project.manage')) {
    const myProjects = await Project.find({ members: req.user._id }).select('_id');
    const ids = myProjects.map((p) => p._id);
    filter.project = filter.project
      ? (ids.some((id) => String(id) === String(filter.project)) ? filter.project : '__none__')
      : { $in: ids };
  }

  const tasks = await Task.find(filter)
    .populate('assignee', 'name email')
    .populate('project', 'key name')
    .sort({ order: 1, createdAt: 1 });
  res.json(tasks);
});

// GET /tasks/:id
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignee', 'name email')
    .populate('project', 'key name')
    .populate('comments.author', 'name email')
    .populate('attachments.uploadedBy', 'name')
    .populate('timeLogs.user', 'name email');
  if (!task) throw ApiError.notFound('Tâche introuvable.');
  res.json(task);
});

// POST /tasks — tout membre du projet.
const createTask = asyncHandler(async (req, res) => {
  const { project, sprint, title, description, type, estimate, priority, assignee, labels, status } = req.body;

  const proj = await Project.findById(project);
  if (!proj) throw ApiError.notFound('Projet introuvable.');

  // Membre du projet requis (admin = accès global via project.manage.any).
  if (!hasPermission(req, 'project.manage.any') && !isProjectMember(proj, req.user._id)) {
    throw ApiError.forbidden('Vous n\'êtes pas membre de ce projet.');
  }

  await assertSprintBelongsToProject(sprint, project);

  // Numéro séquentiel par projet (KEY-N).
  const last = await Task.findOne({ project }).sort({ number: -1 }).select('number');
  const number = (last?.number || 0) + 1;

  const task = await Task.create({
    project,
    number,
    sprint: sprint || null,
    title,
    description,
    type,
    estimate,
    priority,
    assignee: assignee || null,
    labels: labels || [],
    status: status || 'todo',
  });

  // Prévenir l'assigné (sauf si l'on s'assigne soi-même).
  if (task.assignee) {
    await notify({
      users: [task.assignee],
      type: 'task_assigned',
      title: 'Nouvelle tâche assignée',
      body: `« ${task.title} » vous a été assignée.`,
      link: '/my-tasks',
      exclude: req.user._id,
    });
  }

  res.status(201).json(task);
});

// Charge tâche + projet et contrôle les droits de modification.
async function loadTaskForModify(req) {
  const task = await Task.findById(req.params.id);
  if (!task) throw ApiError.notFound('Tâche introuvable.');
  const project = await Project.findById(task.project);
  if (!project) throw ApiError.notFound('Projet de la tâche introuvable.');
  if (!canModifyTask(req, project, task)) {
    throw ApiError.forbidden('Vous ne pouvez modifier que vos tâches assignées ou celles de vos projets.');
  }
  return { task, project };
}

// PATCH /tasks/:id
const updateTask = asyncHandler(async (req, res) => {
  const { task } = await loadTaskForModify(req);
  const prevAssignee = String(task.assignee || '');

  const { title, description, type, estimate, priority, assignee, labels, status, sprint } = req.body;
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (type !== undefined) task.type = type;
  if (estimate !== undefined) task.estimate = estimate;
  if (priority !== undefined) task.priority = priority;
  if (assignee !== undefined) task.assignee = assignee || null;
  if (labels !== undefined) task.labels = labels;
  if (status !== undefined) task.status = status;
  if (sprint !== undefined) {
    await assertSprintBelongsToProject(sprint, task.project);
    task.sprint = sprint || null;
  }

  await task.save();

  // Notifier le nouvel assigné si l'assignation a changé.
  const newAssignee = String(task.assignee || '');
  if (newAssignee && newAssignee !== prevAssignee) {
    await notify({
      users: [task.assignee],
      type: 'task_assigned',
      title: 'Tâche assignée',
      body: `« ${task.title} » vous a été assignée.`,
      link: '/my-tasks',
      exclude: req.user._id,
    });
  }

  res.json(task);
});

// PATCH /tasks/:id/move — déplacer (statut / sprint / ordre) pour le Kanban.
const moveTask = asyncHandler(async (req, res) => {
  const { task } = await loadTaskForModify(req);
  const { status, sprint, order } = req.body;

  if (sprint !== undefined) {
    await assertSprintBelongsToProject(sprint, task.project);
    task.sprint = sprint || null;
  }
  if (status !== undefined) task.status = status;
  if (order !== undefined) task.order = order;

  await task.save();
  res.json(task);
});

// DELETE /tasks/:id
const deleteTask = asyncHandler(async (req, res) => {
  const { task } = await loadTaskForModify(req);
  await task.deleteOne();
  res.json({ deleted: true, id: task._id });
});

// POST /tasks/:id/comments — { body }
const addComment = asyncHandler(async (req, res) => {
  const { task } = await loadTaskForModify(req);
  task.comments.push({ author: req.user._id, body: req.body.body });
  await task.save();
  const populated = await task.populate('comments.author', 'name email');
  res.status(201).json(populated);
});

// POST /tasks/:id/timelogs — { hours, spentOn?, note? } : saisir du temps passé.
const addTimeLog = asyncHandler(async (req, res) => {
  const { task } = await loadTaskForModify(req);
  const { hours, spentOn, note } = req.body;
  task.timeLogs.push({
    user: req.user._id,
    hours,
    ...(spentOn ? { spentOn } : {}),
    note: note || '',
  });
  await task.save();
  const populated = await task.populate('timeLogs.user', 'name email');
  res.status(201).json(populated);
});

// DELETE /tasks/:id/timelogs/:logId — retirer une entrée (auteur ou gestionnaire).
const removeTimeLog = asyncHandler(async (req, res) => {
  const { task } = await loadTaskForModify(req);
  const log = task.timeLogs.id(req.params.logId);
  if (!log) throw ApiError.notFound('Entrée de temps introuvable.');
  // Seuls l'auteur de la saisie ou un gestionnaire global peuvent la supprimer.
  if (String(log.user) !== String(req.user._id) && !hasPermission(req, 'task.manage.any')) {
    throw ApiError.forbidden('Vous ne pouvez supprimer que vos propres saisies de temps.');
  }
  task.timeLogs.pull(req.params.logId);
  await task.save();
  res.json({ deleted: true, id: req.params.logId });
});

// POST /tasks/:id/attachments — image (multipart, champ « image »)
const addAttachment = asyncHandler(async (req, res) => {
  const { task } = await loadTaskForModify(req);
  if (!req.file) throw ApiError.badRequest('Aucune image reçue.');
  task.attachments.push({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    uploadedBy: req.user._id,
  });
  await task.save();
  const populated = await task.populate('attachments.uploadedBy', 'name');
  res.status(201).json(populated);
});

// DELETE /tasks/:id/attachments/:attachmentId
const removeAttachment = asyncHandler(async (req, res) => {
  const { task } = await loadTaskForModify(req);
  const att = task.attachments.id(req.params.attachmentId);
  if (!att) throw ApiError.notFound('Pièce jointe introuvable.');
  // Supprime le fichier sur disque (best effort).
  fs.unlink(path.join(UPLOAD_DIR, att.filename), () => {});
  task.attachments.pull(req.params.attachmentId);
  await task.save();
  res.json({ deleted: true, id: req.params.attachmentId });
});

module.exports = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  addComment,
  addTimeLog,
  removeTimeLog,
  addAttachment,
  removeAttachment,
};
