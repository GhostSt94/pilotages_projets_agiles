import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Users, FolderKanban, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { usePageHeader } from '@/components/layout/AppShell';
import { useProject as useCurrentProject } from '@/lib/project';
import { useProject as useProjectDetail, useAddMember, useRemoveMember } from '@/hooks/useProjects';
import { useUsers, useUsersWorkload } from '@/hooks/useUsers';
import { useAuth, can } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Avatar } from '@/components/common/Avatar';
import { RoleBadge } from '@/components/common/badges';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageLoader, ErrorState, EmptyState } from '@/components/common/states';

const weekly = (m) => (m.dailyCapacityHours || 0) * (m.workingDays?.length || 0);

export default function TeamPage() {
  const { currentProject, projectId, isLoading: projectsLoading } = useCurrentProject();
  const { user } = useAuth();
  const canManage = can(user, 'project.manage');
  usePageHeader('Équipe', currentProject?.name);

  const { data: project, isLoading, isError, error, refetch } = useProjectDetail(projectId);
  const { data: workload = [] } = useUsersWorkload(projectId ? { project: projectId } : {});
  const { data: allUsers = [] } = useUsers();

  const addMember = useAddMember();
  const removeMember = useRemoveMember();
  const [toAdd, setToAdd] = useState('');
  const [toRemove, setToRemove] = useState(null);

  if (projectsLoading) return <PageLoader />;
  if (!projectId) {
    return (
      <div className="p-6">
        <EmptyState icon={FolderKanban} title="Aucun projet" description="Sélectionnez un projet (sélecteur en haut) pour voir son équipe." />
      </div>
    );
  }
  if (isError) return <div className="p-6"><ErrorState error={apiError(error)} onRetry={refetch} /></div>;
  if (isLoading || !project) return <PageLoader />;

  const doneByUser = Object.fromEntries(workload.map((w) => [String(w.user), w.doneHours]));
  const realized = (m) => doneByUser[String(m._id)] || 0;
  const managerId = String(project.manager?._id || project.manager || '');
  const members = project.members || [];
  const memberIds = new Set(members.map((m) => String(m._id)));
  const candidates = allUsers.filter((u) => !memberIds.has(String(u._id)));

  const totalWeekly = members.reduce((s, m) => s + weekly(m), 0);
  const totalRealized = members.reduce((s, m) => s + realized(m), 0);

  async function onAdd() {
    if (!toAdd) return;
    try {
      await addMember.mutateAsync({ id: projectId, userId: toAdd });
      setToAdd('');
      toast.success('Membre ajouté à l\'équipe.');
    } catch (err) {
      toast.error(apiError(err));
    }
  }
  async function onConfirmRemove() {
    try {
      await removeMember.mutateAsync({ id: projectId, userId: toRemove._id });
      toast.success('Membre retiré de l\'équipe.');
      setToRemove(null);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-base font-semibold text-slate-900">Équipe du projet</h2>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
          {members.length} membres · {totalWeekly} h capacité/sem · {totalRealized} h estimées (terminé)
        </span>
      </div>

      <p className="mb-4 text-sm text-slate-500">
        Membres affectés à <span className="font-medium text-slate-700">{project.name}</span>. L'« Estimé (terminé) »
        est la somme des estimations des tâches terminées de ce projet (pas un temps réellement saisi).
      </p>

      {/* Ajout d'un membre (manager/admin) */}
      {canManage && (
        <Card className="mb-4 flex flex-wrap items-center gap-2 p-3">
          <UserPlus className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-slate-700">Ajouter un membre</span>
          <Select value={toAdd} onValueChange={setToAdd}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Choisir un utilisateur…" /></SelectTrigger>
            <SelectContent>
              {candidates.length ? (
                candidates.map((u) => (
                  <SelectItem key={u._id} value={u._id}>{u.name} · {u.email}</SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>Tous les utilisateurs sont déjà membres</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={onAdd} disabled={!toAdd || addMember.isPending}>
            {addMember.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Ajouter
          </Button>
        </Card>
      )}

      {!members.length ? (
        <EmptyState
          icon={Users}
          title="Aucun membre sur ce projet"
          description={canManage ? 'Ajoutez un membre avec le sélecteur ci-dessus.' : 'Aucun membre affecté pour le moment.'}
        />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead>Rôle sur le projet</TableHead>
                <TableHead>Capacité/sem</TableHead>
                <TableHead>Estimé (terminé)</TableHead>
                {canManage && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m._id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={m.name} id={m._id} size="md" />
                      <div>
                        <div className="font-medium text-slate-800">{m.name}</div>
                        <div className="text-xs text-slate-400">{m.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {String(m._id) === managerId ? (
                      <Badge className="bg-indigo-100 text-indigo-700">Chef de projet</Badge>
                    ) : (
                      <RoleBadge role={m.role} />
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800">{weekly(m)} h</TableCell>
                  <TableCell className="text-slate-600">{realized(m)} h</TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      {String(m._id) === managerId ? (
                        <span className="text-xs text-slate-300">—</span>
                      ) : (
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500" title="Retirer du projet" onClick={() => setToRemove(m)} disabled={removeMember.isPending}>
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <p className="mt-3 text-xs text-slate-400">
        Astuce : les comptes (rôle global, capacité, jours de travail) se gèrent dans{' '}
        <Link to="/users" className="font-medium text-primary hover:underline">Société</Link>.
      </p>

      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(o) => !o && setToRemove(null)}
        title="Retirer ce membre ?"
        description={`« ${toRemove?.name || ''} » sera retiré de l'équipe du projet. Son compte n'est pas supprimé.`}
        destructive
        confirmLabel="Retirer"
        loading={removeMember.isPending}
        onConfirm={onConfirmRemove}
      />
    </div>
  );
}
