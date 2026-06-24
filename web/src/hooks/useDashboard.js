import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useDashboard(sprintId) {
  return useQuery({
    queryKey: ['dashboard', sprintId],
    queryFn: async () => (await api.get('/dashboard', { params: { sprint: sprintId } })).data,
    enabled: !!sprintId,
  });
}
