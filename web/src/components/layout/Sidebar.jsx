import { NavLink } from 'react-router-dom';
import {
  Trello,
  Gauge,
  SquareCheckBig,
  CalendarDays,
  LayoutDashboard,
  Users,
  Settings,
  Waves,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, isManagerOrAdmin } from '@/lib/auth';

const NAV = [
  { to: '/board', label: 'Tableau', icon: Trello },
  { to: '/planning', label: 'Planification', icon: Gauge },
  { to: '/my-tasks', label: 'Mes tâches', icon: SquareCheckBig },
  { to: '/leaves', label: 'Congés', icon: CalendarDays },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/team', label: 'Équipe', icon: Users, roles: ['manager', 'admin'] },
  { to: '/settings', label: 'Paramétrage', icon: Settings, roles: ['manager', 'admin'] },
];

export function SidebarContent({ onNavigate }) {
  const { user } = useAuth();
  const items = NAV.filter((n) => !n.roles || n.roles.includes(user?.role));

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Waves className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold leading-tight text-slate-900">Cadence</div>
          <div className="text-[11px] leading-tight text-slate-400">Devox · Agile</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map(({ to, label, icon: Icon, adminOnly }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                isActive
                  ? 'bg-accent font-medium text-accent-foreground'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            <span>{label}</span>
            {adminOnly && (
              <span className="ml-auto text-[10px] uppercase tracking-wide text-slate-400">admin</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3 text-[11px] text-slate-400">
        {isManagerOrAdmin(user) ? 'Espace pilotage' : 'Espace équipe'}
      </div>
    </div>
  );
}
