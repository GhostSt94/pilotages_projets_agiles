import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Statuts (colonnes) d'un projet, ordonnés.
export function useStatuses(projectId) {
  return useQuery({
    queryKey: ['statuses', projectId],
    queryFn: async () => (await api.get(`/projects/${projectId}/statuses`)).data,
    enabled: !!projectId,
  });
}

// Invalide tout ce qui dépend des statuts d'un projet.
function invalidate(qc, projectId) {
  qc.invalidateQueries({ queryKey: ['statuses', projectId] });
  qc.invalidateQueries({ queryKey: ['board'] });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
  qc.invalidateQueries({ queryKey: ['tasks'] });
  qc.invalidateQueries({ queryKey: ['task'] });
}

export function useCreateStatus(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post(`/projects/${projectId}/statuses`, payload)).data,
    onSuccess: () => invalidate(qc, projectId),
  });
}

export function useUpdateStatus(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ statusId, ...patch }) => (await api.patch(`/projects/${projectId}/statuses/${statusId}`, patch)).data,
    onSuccess: () => invalidate(qc, projectId),
  });
}

export function useReorderStatuses(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order) => (await api.patch(`/projects/${projectId}/statuses/reorder`, { order })).data,
    onSuccess: () => invalidate(qc, projectId),
  });
}

export function useDeleteStatus(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (statusId) => (await api.delete(`/projects/${projectId}/statuses/${statusId}`)).data,
    onSuccess: () => invalidate(qc, projectId),
  });
}
