const { Status } = require('../models');
const ApiError = require('../utils/ApiError');

// Statuts par défaut créés avec un projet (les tâches seedées utilisent ces clés).
const DEFAULT_STATUSES = [
  { key: 'todo', label: 'À faire', color: 'slate', isDone: false },
  { key: 'in_progress', label: 'En cours', color: 'blue', isDone: false },
  { key: 'in_review', label: 'En revue', color: 'amber', isDone: false },
  { key: 'done', label: 'Terminé', color: 'emerald', isDone: true },
];

// Slug stable à partir d'un libellé (clé de statut).
function slugify(label) {
  return String(label)
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'statut';
}

// Crée les statuts par défaut si le projet n'en a aucun (idempotent, lazy).
async function ensureDefaultStatuses(projectId) {
  const count = await Status.countDocuments({ project: projectId });
  if (count > 0) return;
  await Status.insertMany(
    DEFAULT_STATUSES.map((s, i) => ({ ...s, project: projectId, order: i, isSystem: true }))
  );
}

// Liste ordonnée des statuts d'un projet (crée les défauts au besoin).
async function getProjectStatuses(projectId) {
  await ensureDefaultStatuses(projectId);
  return Status.find({ project: projectId }).sort({ order: 1 });
}

// Map key -> meta (label/color/isDone) pour un projet.
async function statusMap(projectId) {
  const list = await getProjectStatuses(projectId);
  return new Map(list.map((s) => [s.key, s]));
}

// Map key -> meta pour PLUSIEURS projets (utilisé par les listes multi-projets).
async function statusMapForProjects(projectIds) {
  const ids = [...new Set(projectIds.map(String))];
  const all = await Status.find({ project: { $in: ids } }).sort({ order: 1 });
  const byProject = new Map();
  for (const s of all) {
    const k = String(s.project);
    if (!byProject.has(k)) byProject.set(k, new Map());
    byProject.get(k).set(s.key, s);
  }
  return byProject;
}

// Clés des statuts "terminés" d'un projet.
async function doneKeys(projectId) {
  const list = await Status.find({ project: projectId, isDone: true }).select('key');
  return list.map((s) => s.key);
}

// Valide qu'une clé de statut appartient bien au projet.
async function assertStatusBelongsToProject(projectId, key) {
  if (key === undefined || key === null) return;
  const exists = await Status.findOne({ project: projectId, key });
  if (!exists) throw ApiError.badRequest(`Statut inconnu pour ce projet : « ${key} ».`);
}

// Représentation publique d'un statut (pour le front).
function toMeta(s) {
  return { _id: s._id, key: s.key, label: s.label, color: s.color, order: s.order, isDone: s.isDone };
}

module.exports = {
  DEFAULT_STATUSES,
  slugify,
  ensureDefaultStatuses,
  getProjectStatuses,
  statusMap,
  statusMapForProjects,
  doneKeys,
  assertStatusBelongsToProject,
  toMeta,
};
