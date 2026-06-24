import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Trello, Gauge, SquareCheckBig, CalendarDays,
  LayoutDashboard, FolderKanban, Users, Building2, Settings, ShieldCheck, CornerDownLeft,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useProject } from '@/lib/project';
import { useAuth, can } from '@/lib/auth';
import { cn } from '@/lib/utils';

export function CommandPalette() {
  const navigate = useNavigate();
  const { projects, setProjectId } = useProject();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [index, setIndex] = useState(0);

  // Raccourci global Ctrl/Cmd + K
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) { setQ(''); setIndex(0); }
  }, [open]);

  const items = useMemo(() => {
    const nav = [
      { id: 'board', group: 'Navigation', label: 'Tableau Kanban', icon: Trello, run: () => navigate('/board') },
      { id: 'planning', group: 'Navigation', label: 'Planification', icon: Gauge, run: () => navigate('/planning') },
      { id: 'mytasks', group: 'Navigation', label: 'Mes tâches', icon: SquareCheckBig, run: () => navigate('/my-tasks') },
      { id: 'leaves', group: 'Navigation', label: 'Congés', icon: CalendarDays, run: () => navigate('/leaves') },
      { id: 'dashboard', group: 'Navigation', label: 'Tableau de bord', icon: LayoutDashboard, run: () => navigate('/dashboard') },
    ];
    if (can(user, 'user.view')) {
      nav.push({ id: 'team', group: 'Navigation', label: 'Équipe (projet)', icon: Users, run: () => navigate('/team') });
      nav.push({ id: 'settings', group: 'Navigation', label: 'Paramétrage', icon: Settings, run: () => navigate('/settings') });
      nav.push({ id: 'settings-users', group: 'Navigation', label: 'Utilisateurs (société)', icon: Building2, run: () => navigate('/settings?tab=users') });
    }
    if (can(user, 'role.manage')) {
      nav.push({ id: 'settings-roles', group: 'Navigation', label: 'Rôles', icon: ShieldCheck, run: () => navigate('/settings?tab=roles') });
    }
    const proj = projects.map((p) => ({
      id: `proj-${p._id}`,
      group: 'Changer de projet',
      label: p.name,
      icon: FolderKanban,
      run: () => { setProjectId(p._id); navigate('/board'); },
    }));
    return [...nav, ...proj];
  }, [projects, user, navigate, setProjectId]);

  const filtered = useMemo(
    () => items.filter((i) => i.label.toLowerCase().includes(q.trim().toLowerCase())),
    [items, q]
  );

  useEffect(() => { setIndex(0); }, [q]);

  function run(item) {
    if (!item) return;
    setOpen(false);
    item.run();
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(filtered[index]); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[20%] max-w-lg translate-y-0 gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Palette de commandes</DialogTitle>
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Rechercher une page, un projet…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden rounded border bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400 sm:block">Échap</kbd>
        </div>

        <ul className="max-h-80 overflow-y-auto thin-scroll p-2">
          {filtered.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-slate-400">Aucun résultat pour « {q} »</li>
          )}
          {filtered.map((it, i) => {
            const showHeader = i === 0 || filtered[i - 1].group !== it.group;
            return (
              <li key={it.id}>
                {showHeader && (
                  <div className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {it.group}
                  </div>
                )}
                <button
                  type="button"
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => run(it)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm',
                    i === index ? 'bg-accent text-accent-foreground' : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <it.icon className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="flex-1 truncate">{it.label}</span>
                  {i === index && <CornerDownLeft className="h-3.5 w-3.5 text-slate-400" />}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3 border-t px-3 py-2 text-[11px] text-slate-400">
          <span>↑↓ naviguer</span>
          <span>⏎ ouvrir</span>
          <span className="ml-auto">Ctrl/⌘ K</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
