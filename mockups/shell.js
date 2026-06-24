/* Cadence — coquille partagée des maquettes (sidebar, topbar, badges).
   Statique, sans framework : génère le HTML commun pour garder un design cohérent. */

const NAV = [
  { key: 'board',     label: 'Tableau',           icon: 'trello',           href: 'board.html' },
  { key: 'backlog',   label: 'Backlog',           icon: 'list-todo',        href: 'backlog.html' },
  { key: 'sprints',   label: 'Sprints & capacité',icon: 'gauge',            href: 'sprints.html' },
  { key: 'mytasks',   label: 'Mes tâches',        icon: 'square-check-big', href: 'board.html' },
  { key: 'leaves',    label: 'Congés',            icon: 'calendar-days',    href: 'leaves.html' },
  { key: 'dashboard', label: 'Dashboard',         icon: 'layout-dashboard', href: 'dashboard.html' },
  { key: 'projects',  label: 'Projets',           icon: 'folder-kanban',    href: 'projects.html' },
  { key: 'users',     label: 'Utilisateurs',      icon: 'users',            href: 'users.html', admin: true },
];

const Shell = {
  sidebar(active) {
    const items = NAV.map((n) => {
      const on = n.key === active;
      const cls = on
        ? 'bg-indigo-50 text-indigo-700 font-medium'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';
      const badge = n.admin
        ? '<span class="ml-auto text-[10px] uppercase tracking-wide text-slate-400">admin</span>'
        : '';
      return `<a href="${n.href}" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${cls}">
        <i data-lucide="${n.icon}" class="h-[18px] w-[18px]"></i><span>${n.label}</span>${badge}</a>`;
    }).join('');

    return `<aside class="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div class="flex items-center gap-2 px-5 h-16 border-b border-slate-200">
        <div class="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">
          <i data-lucide="waves" class="h-5 w-5"></i>
        </div>
        <div>
          <div class="font-semibold text-slate-900 leading-tight">Cadence</div>
          <div class="text-[11px] text-slate-400 leading-tight">Devox · Agile</div>
        </div>
      </div>
      <nav class="flex-1 space-y-1 p-3">${items}</nav>
      <div class="border-t border-slate-200 p-3">
        <div class="flex items-center gap-3 rounded-lg px-2 py-2">
          <div class="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">MM</div>
          <div class="min-w-0">
            <div class="truncate text-sm font-medium text-slate-800">Mounia Manager</div>
            <div class="truncate text-xs text-slate-400">manager@devox.ma</div>
          </div>
          <i data-lucide="log-out" class="ml-auto h-4 w-4 text-slate-400"></i>
        </div>
      </div>
    </aside>`;
  },

  topbar(title, subtitle = '') {
    return `<header class="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white/80 px-5 backdrop-blur">
      <button class="md:hidden text-slate-500"><i data-lucide="menu" class="h-5 w-5"></i></button>
      <div class="min-w-0">
        <h1 class="truncate text-lg font-semibold text-slate-900">${title}</h1>
        ${subtitle ? `<p class="truncate text-xs text-slate-400">${subtitle}</p>` : ''}
      </div>
      <div class="ml-auto flex items-center gap-3">
        <div class="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
          <i data-lucide="folder-kanban" class="h-4 w-4 text-indigo-500"></i>
          <span class="font-medium">Atlas Retail</span>
          <span class="rounded bg-slate-100 px-1.5 text-[11px] font-mono text-slate-500">ATLAS</span>
          <i data-lucide="chevron-down" class="h-4 w-4 text-slate-400"></i>
        </div>
        <div class="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">MM</div>
      </div>
    </header>`;
  },

  mount(active, title, subtitle) {
    const el = document.getElementById('sidebar');
    if (el) el.outerHTML = Shell.sidebar(active);
    const tb = document.getElementById('topbar');
    if (tb) tb.outerHTML = Shell.topbar(title, subtitle);
    if (window.lucide) lucide.createIcons();
  },
};

/* --- Helpers de badges (mêmes mappings que le futur lib/constants.js) --- */
const STATUS = {
  todo:        { label: 'À faire',  cls: 'bg-slate-100 text-slate-600',  dot: 'bg-slate-400' },
  in_progress: { label: 'En cours', cls: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  in_review:   { label: 'En revue', cls: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
  done:        { label: 'Terminé',  cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
};
const PRIORITY = {
  low:      { label: 'Basse',    cls: 'text-slate-500 bg-slate-100' },
  medium:   { label: 'Moyenne',  cls: 'text-blue-600 bg-blue-50' },
  high:     { label: 'Haute',    cls: 'text-orange-600 bg-orange-50' },
  critical: { label: 'Critique', cls: 'text-red-600 bg-red-50' },
};
const TYPE = {
  feature: { label: 'Fonctionnalité', icon: 'sparkles', cls: 'text-indigo-600' },
  bug:     { label: 'Bug',            icon: 'bug',      cls: 'text-red-600' },
  tech:    { label: 'Technique',      icon: 'wrench',   cls: 'text-slate-600' },
};
const LEAVE = {
  pending:  { label: 'En attente', cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approuvé',   cls: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Refusé',     cls: 'bg-red-100 text-red-700' },
};

function statusBadge(s) {
  const m = STATUS[s];
  return `<span class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${m.cls}">
    <span class="h-1.5 w-1.5 rounded-full ${m.dot}"></span>${m.label}</span>`;
}
function priorityTag(p) {
  const m = PRIORITY[p];
  return `<span class="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${m.cls}">${m.label}</span>`;
}
function leaveBadge(s) {
  const m = LEAVE[s];
  return `<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${m.cls}">${m.label}</span>`;
}
const AVATAR_COLORS = {
  indigo: 'bg-indigo-100 text-indigo-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  sky: 'bg-sky-100 text-sky-700',
};
function avatar(initials, color = 'indigo', size = 6) {
  const dim = size === 8 ? 'h-8 w-8 text-xs' : 'h-6 w-6 text-[11px]';
  return `<span class="grid ${dim} place-items-center rounded-full ${AVATAR_COLORS[color] || AVATAR_COLORS.indigo} font-semibold">${initials}</span>`;
}
