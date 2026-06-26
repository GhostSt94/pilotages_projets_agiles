import { useState } from 'react';
import { SquareCheckBig } from 'lucide-react';
import { usePageHeader } from '@/components/layout/AppShell';
import { useAuth } from '@/lib/auth';
import { useTasks } from '@/hooks/useTasks';
import { apiError } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { StatusBadge, TypeTag, PriorityTag, statusColor } from '@/components/common/badges';
import { PageLoader, ErrorState, EmptyState } from '@/components/common/states';
import { TaskDialog } from '@/features/board/TaskDialog';
import { cn, taskCode } from '@/lib/utils';

export default function MyTasksPage() {
  const { user } = useAuth();
  usePageHeader('Mes tâches', 'Tâches qui me sont assignées');

  const { data: tasks = [], isLoading, isError, error, refetch } = useTasks({ assignee: user?._id });
  const [openId, setOpenId] = useState(null);

  if (isLoading) return <PageLoader />;
  if (isError) return <div className="p-6"><ErrorState error={apiError(error)} onRetry={refetch} /></div>;

  // Regroupe par statut (libellé), tous projets confondus, ordonné par `order`.
  const groupsMap = new Map();
  for (const t of tasks) {
    const m = t.statusMeta || { label: t.status || '—', color: 'slate', order: 99 };
    if (!groupsMap.has(m.label)) groupsMap.set(m.label, { label: m.label, color: m.color, order: m.order ?? 99, items: [] });
    groupsMap.get(m.label).items.push(t);
  }
  const groups = [...groupsMap.values()].sort((a, b) => a.order - b.order);

  return (
    <div className="p-6">
      {!tasks.length ? (
        <EmptyState icon={SquareCheckBig} title="Aucune tâche assignée" description="Les tâches qui vous sont assignées apparaîtront ici." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="mb-2 flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', statusColor(g.color).dot)} />
                <span className="text-sm font-semibold text-slate-700">{g.label}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{g.items.length}</span>
              </div>
              <div className="space-y-2.5">
                {g.items.map((t) => (
                  <Card key={t._id} className="cursor-pointer p-3 transition hover:shadow-md" onClick={() => setOpenId(t._id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {taskCode(t) && <span className="font-mono text-[10px] text-slate-400">{taskCode(t)}</span>}
                        <TypeTag type={t.type} />
                      </div>
                      <PriorityTag priority={t.priority} />
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-800">{t.title}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                      <StatusBadge meta={t.statusMeta} />
                      <span>{t.estimate || 0} h</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskDialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)} taskId={openId} />
    </div>
  );
}
