import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  TASK_STATUS,
  TASK_PRIORITY,
  TASK_TYPE,
  SPRINT_STATUS,
  PROJECT_STATUS,
  LEAVE_STATUS,
  LEAVE_TYPE,
  ROLE,
} from '@/lib/constants';
import { Sparkles, Bug, Wrench } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';

// Palette (clé couleur d'un rôle) → classes de badge.
export const ROLE_COLORS = {
  violet: 'bg-violet-100 text-violet-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  sky: 'bg-sky-100 text-sky-700',
  slate: 'bg-slate-100 text-slate-600',
};

const TYPE_ICONS = { Sparkles, Bug, Wrench };

export function StatusBadge({ status }) {
  const m = TASK_STATUS[status];
  if (!m) return null;
  return (
    <Badge className={m.badge}>
      <span className={cn('h-1.5 w-1.5 rounded-full', m.dot)} />
      {m.label}
    </Badge>
  );
}

export function PriorityTag({ priority }) {
  const m = TASK_PRIORITY[priority];
  if (!m) return null;
  return <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium', m.badge)}>{m.label}</span>;
}

export function TypeTag({ type, withLabel = true }) {
  const m = TASK_TYPE[type];
  if (!m) return null;
  const Icon = TYPE_ICONS[m.icon];
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium', m.color)}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {withLabel && m.label}
    </span>
  );
}

export function SprintStatusBadge({ status }) {
  const m = SPRINT_STATUS[status];
  return m ? <Badge className={m.badge}>{m.label}</Badge> : null;
}

export function ProjectStatusBadge({ status }) {
  const m = PROJECT_STATUS[status];
  return m ? <Badge className={m.badge}>{m.label}</Badge> : null;
}

export function LeaveStatusBadge({ status }) {
  const m = LEAVE_STATUS[status];
  return m ? <Badge className={m.badge}>{m.label}</Badge> : null;
}

export function LeaveTypeLabel({ type }) {
  return <span>{LEAVE_TYPE[type]?.label || type}</span>;
}

export function RoleBadge({ role }) {
  const { data: roles = [] } = useRoles();
  if (!role) return null;
  const r = roles.find((x) => x.name === role);
  const label = r?.label || ROLE[role]?.label || role;
  const cls = (r && ROLE_COLORS[r.color]) || ROLE[role]?.badge || 'bg-slate-100 text-slate-600';
  return <Badge className={cls}>{label}</Badge>;
}
