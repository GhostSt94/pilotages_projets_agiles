const express = require('express');
const path = require('path');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// CORS pour les clients (front React, app mobile Expo).
const corsOptions =
  env.corsOrigin === '*'
    ? { origin: true }
    : { origin: env.corsOrigin.split(',').map((o) => o.trim()) };
app.use(cors(corsOptions));

app.use(express.json());

// Fichiers uploadés (images des tâches).
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Sonde de santé.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'cadence-backend', time: new Date().toISOString() });
});

// Routes API.
app.use('/', routes);

// 404 + gestion d'erreurs centralisée (toujours en dernier).
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
