import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useCreateSprint, useUpdateSprint } from '@/hooks/useSprints';
import { apiError, apiFieldErrors } from '@/lib/api';
import { FieldError } from '@/components/common/FieldError';
import { toInputDate } from '@/lib/dates';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function SprintForm({ open, onOpenChange, projectId, sprint }) {
  const editing = !!sprint;
  const create = useCreateSprint();
  const update = useUpdateSprint();
  const [form, setForm] = useState({ name: '', goal: '', startDate: '', endDate: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm({
        name: sprint?.name || '',
        goal: sprint?.goal || '',
        startDate: toInputDate(sprint?.startDate) || '',
        endDate: toInputDate(sprint?.endDate) || '',
      });
    }
  }, [open, sprint]);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setErrors({ endDate: 'La date de fin doit être postérieure à la date de début.' });
      return;
    }
    try {
      if (editing) {
        await update.mutateAsync({ id: sprint._id, ...form });
        toast.success('Sprint mis à jour.');
      } else {
        await create.mutateAsync({ project: projectId, ...form });
        toast.success('Sprint créé.');
      }
      onOpenChange(false);
    } catch (err) {
      setErrors(apiFieldErrors(err));
      toast.error(apiError(err));
    }
  }

  const busy = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{editing ? 'Modifier le sprint' : 'Nouveau sprint'}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="s-name">Nom</Label>
            <Input id="s-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Sprint 3 — …" aria-invalid={!!errors.name} className={errors.name ? 'border-red-400 focus-visible:ring-red-200' : ''} required />
            <FieldError>{errors.name}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-goal">Objectif</Label>
            <Textarea id="s-goal" value={form.goal} onChange={(e) => set('goal', e.target.value)} placeholder="But du sprint…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-start">Début</Label>
              <Input id="s-start" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-end">Fin</Label>
              <Input id="s-end" type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} aria-invalid={!!errors.endDate} className={errors.endDate ? 'border-red-400 focus-visible:ring-red-200' : ''} required />
            </div>
          </div>
          <FieldError>{errors.endDate}</FieldError>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
