// Catalogue FIXE des permissions de l'application.
// Les rôles (dynamiques, gérés par l'admin) accordent un sous-ensemble de ces clés.
const PERMISSIONS = [
  { key: 'project.manage', label: 'Gérer ses projets', description: 'Créer des projets et gérer ceux dont on est membre (édition, membres).' },
  { key: 'project.manage.any', label: 'Gérer tous les projets', description: 'Gérer et consulter n\'importe quel projet, même sans en être membre.' },
  { key: 'sprint.manage', label: 'Gérer les sprints', description: 'Créer, démarrer, clôturer et modifier les sprints.' },
  { key: 'task.manage.any', label: 'Modifier toutes les tâches', description: 'Modifier/déplacer/supprimer n\'importe quelle tâche (pas seulement les siennes).' },
  { key: 'leave.review', label: 'Valider les congés', description: 'Approuver ou refuser les demandes de congé.' },
  { key: 'user.view', label: 'Voir les utilisateurs', description: 'Consulter l\'annuaire (Société) et les équipes.' },
  { key: 'user.manage', label: 'Gérer les utilisateurs', description: 'Créer des comptes et modifier rôle/capacité/jours travaillés.' },
  { key: 'role.manage', label: 'Gérer les rôles', description: 'Créer, modifier et supprimer les rôles et leurs permissions.' },
];

const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

// Rôles système (toujours présents, non supprimables). name = identifiant stable.
const SYSTEM_ROLES = [
  {
    name: 'admin',
    label: 'Admin',
    color: 'violet',
    permissions: [...PERMISSION_KEYS], // toutes
  },
  {
    name: 'manager',
    label: 'Manager',
    color: 'indigo',
    permissions: ['project.manage', 'sprint.manage', 'task.manage.any', 'leave.review', 'user.view'],
  },
  {
    name: 'developer',
    label: 'Développeur',
    color: 'slate',
    permissions: [],
  },
];

module.exports = { PERMISSIONS, PERMISSION_KEYS, SYSTEM_ROLES };
