const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['developer', 'manager', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    // Rôle dynamique : nom d'un Role (validé applicativement). Plus d'enum figé.
    role: { type: String, default: 'developer', lowercase: true, trim: true },

    // Capacité quotidienne en HEURES (unité cohérente avec task.estimate).
    dailyCapacityHours: { type: Number, default: 6, min: 0 },

    // Jours travaillés de la semaine : 0 = dimanche … 6 = samedi (cf. Date#getUTCDay).
    workingDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5], // lundi → vendredi
      validate: {
        validator: (days) => days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6),
        message: 'workingDays doit contenir des entiers entre 0 (dim.) et 6 (sam.).',
      },
    },

    team: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

// Hache le mot de passe à partir d'un champ virtuel `password`.
userSchema.virtual('password').set(function setPassword(plain) {
  this._plainPassword = plain;
});

// pre('validate') et non pre('save') : la validation (passwordHash requis)
// s'exécute avant les hooks save, il faut donc hacher en amont.
userSchema.pre('validate', async function hashPassword(next) {
  if (!this._plainPassword) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this._plainPassword, salt);
  this._plainPassword = undefined;
  return next();
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Ne jamais exposer le hash dans les réponses JSON.
userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

userSchema.statics.ROLES = ROLES;

module.exports = mongoose.model('User', userSchema);
