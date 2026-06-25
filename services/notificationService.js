const { Notification, Role, User } = require('../models');

/**
 * Crée des notifications pour un ou plusieurs destinataires.
 * Best-effort : toute erreur est journalisée mais n'interrompt jamais le flux appelant
 * (une notification ratée ne doit pas faire échouer l'action métier).
 *
 * @param {object}   params
 * @param {Array}    params.users  identifiants des destinataires
 * @param {string}   params.type   type de notification (cf. Notification.TYPES)
 * @param {string}   params.title
 * @param {string} [params.body]
 * @param {string} [params.link]
 * @param {string} [params.exclude] identifiant à exclure (ex. l'auteur de l'action)
 */
async function notify({ users = [], type, title, body = '', link = '', exclude = null }) {
  try {
    const seen = new Set();
    const docs = [];
    for (const u of users) {
      const id = String(u);
      if (!id || id === String(exclude) || seen.has(id)) continue;
      seen.add(id);
      docs.push({ user: id, type, title, body, link });
    }
    if (docs.length) await Notification.insertMany(docs);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[notify] échec de création de notification :', err.message);
  }
}

// Identifiants des utilisateurs dont le rôle accorde une permission donnée.
async function usersWithPermission(permission) {
  try {
    const roles = await Role.find({ permissions: permission }).select('name');
    const names = roles.map((r) => r.name);
    if (!names.length) return [];
    const users = await User.find({ role: { $in: names } }).select('_id');
    return users.map((u) => u._id);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[notify] échec de résolution des destinataires :', err.message);
    return [];
  }
}

module.exports = { notify, usersWithPermission };
