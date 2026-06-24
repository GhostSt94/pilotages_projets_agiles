import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useCreateProject, useUpdateProject } from '@/hooks/useProjects';
import { apiError, apiFieldErrors } from '@/lib/api';
import { FieldError } from '@/components/common/FieldError';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export function ProjectForm({ open, onOpenChange, project }) {
  const editing = !!project;
  const create = useCreateProject();
  const update = useUpdateProject();
  const [form, setForm] = useState({ name: '', key: '', description: '', status: 'active' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm({
        name: project?.name || '',
        key: project?.key || '',
        description: project?.description || '',
        status: project?.status || 'active',
      });
    }
  }, [open, project]);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    try {
      if (editing) {
        await update.mutateAsync({ id: project._id, ...form });
        toast.success('Projet mis à jour.');
      } else {
        await create.mutateAsync({ name: form.name, key: form.key, description: form.description });
        toast.success('Projet créé.');
      }
      onOpenChange(false);
    } catch (err) {
      const fields = apiFieldErrors(err);
      setErrors(fields);
      toast.error(apiError(err));
    }
  }

  const busy = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{editing ? 'Modifier le projet' : 'Nouveau projet'}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Nom</Label>
            <Input id="p-name" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} className={errors.name ? 'border-red-400 focus-visible:ring-red-200' : ''} required />
            <FieldError>{errors.name}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-key">Clé</Label>
            <Input id="p-key" value={form.key} onChange={(e) => set('key', e.target.value.toUpperCase())} placeholder="ATLAS" aria-invalid={!!errors.key} className={errors.key ? 'border-red-400 focus-visible:ring-red-200' : ''} required />
            {errors.key ? <FieldError>{errors.key}</FieldError> : <p className="text-xs text-slate-400">Identifiant court et unique (en majuscules).</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea id="p-desc" value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          {editing && (
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
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
