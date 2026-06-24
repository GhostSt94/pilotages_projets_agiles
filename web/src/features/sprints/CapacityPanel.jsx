import { AlertTriangle, CheckCircle2, Plane, Info } from 'lucide-react';
import { useCapacity } from '@/hooks/useSprints';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Avatar } from '@/components/common/Avatar';
import { CapacityBar } from '@/components/common/CapacityBar';
import { LeaveTypeLabel } from '@/components/common/badges';
import { PageLoader, ErrorState } from '@/components/common/states';
import { apiError } from '@/lib/api';
import { formatDay } from '@/lib/dates';
import { cn } from '@/lib/utils';

/**
 * Panneau capacité d'un sprint (cœur métier).
 * - `compact`    : bandeau synthèse uniquement.
 * - `detailOnly` : tableau par membre + absences uniquement (sans bandeau).
 * - défaut       : les deux.
 */
export function CapacityPanel({ sprintId, compact = false, detailOnly = false }) {
  const { data, isLoading, isError, error, refetch } = useCapacity(sprintId);

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorState error={apiError(error)} onRetry={refetch} />;
  if (!data) return null;

  const { availableCapacityHours, committedHours, remainingHours, utilizationRate, overload, overloadHours, members } =
    data;

  return (
    <div className="space-y-5">
      {/* Bandeau synthèse */}
      {!detailOnly && (
      <Card className={cn('p-3', overload && 'border-red-200 bg-red-50')}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-xs uppercase tracking-wide text-slate-400">Capacité</span>
          <div className="flex items-baseline gap-1.5">
            <span className={cn('text-lg font-bold', overload ? 'text-red-600' : 'text-slate-900')}>{committedHours}</span>
            <span className="text-xs text-slate-400">/ {availableCapacityHours} h</span>
          </div>
          {overload ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">
              <AlertTriangle className="h-3.5 w-3.5" /> Surcharge +{overloadHours} h
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> OK
            </span>
          )}
          <span className="ml-auto text-xs text-slate-400">
            {utilizationRate != null ? `${utilizationRate} % · ` : ''}
            {overload ? `${overloadHours} h de trop` : `${remainingHours} h restantes`}
          </span>
        </div>
        <div className="mt-2">
          <CapacityBar available={availableCapacityHours} committed={committedHours} overload={overload} />
        </div>
      </Card>
      )}

      {!compact && (
        <>
          {/* Capacité par membre */}
          <Card>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Capacité par membre</h3>
              <span className="hidden text-xs text-slate-400 sm:block">
                (jours travaillés − congés approuvés) × capacité/jour
              </span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membre</TableHead>
                  <TableHead>Cap./j</TableHead>
                  <TableHead>J. travaillés</TableHead>
                  <TableHead>J. congé</TableHead>
                  <TableHead>J. dispo</TableHead>
                  <TableHead className="text-right">Heures dispo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.user._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar name={m.user.name} id={m.user._id} size="xs" />
                        <span className="font-medium text-slate-700">{m.user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{m.user.dailyCapacityHours} h</TableCell>
                    <TableCell className="text-slate-600">{m.workingDays}</TableCell>
                    <TableCell className={m.leaveDays ? 'font-medium text-amber-600' : 'text-slate-400'}>
                      {m.leaveDays}
                    </TableCell>
                    <TableCell className="text-slate-600">{m.availableDays}</TableCell>
                    <TableCell className="text-right font-semibold text-slate-800">{m.availableHours} h</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-slate-50 font-semibold hover:bg-slate-50">
                  <TableCell colSpan={5} className="text-slate-700">
                    Total disponible
                  </TableCell>
                  <TableCell className="text-right text-slate-900">{availableCapacityHours} h</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          {/* Absences */}
          <Card className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Plane className="h-4 w-4 text-primary" /> Absences sur la période
            </h3>
            <AbsencesList members={members} />
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <Info className="h-3.5 w-3.5" />
              Capacité calculée sur tous les membres du projet. Seuls les congés approuvés chevauchant le sprint la
              réduisent.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

function AbsencesList({ members }) {
  const rows = members.flatMap((m) =>
    (m.absences || []).map((a) => ({ ...a, user: m.user, key: a.leaveId }))
  );
  if (!rows.length) return <p className="text-sm text-slate-400">Aucune absence approuvée sur cette période.</p>;
  return (
    <div className="space-y-2">
      {rows.map((a) => (
        <div key={a.key} className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <Avatar name={a.user.name} id={a.user._id} size="xs" />
          <span className="text-slate-700">{a.user.name}</span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Congé · <LeaveTypeLabel type={a.type} />
          </span>
          <span className="ml-auto text-xs text-slate-500">
            {formatDay(a.startDate)} → {formatDay(a.endDate)} · <strong>{a.workingDaysOff} j décomptés</strong>
          </span>
        </div>
      ))}
    </div>
  );
}
