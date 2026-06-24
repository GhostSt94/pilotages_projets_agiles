const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { ensureDefaultRoles } = require('./services/roleService');

async function start() {
  await connectDB();
  await ensureDefaultRoles(); // crée les rôles système s'ils n'existent pas
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] Cadence API à l'écoute sur http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[server] Démarrage impossible :', err.message);
  process.exit(1);
});
