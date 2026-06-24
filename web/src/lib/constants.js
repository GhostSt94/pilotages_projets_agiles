// Enums de l'API + labels FR + classes de couleur. Source unique de vérité côté front
// (ne jamais coder « todo » / « high » en dur dans un composant).

export const TASK_STATUS = {
  todo: { label: 'À faire', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  in_progress: { label: 'En cours', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  in_review: { label: 'En revue', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  done: { label: 'Terminé', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
};
export const TASK_STATUS_ORDER = ['todo', 'in_progress', 'in_review', 'done'];

export const TASK_PRIORITY = {
  low: { label: 'Basse', badge: 'bg-slate-100 text-slate-500' },
  medium: { label: 'Moyenne', badge: 'bg-blue-50 text-blue-600' },
  high: { label: 'Haute', badge: 'bg-orange-50 text-orange-600' },
  critical: { label: 'Critique', badge: 'bg-red-50 text-red-600' },
};
export const TASK_PRIORITY_ORDER = ['low', 'medium', 'high', 'critical'];

export const TASK_TYPE = {
  feature: { label: 'Fonctionnalité', icon: 'Sparkles', color: 'text-indigo-600' },
  bug: { label: 'Bug', icon: 'Bug', color: 'text-red-600' },
  tech: { label: 'Technique', icon: 'Wrench', color: 'text-slate-600' },
};
export const TASK_TYPE_ORDER = ['feature', 'bug', 'tech'];

export const SPRINT_STATUS = {
  planned: { label: 'Planifié', badge: 'bg-blue-100 text-blue-700' },
  active: { label: 'Actif', badge: 'bg-emerald-100 text-emerald-700' },
  completed: { label: 'Terminé', badge: 'bg-slate-100 text-slate-500' },
};

export const PROJECT_STATUS = {
  active: { label: 'Actif', badge: 'bg-emerald-100 text-emerald-700' },
  archived: { label: 'Archivé', badge: 'bg-slate-100 text-slate-500' },
};

export const LEAVE_STATUS = {
  pending: { label: 'En attente', badge: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approuvé', badge: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Refusé', badge: 'bg-red-100 text-red-700' },
};

export const LEAVE_TYPE = {
  vacation: { label: 'Vacances' },
  sick: { label: 'Maladie' },
  personal: { label: 'Personnel' },
  other: { label: 'Autre' },
};
export const LEAVE_TYPE_ORDER = ['vacation', 'sick', 'personal', 'other'];

export const ROLE = {
  developer: { label: 'Développeur', badge: 'bg-slate-100 text-slate-600' },
  manager: { label: 'Manager', badge: 'bg-indigo-100 text-indigo-700' },
  admin: { label: 'Admin', badge: 'bg-violet-100 text-violet-700' },
};
export const ROLE_ORDER = ['developer', 'manager', 'admin'];

// Jours de la semaine : index = valeur API (0 = dimanche … 6 = samedi, cf. getUTCDay).
export const WEEKDAYS = [
  { value: 1, short: 'L', label: 'Lundi' },
  { value: 2, short: 'M', label: 'Mardi' },
  { value: 3, short: 'M', label: 'Mercredi' },
  { value: 4, short: 'J', label: 'Jeudi' },
  { value: 5, short: 'V', label: 'Vendredi' },
  { value: 6, short: 'S', label: 'Samedi' },
  { value: 0, short: 'D', label: 'Dimanche' },
];
