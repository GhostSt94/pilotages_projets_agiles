import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { TASK_PRIORITY, TASK_PRIORITY_ORDER, TASK_TYPE, TASK_TYPE_ORDER } from '@/lib/constants';

export const EMPTY_FILTERS = { q: '', assignee: 'all', priority: 'all', type: 'all' };

export function isFiltering(f) {
  return f.q.trim() !== '' || f.assignee !== 'all' || f.priority !== 'all' || f.type !== 'all';
}

export function matchesFilters(task, f, projectKey) {
  if (f.q.trim()) {
    const q = f.q.trim().toLowerCase();
    const code = task.number ? `${projectKey || ''}-${task.number}`.toLowerCase() : '';
    const haystack = `${task.title} ${code} ${task.number ?? ''}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (f.assignee === 'none' && task.assignee) return false;
  if (f.assignee !== 'all' && f.assignee !== 'none' && String(task.assignee?._id) !== f.assignee) return false;
  if (f.priority !== 'all' && task.priority !== f.priority) return false;
  if (f.type !== 'all' && task.type !== f.type) return false;
  return true;
}

export function BoardFilters({ filters, setFilters, members }) {
  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const active = isFiltering(filters);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-white px-5 py-2.5">
      <SlidersHorizontal className="h-4 w-4 text-slate-400" />
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          value={filters.q}
          onChange={(e) => set('q', e.target.value)}
          placeholder="Rechercher une tâche…"
          className="h-9 w-52 pl-8"
        />
      </div>

      <Select value={filters.assignee} onValueChange={(v) => set('assignee', v)}>
        <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Assigné" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les assignés</SelectItem>
          <SelectItem value="none">Non assigné</SelectItem>
          {members.map((m) => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.priority} onValueChange={(v) => set('priority', v)}>
        <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Priorité" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toute priorité</SelectItem>
          {TASK_PRIORITY_ORDER.map((p) => <SelectItem key={p} value={p}>{TASK_PRIORITY[p].label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.type} onValueChange={(v) => set('type', v)}>
        <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tout type</SelectItem>
          {TASK_TYPE_ORDER.map((t) => <SelectItem key={t} value={t}>{TASK_TYPE[t].label}</SelectItem>)}
        </SelectContent>
      </Select>

      {active && (
        <Button variant="ghost" size="sm" className="text-slate-500" onClick={() => setFilters(EMPTY_FILTERS)}>
          <X className="h-4 w-4" /> Réinitialiser
        </Button>
      )}
    </div>
  );
}
