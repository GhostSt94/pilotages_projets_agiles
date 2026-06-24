import { useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isWithinInterval,
  parseISO,
  addMonths,
  getDay,
  isWeekend,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { initials } from '@/lib/utils';
import { cn } from '@/lib/utils';

/** Calendrier mensuel des absences (congés approuvés en plein, en attente en pointillé). */
export function TeamCalendar({ leaves = [] }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const start = startOfMonth(cursor);
  const end = endOfMonth(cursor);
  const days = eachDayOfInterval({ start, end });
  const lead = (getDay(start) + 6) % 7; // décalage lundi=0

  function leavesOn(day) {
    return leaves
      .filter((l) => l.status !== 'rejected')
      .filter((l) => isWithinInterval(day, { start: parseISO(l.startDate), end: parseISO(l.endDate) }));
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold capitalize text-slate-900">{format(cursor, 'MMMM yyyy', { locale: fr })}</h3>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCursor((c) => addMonths(c, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCursor((c) => addMonths(c, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase text-slate-400">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <div key={i} className={i > 4 ? 'text-slate-300' : ''}>{d}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: lead }).map((_, i) => <div key={`b${i}`} />)}
        {days.map((day) => {
          const dayLeaves = leavesOn(day);
          const we = isWeekend(day);
          return (
            <div
              key={day.toISOString()}
              className={cn('min-h-[54px] rounded-lg border p-1 text-left', we ? 'border-slate-100 bg-slate-50' : 'border-slate-100')}
            >
              <span className={cn('text-xs', we ? 'text-slate-300' : 'text-slate-500')}>{format(day, 'd')}</span>
              <div className="mt-0.5 flex flex-wrap gap-0.5">
                {dayLeaves.slice(0, 3).map((l) => (
                  <span
                    key={l._id}
                    title={`${l.user?.name || 'Moi'} (${l.status})`}
                    className={cn(
                      'rounded px-1 text-[9px] font-medium',
                      l.status === 'approved'
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'border border-dashed border-amber-400 text-amber-700'
                    )}
                  >
                    {initials(l.user?.name || '')}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-200" /> Approuvé</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-dashed border-amber-400" /> En attente</span>
      </div>
    </Card>
  );
}
