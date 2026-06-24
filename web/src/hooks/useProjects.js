import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useProject(id) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => (await api.get(`/projects/${id}`)).data,
    enabled: !!id,
  });
}

export function useBoard(projectId) {
  return useQuery({
    queryKey: ['board', projectId],
    queryFn: async () => (await api.get(`/projects/${projectId}/board`)).data,
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/projects', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => (await api.patch(`/projects/${id}`, patch)).data,
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['project', id] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/projects/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useAddMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId }) => (await api.post(`/projects/${id}/members`, { userId })).data,
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['project', id] });
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId }) => (await api.delete(`/projects/${id}/members/${userId}`)).data,
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['project', id] });
    },
  });
}
