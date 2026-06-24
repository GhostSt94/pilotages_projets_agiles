const mongoose = require('mongoose');

const TASK_STATUSES = ['todo', 'in_progress', 'in_review', 'done'];
const TASK_TYPES = ['feature', 'bug', 'tech'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: true, _id: true }
);

// Image attachée à une tâche (stockée sur disque, servie via /uploads).
const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true }, // ex. /uploads/172...-12345.png
    filename: { type: String, required: true }, // nom de fichier sur disque
    originalName: { type: String },
    mimetype: { type: String },
    size: { type: Number },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    // Numéro séquentiel par projet (affiché « KEY-N », ex. ATLAS-12).
    number: { type: Number, default: null },
    // null => la tâche est dans le backlog.
    sprint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
      default: null,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    type: { type: String, enum: TASK_TYPES, default: 'feature' },

    // Estimation de l'effort en HEURES (unité cohérente avec dailyCapacityHours).
    estimate: { type: Number, default: 0, min: 0 },

    priority: { type: String, enum: TASK_PRIORITIES, default: 'medium' },
    status: { type: String, enum: TASK_STATUSES, default: 'todo' },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    labels: [{ type: String, trim: true }],
    comments: [commentSchema],
    attachments: [attachmentSchema],

    // Position de la carte dans sa colonne Kanban (persistance du glisser-déposer).
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index recommandés (cf. cahier des charges).
taskSchema.index({ project: 1, sprint: 1, status: 1, order: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ project: 1, number: 1 });

taskSchema.statics.STATUSES = TASK_STATUSES;
taskSchema.statics.TYPES = TASK_TYPES;
taskSchema.statics.PRIORITIES = TASK_PRIORITIES;

module.exports = mongoose.model('Task', taskSchema);
