import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Liste paginée de mes notifications.
export function useNotifications(params = {}, options = {}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => (await api.get('/notifications', { params })).data,
    ...options,
  });
}

// Compteur de non-lues. Mise à jour surtout en temps réel (Socket.io) ; le polling
// long ne sert que de filet de sécurité (reconnexion, onglet en arrière-plan).
export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => (await api.get('/notifications/count')).data,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });
}

function invalidate(qc) {
  qc.invalidateQueries({ queryKey: ['notifications'] });
  qc.invalidateQueries({ queryKey: ['notifications-count'] });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.patch(`/notifications/${id}/read`)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.patch('/notifications/read-all')).data,
    onSuccess: () => invalidate(qc),
  });
}
