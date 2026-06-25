import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useTasks(params = {}) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: async () => (await api.get('/tasks', { params })).data,
    enabled: params.enabled !== false,
  });
}

export function useTask(id) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => (await api.get(`/tasks/${id}`)).data,
    enabled: !!id,
  });
}

// Invalide tout ce qui dépend des tâches (board, listes, détail, capacité, dashboard).
function invalidateTaskViews(qc) {
  qc.invalidateQueries({ queryKey: ['board'] });
  qc.invalidateQueries({ queryKey: ['tasks'] });
  qc.invalidateQueries({ queryKey: ['task'] }); // détail d'une tâche (TaskDialog)
  qc.invalidateQueries({ queryKey: ['capacity'] });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
  qc.invalidateQueries({ queryKey: ['users-workload'] }); // heures réalisées par membre
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/tasks', payload)).data,
    onSuccess: () => invalidateTaskViews(qc),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => (await api.patch(`/tasks/${id}`, patch)).data,
    onSuccess: (_d, { id }) => {
      invalidateTaskViews(qc);
      qc.invalidateQueries({ queryKey: ['task', id] });
    },
  });
}

export function useMoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => (await api.patch(`/tasks/${id}/move`, patch)).data,
    onSuccess: () => invalidateTaskViews(qc),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/tasks/${id}`)).data,
    onSuccess: () => invalidateTaskViews(qc),
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }) => (await api.post(`/tasks/${id}/comments`, { body })).data,
    // Ajout optimiste : le commentaire apparaît immédiatement, rollback si erreur.
    onMutate: async ({ id, body, author }) => {
      await qc.cancelQueries({ queryKey: ['task', id] });
      const prev = qc.getQueryData(['task', id]);
      if (prev) {
        qc.setQueryData(['task', id], {
          ...prev,
          comments: [
            ...(prev.comments || []),
            {
              _id: `tmp-${Date.now()}`,
              body,
              author: author ? { _id: author._id, name: author.name } : null,
              createdAt: new Date().toISOString(),
              _optimistic: true,
            },
          ],
        });
      }
      return { prev, id };
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.prev) qc.setQueryData(['task', id], ctx.prev);
    },
    onSettled: (_d, _e, { id }) => qc.invalidateQueries({ queryKey: ['task', id] }),
  });
}

// Saisie de temps passé sur une tâche.
export function useAddTimeLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, hours, spentOn, note }) =>
      (await api.post(`/tasks/${id}/timelogs`, { hours, spentOn, note })).data,
    onSuccess: (_d, { id }) => {
      invalidateTaskViews(qc);
      qc.invalidateQueries({ queryKey: ['task', id] });
    },
  });
}

export function useRemoveTimeLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, logId }) => (await api.delete(`/tasks/${id}/timelogs/${logId}`)).data,
    onSuccess: (_d, { id }) => {
      invalidateTaskViews(qc);
      qc.invalidateQueries({ queryKey: ['task', id] });
    },
  });
}

// Upload d'une image sur une tâche (multipart/form-data).
export function useAddAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }) => {
      const fd = new FormData();
      fd.append('image', file);
      return (await api.post(`/tasks/${id}/attachments`, fd)).data;
    },
    onSuccess: (_d, { id }) => qc.invalidateQueries({ queryKey: ['task', id] }),
  });
}

export function useRemoveAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, attachmentId }) =>
      (await api.delete(`/tasks/${id}/attachments/${attachmentId}`)).data,
    onSuccess: (_d, { id }) => qc.invalidateQueries({ queryKey: ['task', id] }),
  });
}
