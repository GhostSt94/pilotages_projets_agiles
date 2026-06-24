const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    key: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String, trim: true, default: '' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Propriétaire / chef de projet principal.
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
