const mongoose = require('mongoose');

const SPRINT_STATUSES = ['planned', 'active', 'completed'];

const sprintSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    goal: { type: String, trim: true, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: SPRINT_STATUSES, default: 'planned' },
  },
  { timestamps: true }
);

sprintSchema.index({ project: 1, status: 1 });

sprintSchema.statics.STATUSES = SPRINT_STATUSES;

module.exports = mongoose.model('Sprint', sprintSchema);
