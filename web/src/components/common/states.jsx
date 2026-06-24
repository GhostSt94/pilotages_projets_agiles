import { Loader2, Inbox, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PageLoader({ className }) {
  return (
    <div className={cn('grid place-items-center py-20 text-slate-400', className)}>
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-slate-200 bg-white py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-700">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="grid place-items-center rounded-xl border border-red-100 bg-red-50/50 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-red-100 text-red-500">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-700">Impossible de charger les données</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-400">{String(error || '')}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}
