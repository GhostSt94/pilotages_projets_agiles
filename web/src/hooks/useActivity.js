import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Journal d'activité paginé ({ items, total, page, pageCount }).
export function useActivity(params = {}, options = {}) {
  return useQuery({
    queryKey: ['activity', params],
    queryFn: async () => (await api.get('/activity', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });
}
