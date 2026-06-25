const mongoose = require('mongoose');

const ENTITY_TYPES = ['task', 'sprint', 'leave', 'project', 'user'];

const ACTIONS = [
  'task.create', 'task.update', 'task.move', 'task.delete',
  'sprint.create', 'sprint.start', 'sprint.complete', 'sprint.update',
  'leave.request', 'leave.approve', 'leave.reject',
  'project.create', 'project.update', 'member.add', 'member.remove',
  'user.create', 'user.update',
];

const activityLogSchema = new mongoose.Schema(
  {
    // Auteur de l'action.
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ACTIONS, required: true },
    entityType: { type: String, enum: ENTITY_TYPES, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    // Projet concerné (null pour les events non liés à un projet, ex. congés/comptes).
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    // Résumé FR lisible, construit à l'écriture (ex. « a déplacé ATLAS-3 → En cours »).
    summary: { type: String, required: true, trim: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ entityType: 1, createdAt: -1 });

activityLogSchema.statics.ENTITY_TYPES = ENTITY_TYPES;
activityLogSchema.statics.ACTIONS = ACTIONS;

module.exports = mongoose.model('ActivityLog', activityLogSchema);
