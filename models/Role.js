const mongoose = require('mongoose');
const { PERMISSION_KEYS } = require('../config/permissions');

const roleSchema = new mongoose.Schema(
  {
    // Identifiant stable (slug), utilisé comme valeur de user.role.
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    label: { type: String, required: true, trim: true },
    color: { type: String, default: 'slate' }, // clé de palette (indigo, emerald, amber, rose, sky, violet, slate)
    description: { type: String, trim: true, default: '' },
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator: (perms) => perms.every((p) => PERMISSION_KEYS.includes(p)),
        message: 'Permission inconnue.',
      },
    },
    // Rôle système : non supprimable, non renommable (name figé).
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);
