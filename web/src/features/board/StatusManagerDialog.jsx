import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowUp, ArrowDown, Check, Loader2, Columns3 } from 'lucide-react';
import {
  useStatuses, useCreateStatus, useUpdateStatus, useReorderStatuses, useDeleteStatus,
} from '@/hooks/useStatuses';
import { apiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { STATUS_COLORS, STATUS_COLOR_KEYS, statusColor } from '@/components/common/badges';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

// Pastilles de sélection de couleur.
function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1">
      {STATUS_COLOR_KEYS.map((c) => (
        <button
          key={c}
          type="button"
          title={c}
          onClick={() => onChange(c)}
          className={cn(
            'grid h-5 w-5 place-items-center rounded-full ring-2 ring-offset-1 transition',
            STATUS_COLORS[c].dot,
            value === c ? 'ring-slate-500' : 'ring-transparent hover:ring-slate-300'
          )}
        >
          {value === c && <Check className="h-3 w-3 text-white" />}
        </button>
      ))}
    </div>
  );
}

export function StatusManagerDialog({ open, onOpenChange, projectId }) {
  const { data: statuses = [] } = useStatuses(open ? projectId : null);
  const create = useCreateStatus(projectId);
  const update = useUpdateStatus(projectId);
  const reorder = useReorderStatuses(projectId);
  const del = useDeleteStatus(projectId);

  const [labels, setLabels] = useState({}); // édition locale des libellés { id: label }
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('blue');
  const [toDelete, setToDelete] = useState(null);

  const labelOf = (s) => (labels[s.key] !== undefined ? labels[s.key] : s.label);

  async function saveLabel(s) {
    const label = (labels[s.key] ?? s.label).trim();
    if (!label || label === s.label) return;
    try {
      await update.mutateAsync({ statusId: s._id, label });
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function setColor(s, color) {
    try { await update.mutateAsync({ statusId: s._id, color }); }
    catch (err) { toast.error(apiError(err)); }
  }
  async function toggleDone(s) {
    try { await update.mutateAsync({ statusId: s._id, isDone: !s.isDone }); }
    catch (err) { toast.error(apiError(err)); }
  }
  async function moveAt(index, dir) {
    const next = [...statuses];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    try { await reorder.mutateAsync(next.map((s) => s._id)); }
    catch (err) { toast.error(apiError(err)); }
  }
  async function add() {
    const label = newLabel.trim();
    if (!label) return;
    try {
      await create.mutateAsync({ label, color: newColor, isDone: false });
      setNewLabel('');
      setNewColor('blue');
    } catch (err) {
      toast.error(apiError(err));
    }
  }
  async function confirmDelete() {
    try {
      const res = await del.mutateAsync(toDelete._id);
      toast.success(res.movedTasks ? `Colonne supprimée — ${res.movedTasks} tâche(s) déplacée(s).` : 'Colonne supprimée.');
      setToDelete(null);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogTitle className="flex items-center gap-2"><Columns3 className="h-5 w-5 text-primary" /> Configurer les colonnes</DialogTitle>
        <DialogDescription>
          Les colonnes du tableau Kanban de ce projet. « Terminé » marque les tâches comme achevées
          (avancement, clôture de sprint).
        </DialogDescription>

        <div className="mt-2 space-y-2">
          {statuses.map((s, i) => (
            <div key={s._id} className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-2.5">
              <div className="flex flex-col">
                <button type="button" onClick={() => moveAt(i, -1)} disabled={i === 0 || reorder.isPending} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => moveAt(i, 1)} disabled={i === statuses.length - 1 || reorder.isPending} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className={cn('h-3 w-3 shrink-0 rounded-full', statusColor(s.color).dot)} />
              <Input
                value={labelOf(s)}
                onChange={(e) => setLabels((m) => ({ ...m, [s.key]: e.target.value }))}
                onBlur={() => saveLabel(s)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                className="h-8 w-40"
              />
              <ColorPicker value={s.color} onChange={(c) => setColor(s, c)} />
              <button
                type="button"
                onClick={() => toggleDone(s)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition',
                  s.isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                )}
              >
                <Check className="h-3 w-3" /> Terminé
              </button>
              <button
                type="button"
                onClick={() => setToDelete(s)}
                disabled={statuses.length <= 1}
                className="ml-auto text-slate-300 transition hover:text-red-500 disabled:opacity-30"
                title={statuses.length <= 1 ? 'Au moins une colonne requise' : 'Supprimer la colonne'}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Ajout */}
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-2.5">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
            placeholder="Nouvelle colonne…"
            className="h-8 w-40"
          />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <Button size="sm" className="ml-auto" onClick={add} disabled={!newLabel.trim() || create.isPending}>
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Ajouter
          </Button>
        </div>
      </DialogContent>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Supprimer cette colonne ?"
        description={`Les tâches de « ${toDelete?.label || ''} » seront déplacées vers la première colonne. Cette action est irréversible.`}
        destructive
        confirmLabel="Supprimer"
        loading={del.isPending}
        onConfirm={confirmDelete}
      />
    </Dialog>
  );
}
