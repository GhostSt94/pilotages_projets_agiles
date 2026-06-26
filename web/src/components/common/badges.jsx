import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
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
  blue: 'bg-blue-100 text-blue-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  teal: 'bg-teal-100 text-teal-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  sky: 'bg-sky-100 text-sky-700',
  slate: 'bg-slate-100 text-slate-600',
  // alias hérités (anciens rôles) → rendus en teintes froides (pas d'indigo/violet)
  indigo: 'bg-blue-100 text-blue-700',
  violet: 'bg-slate-200 text-slate-700',
};

const TYPE_ICONS = { Sparkles, Bug, Wrench };

// Palette (clé couleur d'un statut) → classes de badge + pastille.
export const STATUS_COLORS = {
  slate: { badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  blue: { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  sky: { badge: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  cyan: { badge: 'bg-cyan-100 text-cyan-700', dot: 'bg-cyan-500' },
  teal: { badge: 'bg-teal-100 text-teal-700', dot: 'bg-teal-500' },
  emerald: { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  amber: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  orange: { badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  rose: { badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  red: { badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};
export const STATUS_COLOR_KEYS = Object.keys(STATUS_COLORS);
export function statusColor(color) {
  return STATUS_COLORS[color] || STATUS_COLORS.slate;
}

// `meta` = { label, color } (depuis task.statusMeta ou la liste des statuts du projet).
export function StatusBadge({ meta }) {
  if (!meta) return null;
  const c = statusColor(meta.color);
  return (
    <Badge className={c.badge}>
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
      {meta.label}
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
