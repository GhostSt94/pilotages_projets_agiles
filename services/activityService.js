const { ActivityLog } = require('../models');

// Libellé FR d'un statut de tâche (pour les résumés « … → En cours »).
const STATUS_LABEL = {
  todo: 'À faire',
  in_progress: 'En cours',
  in_review: 'En revue',
  done: 'Terminé',
};
function statusLabel(status) {
  return STATUS_LABEL[status] || status;
}

// Identifiant lisible d'une tâche (« ATLAS-12 ») à partir du projet et de la tâche.
function taskCode(project, task) {
  if (!task?.number) return `tâche`;
  const key = project?.key;
  return key ? `${key}-${task.number}` : `#${task.number}`;
}

/**
 * Enregistre une entrée de journal d'activité.
 * Best-effort : toute erreur est journalisée mais n'interrompt jamais l'action métier
 * (même philosophie que services/notificationService.js).
 */
async function logActivity({ actor, action, entityType, entityId = null, project = null, summary, meta }) {
  try {
    if (!actor || !action || !entityType || !summary) return;
    await ActivityLog.create({ actor, action, entityType, entityId, project, summary, meta });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[activity] échec d’écriture du journal :', err.message);
  }
}

module.exports = { logActivity, statusLabel, taskCode };
