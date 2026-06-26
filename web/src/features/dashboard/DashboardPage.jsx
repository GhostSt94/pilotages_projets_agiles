import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, CheckCheck, Hourglass, Gauge, CheckCircle2, AlertTriangle } from 'lucide-react';
import { usePageHeader } from '@/components/layout/AppShell';
import { useProject } from '@/lib/project';
import { useSprints } from '@/hooks/useSprints';
import { useDashboard } from '@/hooks/useDashboard';
import { apiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Avatar } from '@/components/common/Avatar';
import { CapacityBar } from '@/components/common/CapacityBar';
import { PageLoader, ErrorState, EmptyState } from '@/components/common/states';

// Couleur hex par clé de palette de statut (pour le camembert Recharts).
const STATUS_HEX = {
  slate: '#94a3b8', blue: '#3b82f6', sky: '#0ea5e9', cyan: '#06b6d4', teal: '#14b8a6',
  emerald: '#10b981', amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', red: '#ef4444',
};

export default function DashboardPage() {
  const { currentProject, projectId } = useProject();
  usePageHeader('Tableau de bord', currentProject?.name);

  const { data: sprints = [] } = useSprints(projectId);
  const [sprintId, setSprintId] = useState('');

  useEffect(() => {
    if (!sprints.length) return;
    if (sprintId && sprints.some((s) => s._id === sprintId)) return;
    setSprintId((sprints.find((s) => s.status === 'active') || sprints[0])._id);
  }, [sprints, sprintId]);

  const { data, isLoading, isError, error, refetch } = useDashboard(sprintId);

  if (!sprints.length) {
    return <div className="p-6"><EmptyState icon={Gauge} title="Aucun sprint" description="Créez un sprint pour afficher le tableau de bord." /></div>;
  }

  return (
    <div className="p-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select value={sprintId} onValueChange={setSprintId}>
          <SelectTrigger className="w-auto min-w-[260px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {sprints.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState error={apiError(error)} onRetry={refetch} />
      ) : data ? (
        <DashboardContent data={data} />
      ) : null}
    </div>
  );
}

function DashboardContent({ data }) {
  const { progress, capacity, memberLoad } = data;

  const kpis = [
    { label: 'Avancement', value: `${progress.completionRate} %`, sub: `${progress.doneEstimateHours} h / ${progress.totalEstimateHours} h faites`, icon: TrendingUp, tint: 'bg-accent text-accent-foreground' },
    { label: 'Tâches terminées', value: `${progress.doneTasks} / ${progress.totalTasks}`, sub: 'sur le sprint', icon: CheckCheck, tint: 'bg-emerald-50 text-emerald-600' },
    { label: 'Reste à faire', value: `${progress.remainingEstimateHours} h`, sub: 'à terminer', icon: Hourglass, tint: 'bg-amber-50 text-amber-600' },
    { label: 'Occupation', value: capacity.utilizationRate != null ? `${capacity.utilizationRate} %` : '—', sub: capacity.overload ? 'surcharge !' : 'capacité OK', icon: Gauge, tint: 'bg-sky-50 text-sky-600' },
  ];

  const pieData = (data.statuses || [])
    .map((s) => ({ name: s.label, key: s.key, color: s.color, value: progress.tasksByStatus[s.key] || 0 }))
    .filter((d) => d.value > 0);
  const barData = memberLoad.map((m) => ({ name: m.user.name.split(' ')[0], Estimé: m.estimateHours, Disponible: m.availableHours ?? 0 }));

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{k.label}</span>
              <span className={cn('grid h-8 w-8 place-items-center rounded-lg', k.tint)}><k.icon className="h-4 w-4" /></span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{k.value}</div>
            <div className="text-xs text-slate-400">{k.sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Donut statuts */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900">Tâches par statut</h3>
          {pieData.length ? (
            <div className="mt-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {pieData.map((d) => <Cell key={d.key} fill={STATUS_HEX[d.color] || '#94a3b8'} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-400">Aucune tâche.</p>
          )}
        </Card>

        {/* Charge par membre */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900">Charge par membre (estimé vs disponible)</h3>
          {barData.length ? (
            <div className="mt-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barGap={4}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit=" h" width={40} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Disponible" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Estimé" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-400">Aucune charge assignée.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Capacité */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900">Capacité du sprint</h3>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-900">{capacity.committedHours}</span>
            <span className="mb-1 text-sm text-slate-400">/ {capacity.availableCapacityHours} h engagées</span>
          </div>
          <div className="mt-3">
            <CapacityBar available={capacity.availableCapacityHours} committed={capacity.committedHours} overload={capacity.overload} />
          </div>
          <div className="mt-2 text-xs">
            {capacity.overload ? (
              <span className="inline-flex items-center gap-1 text-red-600"><AlertTriangle className="h-4 w-4" /> Surcharge</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Pas de surcharge</span>
            )}
          </div>
        </Card>

        {/* Table charge par membre */}
        <Card className="p-0 lg:col-span-2">
          <div className="border-b px-4 py-3"><h3 className="text-sm font-semibold text-slate-900">Détail par membre</h3></div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead>Tâches</TableHead>
                <TableHead>Estimé</TableHead>
                <TableHead>Fait</TableHead>
                <TableHead>Saisi</TableHead>
                <TableHead>Dispo</TableHead>
                <TableHead className="text-right">Occupation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberLoad.length ? memberLoad.map((m) => (
                <TableRow key={m.user._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar name={m.user.name} id={m.user._id} size="xs" />
                      <span className="font-medium text-slate-700">{m.user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{m.taskCount}</TableCell>
                  <TableCell className="text-slate-600">{m.estimateHours} h</TableCell>
                  <TableCell className="text-slate-600">{m.doneHours} h</TableCell>
                  <TableCell className="text-slate-600">{m.loggedHours || 0} h</TableCell>
                  <TableCell className="text-slate-600">{m.availableHours ?? '—'} h</TableCell>
                  <TableCell className={cn('text-right font-medium', m.utilizationRate > 100 ? 'text-red-600' : 'text-slate-700')}>
                    {m.utilizationRate != null ? `${m.utilizationRate} %` : '—'}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={7} className="text-center text-sm text-slate-400">Aucune tâche assignée.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
