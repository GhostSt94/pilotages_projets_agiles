const { Role } = require('../models');
const { SYSTEM_ROLES } = require('../config/permissions');

// Cache mémoire { name -> role } pour éviter une requête par requête HTTP.
let cache = null;

async function loadCache() {
  const roles = await Role.find();
  cache = new Map(roles.map((r) => [r.name, r]));
  return cache;
}

// Invalide le cache (après création/modif/suppression d'un rôle).
function invalidateRolesCache() {
  cache = null;
}

async function getRoleByName(name) {
  if (!cache) await loadCache();
  return cache.get(name) || null;
}

// Permissions effectives d'un utilisateur (selon son rôle courant).
async function permissionsForUser(user) {
  if (!user?.role) return [];
  const role = await getRoleByName(user.role);
  return role ? role.permissions : [];
}

// Crée les rôles système s'ils n'existent pas (idempotent, au démarrage).
async function ensureDefaultRoles() {
  for (const def of SYSTEM_ROLES) {
    const existing = await Role.findOne({ name: def.name });
    if (!existing) {
      await Role.create({ ...def, isSystem: true });
      continue;
    }
    // Réconciliation non destructive : marque comme système et ajoute les permissions
    // manquantes de la définition (pour propager les nouvelles clés sans retirer les
    // personnalisations de l'admin).
    let dirty = false;
    if (!existing.isSystem) {
      existing.isSystem = true;
      dirty = true;
    }
    const missing = def.permissions.filter((p) => !existing.permissions.includes(p));
    if (missing.length) {
      existing.permissions = [...existing.permissions, ...missing];
      dirty = true;
    }
    if (dirty) await existing.save();
  }
  invalidateRolesCache();
}

module.exports = { permissionsForUser, getRoleByName, invalidateRolesCache, ensureDefaultRoles };
