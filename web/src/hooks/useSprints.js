import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useSprints(projectId) {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async () => (await api.get(`/projects/${projectId}/sprints`)).data,
    enabled: !!projectId,
  });
}

export function useCapacity(sprintId) {
  return useQuery({
    queryKey: ['capacity', sprintId],
    queryFn: async () => (await api.get(`/sprints/${sprintId}/capacity`)).data,
    enabled: !!sprintId,
  });
}

export function useCreateSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/sprints', payload)).data,
    onSuccess: (s) => qc.invalidateQueries({ queryKey: ['sprints', s.project] }),
  });
}

export function useUpdateSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => (await api.patch(`/sprints/${id}`, patch)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints'] }),
  });
}

function useSprintTransition(action) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.patch(`/sprints/${id}/${action}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints'] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}
export const useStartSprint = () => useSprintTransition('start');
export const useCompleteSprint = () => useSprintTransition('complete');
