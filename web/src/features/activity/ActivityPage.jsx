import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Search, X, ChevronLeft, ChevronRight, ScrollText,
  SquareCheckBig, Rocket, CalendarClock, FolderKanban, UserCog,
} from 'lucide-react';
import { useActivity } from '@/hooks/useActivity';
import { useUsers } from '@/hooks/useUsers';
import { useProject } from '@/lib/project';
import { apiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Avatar } from '@/components/common/Avatar';
import { PageLoader, ErrorState, EmptyState } from '@/components/common/states';

const PAGE_SIZE = 15;

// Icône / teinte / libellé par type d'entité.
const ENTITY = {
  task: { icon: SquareCheckBig, tint: 'bg-primary/10 text-primary', label: 'Tâche' },
  sprint: { icon: Rocket, tint: 'bg-sky-100 text-sky-600', label: 'Sprint' },
  leave: { icon: CalendarClock, tint: 'bg-amber-100 text-amber-600', label: 'Congé' },
  project: { icon: FolderKanban, tint: 'bg-emerald-100 text-emerald-600', label: 'Projet' },
  user: { icon: UserCog, tint: 'bg-rose-100 text-rose-600', label: 'Compte' },
};
const TYPE_ORDER = ['task', 'sprint', 'leave', 'project', 'user'];
const ALL = '__all__';

function timeAgo(date) {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  } catch {
    return '';
  }
}

export default function ActivityPage() {
  const { projects = [] } = useProject();
  const { data: users = [] } = useUsers();

  const [q, setQ] = useState('');
  const [type, setType] = useState(ALL);
  const [actor, setActor] = useState(ALL);
  const [project, setProject] = useState(ALL);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);

  const params = { page: page + 1, limit: PAGE_SIZE };
  if (q.trim()) params.q = q.trim();
  if (type !== ALL) params.type = type;
  if (actor !== ALL) params.actor = actor;
  if (project !== ALL) params.project = project;
  if (from) params.from = from;
  if (to) params.to = to;

  const { data, isLoading, isError, error, refetch } = useActivity(params);

  const items = data?.items || [];
  const total = data?.total || 0;
  const pageCount = data?.pageCount || 1;
  const active = q.trim() || type !== ALL || actor !== ALL || project !== ALL || from || to;

  useEffect(() => { setPage(0); }, [q, type, actor, project, from, to]);
  useEffect(() => { setPage((p) => (p >= pageCount ? 0 : p)); }, [pageCount]);

  function reset() {
    setQ(''); setType(ALL); setActor(ALL); setProject(ALL); setFrom(''); setTo('');
  }

  if (isLoading && !data) return <PageLoader />;
  if (isError) return <div className="p-6"><ErrorState error={apiError(error)} onRetry={refetch} /></div>;

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <ScrollText className="h-5 w-5 text-primary" /> Journal d'activité
        </h2>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
          {total} entrée{total > 1 ? 's' : ''}
        </span>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="h-9 w-52 pl-8" />
        </div>

        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tout type</SelectItem>
            {TYPE_ORDER.map((t) => <SelectItem key={t} value={t}>{ENTITY[t].label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={actor} onValueChange={setActor}>
          <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Acteur" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les acteurs</SelectItem>
            {users.map((u) => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={project} onValueChange={setProject}>
          <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Projet" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les projets</SelectItem>
            {projects.map((p) => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">Du</span>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-36" />
          <span className="text-xs text-slate-400">au</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-36" />
        </div>

        {active && (
          <Button variant="ghost" size="sm" className="text-slate-500" onClick={reset}>
            <X className="h-4 w-4" /> Réinitialiser
          </Button>
        )}
      </div>

      {/* Liste */}
      {items.length ? (
        <Card className="divide-y">
          {items.map((a) => {
            const meta = ENTITY[a.entityType] || { icon: ScrollText, tint: 'bg-slate-100 text-slate-500', label: a.entityType };
            const Icon = meta.icon;
            return (
              <div key={a._id} className="flex items-center gap-3 p-3.5">
                <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full', meta.tint)}>
                  <Icon className="h-4 w-4" />
                </span>
                <Avatar name={a.actor?.name} id={a.actor?._id} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium text-slate-800">{a.actor?.name || 'Quelqu\'un'}</span> {a.summary}
                  </p>
                  <p className="text-[11px] text-slate-400">{timeAgo(a.createdAt)}</p>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  {a.project?.key && (
                    <span className="rounded bg-slate-100 px-1.5 font-mono text-[10px] text-slate-500">{a.project.key}</span>
                  )}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{meta.label}</span>
                </div>
              </div>
            );
          })}
        </Card>
      ) : (
        <EmptyState
          icon={ScrollText}
          title={active ? 'Aucune entrée pour ces filtres' : 'Aucune activité'}
          description={active ? 'Ajustez ou réinitialisez les filtres.' : 'Les actions des utilisateurs apparaîtront ici.'}
        />
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Page {page + 1} / {pageCount}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}>
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
