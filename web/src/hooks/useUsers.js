import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useUsers(params = {}, options = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => (await api.get('/users', { params })).data,
    ...options,
  });
}

// Liste paginée côté serveur ({ items, total, page, pageCount }). Garde la page
// précédente affichée pendant le chargement de la suivante (pas de clignotement).
export function useUsersPage(params = {}, options = {}) {
  return useQuery({
    queryKey: ['users', 'page', params],
    queryFn: async () => (await api.get('/users', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });
}

// Heures réalisées par membre (somme des estimations des tâches terminées).
// params.project (optionnel) limite l'agrégation à un projet.
export function useUsersWorkload(params = {}) {
  return useQuery({
    queryKey: ['users-workload', params],
    queryFn: async () => (await api.get('/users/workload', { params })).data,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/users', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => (await api.patch(`/users/${id}`, patch)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

// Réinitialisation du mot de passe d'un utilisateur (admin).
export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ id, password }) => (await api.patch(`/users/${id}/password`, { password })).data,
  });
}
