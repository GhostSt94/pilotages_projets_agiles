import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Check, X, Inbox, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePageHeader } from '@/components/layout/AppShell';
import { useAuth, can } from '@/lib/auth';
import { useLeaves, useApproveLeave, useRejectLeave } from '@/hooks/useLeaves';
import { useUsers } from '@/hooks/useUsers';
import { apiError } from '@/lib/api';
import { formatRange, formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { LEAVE_STATUS } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Avatar } from '@/components/common/Avatar';
import { LeaveStatusBadge, LeaveTypeLabel } from '@/components/common/badges';
import { PageLoader, ErrorState, EmptyState } from '@/components/common/states';
import { TeamCalendar } from './TeamCalendar';
import { LeaveFormDialog } from './LeaveFormDialog';

const PAGE_SIZE = 5;

export default function LeavesPage() {
  const { user } = useAuth();
  const manager = can(user, 'leave.review');
  usePageHeader('Congés & calendrier', manager ? 'Disponibilités et validation de l\'équipe' : 'Mes congés');

  const { data: leaves = [], isLoading, isError, error, refetch } = useLeaves();
  const { data: allUsers = [] } = useUsers({}, { enabled: manager });
  const approve = useApproveLeave();
  const reject = useRejectLeave();

  // Lignes du calendrier : tous les utilisateurs pour un valideur, sinon moi seul.
  const calendarMembers = manager ? allUsers : user ? [user] : [];

  const [formOpen, setFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);

  const pending = leaves.filter((l) => l.status === 'pending');
  const filtered = statusFilter === 'all' ? leaves : leaves.filter((l) => l.status === statusFilter);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => { setPage(0); }, [statusFilter]);
  useEffect(() => { setPage((p) => (p >= pageCount ? 0 : p)); }, [pageCount]);

  async function review(action, id) {
    try {
      await (action === 'approve' ? approve : reject).mutateAsync(id);
      toast.success(action === 'approve' ? 'Congé approuvé.' : 'Congé refusé.');
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  if (isLoading) return <PageLoader />;
  if (isError) return <div className="p-6"><ErrorState error={apiError(error)} onRetry={refetch} /></div>;

  const pageLeaves = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Congés</h2>
        {manager && pending.length > 0 && (
          <Badge className="bg-amber-100 text-amber-700">{pending.length} en attente</Badge>
        )}
        <Button className="ml-auto" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> {manager ? 'Ajouter un congé' : 'Demander un congé'}
        </Button>
      </div>

      {/* Calendrier en vedette */}
      <TeamCalendar leaves={leaves} members={calendarMembers} />

      {/* Listes */}
      <div className={cn('grid gap-6', manager && 'lg:grid-cols-2')}>
        {/* Demandes à valider (valideurs) */}
        {manager && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Inbox className="h-4 w-4 text-primary" /> Demandes à valider
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{pending.length}</span>
            </h3>
            {pending.length ? (
              <Card className="divide-y">
                {pending.map((l) => (
                  <div key={l._id} className="flex flex-wrap items-center gap-3 p-3.5">
                    <Avatar name={l.user?.name} id={l.user?._id} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800">
                        {l.user?.name} <span className="font-normal text-slate-400">· <LeaveTypeLabel type={l.type} /></span>
                      </div>
                      <div className="text-xs text-slate-500">{formatRange(l.startDate, l.endDate)}{l.reason ? ` — ${l.reason}` : ''}</div>
                      <LeaveMeta leave={l} />
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => review('approve', l._id)} disabled={approve.isPending}>
                        <Check className="h-3.5 w-3.5" /> Approuver
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => review('reject', l._id)} disabled={reject.isPending}>
                        <X className="h-3.5 w-3.5" /> Refuser
                      </Button>
                    </div>
                  </div>
                ))}
              </Card>
            ) : (
              <Card className="grid place-items-center py-10 text-center text-sm text-slate-400">Aucune demande en attente.</Card>
            )}
          </div>
        )}

        {/* Tous les congés / Mes congés */}
        <div>
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-900">{manager ? 'Tous les congés' : 'Mes congés'}</h3>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="ml-auto h-8 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">{LEAVE_STATUS.pending.label}</SelectItem>
                <SelectItem value="approved">{LEAVE_STATUS.approved.label}</SelectItem>
                <SelectItem value="rejected">{LEAVE_STATUS.rejected.label}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length ? (
            <>
              <Card className="divide-y">
                {pageLeaves.map((l) => (
                  <div key={l._id} className="flex flex-wrap items-center gap-3 p-3.5">
                    {manager && <Avatar name={l.user?.name} id={l.user?._id} size="sm" />}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-700">
                        {manager ? l.user?.name : <LeaveTypeLabel type={l.type} />}
                        {manager && <span className="font-normal text-slate-400"> · <LeaveTypeLabel type={l.type} /></span>}
                      </div>
                      <div className="text-xs text-slate-500">{formatRange(l.startDate, l.endDate)}{l.reason ? ` — ${l.reason}` : ''}</div>
                      <LeaveMeta leave={l} />
                    </div>
                    <span className="ml-auto shrink-0"><LeaveStatusBadge status={l.status} /></span>
                  </div>
                ))}
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
            </>
          ) : (
            <EmptyState
              icon={Inbox}
              title={statusFilter === 'all' ? 'Aucun congé' : 'Aucun congé pour ce statut'}
              description={statusFilter === 'all' ? 'Déclarez un congé avec le bouton ci-dessus.' : 'Changez de filtre pour voir les autres congés.'}
            />
          )}
        </div>
      </div>

      <LeaveFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}

/** Métadonnées d'un congé : date de demande + date/auteur de la décision. */
function LeaveMeta({ leave }) {
  const decided = leave.status !== 'pending' && leave.reviewedAt;
  return (
    <div className="mt-0.5 text-[11px] text-slate-400">
      Demandé le {formatDate(leave.createdAt)}
      {decided && (
        <>
          {' · '}
          {leave.status === 'approved' ? 'Approuvé' : 'Refusé'} le {formatDate(leave.reviewedAt)}
          {leave.reviewedBy?.name ? ` par ${leave.reviewedBy.name}` : ''}
        </>
      )}
    </div>
  );
}
