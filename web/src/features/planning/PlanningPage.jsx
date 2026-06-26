import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Calendar, Play, FlagOff, Pencil, ArrowRightToLine, X, ListTodo, Gauge, ChevronRight } from 'lucide-react';
import { usePageHeader } from '@/components/layout/AppShell';
import { useProject } from '@/lib/project';
import { useAuth, can } from '@/lib/auth';
import { useSprints, useStartSprint, useCompleteSprint } from '@/hooks/useSprints';
import { useTasks, useMoveTask } from '@/hooks/useTasks';
import { apiError } from '@/lib/api';
import { formatRange } from '@/lib/dates';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { TypeTag, PriorityTag, SprintStatusBadge } from '@/components/common/badges';
import { Avatar } from '@/components/common/Avatar';
import { PageLoader, ErrorState, EmptyState } from '@/components/common/states';
import { TableSkeleton } from '@/components/common/skeletons';
import { RoleGate } from '@/components/layout/RoleGate';
import { SPRINT_STATUS } from '@/lib/constants';
import { cn, taskCode } from '@/lib/utils';
import { TaskDialog } from '@/features/board/TaskDialog';
import { CapacityPanel } from '@/features/sprints/CapacityPanel';
import { SprintForm } from '@/features/sprints/SprintForm';

export default function PlanningPage() {
  const { currentProject, projectId, isLoading: projectsLoading } = useProject();
  const { user } = useAuth();
  usePageHeader('Planification', currentProject?.name);

  const sprintsQ = useSprints(projectId);
  const sprints = sprintsQ.data || [];

  const [selectedId, setSelectedId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [openTaskId, setOpenTaskId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editSprint, setEditSprint] = useState(null);
  const [showCapDetail, setShowCapDetail] = useState(false);

  const startSprint = useStartSprint();
  const completeSprint = useCompleteSprint();
  const move = useMoveTask();

  const backlogQ = useTasks({ project: projectId, sprint: 'null', enabled: !!projectId });
  const sprintTasksQ = useTasks({ project: projectId, sprint: selectedId, enabled: !!selectedId });

  // Sélection par défaut : sprint actif, sinon premier planifié, sinon premier.
  useEffect(() => {
    if (!sprints.length) return;
    if (selectedId && sprints.some((s) => s._id === selectedId)) return;
    const def = sprints.find((s) => s.status === 'active') || sprints.find((s) => s.status === 'planned') || sprints[0];
    setSelectedId(def._id);
  }, [sprints, selectedId]);

  const selected = sprints.find((s) => s._id === selectedId) || null;
  const canManage = can(user, 'sprint.manage');
  const canPlan = selected && selected.status !== 'completed';

  async function planTask(taskId) {
    if (!canPlan) return;
    try {
      await move.mutateAsync({ id: taskId, sprint: selectedId });
      toast.success(`Ajoutée à « ${selected.name} ».`);
    } catch (err) {
      toast.error(apiError(err));
    }
  }
  async function unplanTask(taskId) {
    try {
      await move.mutateAsync({ id: taskId, sprint: null });
      toast.success('Renvoyée au backlog.');
    } catch (err) {
      toast.error(apiError(err));
    }
  }
  async function onStart() {
    try { await startSprint.mutateAsync(selectedId); toast.success('Sprint démarré.'); }
    catch (err) { toast.error(apiError(err)); }
  }
  async function onComplete() {
    try {
      const res = await completeSprint.mutateAsync(selectedId);
      toast.success(`Sprint clôturé.${res.unfinishedTasks ? ` ${res.unfinishedTasks} tâche(s) non terminée(s).` : ''}`);
    } catch (err) { toast.error(apiError(err)); }
  }

  if (projectsLoading) return <PageLoader />;
  if (!projectId)
    return <div className="p-6"><EmptyState icon={Calendar} title="Aucun projet" description="Créez un projet (ou demandez à y être ajouté) pour planifier." /></div>;
  if (sprintsQ.isError) return <div className="p-6"><ErrorState error={apiError(sprintsQ.error)} onRetry={sprintsQ.refetch} /></div>;
  if (sprintsQ.isLoading) return <PageLoader />;

  const backlog = backlogQ.data || [];
  const backlogHours = backlog.reduce((s, t) => s + (t.estimate || 0), 0);
  const sprintTasks = sprintTasksQ.data || [];

  return (
    <div className="p-6">
      {/* Barre : sélection du sprint + cycle de vie */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {sprints.length > 0 ? (
          <>
            <Select value={selectedId || ''} onValueChange={setSelectedId}>
              <SelectTrigger className="w-auto min-w-[260px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {sprints.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name} — {SPRINT_STATUS[s.status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar className="h-3.5 w-3.5" /> {formatRange(selected.startDate, selected.endDate)}
              </span>
            )}
            {selected && <SprintStatusBadge status={selected.status} />}
          </>
        ) : (
          <span className="text-sm text-slate-500">Aucun sprint pour ce projet.</span>
        )}

        <RoleGate permission="sprint.manage">
          <div className="ml-auto flex items-center gap-2">
            {selected && selected.status === 'planned' && (
              <Button size="sm" variant="secondary" onClick={onStart} disabled={startSprint.isPending}>
                <Play className="h-4 w-4" /> Démarrer
              </Button>
            )}
            {selected && selected.status === 'active' && (
              <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={onComplete} disabled={completeSprint.isPending}>
                <FlagOff className="h-4 w-4" /> Clôturer
              </Button>
            )}
            {selected && (
              <Button size="sm" variant="outline" onClick={() => { setEditSprint(selected); setFormOpen(true); }}>
                <Pencil className="h-4 w-4" /> Modifier
              </Button>
            )}
            <Button size="sm" onClick={() => { setEditSprint(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" /> Sprint
            </Button>
          </div>
        </RoleGate>
      </div>

      {!sprints.length ? (
        <EmptyState
          icon={Gauge}
          title="Commencez par créer un sprint"
          description="Un sprint vous permet de planifier des tâches et de suivre la capacité de l'équipe."
          action={<RoleGate permission="sprint.manage"><Button onClick={() => { setEditSprint(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Nouveau sprint</Button></RoleGate>}
        />
      ) : (
        <>
        {selected && (
          <div className="mb-6 space-y-3">
            <CapacityPanel sprintId={selected._id} compact />
            <div>
              <button
                type="button"
                onClick={() => setShowCapDetail((v) => !v)}
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                <ChevronRight className={cn('h-4 w-4 transition-transform', showCapDetail && 'rotate-90')} />
                Détail par membre &amp; absences
              </button>
              {showCapDetail && (
                <div className="mt-3">
                  <CapacityPanel sprintId={selected._id} detailOnly />
                </div>
              )}
            </div>
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Backlog */}
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-base font-semibold text-slate-900">Backlog</h2>
              {!backlogQ.isLoading && (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {backlog.length} tâches · {backlogHours} h
                </span>
              )}
              <Button size="sm" className="ml-auto" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> Tâche
              </Button>
            </div>

            {backlogQ.isLoading ? (
              <TableSkeleton rows={4} cols={5} />
            ) : !backlog.length ? (
              <EmptyState icon={ListTodo} title="Backlog vide" description="Créez des tâches, puis ajoutez-les au sprint sélectionné." />
            ) : (
              <Card className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tâche</TableHead>
                      <TableHead>Est.</TableHead>
                      <TableHead className="text-right">Planifier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backlog.map((t) => (
                      <TableRow key={t._id} className="cursor-pointer" onClick={() => setOpenTaskId(t._id)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {taskCode(t, currentProject?.key) && <span className="font-mono text-[10px] text-slate-400">{taskCode(t, currentProject?.key)}</span>}
                            <TypeTag type={t.type} withLabel={false} />
                            <span className="font-medium text-slate-800">{t.title}</span>
                            <PriorityTag priority={t.priority} />
                            {t.assignee && <Avatar name={t.assignee.name} id={t.assignee._id} size="xs" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">{t.estimate || 0} h</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <SimpleTooltip label={canPlan ? `Ajouter à « ${selected.name} »` : 'Sélectionnez un sprint non clôturé'}>
                            <Button size="sm" variant="outline" onClick={() => planTask(t._id)} disabled={!canPlan || move.isPending}>
                              <ArrowRightToLine className="h-3.5 w-3.5" /> Planifier
                            </Button>
                          </SimpleTooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
            <p className="mt-3 text-xs text-slate-400">
              « Planifier » ajoute la tâche au sprint sélectionné ci-dessus. La capacité se met à jour aussitôt.
            </p>
          </div>

          {/* Tâches du sprint sélectionné */}
          <div className="min-w-0">
            {selected ? (
                <Card className="p-0">
                  <div className="flex items-center gap-2 border-b px-4 py-3">
                    <h3 className="text-sm font-semibold text-slate-900">Tâches du sprint</h3>
                    {!sprintTasksQ.isLoading && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{sprintTasks.length}</span>
                    )}
                  </div>
                  {sprintTasksQ.isLoading ? (
                    <div className="p-4"><PageLoader className="py-4" /></div>
                  ) : !sprintTasks.length ? (
                    <p className="p-4 text-sm text-slate-400">Aucune tâche planifiée. Ajoutez-en depuis le backlog.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {sprintTasks.map((t) => (
                        <li key={t._id} className="flex items-center gap-2 px-4 py-2.5">
                          <button className="min-w-0 flex-1 text-left" onClick={() => setOpenTaskId(t._id)}>
                            <div className="flex items-center gap-2">
                              {taskCode(t, currentProject?.key) && <span className="font-mono text-[10px] text-slate-400">{taskCode(t, currentProject?.key)}</span>}
                              <TypeTag type={t.type} withLabel={false} />
                              <span className="truncate text-sm font-medium text-slate-800">{t.title}</span>
                            </div>
                          </button>
                          <span className="shrink-0 text-xs text-slate-500">{t.estimate || 0} h</span>
                          {canPlan && (
                            <SimpleTooltip label="Renvoyer au backlog">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => unplanTask(t._id)} disabled={move.isPending}>
                                <X className="h-4 w-4" />
                              </Button>
                            </SimpleTooltip>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
            ) : (
              <EmptyState title="Sélectionnez un sprint" description="Choisissez un sprint pour voir sa capacité." />
            )}
          </div>
        </div>
        </>
      )}

      <TaskDialog open={!!openTaskId} onOpenChange={(o) => !o && setOpenTaskId(null)} taskId={openTaskId} />
      <TaskDialog open={createOpen} onOpenChange={setCreateOpen} />
      <SprintForm open={formOpen} onOpenChange={setFormOpen} projectId={projectId} sprint={editSprint} />
    </div>
  );
}
