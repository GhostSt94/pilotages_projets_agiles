import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useLeaves(params = {}) {
  return useQuery({
    queryKey: ['leaves', params],
    queryFn: async () => (await api.get('/leaves', { params })).data,
  });
}

export function useCreateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/leaves', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
      // Un congé auto-approuvé (valideur) réduit immédiatement la capacité.
      qc.invalidateQueries({ queryKey: ['capacity'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

function useLeaveReview(action) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.patch(`/leaves/${id}/${action}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
      qc.invalidateQueries({ queryKey: ['capacity'] }); // un congé approuvé change la capacité
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
export const useApproveLeave = () => useLeaveReview('approve');
export const useRejectLeave = () => useLeaveReview('reject');
