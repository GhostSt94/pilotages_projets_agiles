import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isWithinInterval,
  parseISO,
  addMonths,
  isWeekend,
  isToday,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/common/Avatar';
import { LEAVE_TYPE, LEAVE_TYPE_ORDER } from '@/lib/constants';
import { cn } from '@/lib/utils';

// Teinte par type de congé (palette froide, maladie en rose pour l'alerte).
const TYPE_COLOR = {
  vacation: { solid: 'bg-emerald-400', soft: 'bg-emerald-100', border: 'border-emerald-400', dot: 'bg-emerald-400' },
  sick: { solid: 'bg-rose-400', soft: 'bg-rose-100', border: 'border-rose-400', dot: 'bg-rose-400' },
  personal: { solid: 'bg-amber-400', soft: 'bg-amber-100', border: 'border-amber-400', dot: 'bg-amber-400' },
  other: { solid: 'bg-slate-400', soft: 'bg-slate-100', border: 'border-slate-400', dot: 'bg-slate-400' },
};

/**
 * Calendrier de disponibilité par membre : une ligne par personne, une colonne par jour
 * du mois. Une cellule pleine = congé approuvé (couleur du type), une cellule cerclée en
 * pointillé = congé en attente. Les week-ends sont grisés.
 */
export function TeamCalendar({ leaves = [], members = [] }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const start = startOfMonth(cursor);
  const end = endOfMonth(cursor);
  const days = useMemo(() => eachDayOfInterval({ start, end }), [start, end]);

  // Congés (hors refusés) regroupés par identifiant de membre.
  const byMember = useMemo(() => {
    const map = new Map();
    for (const l of leaves) {
      if (l.status === 'rejected') continue;
      const id = String(l.user?._id || l.user || '');
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(l);
    }
    return map;
  }, [leaves]);

  // Membres à afficher : ceux fournis, sinon déduits des congés.
  const rows = useMemo(() => {
    if (members.length) return members;
    const seen = new Map();
    for (const l of leaves) {
      const u = l.user;
      if (u?._id && !seen.has(String(u._id))) seen.set(String(u._id), u);
    }
    return [...seen.values()];
  }, [members, leaves]);

  function leaveFor(memberId, day) {
    const list = byMember.get(String(memberId));
    if (!list) return null;
    return list.find((l) => isWithinInterval(day, { start: parseISO(l.startDate), end: parseISO(l.endDate) })) || null;
  }

  const gridCols = { gridTemplateColumns: `160px repeat(${days.length}, minmax(26px, 1fr))` };

  return (
    <Card className="overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <CalendarDays className="h-4 w-4 text-primary" />
          Disponibilité de l'équipe
          <span className="font-normal capitalize text-slate-400">· {format(cursor, 'MMMM yyyy', { locale: fr })}</span>
        </h3>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCursor((c) => addMonths(c, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCursor(startOfMonth(new Date()))}>
            <span className="text-[11px] font-medium">Auj.</span>
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCursor((c) => addMonths(c, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="grid place-items-center py-10 text-center text-sm text-slate-400">Aucun membre à afficher.</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* En-tête des jours */}
            <div className="grid" style={gridCols}>
              <div className="sticky left-0 z-10 bg-white" />
              {days.map((day) => {
                const we = isWeekend(day);
                const today = isToday(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'border-b border-slate-100 pb-1 text-center text-[10px] font-medium leading-tight',
                      we ? 'text-slate-300' : 'text-slate-400'
                    )}
                  >
                    <div className="uppercase">{format(day, 'EEEEE', { locale: fr })}</div>
                    <div
                      className={cn(
                        'mx-auto mt-0.5 grid h-5 w-5 place-items-center rounded-full',
                        today ? 'bg-primary font-semibold text-primary-foreground' : we ? 'text-slate-300' : 'text-slate-600'
                      )}
                    >
                      {format(day, 'd')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Lignes par membre */}
            {rows.map((m) => (
              <div key={m._id} className="grid border-b border-slate-50 last:border-0" style={gridCols}>
                <div className="sticky left-0 z-10 flex items-center gap-2 bg-white py-1.5 pr-2">
                  <Avatar name={m.name} id={m._id} size="sm" />
                  <span className="truncate text-xs font-medium text-slate-700">{m.name}</span>
                </div>
                {days.map((day) => {
                  const we = isWeekend(day);
                  const l = leaveFor(m._id, day);
                  const color = l ? TYPE_COLOR[l.type] || TYPE_COLOR.other : null;
                  return (
                    <div key={day.toISOString()} className="px-px py-1.5">
                      <div
                        title={l ? `${m.name} — ${LEAVE_TYPE[l.type]?.label || l.type} (${l.status === 'approved' ? 'approuvé' : 'en attente'})` : undefined}
                        className={cn(
                          'h-5 w-full rounded',
                          l
                            ? l.status === 'approved'
                              ? color.solid
                              : cn(color.soft, 'border border-dashed', color.border)
                            : we
                              ? 'bg-slate-50'
                              : 'bg-slate-100/60'
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Légende */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
        {LEAVE_TYPE_ORDER.map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className={cn('h-3 w-3 rounded', TYPE_COLOR[t].dot)} /> {LEAVE_TYPE[t].label}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-dashed border-emerald-400 bg-emerald-100" /> En attente
        </span>
      </div>
    </Card>
  );
}
