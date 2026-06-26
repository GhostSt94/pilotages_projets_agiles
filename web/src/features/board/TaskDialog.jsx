import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Loader2, Trash2, Send, MessageSquare,
  CircleDot, User, Flag, Shapes, CalendarRange, Clock, Tags, ImagePlus, X, Timer, Plus,
} from 'lucide-react';
import { useTask, useCreateTask, useUpdateTask, useDeleteTask, useAddComment, useAddAttachment, useRemoveAttachment, useAddTimeLog, useRemoveTimeLog } from '@/hooks/useTasks';
import { useSprints } from '@/hooks/useSprints';
import { useProject } from '@/lib/project';
import { useAuth, canModifyTask } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { formatDate } from '@/lib/dates';
import { taskCode } from '@/lib/utils';
import {
  TASK_TYPE,
  TASK_TYPE_ORDER,
  TASK_PRIORITY,
  TASK_PRIORITY_ORDER,
} from '@/lib/constants';
import { useStatuses } from '@/hooks/useStatuses';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge, TypeTag } from '@/components/common/badges';
import { PageLoader } from '@/components/common/states';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ImageViewer } from '@/components/common/ImageViewer';

const UNASSIGNED = '__none__';
const BACKLOG = '__backlog__';
const EMPTY = { title: '', description: '', type: 'feature', priority: 'medium', status: '', estimate: 0, assignee: UNASSIGNED, sprint: BACKLOG, labels: '' };
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4400';

export function TaskDialog({ open, onOpenChange, taskId, defaults }) {
  const editing = !!taskId;
  const { currentProject, projectId } = useProject();
  const { user } = useAuth();
  const { data: sprints = [] } = useSprints(projectId);
  const { data: task, isLoading } = useTask(editing && open ? taskId : null);
  // Statuts du projet concerné (celui de la tâche en édition, sinon le projet courant).
  const statusProjectId = editing ? (task?.project?._id || task?.project) : projectId;
  const { data: statuses = [] } = useStatuses(open ? statusProjectId : null);

  const create = useCreateTask();
  const update = useUpdateTask();
  const del = useDeleteTask();
  const addComment = useAddComment();
  const addAttachment = useAddAttachment();
  const removeAttachment = useRemoveAttachment();
  const addTimeLog = useAddTimeLog();
  const removeTimeLog = useRemoveTimeLog();

  const [form, setForm] = useState(EMPTY);
  const [comment, setComment] = useState('');
  const [tlHours, setTlHours] = useState('');
  const [tlNote, setTlNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Images sélectionnées avant création (téléversées après création de la tâche).
  const [pending, setPending] = useState([]); // [{ file, url }]
  const [viewerIndex, setViewerIndex] = useState(-1); // -1 = visualiseur fermé

  useEffect(() => {
    if (!open) {
      // Libère les aperçus locaux à la fermeture.
      setPending((p) => { p.forEach((x) => URL.revokeObjectURL(x.url)); return []; });
      setTlHours('');
      setTlNote('');
      return;
    }
    if (editing && task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        type: task.type,
        priority: task.priority,
        status: task.status,
        estimate: task.estimate ?? 0,
        assignee: task.assignee?._id || UNASSIGNED,
        sprint: task.sprint || BACKLOG,
        labels: (task.labels || []).join(', '),
      });
    } else if (!editing) {
      setForm({ ...EMPTY, ...mapDefaults(defaults) });
    }
  }, [open, editing, task]); // eslint-disable-line react-hooks/exhaustive-deps

  const members = currentProject?.members || [];
  const selectableSprints = sprints.filter((s) => s.status !== 'completed');
  const canEdit = editing ? canModifyTask(user, currentProject, task) : true;
  const assignee = members.find((m) => m._id === form.assignee);
  // Liste pour le visualiseur (images serveur en édition, aperçus locaux en création).
  const viewerImages = editing
    ? (task?.attachments || []).map((a) => ({ url: `${API_URL}${a.url}`, name: a.originalName || 'image' }))
    : pending.map((p, i) => ({ url: p.url, name: `image ${i + 1}` }));

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function buildPayload() {
    return {
      title: form.title,
      description: form.description,
      type: form.type,
      priority: form.priority,
      status: form.status || statuses[0]?.key,
      estimate: Number(form.estimate) || 0,
      assignee: form.assignee === UNASSIGNED ? null : form.assignee,
      sprint: form.sprint === BACKLOG ? null : form.sprint,
      labels: form.labels.split(',').map((s) => s.trim()).filter(Boolean),
    };
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await update.mutateAsync({ id: taskId, ...buildPayload() });
        toast.success('Tâche mise à jour.');
      } else {
        const created = await create.mutateAsync({ project: projectId, ...buildPayload() });
        // Téléverse les images sélectionnées sur la tâche fraîchement créée.
        for (const item of pending) {
          await addAttachment.mutateAsync({ id: created._id, file: item.file });
        }
        toast.success(pending.length ? `Tâche créée (${pending.length} image(s)).` : 'Tâche créée.');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function doDelete() {
    try {
      await del.mutateAsync(taskId);
      toast.success('Tâche supprimée.');
      setConfirmDelete(false);
      onOpenChange(false);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function onAddComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      setComment('');
      await addComment.mutateAsync({ id: taskId, body: comment, author: user });
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function onAddTimeLog(e) {
    e.preventDefault();
    const hours = Number(tlHours);
    if (!hours || hours <= 0) return;
    try {
      await addTimeLog.mutateAsync({ id: taskId, hours, note: tlNote.trim() });
      setTlHours('');
      setTlNote('');
      toast.success('Temps enregistré.');
    } catch (err) {
      toast.error(apiError(err));
    }
  }
  async function onRemoveTimeLog(logId) {
    try {
      await removeTimeLog.mutateAsync({ id: taskId, logId });
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function onUploadImage(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de re-sélectionner le même fichier
    if (!file) return;
    try {
      await addAttachment.mutateAsync({ id: taskId, file });
      toast.success('Image ajoutée.');
    } catch (err) {
      toast.error(apiError(err));
    }
  }
  async function onRemoveImage(attachmentId) {
    try {
      await removeAttachment.mutateAsync({ id: taskId, attachmentId });
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  // Mode création : on empile localement les images (aperçu), upload après création.
  function onStageImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPending((p) => [...p, { file, url: URL.createObjectURL(file) }]);
  }
  function removeStaged(idx) {
    setPending((p) => {
      const x = p[idx];
      if (x) URL.revokeObjectURL(x.url);
      return p.filter((_, i) => i !== idx);
    });
  }

  const busy = create.isPending || update.isPending || addAttachment.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl gap-0 overflow-hidden p-0"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {editing && isLoading ? (
          <div className="p-10"><PageLoader /></div>
        ) : (
          <form className="flex max-h-[88vh] flex-col" onSubmit={onSubmit}>
            {/* Barre supérieure : type + statut à gauche, actions à droite */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 pr-12">
              <DialogTitle className="sr-only">{editing ? 'Détail de la tâche' : 'Nouvelle tâche'}</DialogTitle>
              <div className="flex items-center gap-2">
                {editing && task && taskCode(task) && (
                  <span className="font-mono text-xs font-medium text-slate-500">{taskCode(task)}</span>
                )}
                <TypeTag type={form.type} />
                {editing && <StatusBadge meta={task?.statusMeta} />}
                {editing && task?.createdAt && (
                  <span className="text-xs text-slate-400">Créée le {formatDate(task.createdAt)}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button type="submit" size="sm" disabled={busy}>
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editing ? 'Enregistrer' : 'Créer'}
                  </Button>
                )}
                {editing && canEdit && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="h-4 w-4" /> Supprimer
                  </Button>
                )}
              </div>
            </div>

            {/* Titre */}
            <div className="border-b px-6 py-4">
              <Input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                disabled={!canEdit}
                required
                placeholder="Titre de la tâche…"
                className="h-auto border-0 bg-transparent px-0 py-0 text-lg font-semibold text-slate-900 shadow-none focus-visible:border-0 focus-visible:ring-0 disabled:opacity-100"
              />
            </div>

            {/* Corps : contenu + panneau détails */}
            <div className="grid flex-1 overflow-y-auto thin-scroll md:grid-cols-[1fr_300px]">
              {/* Contenu */}
              <div className="space-y-6 p-6">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide text-slate-400">Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    disabled={!canEdit}
                    placeholder="Ajouter une description…"
                    className="min-h-[100px] resize-none"
                  />
                </div>

                {/* Images (création : aperçus locaux ; édition : images serveur) */}
                {(editing ? !!task : true) && (
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <ImagePlus className="h-4 w-4" /> Images
                      <span className="rounded-full bg-slate-100 px-1.5 text-[11px] font-medium text-slate-500">
                        {editing ? task.attachments?.length || 0 : pending.length}
                      </span>
                    </h4>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {editing
                        ? (task.attachments || []).map((a, i) => (
                            <div key={a._id} className="group relative">
                              <button type="button" onClick={() => setViewerIndex(i)} className="block w-full" aria-label="Agrandir l'image">
                                <img src={`${API_URL}${a.url}`} alt={a.originalName || 'image'} className="h-24 w-full cursor-zoom-in rounded-lg border border-slate-200 object-cover transition hover:opacity-90" />
                              </button>
                              {canEdit && (
                                <button type="button" onClick={() => onRemoveImage(a._id)} disabled={removeAttachment.isPending}
                                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-900/60 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100" aria-label="Supprimer l'image">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ))
                        : pending.map((p, i) => (
                            <div key={p.url} className="group relative">
                              <button type="button" onClick={() => setViewerIndex(i)} className="block w-full" aria-label="Agrandir l'image">
                                <img src={p.url} alt={`image ${i + 1}`} className="h-24 w-full cursor-zoom-in rounded-lg border border-slate-200 object-cover transition hover:opacity-90" />
                              </button>
                              <button type="button" onClick={() => removeStaged(i)}
                                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-900/60 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100" aria-label="Retirer l'image">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                      {canEdit && (
                        <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-xs font-medium text-slate-400 transition hover:border-primary/40 hover:text-primary">
                          {addAttachment.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              <ImagePlus className="h-5 w-5" />
                              Ajouter
                            </>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={editing ? onUploadImage : onStageImage} disabled={addAttachment.isPending} />
                        </label>
                      )}
                    </div>
                    {editing && !task.attachments?.length && !canEdit && (
                      <p className="text-sm text-slate-400">Aucune image.</p>
                    )}
                  </div>
                )}

                {editing && task && (
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <Timer className="h-4 w-4" /> Temps passé
                      <span className="rounded-full bg-slate-100 px-1.5 text-[11px] font-medium text-slate-500">
                        {task.loggedHours || 0} h{task.estimate ? ` / ${task.estimate} h` : ''}
                      </span>
                    </h4>

                    {/* Barre estimé vs saisi */}
                    {task.estimate > 0 && (
                      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${task.loggedHours > task.estimate ? 'bg-rose-400' : 'bg-primary'}`}
                          style={{ width: `${Math.min(100, Math.round(((task.loggedHours || 0) / task.estimate) * 100))}%` }}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      {(task.timeLogs || []).map((l) => (
                        <div key={l._id} className="group flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2">
                          <Avatar name={l.user?.name} id={l.user?._id} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-medium text-slate-700">{l.user?.name}</span>
                              <span className="text-[11px] text-slate-400">{formatDate(l.spentOn || l.createdAt)}</span>
                            </div>
                            {l.note && <p className="truncate text-xs text-slate-500">{l.note}</p>}
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-slate-800">{l.hours} h</span>
                          {(canEdit && (String(l.user?._id) === String(user?._id) || canModifyTask(user, currentProject, task))) && (
                            <button
                              type="button"
                              onClick={() => onRemoveTimeLog(l._id)}
                              disabled={removeTimeLog.isPending}
                              className="text-slate-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                              aria-label="Supprimer la saisie"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {!task.timeLogs?.length && (
                        <p className="rounded-lg border border-dashed py-4 text-center text-sm text-slate-400">
                          Aucun temps saisi pour l'instant.
                        </p>
                      )}
                    </div>

                    {canEdit && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="relative w-28 shrink-0">
                          <Input
                            type="number" min="0" step="0.5" value={tlHours}
                            onChange={(e) => setTlHours(e.target.value)}
                            placeholder="Heures" className="pr-7"
                            onKeyDown={(e) => { if (e.key === 'Enter') onAddTimeLog(e); }}
                          />
                          <span className="pointer-events-none absolute right-3 top-2 text-xs text-slate-400">h</span>
                        </div>
                        <Input
                          value={tlNote}
                          onChange={(e) => setTlNote(e.target.value)}
                          placeholder="Note (optionnel)…"
                          onKeyDown={(e) => { if (e.key === 'Enter') onAddTimeLog(e); }}
                        />
                        <Button type="button" size="icon" onClick={onAddTimeLog} disabled={addTimeLog.isPending || !tlHours}>
                          {addTimeLog.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {editing && task && (
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <MessageSquare className="h-4 w-4" /> Commentaires
                      <span className="rounded-full bg-slate-100 px-1.5 text-[11px] font-medium text-slate-500">
                        {task.comments?.length || 0}
                      </span>
                    </h4>
                    <div className="space-y-3">
                      {(task.comments || []).map((c) => (
                        <div key={c._id} className="flex gap-2.5">
                          <Avatar name={c.author?.name} id={c.author?._id} size="sm" />
                          <div className="min-w-0 flex-1 rounded-lg rounded-tl-none bg-slate-50 px-3 py-2">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-medium text-slate-700">{c.author?.name}</span>
                              <span className="text-[11px] text-slate-400">{formatDate(c.createdAt)}</span>
                            </div>
                            <p className="mt-0.5 text-sm text-slate-600">{c.body}</p>
                          </div>
                        </div>
                      ))}
                      {!task.comments?.length && (
                        <p className="rounded-lg border border-dashed py-4 text-center text-sm text-slate-400">
                          Aucun commentaire pour l'instant.
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Avatar name={user?.name} id={user?._id} size="sm" />
                      <Input
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Écrire un commentaire…"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') onAddComment(e);
                        }}
                      />
                      <Button type="button" size="icon" onClick={onAddComment} disabled={addComment.isPending || !comment.trim()}>
                        {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Panneau Détails */}
              <div className="space-y-3.5 border-t bg-slate-50/60 p-5 md:border-l md:border-t-0">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Détails</h4>

                <Meta icon={CircleDot} label="Statut">
                  <Select value={form.status || statuses[0]?.key || ''} onValueChange={(v) => set('status', v)} disabled={!canEdit}>
                    <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Meta>

                <Meta icon={User} label="Assigné">
                  <Select value={form.assignee} onValueChange={(v) => set('assignee', v)} disabled={!canEdit}>
                    <SelectTrigger className="h-9 bg-white">
                      {assignee && <Avatar name={assignee.name} id={assignee._id} size="xs" />}
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>Non assigné</SelectItem>
                      {members.map((m) => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Meta>

                <div className="grid grid-cols-2 gap-3">
                  <Meta icon={Flag} label="Priorité">
                    <Select value={form.priority} onValueChange={(v) => set('priority', v)} disabled={!canEdit}>
                      <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TASK_PRIORITY_ORDER.map((p) => <SelectItem key={p} value={p}>{TASK_PRIORITY[p].label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Meta>
                  <Meta icon={Shapes} label="Type">
                    <Select value={form.type} onValueChange={(v) => set('type', v)} disabled={!canEdit}>
                      <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TASK_TYPE_ORDER.map((t) => <SelectItem key={t} value={t}>{TASK_TYPE[t].label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Meta>
                </div>

                <Meta icon={CalendarRange} label="Sprint">
                  <Select value={form.sprint} onValueChange={(v) => set('sprint', v)} disabled={!canEdit}>
                    <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={BACKLOG}>Backlog</SelectItem>
                      {selectableSprints.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Meta>

                <Meta icon={Clock} label="Estimation (heures)">
                  <div className="relative">
                    <Input type="number" min="0" step="0.5" value={form.estimate} onChange={(e) => set('estimate', e.target.value)} disabled={!canEdit} className="h-9 bg-white pr-7" />
                    <span className="pointer-events-none absolute right-3 top-2 text-xs text-slate-400">h</span>
                  </div>
                </Meta>

                <Meta icon={Tags} label="Étiquettes">
                  <Input value={form.labels} onChange={(e) => set('labels', e.target.value)} disabled={!canEdit} placeholder="catalogue, urgent" className="h-9 bg-white" />
                </Meta>

                {!canEdit && (
                  <p className="rounded-md bg-amber-50 px-2.5 py-2 text-[11px] text-amber-700">
                    Lecture seule — vous n'avez pas les droits pour modifier cette tâche.
                  </p>
                )}
              </div>
            </div>
          </form>
        )}
      </DialogContent>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Supprimer la tâche ?"
        description={`« ${form.title || 'Cette tâche'} » sera définitivement supprimée. Cette action est irréversible.`}
        destructive
        confirmLabel="Supprimer"
        loading={del.isPending}
        onConfirm={doDelete}
      />

      <ImageViewer
        images={viewerImages}
        index={viewerIndex}
        onIndexChange={setViewerIndex}
        onClose={() => setViewerIndex(-1)}
      />
    </Dialog>
  );
}

function Meta({ icon: Icon, label, children }) {
  return (
    <div className="space-y-1">
      <Label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
        {label}
      </Label>
      {children}
    </div>
  );
}

function mapDefaults(defaults) {
  if (!defaults) return {};
  const out = {};
  if (defaults.status) out.status = defaults.status;
  if (defaults.sprint) out.sprint = defaults.sprint;
  return out;
}
