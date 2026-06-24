// Helpers d'autorisation métier (basés sur les permissions du rôle dynamique).
// `req.permissions` est rempli par le middleware authenticate.

function hasPermission(req, perm) {
  return Array.isArray(req?.permissions) && req.permissions.includes(perm);
}

// Un membre du projet (gère ObjectId et docs peuplés).
function isProjectMember(project, userId) {
  return (project.members || []).some((m) => String(m._id || m) === String(userId));
}

// Peut modifier une tâche : permission « toutes tâches », ou membre du projet, ou assigné.
function canModifyTask(req, project, task) {
  if (hasPermission(req, 'task.manage.any')) return true;
  if (isProjectMember(project, req.user._id)) return true;
  const a = task && task.assignee;
  return !!a && String(a._id || a) === String(req.user._id);
}

// Peut GÉRER un projet (édition, sprints, membres) : accès global (`project.manage.any`,
// = admin) ou bien permission de gestion + être membre du projet (manager scopé à ses projets).
function canManageProject(req, project) {
  if (hasPermission(req, 'project.manage.any')) return true;
  return hasPermission(req, 'project.manage') && isProjectMember(project, req.user._id);
}

// Peut CONSULTER un projet et ses indicateurs (capacité, dashboard, sprints) :
// accès global (admin) ou membre du projet.
function canAccessProject(req, project) {
  if (hasPermission(req, 'project.manage.any')) return true;
  return isProjectMember(project, req.user._id);
}

module.exports = { hasPermission, isProjectMember, canModifyTask, canManageProject, canAccessProject };
