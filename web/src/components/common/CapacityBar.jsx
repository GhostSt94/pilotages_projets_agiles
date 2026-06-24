import { cn } from '@/lib/utils';

/** Barre capacité disponible vs engagée. Vert si OK, rouge si surcharge. */
export function CapacityBar({ available = 0, committed = 0, overload = false }) {
  const pct = available > 0 ? Math.round((committed / available) * 100) : committed > 0 ? 100 : 0;
  return (
    <div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full transition-all', overload ? 'bg-red-500' : 'bg-emerald-500')}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
