import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await api.get('/roles')).data,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePermissionsCatalog() {
  return useQuery({
    queryKey: ['permissions-catalog'],
    queryFn: async () => (await api.get('/roles/permissions')).data,
    staleTime: Infinity,
  });
}

function useRoleMutation(fn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export const useCreateRole = () => useRoleMutation((payload) => api.post('/roles', payload).then((r) => r.data));
export const useUpdateRole = () => useRoleMutation(({ id, ...patch }) => api.patch(`/roles/${id}`, patch).then((r) => r.data));
export const useDeleteRole = () => useRoleMutation((id) => api.delete(`/roles/${id}`).then((r) => r.data));
