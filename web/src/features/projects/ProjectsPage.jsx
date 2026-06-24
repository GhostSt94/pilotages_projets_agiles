import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Users, ArrowRight, Pencil, Trash2, FolderKanban, User } from 'lucide-react';
import { useProjectsQuery, useProject as useProjectCtx } from '@/lib/project';
import { useDeleteProject } from '@/hooks/useProjects';
import { useAuth, can } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProjectStatusBadge } from '@/components/common/badges';
import { ErrorState, EmptyState } from '@/components/common/states';
import { CardsSkeleton } from '@/components/common/skeletons';
import { RoleGate } from '@/components/layout/RoleGate';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ProjectForm } from './ProjectForm';
import { MembersDialog } from './MembersDialog';

export default function ProjectsPage() {
  const { data: projects = [], isLoading, isError, error, refetch } = useProjectsQuery();
  const { setProjectId } = useProjectCtx();
  const { user } = useAuth();
  const del = useDeleteProject();

  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [membersFor, setMembersFor] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const canManage = can(user, 'project.manage');

  async function doDelete() {
    try {
      await del.mutateAsync(toDelete._id);
      toast.success('Projet supprimé.');
      setToDelete(null);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  if (isError) return <div className="p-6"><ErrorState error={apiError(error)} onRetry={refetch} /></div>;

  return (
    <div className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-base font-semibold text-slate-900">Projets</h2>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">{projects.length}</span>
        <RoleGate permission="project.manage">
          <Button className="ml-auto" onClick={() => { setEditProject(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> Nouveau projet
          </Button>
        </RoleGate>
      </div>

      {isLoading ? (
        <CardsSkeleton count={6} />
      ) : !projects.length ? (
        <EmptyState icon={FolderKanban} title="Aucun projet" description="Créez votre premier projet pour démarrer." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card key={p._id} className="flex flex-col p-5 transition hover:shadow-md">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
                  {p.key?.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-900">{p.name}</div>
                  <span className="rounded bg-slate-100 px-1.5 font-mono text-[11px] text-slate-500">{p.key}</span>
                </div>
                <span className="ml-auto"><ProjectStatusBadge status={p.status} /></span>
              </div>

              {p.description && <p className="mt-3 line-clamp-2 text-sm text-slate-500">{p.description}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {p.members?.length || 0} membres</span>
                {p.manager?.name && <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" /> {p.manager.name}</span>}
              </div>

              <div className="mt-4 flex items-center gap-2 border-t pt-3">
                <Button variant="link" className="h-auto p-0" onClick={() => setProjectId(p._id)}>
                  Définir comme courant <ArrowRight className="h-4 w-4" />
                </Button>
                {canManage && (
                  <div className="ml-auto flex items-center gap-1">
                    <Button variant="ghost" size="icon" title="Membres" onClick={() => setMembersFor(p._id)}>
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Modifier" onClick={() => { setEditProject(p); setFormOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Supprimer" className="text-slate-400 hover:text-red-500" onClick={() => setToDelete(p)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ProjectForm open={formOpen} onOpenChange={setFormOpen} project={editProject} />
      <MembersDialog open={!!membersFor} onOpenChange={(o) => !o && setMembersFor(null)} projectId={membersFor} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Supprimer le projet ?"
        description={`« ${toDelete?.name || ''} » sera supprimé, ainsi que tous ses sprints et tâches. Action irréversible.`}
        destructive
        confirmLabel="Supprimer"
        loading={del.isPending}
        onConfirm={doDelete}
      />
    </div>
  );
}
