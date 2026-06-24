import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuth, can } from '@/lib/auth';
import { useCreateLeave } from '@/hooks/useLeaves';
import { useUsers } from '@/hooks/useUsers';
import { apiError } from '@/lib/api';
import { LEAVE_TYPE, LEAVE_TYPE_ORDER } from '@/lib/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const EMPTY = { type: 'vacation', startDate: '', endDate: '', reason: '', user: '' };

export function LeaveFormDialog({ open, onOpenChange }) {
  const { user } = useAuth();
  const manager = can(user, 'leave.review');
  const { data: users = [] } = useUsers({}, { enabled: manager && open });
  const createLeave = useCreateLeave();

  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm(EMPTY);
  }, [open]);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error('La date de fin doit être postérieure à la date de début.');
      return;
    }
    try {
      await createLeave.mutateAsync({
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
        ...(manager && form.user ? { user: form.user } : {}),
      });
      toast.success(manager ? 'Congé ajouté.' : 'Demande envoyée.');
      onOpenChange(false);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{manager ? 'Ajouter un congé' : 'Demander un congé'}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          {manager && (
            <div className="space-y-1.5">
              <Label>Membre</Label>
              <Select value={form.user || '__self__'} onValueChange={(v) => set('user', v === '__self__' ? '' : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__self__">Moi-même ({user?.name})</SelectItem>
                  {users.filter((u) => u._id !== user?._id).map((u) => (
                    <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => set('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAVE_TYPE_ORDER.map((t) => <SelectItem key={t} value={t}>{LEAVE_TYPE[t].label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lf-start">Du</Label>
              <Input id="lf-start" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-end">Au</Label>
              <Input id="lf-end" type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lf-reason">Motif (optionnel)</Label>
            <Textarea id="lf-reason" value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="Quelques mots…" />
          </div>

          <DialogFooter className="flex-col gap-1.5 sm:flex-col sm:items-stretch sm:space-x-0">
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button type="submit" disabled={createLeave.isPending}>
                {createLeave.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {manager ? 'Ajouter le congé' : 'Envoyer la demande'}
              </Button>
            </div>
            {manager && <p className="text-right text-[11px] text-slate-400">Ajouté directement comme approuvé.</p>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
