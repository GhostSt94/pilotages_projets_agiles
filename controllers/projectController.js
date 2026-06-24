const { Project, Sprint, Task, User } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { isProjectMember, hasPermission, canManageProject, canAccessProject } = require('../utils/authz');

// GET /projects — admin/manager voient tout ; developer voit ses projets.
const listProjects = asyncHandler(async (req, res) => {
  // Accès global (admin) => tous ; sinon on ne voit que ses projets (membre).
  const filter = {};
  if (!hasPermission(req, 'project.manage.any')) {
    filter.members = req.user._id;
  }
  const projects = await Project.find(filter)
    .populate('members', 'name email role')
    .populate('manager', 'name email')
    .sort({ createdAt: -1 });
  res.json(projects);
});

// GET /projects/:id
const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('members', 'name email role dailyCapacityHours workingDays')
    .populate('manager', 'name email');
  if (!project) throw ApiError.notFound('Projet introuvable.');

  if (!canAccessProject(req, project)) {
    throw ApiError.forbidden('Vous n\'êtes pas membre de ce projet.');
  }
  res.json(project);
});

// POST /projects  (manager/admin)
const createProject = asyncHandler(async (req, res) => {
  const { name, key, description, members } = req.body;

  const project = await Project.create({
    name,
    key,
    description,
    manager: req.user._id,
    // Le créateur est toujours membre.
    members: Array.from(new Set([String(req.user._id), ...(members || []).map(String)])),
  });

  const populated = await project.populate('members', 'name email role');
  res.status(201).json(populated);
});

// PATCH /projects/:id  (manager/admin)
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound('Projet introuvable.');
  if (!canManageProject(req, project)) throw ApiError.forbidden('Vous ne gérez pas ce projet.');

  const { name, key, description, status } = req.body;
  if (name !== undefined) project.name = name;
  if (key !== undefined) project.key = key;
  if (description !== undefined) project.description = description;
  if (status !== undefined) project.status = status;

  await project.save();
  res.json(project);
});

// DELETE /projects/:id  (manager/admin) — supprime aussi sprints et tâches liés.
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound('Projet introuvable.');
  if (!canManageProject(req, project)) throw ApiError.forbidden('Vous ne gérez pas ce projet.');

  await Promise.all([
    Task.deleteMany({ project: project._id }),
    Sprint.deleteMany({ project: project._id }),
  ]);
  await project.deleteOne();

  res.json({ deleted: true, id: project._id });
});

// POST /projects/:id/members  (manager/admin) — { userId }
const addMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound('Projet introuvable.');
  if (!canManageProject(req, project)) throw ApiError.forbidden('Vous ne gérez pas ce projet.');

  const { userId } = req.body;
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('Utilisateur introuvable.');

  if (isProjectMember(project, userId)) {
    throw ApiError.conflict('Cet utilisateur est déjà membre du projet.');
  }
  project.members.push(userId);
  await project.save();

  const populated = await project.populate('members', 'name email role');
  res.json(populated);
});

// DELETE /projects/:id/members/:userId  (manager/admin)
const removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound('Projet introuvable.');
  if (!canManageProject(req, project)) throw ApiError.forbidden('Vous ne gérez pas ce projet.');

  project.members = project.members.filter((m) => String(m) !== String(req.params.userId));
  await project.save();

  const populated = await project.populate('members', 'name email role');
  res.json(populated);
});

// GET /projects/:id/board — tâches du sprint actif regroupées par statut.
const getBoard = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound('Projet introuvable.');

  if (!canAccessProject(req, project)) {
    throw ApiError.forbidden('Vous n\'êtes pas membre de ce projet.');
  }

  const activeSprint = await Sprint.findOne({ project: project._id, status: 'active' });

  const columns = { todo: [], in_progress: [], in_review: [], done: [] };
  if (activeSprint) {
    const tasks = await Task.find({ sprint: activeSprint._id })
      .populate('assignee', 'name email')
      .sort({ status: 1, order: 1 });
    for (const task of tasks) {
      if (columns[task.status]) columns[task.status].push(task);
    }
  }

  res.json({
    project: { _id: project._id, name: project.name, key: project.key },
    activeSprint: activeSprint
      ? { _id: activeSprint._id, name: activeSprint.name, startDate: activeSprint.startDate, endDate: activeSprint.endDate }
      : null,
    columns,
  });
});

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getBoard,
};
