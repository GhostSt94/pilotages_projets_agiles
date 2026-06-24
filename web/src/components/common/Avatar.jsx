import { cn, initials, avatarColor } from '@/lib/utils';
import { SimpleTooltip } from '@/components/ui/tooltip';

const COLORS = {
  indigo: 'bg-indigo-100 text-indigo-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  sky: 'bg-sky-100 text-sky-700',
  violet: 'bg-violet-100 text-violet-700',
  slate: 'bg-slate-100 text-slate-600',
};

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
};

/** Avatar à initiales, couleur déterministe par utilisateur, avec tooltip du nom. */
export function Avatar({ name, id, size = 'sm', className, tooltip = true }) {
  const color = COLORS[avatarColor(id || name || '')] || COLORS.slate;
  const el = (
    <span
      className={cn('grid shrink-0 place-items-center rounded-full font-semibold', SIZES[size], color, className)}
    >
      {initials(name)}
    </span>
  );
  return tooltip && name ? <SimpleTooltip label={name}>{el}</SimpleTooltip> : el;
}
