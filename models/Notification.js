const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'leave_requested', // une demande de congé attend une validation
  'leave_approved',
  'leave_rejected',
  'task_assigned',
  'sprint_started',
];

const notificationSchema = new mongoose.Schema(
  {
    // Destinataire de la notification.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, trim: true, default: '' },
    // Lien front à ouvrir au clic (ex. /leaves, /board).
    link: { type: String, trim: true, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

notificationSchema.statics.TYPES = NOTIFICATION_TYPES;

module.exports = mongoose.model('Notification', notificationSchema);
