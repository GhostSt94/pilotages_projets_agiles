const mongoose = require('mongoose');

// Statut de tâche d'un projet = une colonne du tableau Kanban.
// `key` est un slug stable (les tâches y font référence) ; le reste est éditable.
const statusSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    color: { type: String, default: 'slate' }, // clé de palette (cf. STATUS_COLORS front)
    order: { type: Number, default: 0 },
    isDone: { type: Boolean, default: false }, // statut "terminal" (avancement, clôture sprint)
    isSystem: { type: Boolean, default: false }, // statut par défaut créé avec le projet
  },
  { timestamps: true }
);

statusSchema.index({ project: 1, order: 1 });
statusSchema.index({ project: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Status', statusSchema);
