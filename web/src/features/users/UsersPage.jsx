import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Pencil, Loader2, Plus, X, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth, can } from '@/lib/auth';
import { useUsers, useUpdateUser } from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useRoles';
import { apiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { WEEKDAYS } from '@/lib/constants';

/** Heures travaillées par semaine = capacité/jour × nombre de jours travaillés. */
function weeklyHours(u) {
  return (u.dailyCapacityHours || 0) * (u.workingDays?.length || 0);
}
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Avatar } from '@/components/common/Avatar';
import { RoleBadge } from '@/components/common/badges';
import { PageLoader, ErrorState } from '@/components/common/states';
import { UserFormDialog } from './UserFormDialog';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { KeyRound } from 'lucide-react';

export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin = can(user, 'user.manage');
  const [roleFilter, setRoleFilter] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const { data: users = [], isLoading, isError, error, refetch } = useUsers(roleFilter !== 'all' ? { role: roleFilter } : {});
  const { data: roles = [] } = useRoles();
  const update = useUpdateUser();

  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState(null);

  // Recherche (nom/email) + pagination, côté client sur la liste chargée.
  const PAGE_SIZE = 8;
  const filtered = users.filter((u) => {
    const t = q.trim().toLowerCase();
    return !t || u.name?.toLowerCase().includes(t) || u.email?.toLowerCase().includes(t);
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageUsers = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  // Revenir à la 1re page quand la recherche/filtre change ou que la liste raccourcit.
  useEffect(() => {
    setPage(0);
  }, [q, roleFilter]);
  useEffect(() => {
    setPage((p) => (p >= pageCount ? 0 : p));
  }, [pageCount]);

  useEffect(() => {
    if (selected) {
      setForm({
        name: selected.name,
        role: selected.role,
        dailyCapacityHours: selected.dailyCapacityHours,
        workingDays: selected.workingDays || [1, 2, 3, 4, 5],
      });
    }
  }, [selected]);

  function toggleDay(d) {
    setForm((f) => {
      const has = f.workingDays.includes(d);
      return { ...f, workingDays: has ? f.workingDays.filter((x) => x !== d) : [...f.workingDays, d] };
    });
  }

  async function onSave() {
    try {
      await update.mutateAsync({
        id: selected._id,
        name: form.name,
        role: form.role,
        dailyCapacityHours: Number(form.dailyCapacityHours) || 0,
        workingDays: form.workingDays,
      });
      toast.success('Utilisateur mis à jour.');
      setSelected(null);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  if (isLoading) return <PageLoader />;
  if (isError) return <div className="p-6"><ErrorState error={apiError(error)} onRetry={refetch} /></div>;

  const totalWeekly = filtered.reduce((s, u) => s + weeklyHours(u), 0);

  return (
    <div className={cn('grid gap-6 p-6', isAdmin && 'lg:grid-cols-[1fr_360px]')}>
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold text-slate-900">Société</h2>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
            {filtered.length} membre{filtered.length > 1 ? 's' : ''} · {totalWeekly} h capacité/sem cumulée
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (nom, email)…" className="h-9 w-56 pl-8" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {roles.map((r) => <SelectItem key={r._id} value={r.name}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {isAdmin && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> Nouvel utilisateur
              </Button>
            )}
          </div>
        </div>

        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Jours de travail</TableHead>
                <TableHead>Capacité/sem</TableHead>
                {isAdmin && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!pageUsers.length && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={isAdmin ? 5 : 4} className="py-8 text-center text-sm text-slate-400">
                    Aucun membre ne correspond à la recherche.
                  </TableCell>
                </TableRow>
              )}
              {pageUsers.map((u) => (
                <TableRow key={u._id} className={cn(selected?._id === u._id && 'bg-accent/40')}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} id={u._id} size="md" />
                      <div>
                        <div className="font-medium text-slate-800">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><RoleBadge role={u.role} /></TableCell>
                  <TableCell><DaysMini days={u.workingDays || []} /></TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-800">{weeklyHours(u)} h</div>
                    <div className="text-[11px] text-slate-400">{u.dailyCapacityHours} h/j</div>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setSelected(u)}><Pencil className="h-4 w-4" /></Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {pageCount > 1 && (
          <div className="mt-3 flex items-center justify-between text-sm">
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

      {/* Panneau d'édition (admin uniquement) */}
      {isAdmin && (
      <aside className="lg:sticky lg:top-6 lg:self-start">
        {selected && form ? (
          <Card className="overflow-hidden">
            {/* En-tête identité */}
            <div className="flex items-center gap-3 border-b bg-slate-50 px-5 py-4">
              <Avatar name={selected.name} id={selected._id} size="lg" />
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-900">{selected.name}</div>
                <div className="truncate text-xs text-slate-400">{selected.email}</div>
                <div className="mt-1"><RoleBadge role={selected.role} /></div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="ml-auto self-start rounded-md p-1 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-600"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="space-y-1.5">
                <Label>Nom</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Rôle</Label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => <SelectItem key={r._id} value={r.name}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Capacité quotidienne</Label>
                <div className="relative">
                  <Input type="number" min="0" step="0.5" value={form.dailyCapacityHours} onChange={(e) => setForm((f) => ({ ...f, dailyCapacityHours: e.target.value }))} className="pr-8" />
                  <span className="pointer-events-none absolute right-3 top-2 text-xs text-slate-400">h</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Jours de travail</Label>
                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAYS.map((d) => {
                    const on = form.workingDays.includes(d.value);
                    return (
                      <button
                        key={d.value}
                        type="button"
                        title={d.label}
                        onClick={() => toggleDay(d.value)}
                        className={cn(
                          'rounded-lg border py-2 text-xs font-medium transition',
                          on ? 'border-primary/40 bg-accent text-accent-foreground' : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                        )}
                      >
                        {d.short}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-accent px-3 py-2.5 text-sm">
                <span className="flex items-center gap-1.5 text-accent-foreground"><Clock className="h-4 w-4" /> Capacité/semaine</span>
                <span className="font-semibold text-accent-foreground">
                  {(Number(form.dailyCapacityHours) || 0) * form.workingDays.length} h
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <Button className="flex-1" onClick={onSave} disabled={update.isPending}>
                  {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
                </Button>
                <Button variant="outline" onClick={() => setSelected(null)}>Annuler</Button>
              </div>

              <div className="border-t pt-3">
                <Button variant="outline" className="w-full text-slate-600" onClick={() => setResetUser(selected)}>
                  <KeyRound className="h-4 w-4" /> Réinitialiser le mot de passe
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="grid place-items-center gap-2 p-10 text-center">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-400">
              <Pencil className="h-5 w-5" />
            </div>
            <p className="text-sm text-slate-500">Sélectionnez un membre pour modifier son rôle, sa capacité et ses jours de travail.</p>
          </Card>
        )}
      </aside>
      )}

      <UserFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ResetPasswordDialog open={!!resetUser} onOpenChange={(o) => !o && setResetUser(null)} user={resetUser} />
    </div>
  );
}

/** Pastilles des jours travaillés (L M M J V S D). */
function DaysMini({ days }) {
  return (
    <div className="flex gap-1">
      {WEEKDAYS.map((d) => {
        const on = days.includes(d.value);
        return (
          <span
            key={d.value}
            title={d.label}
            className={cn(
              'grid h-5 w-5 place-items-center rounded text-[10px] font-medium',
              on ? 'bg-accent text-accent-foreground' : 'bg-slate-100 text-slate-300'
            )}
          >
            {d.short}
          </span>
        );
      })}
    </div>
  );
}

