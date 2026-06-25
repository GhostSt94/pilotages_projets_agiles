import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bell, CheckCheck, CalendarClock, CheckCircle2, XCircle, SquareCheckBig, Rocket } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/useNotifications';

// Icône + teinte par type de notification.
const ICON = {
  leave_requested: { icon: CalendarClock, tint: 'bg-amber-100 text-amber-600' },
  leave_approved: { icon: CheckCircle2, tint: 'bg-emerald-100 text-emerald-600' },
  leave_rejected: { icon: XCircle, tint: 'bg-rose-100 text-rose-600' },
  task_assigned: { icon: SquareCheckBig, tint: 'bg-primary/10 text-primary' },
  sprint_started: { icon: Rocket, tint: 'bg-sky-100 text-sky-600' },
};

function timeAgo(date) {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  } catch {
    return '';
  }
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: count } = useUnreadCount();
  const { data, isLoading } = useNotifications({ limit: 8 }, { enabled: open });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unread = count?.unread || 0;
  const items = data?.items || [];

  function onItemClick(n) {
    if (!n.read) markRead.mutate(n._id);
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <span className="text-sm font-semibold text-slate-800">Notifications</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Tout marquer comme lu
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto thin-scroll">
          {isLoading ? (
            <p className="px-3 py-8 text-center text-sm text-slate-400">Chargement…</p>
          ) : items.length === 0 ? (
            <div className="grid place-items-center gap-2 px-3 py-10 text-center">
              <Bell className="h-7 w-7 text-slate-300" />
              <p className="text-sm text-slate-400">Aucune notification.</p>
            </div>
          ) : (
            items.map((n) => {
              const meta = ICON[n.type] || { icon: Bell, tint: 'bg-slate-100 text-slate-500' };
              const Icon = meta.icon;
              return (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => onItemClick(n)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-50',
                    !n.read && 'bg-accent/40'
                  )}
                >
                  <span className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full', meta.tint)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-slate-800">{n.title}</span>
                      {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    </div>
                    {n.body && <p className="text-xs text-slate-500">{n.body}</p>}
                    <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
