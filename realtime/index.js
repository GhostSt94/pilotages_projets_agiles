const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User, Project } = require('../models');

// Instance Socket.io (initialisée au démarrage par initRealtime).
let io = null;

const userRoom = (id) => `user:${id}`;
const projectRoom = (id) => `project:${id}`;

/**
 * Initialise le serveur temps réel sur le serveur HTTP fourni.
 * Authentifie chaque connexion via le JWT (handshake.auth.token) — mêmes étapes
 * que middlewares/auth.js — puis fait rejoindre au socket sa room utilisateur et
 * les rooms des projets dont il est membre.
 */
function initRealtime(server) {
  io = new Server(server, {
    cors: env.corsOrigin === '*' ? { origin: true } : { origin: env.corsOrigin.split(',').map((o) => o.trim()) },
  });

  // Authentification du handshake.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Jeton manquant.'));
      const payload = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(payload.sub).select('_id');
      if (!user) return next(new Error('Utilisateur introuvable.'));
      socket.data.userId = String(user._id);
      next();
    } catch (err) {
      next(new Error('Jeton invalide ou expiré.'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    socket.join(userRoom(userId));
    try {
      const projects = await Project.find({ members: userId }).select('_id');
      for (const p of projects) socket.join(projectRoom(p._id));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[realtime] échec du join des rooms projet :', err.message);
    }
  });

  return io;
}

// Émetteurs best-effort : no-op si le temps réel n'est pas initialisé (ex. tests).
function emitToProject(projectId, event, payload = {}) {
  if (!io || !projectId) return;
  io.to(projectRoom(projectId)).emit(event, payload);
}

function emitToUser(userId, event, payload = {}) {
  if (!io || !userId) return;
  io.to(userRoom(userId)).emit(event, payload);
}

module.exports = { initRealtime, emitToProject, emitToUser };
