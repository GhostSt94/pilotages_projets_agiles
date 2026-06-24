import { cn } from '@/lib/utils';

/** Badge générique : on passe la classe de couleur via `className`. */
function Badge({ className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
