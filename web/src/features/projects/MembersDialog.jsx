import { useState } from 'react';
import { toast } from 'sonner';
import { UserMinus, Plus } from 'lucide-react';
import { useProject as useProjectDetail, useAddMember, useRemoveMember } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { apiError } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Avatar } from '@/components/common/Avatar';
import { RoleBadge } from '@/components/common/badges';
import { PageLoader } from '@/components/common/states';

export function MembersDialog({ open, onOpenChange, projectId }) {
  const { data: project, isLoading } = useProjectDetail(open ? projectId : null);
  const { data: users = [] } = useUsers();
  const addMember = useAddMember();
  const removeMember = useRemoveMember();
  const [toAdd, setToAdd] = useState('');

  const memberIds = new Set((project?.members || []).map((m) => m._id));
  const candidates = users.filter((u) => !memberIds.has(u._id));

  async function onAdd() {
    if (!toAdd) return;
    try {
      await addMember.mutateAsync({ id: projectId, userId: toAdd });
      setToAdd('');
      toast.success('Membre ajouté.');
    } catch (err) {
      toast.error(apiError(err));
    }
  }
  async function onRemove(userId) {
    try {
      await removeMember.mutateAsync({ id: projectId, userId });
      toast.success('Membre retiré.');
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Membres {project ? `— ${project.name}` : ''}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <PageLoader />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Select value={toAdd} onValueChange={setToAdd}>
                <SelectTrigger><SelectValue placeholder="Choisir un utilisateur…" /></SelectTrigger>
                <SelectContent>
                  {candidates.length ? (
                    candidates.map((u) => <SelectItem key={u._id} value={u._id}>{u.name} · {u.email}</SelectItem>)
                  ) : (
                    <SelectItem value="none" disabled>Tous les utilisateurs sont membres</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button onClick={onAdd} disabled={!toAdd || addMember.isPending}>
                <Plus className="h-4 w-4" /> Ajouter
              </Button>
            </div>

            <div className="divide-y rounded-lg border">
              {(project?.members || []).map((m) => (
                <div key={m._id} className="flex items-center gap-3 p-3">
                  <Avatar name={m.name} id={m._id} size="md" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800">{m.name}</div>
                    <div className="text-xs text-slate-400">{m.email}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <RoleBadge role={m.role} />
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500" onClick={() => onRemove(m._id)} disabled={removeMember.isPending}>
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
