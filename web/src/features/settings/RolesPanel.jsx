import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, ShieldCheck, Lock } from 'lucide-react';
import { useRoles, usePermissionsCatalog, useCreateRole, useUpdateRole, useDeleteRole } from '@/hooks/useRoles';
import { apiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageLoader, ErrorState, EmptyState } from '@/components/common/states';
import { ROLE_COLORS } from '@/components/common/badges';

const COLORS = ['blue', 'cyan', 'teal', 'emerald', 'amber', 'rose', 'sky', 'slate'];

export default function RolesPanel() {
  const { data: roles = [], isLoading, isError, error, refetch } = useRoles();
  const del = useDeleteRole();
  const [formOpen, setFormOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  async function onConfirmDelete() {
    try {
      await del.mutateAsync(toDelete._id);
      toast.success('Rôle supprimé.');
      setToDelete(null);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  if (isLoading) return <PageLoader />;
  if (isError) return <div className="p-6"><ErrorState error={apiError(error)} onRetry={refetch} /></div>;

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-base font-semibold text-slate-900">Rôles &amp; permissions</h2>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">{roles.length}</span>
        <Button className="ml-auto" onClick={() => { setEditRole(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Nouveau rôle
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((r) => (
          <Card key={r._id} className="flex flex-col p-4">
            <div className="flex items-center gap-2">
              <span className={cn('grid h-8 w-8 place-items-center rounded-lg', ROLE_COLORS[r.color] || ROLE_COLORS.slate)}>
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  {r.label}
                  {r.isSystem && <Lock className="h-3 w-3 text-slate-400" title="Rôle système" />}
                </div>
                <div className="font-mono text-[11px] text-slate-400">{r.name}</div>
              </div>
            </div>

            {r.description && <p className="mt-2 line-clamp-2 text-xs text-slate-500">{r.description}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              <span>{r.permissions.length} permission(s)</span>
              <span>· {r.userCount} utilisateur(s)</span>
            </div>

            <div className="mt-3 flex items-center gap-1 border-t pt-3">
              <Button variant="ghost" size="sm" onClick={() => { setEditRole(r); setFormOpen(true); }}>
                <Pencil className="h-4 w-4" /> Modifier
              </Button>
              {!r.isSystem && (
                <Button variant="ghost" size="icon" className="ml-auto text-slate-400 hover:text-red-500" title="Supprimer" onClick={() => setToDelete(r)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {!roles.length && <EmptyState icon={ShieldCheck} title="Aucun rôle" description="Créez un premier rôle." />}

      <RoleFormDialog open={formOpen} onOpenChange={setFormOpen} role={editRole} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Supprimer le rôle ?"
        description={`« ${toDelete?.label || ''} » sera supprimé. Possible uniquement s'il n'est attribué à personne.`}
        destructive
        confirmLabel="Supprimer"
        loading={del.isPending}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

function RoleFormDialog({ open, onOpenChange, role }) {
  const editing = !!role;
  const { data: catalog = [] } = usePermissionsCatalog();
  const create = useCreateRole();
  const update = useUpdateRole();
  const [form, setForm] = useState({ name: '', label: '', color: 'blue', description: '', permissions: [] });

  useEffect(() => {
    if (open) {
      setForm({
        name: role?.name || '',
        label: role?.label || '',
        color: role?.color || 'indigo',
        description: role?.description || '',
        permissions: role?.permissions || [],
      });
    }
  }, [open, role]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  function togglePerm(key) {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key) ? f.permissions.filter((p) => p !== key) : [...f.permissions, key],
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await update.mutateAsync({ id: role._id, label: form.label, color: form.color, description: form.description, permissions: form.permissions });
        toast.success('Rôle mis à jour.');
      } else {
        await create.mutateAsync({ name: form.name, label: form.label, color: form.color, description: form.description, permissions: form.permissions });
        toast.success('Rôle créé.');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  const busy = create.isPending || update.isPending;
  const isSystem = role?.isSystem;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{editing ? `Modifier « ${role.label} »` : 'Nouveau rôle'}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-label">Libellé</Label>
              <Input id="r-label" value={form.label} onChange={(e) => set('label', e.target.value)} placeholder="Lead technique" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-name">Identifiant</Label>
              <Input id="r-name" value={form.name} onChange={(e) => set('name', e.target.value.toLowerCase())} placeholder="lead" disabled={editing} required />
              {editing && <p className="text-[11px] text-slate-400">Non modifiable.</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Couleur</Label>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color', c)}
                  className={cn('h-7 w-7 rounded-full ring-2 ring-offset-1 transition', ROLE_COLORS[c], form.color === c ? 'ring-slate-400' : 'ring-transparent')}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="r-desc">Description</Label>
            <Textarea id="r-desc" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="À quoi sert ce rôle…" />
          </div>

          <div className="space-y-1.5">
            <Label>Permissions</Label>
            {isSystem && <p className="text-[11px] text-amber-600">Rôle système : modifiable, mais à ajuster avec précaution.</p>}
            <div className="space-y-1.5 rounded-lg border p-2">
              {catalog.map((p) => (
                <label key={p.key} className="flex cursor-pointer items-start gap-2 rounded-md p-1.5 hover:bg-slate-50">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-blue-600" checked={form.permissions.includes(p.key)} onChange={() => togglePerm(p.key)} />
                  <span>
                    <span className="text-sm font-medium text-slate-700">{p.label}</span>
                    <span className="block text-[11px] text-slate-400">{p.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Enregistrer' : 'Créer le rôle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
