import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useCreateUser } from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useRoles';
import { apiError, apiFieldErrors } from '@/lib/api';
import { cn } from '@/lib/utils';
import { WEEKDAYS } from '@/lib/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { FieldError } from '@/components/common/FieldError';

const EMPTY = {
  name: '',
  email: '',
  password: '',
  role: 'developer',
  dailyCapacityHours: 6,
  workingDays: [1, 2, 3, 4, 5],
};

export function UserFormDialog({ open, onOpenChange }) {
  const create = useCreateUser();
  const { data: roles = [] } = useRoles();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setErrors({});
    }
  }, [open]);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function toggleDay(d) {
    setForm((f) => {
      const has = f.workingDays.includes(d);
      return { ...f, workingDays: has ? f.workingDays.filter((x) => x !== d) : [...f.workingDays, d] };
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    if (form.password.length < 6) {
      setErrors({ password: 'Le mot de passe doit contenir au moins 6 caractères.' });
      return;
    }
    try {
      await create.mutateAsync({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        dailyCapacityHours: Number(form.dailyCapacityHours) || 0,
        workingDays: form.workingDays,
      });
      toast.success('Utilisateur créé.');
      onOpenChange(false);
    } catch (err) {
      setErrors(apiFieldErrors(err));
      toast.error(apiError(err));
    }
  }

  const weekly = (Number(form.dailyCapacityHours) || 0) * form.workingDays.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Nouvel utilisateur</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="u-name">Nom complet</Label>
            <Input id="u-name" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} className={errors.name ? 'border-red-400 focus-visible:ring-red-200' : ''} required />
            <FieldError>{errors.name}</FieldError>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="u-email">Email</Label>
              <Input id="u-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} aria-invalid={!!errors.email} className={errors.email ? 'border-red-400 focus-visible:ring-red-200' : ''} required />
              <FieldError>{errors.email}</FieldError>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-password">Mot de passe</Label>
              <Input id="u-password" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} aria-invalid={!!errors.password} className={errors.password ? 'border-red-400 focus-visible:ring-red-200' : ''} required />
              <FieldError>{errors.password}</FieldError>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Rôle</Label>
              <Select value={form.role} onValueChange={(v) => set('role', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => <SelectItem key={r._id} value={r.name}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-cap">Capacité/jour (h)</Label>
              <Input id="u-cap" type="number" min="0" step="0.5" value={form.dailyCapacityHours} onChange={(e) => set('dailyCapacityHours', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Jours de travail</Label>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((d) => {
                const on = form.workingDays.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    title={d.label}
                    onClick={() => toggleDay(d.value)}
                    className={cn(
                      'rounded-lg border py-2 text-xs font-medium transition',
                      on ? 'border-primary/40 bg-accent text-accent-foreground' : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                    )}
                  >
                    {d.short}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">Capacité : {weekly} h/semaine.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Créer l'utilisateur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
