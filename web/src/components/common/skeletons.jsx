import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { TASK_STATUS, TASK_STATUS_ORDER } from '@/lib/constants';
import { cn } from '@/lib/utils';

/** Squelette du tableau Kanban (4 colonnes + cartes). */
export function BoardSkeleton() {
  return (
    <div className="flex flex-1 gap-4 overflow-hidden p-5">
      {TASK_STATUS_ORDER.map((status) => (
        <div key={status} className="flex w-80 shrink-0 flex-col rounded-xl bg-slate-100/70">
          <div className="flex items-center gap-2 px-3 py-3">
            <span className={cn('h-2 w-2 rounded-full', TASK_STATUS[status].dot)} />
            <span className="text-sm font-semibold text-slate-500">{TASK_STATUS[status].label}</span>
          </div>
          <div className="space-y-2.5 px-2.5 pb-2.5">
            {Array.from({ length: status === 'todo' ? 3 : 2 }).map((_, i) => (
              <Card key={i} className="p-3">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="mt-2.5 h-4 w-4/5" />
                <div className="mt-3 flex items-center gap-2">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="ml-auto h-6 w-6 rounded-full" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Squelette de table générique. */
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <Card className="p-0">
      <div className="border-b px-4 py-3">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="h-8 w-8 rounded-full" />
            {Array.from({ length: cols - 1 }).map((_, c) => (
              <Skeleton key={c} className={cn('h-4', c === 0 ? 'flex-1' : 'w-16')} />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Squelette de grille de cartes (projets). */
export function CardsSkeleton({ count = 3 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-2/3" />
          <div className="mt-4 flex gap-3 border-t pt-3">
            <Skeleton className="h-4 w-24" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/** Squelette de liste verticale (sprints). */
export function ListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-3.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-3 w-28" />
          <Skeleton className="mt-1.5 h-3 w-3/4" />
        </Card>
      ))}
    </div>
  );
}
