import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { getToken } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

// Clés invalidées quand une tâche/un sprint change (miroir d'invalidateTaskViews).
const TASK_KEYS = [['board'], ['tasks'], ['task'], ['sprints'], ['capacity'], ['dashboard'], ['users-workload']];

/**
 * Pont temps réel : ouvre la connexion Socket.io quand un utilisateur est connecté
 * et traduit les événements serveur en invalidations TanStack Query (refetch ciblé).
 * Aucun rendu — monté une fois dans les providers.
 */
export function RealtimeBridge() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return undefined;
    const token = getToken();
    if (!token) return undefined;

    const socket = connectSocket(token);

    const invalidateTasks = () => TASK_KEYS.forEach((key) => qc.invalidateQueries({ queryKey: key }));
    const onNotification = (payload) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
      if (payload?.title) toast.info(payload.title);
    };

    socket.on('task:changed', invalidateTasks);
    socket.on('sprint:changed', invalidateTasks);
    socket.on('notification:new', onNotification);

    return () => {
      socket.off('task:changed', invalidateTasks);
      socket.off('sprint:changed', invalidateTasks);
      socket.off('notification:new', onNotification);
    };
  }, [user, qc]);

  // Ferme la connexion à la déconnexion (plus d'utilisateur).
  useEffect(() => {
    if (!user) disconnectSocket();
  }, [user]);

  return null;
}
