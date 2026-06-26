import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus, Calendar, Gauge, Trello, FolderKanban, AlertTriangle, CheckCircle2, Columns3 } from 'lucide-react';
import { usePageHeader } from '@/components/layout/AppShell';
import { useProject } from '@/lib/project';
import { useAuth, canModifyTask, can, isProjectMember } from '@/lib/auth';
import { useBoard } from '@/hooks/useProjects';
import { useCapacity } from '@/hooks/useSprints';
import { useMoveTask } from '@/hooks/useTasks';
import { apiError } from '@/lib/api';
import { formatRange } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { statusColor } from '@/components/common/badges';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoader, ErrorState, EmptyState } from '@/components/common/states';
import { BoardSkeleton } from '@/components/common/skeletons';
import { SortableTask, TaskCard } from './TaskCard';
import { TaskDialog } from './TaskDialog';
import { BoardFilters, EMPTY_FILTERS, matchesFilters, isFiltering } from './BoardFilters';
import { StatusManagerDialog } from './StatusManagerDialog';

export default function BoardPage() {
  const { currentProject, projectId, isLoading: projectsLoading } = useProject();
  const { user } = useAuth();
  usePageHeader('Tableau Kanban', currentProject ? `${currentProject.name} · sprint actif` : '');

  const { data, isLoading, isError, error, refetch } = useBoard(projectId);
  const capacity = useCapacity(data?.activeSprint?._id);
  const move = useMoveTask();

  const [cols, setCols] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [dialogTaskId, setDialogTaskId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Synchronise l'état local depuis le serveur quand on ne drague pas.
  useEffect(() => {
    if (data?.columns && !activeTask) setCols(data.columns);
  }, [data, activeTask]);

  if (projectsLoading) return <PageLoader />;
  if (!projectId) {
    return (
      <div className="p-6">
        <EmptyState
          icon={FolderKanban}
          title="Aucun projet"
          description={
            can(user, 'project.manage')
              ? 'Créez un projet ou ajoutez-vous comme membre pour afficher le tableau.'
              : 'Demandez à un manager de vous ajouter à un projet pour afficher le tableau.'
          }
          action={
            can(user, 'project.manage')
              ? <Button asChild><Link to="/settings?tab=projects"><FolderKanban className="h-4 w-4" /> Gérer les projets</Link></Button>
              : null
          }
        />
      </div>
    );
  }
  if (isError) return <div className="p-6"><ErrorState error={apiError(error)} onRetry={refetch} /></div>;
  if (isLoading || !data) return <BoardSkeleton />;

  const statuses = data.statuses || [];
  const statusKeys = statuses.map((s) => s.key);
  const canConfigure =
    can(user, 'status.manage') &&
    (can(user, 'project.manage.any') || isProjectMember(currentProject, user?._id));

  if (!data.activeSprint) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Trello}
          title="Aucun sprint actif"
          description="Démarrez un sprint pour afficher le tableau Kanban de ce projet."
          action={<Button asChild><Link to="/planning"><Gauge className="h-4 w-4" /> Aller à la planification</Link></Button>}
        />
      </div>
    );
  }

  const board = cols || data.columns;
  const filtering = isFiltering(filters);
  // Vue filtrée (le drag&drop continue d'opérer sur `board` complet).
  const viewBoard = filtering
    ? statusKeys.reduce((acc, k) => ({ ...acc, [k]: (board[k] || []).filter((t) => matchesFilters(t, filters, currentProject?.key)) }), {})
    : board;

  function findContainer(id) {
    if (id in board) return id;
    return statusKeys.find((k) => (board[k] || []).some((t) => t._id === id));
  }

  function onDragStart({ active }) {
    const col = findContainer(active.id);
    setActiveTask(board[col]?.find((t) => t._id === active.id) || null);
  }

  function onDragOver({ active, over }) {
    if (!over) return;
    const from = findContainer(active.id);
    const to = findContainer(over.id);
    if (!from || !to || from === to) return;
    setCols((prev) => {
      const cur = prev || data.columns;
      const fromItems = cur[from];
      const toItems = cur[to];
      const moved = fromItems.find((t) => t._id === active.id);
      if (!moved) return cur;
      const overIndex = over.id in cur ? toItems.length : toItems.findIndex((t) => t._id === over.id);
      const idx = overIndex < 0 ? toItems.length : overIndex;
      return {
        ...cur,
        [from]: fromItems.filter((t) => t._id !== active.id),
        [to]: [...toItems.slice(0, idx), moved, ...toItems.slice(idx)],
      };
    });
  }

  async function onDragEnd({ active, over }) {
    setActiveTask(null);

    let toStatus = null;
    let order = 0;
    if (over) {
      if (over.id in board) {
        toStatus = over.id;
        order = board[toStatus].length;
      } else {
        toStatus = statusKeys.find((k) => (board[k] || []).some((t) => t._id === over.id));
        if (toStatus) {
          const i = board[toStatus].findIndex((t) => t._id === over.id);
          order = i < 0 ? board[toStatus].length : i;
        }
      }
    }
    // Repli : position courante de la carte (déplacée en live par onDragOver).
    if (!toStatus) {
      toStatus = statusKeys.find((k) => (board[k] || []).some((t) => t._id === active.id));
      order = toStatus ? Math.max(0, board[toStatus].findIndex((t) => t._id === active.id)) : 0;
    }
    if (!toStatus) return;

    try {
      await move.mutateAsync({ id: active.id, status: toStatus, order });
    } catch (err) {
      toast.error(apiError(err));
      refetch();
    }
  }

  async function onQuickStatus(taskId, status) {
    try {
      await move.mutateAsync({ id: taskId, status });
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  const totalTasks = statusKeys.reduce((s, k) => s + (viewBoard[k]?.length || 0), 0);

  return (
    <div className="flex h-full flex-col">
      {/* Barre de sprint */}
      <div className="flex flex-wrap items-center gap-3 border-b bg-white px-5 py-3">
        <Badge className="bg-emerald-100 text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Sprint actif
        </Badge>
        <span className="font-semibold text-slate-900">{data.activeSprint.name}</span>
        <span className="flex items-center gap-1 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5" /> {formatRange(data.activeSprint.startDate, data.activeSprint.endDate)}
        </span>

        {capacity.data && <CapacityMeter cap={capacity.data} />}

        <div className="ml-auto flex items-center gap-2">
          {canConfigure && (
            <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
              <Columns3 className="h-4 w-4" /> Colonnes
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link to="/planning"><Gauge className="h-4 w-4" /> Capacité</Link>
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Tâche
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <BoardFilters filters={filters} setFilters={setFilters} members={currentProject?.members || []} />

      {/* Colonnes */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
        <div className="flex flex-1 gap-4 overflow-x-auto p-5">
          {statuses.map((s) => (
            <Column
              key={s.key}
              meta={s}
              tasks={viewBoard[s.key] || []}
              statuses={statuses}
              user={user}
              project={currentProject}
              projectKey={currentProject?.key}
              onOpenTask={setDialogTaskId}
              onAdd={() => setCreateOpen(true)}
              onQuickStatus={onQuickStatus}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="rotate-2 cursor-grabbing rounded-xl shadow-xl ring-1 ring-primary/30">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {totalTasks === 0 && (
        <p className="px-5 pb-4 text-xs text-slate-400">
          {filtering ? 'Aucune tâche ne correspond aux filtres.' : "Aucune tâche dans ce sprint pour l'instant."}
        </p>
      )}

      <TaskDialog open={!!dialogTaskId} onOpenChange={(o) => !o && setDialogTaskId(null)} taskId={dialogTaskId} />
      <TaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaults={{ sprint: data.activeSprint._id }}
      />
      <StatusManagerDialog open={configOpen} onOpenChange={setConfigOpen} projectId={projectId} />
    </div>
  );
}

/** Jauge compacte engagé/disponible avec alerte de surcharge, pour la barre du sprint. */
function CapacityMeter({ cap }) {
  const { committedHours, availableCapacityHours, overload, overloadHours, utilizationRate } = cap;
  const pct = availableCapacityHours > 0 ? Math.min(Math.round((committedHours / availableCapacityHours) * 100), 100) : committedHours > 0 ? 100 : 0;
  return (
    <Link to="/planning" className="group flex items-center gap-2" title="Voir le détail de la capacité">
      <div className="hidden w-44 sm:block">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-medium">Capacité</span>
          <span className={cn(overload && 'font-semibold text-red-600')}>
            {committedHours} / {availableCapacityHours} h
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div className={cn('h-full rounded-full transition-all', overload ? 'bg-red-500' : 'bg-emerald-500')} style={{ width: `${pct}%` }} />
        </div>
      </div>
      {overload ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">
          <AlertTriangle className="h-3.5 w-3.5" /> Surcharge +{overloadHours} h
        </span>
      ) : (
        <span className="hidden items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 md:inline-flex">
          <CheckCircle2 className="h-3.5 w-3.5" /> {utilizationRate ?? 0}%
        </span>
      )}
    </Link>
  );
}

function Column({ meta, tasks, statuses, user, project, projectKey, onOpenTask, onAdd, onQuickStatus }) {
  const { setNodeRef, isOver } = useDroppable({ id: meta.key });
  const dot = statusColor(meta.color).dot;
  const hours = tasks.reduce((s, t) => s + (t.estimate || 0), 0);

  return (
    <div className="flex w-80 shrink-0 flex-col rounded-xl bg-slate-100/70">
      <div className="flex items-center gap-2 px-3 py-3">
        <span className={cn('h-2 w-2 rounded-full', dot)} />
        <span className="text-sm font-semibold text-slate-700">{meta.label}</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">{tasks.length}</span>
        <span className="ml-auto text-xs text-slate-400">{hours} h</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn('thin-scroll flex-1 space-y-2.5 overflow-y-auto px-2.5 pb-2.5 transition', isOver && 'bg-slate-200/40')}
      >
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTask
              key={task._id}
              task={task}
              statuses={statuses}
              projectKey={projectKey}
              onClick={() => onOpenTask(task._id)}
              disabled={!canModifyTask(user, project, task)}
              onQuickStatus={onQuickStatus}
            />
          ))}
        </SortableContext>
        <button
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-400 transition hover:border-primary/40 hover:text-primary"
        >
          <Plus className="h-4 w-4" /> Ajouter
        </button>
      </div>
    </div>
  );
}
