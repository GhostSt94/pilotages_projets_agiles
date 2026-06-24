const mongoose = require('mongoose');

const LEAVE_STATUSES = ['pending', 'approved', 'rejected'];
const LEAVE_TYPES = ['vacation', 'sick', 'personal', 'other'];

const leaveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: { type: String, enum: LEAVE_TYPES, default: 'vacation' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: LEAVE_STATUSES, default: 'pending' },
    reason: { type: String, trim: true, default: '' },

    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

leaveSchema.index({ user: 1, startDate: 1 });
leaveSchema.index({ status: 1 });

leaveSchema.statics.STATUSES = LEAVE_STATUSES;
leaveSchema.statics.TYPES = LEAVE_TYPES;

module.exports = mongoose.model('Leave', leaveSchema);
