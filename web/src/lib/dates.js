import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

function toDate(d) {
  if (!d) return null;
  return typeof d === 'string' ? parseISO(d) : d;
}

/** « 13 juin 2026 » */
export function formatDate(d) {
  const dt = toDate(d);
  return dt ? format(dt, 'd MMM yyyy', { locale: fr }) : '';
}

/** « 13 juin » (sans année) */
export function formatDay(d) {
  const dt = toDate(d);
  return dt ? format(dt, 'd MMM', { locale: fr }) : '';
}

/** « 13 → 26 juin 2026 » */
export function formatRange(start, end) {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return '';
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) return `${format(s, 'd', { locale: fr })} → ${format(e, 'd MMM yyyy', { locale: fr })}`;
  return `${formatDay(s)} → ${formatDate(e)}`;
}

/** Valeur pour <input type="date"> */
export function toInputDate(d) {
  const dt = toDate(d);
  return dt ? format(dt, 'yyyy-MM-dd') : '';
}
