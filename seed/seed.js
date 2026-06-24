/**
 * Script d'initialisation de la base « Cadence ».
 * Crée des utilisateurs (developer/manager/admin), le projet « Atlas Retail »,
 * un sprint actif, des tâches à différents statuts et quelques congés.
 *
 * Lancement :  npm run seed
 * ATTENTION : vide les collections users/projects/sprints/tasks/leaves.
 */
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const { User, Project, Sprint, Task, Leave } = require('../models');
const { ensureDefaultRoles } = require('../services/roleService');

// Dates relatives à aujourd'hui pour que le sprint soit toujours "en cours".
const today = new Date();
function dayOffset(n) {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() + n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function run() {
  await connectDB();
  await ensureDefaultRoles(); // rôles système (admin/manager/developer)

  // eslint-disable-next-line no-console
  console.log('[seed] Nettoyage des collections…');
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Sprint.deleteMany({}),
    Task.deleteMany({}),
    Leave.deleteMany({}),
  ]);

  // --- Utilisateurs ---
  // NB : le hash est géré par le hook pre-save via le virtuel `password`,
  // donc on crée chaque user avec `new User(...).save()`.
  async function makeUser(data) {
    const u = new User(data);
    await u.save();
    return u;
  }

  const admin = await makeUser({
    name: 'Amine Admin',
    email: 'admin@devox.ma',
    password: 'password123',
    role: 'admin',
    dailyCapacityHours: 6,
    workingDays: [1, 2, 3, 4, 5],
  });

  const manager = await makeUser({
    name: 'Mounia Manager',
    email: 'manager@devox.ma',
    password: 'password123',
    role: 'manager',
    dailyCapacityHours: 5,
    workingDays: [1, 2, 3, 4, 5],
  });

  const dev1 = await makeUser({
    name: 'Driss Développeur',
    email: 'dev1@devox.ma',
    password: 'password123',
    role: 'developer',
    dailyCapacityHours: 6,
    workingDays: [1, 2, 3, 4, 5],
  });

  const dev2 = await makeUser({
    name: 'Sara Salhi',
    email: 'dev2@devox.ma',
    password: 'password123',
    role: 'developer',
    dailyCapacityHours: 7,
    workingDays: [1, 2, 3, 4, 5],
  });

  const dev3 = await makeUser({
    name: 'Yassine Younsi',
    email: 'dev3@devox.ma',
    password: 'password123',
    role: 'developer',
    dailyCapacityHours: 6,
    workingDays: [1, 2, 3, 4], // travaille 4 jours/semaine
  });

  // eslint-disable-next-line no-console
  console.log('[seed] Utilisateurs créés.');

  // --- Projet ---
  const project = await Project.create({
    name: 'Atlas Retail',
    key: 'ATLAS',
    description: 'Plateforme e-commerce pour un client retail.',
    manager: manager._id,
    members: [manager._id, dev1._id, dev2._id, dev3._id],
    status: 'active',
  });

  // --- Sprint actif (période de 2 semaines englobant aujourd'hui) ---
  const sprint = await Sprint.create({
    project: project._id,
    name: 'Sprint 1 — Catalogue & Panier',
    goal: 'Livrer le catalogue produit et le panier de base.',
    startDate: dayOffset(-3),
    endDate: dayOffset(10),
    status: 'active',
  });

  // Un sprint planifié (futur) pour montrer le backlog/planification.
  const nextSprint = await Sprint.create({
    project: project._id,
    name: 'Sprint 2 — Paiement',
    goal: 'Intégration du paiement en ligne.',
    startDate: dayOffset(11),
    endDate: dayOffset(24),
    status: 'planned',
  });

  // eslint-disable-next-line no-console
  console.log('[seed] Projet et sprints créés.');

  // --- Tâches du sprint actif (statuts variés) ---
  const sprintTasks = [
    { title: 'Page liste des produits', status: 'done', estimate: 8, assignee: dev1._id, type: 'feature', order: 0 },
    { title: 'Filtres et recherche catalogue', status: 'in_progress', estimate: 12, assignee: dev1._id, type: 'feature', priority: 'high', order: 1 },
    { title: 'Fiche produit détaillée', status: 'in_review', estimate: 6, assignee: dev2._id, type: 'feature', order: 0 },
    { title: 'Ajout au panier', status: 'in_progress', estimate: 10, assignee: dev2._id, type: 'feature', priority: 'high', order: 2 },
    { title: 'Persistance du panier (localStorage)', status: 'todo', estimate: 5, assignee: dev3._id, type: 'tech', order: 0 },
    { title: 'Bug : prix TTC mal arrondi', status: 'todo', estimate: 3, assignee: dev3._id, type: 'bug', priority: 'critical', order: 1 },
    { title: 'Composant en-tête + navigation', status: 'done', estimate: 4, assignee: dev1._id, type: 'feature', order: 2 },
  ];

  let taskNumber = 0; // séquence KEY-N par projet (Atlas)
  for (const t of sprintTasks) {
    await Task.create({
      project: project._id,
      number: ++taskNumber,
      sprint: sprint._id,
      title: t.title,
      description: `Tâche d'exemple : ${t.title}.`,
      type: t.type || 'feature',
      estimate: t.estimate,
      priority: t.priority || 'medium',
      status: t.status,
      assignee: t.assignee,
      labels: ['catalogue'],
      order: t.order,
    });
  }

  // --- Tâches du backlog (sprint = null) ---
  const backlogTasks = [
    { title: 'Intégration passerelle de paiement', estimate: 16, type: 'feature', priority: 'high' },
    { title: 'Compte client & historique de commandes', estimate: 12, type: 'feature' },
    { title: 'Mise en place CI/CD', estimate: 8, type: 'tech' },
  ];
  for (let i = 0; i < backlogTasks.length; i += 1) {
    const t = backlogTasks[i];
    await Task.create({
      project: project._id,
      number: ++taskNumber,
      sprint: null,
      title: t.title,
      description: `Tâche backlog : ${t.title}.`,
      type: t.type,
      estimate: t.estimate,
      priority: t.priority || 'medium',
      status: 'todo',
      labels: ['backlog'],
      order: i,
    });
  }

  // eslint-disable-next-line no-console
  console.log('[seed] Tâches créées (sprint + backlog).');

  // --- Congés ---
  // dev2 : 2 jours approuvés pendant le sprint actif -> réduit la capacité.
  await Leave.create({
    user: dev2._id,
    type: 'vacation',
    startDate: dayOffset(2),
    endDate: dayOffset(3),
    status: 'approved',
    reason: 'Congé personnel',
    reviewedBy: manager._id,
    reviewedAt: new Date(),
  });

  // dev3 : 1 jour en attente (n'impacte pas encore la capacité).
  await Leave.create({
    user: dev3._id,
    type: 'sick',
    startDate: dayOffset(5),
    endDate: dayOffset(5),
    status: 'pending',
    reason: 'Rendez-vous médical',
  });

  // dev1 : congé approuvé hors période du sprint (sans impact sur ce sprint).
  await Leave.create({
    user: dev1._id,
    type: 'vacation',
    startDate: dayOffset(30),
    endDate: dayOffset(34),
    status: 'approved',
    reason: 'Vacances',
    reviewedBy: manager._id,
    reviewedAt: new Date(),
  });

  // eslint-disable-next-line no-console
  console.log('[seed] Congés créés.');

  // --- Récapitulatif ---
  // eslint-disable-next-line no-console
  console.log('\n=== Seed terminé ===');
  // eslint-disable-next-line no-console
  console.log('Comptes (mot de passe : password123) :');
  // eslint-disable-next-line no-console
  console.log('  admin@devox.ma    (admin)');
  // eslint-disable-next-line no-console
  console.log('  manager@devox.ma  (manager)');
  // eslint-disable-next-line no-console
  console.log('  dev1@devox.ma / dev2@devox.ma / dev3@devox.ma (developer)');
  // eslint-disable-next-line no-console
  console.log(`\nProjet  : ${project.name} (${project._id})`);
  // eslint-disable-next-line no-console
  console.log(`Sprint actif : ${sprint.name} (${sprint._id})`);
  // eslint-disable-next-line no-console
  console.log(`Sprint planifié : ${nextSprint.name} (${nextSprint._id})`);
  // eslint-disable-next-line no-console
  console.log(`\nTester la capacité :  GET /sprints/${sprint._id}/capacity`);
  // eslint-disable-next-line no-console
  console.log(`Tester le dashboard : GET /dashboard?sprint=${sprint._id}\n`);

  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] Erreur :', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
