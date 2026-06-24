import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Réhydratation au démarrage : si un token existe, on recharge le profil.
  useEffect(() => {
    let active = true;
    async function boot() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/users/me');
        if (active) setUser(data);
      } catch {
        setToken(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    boot();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    window.location.assign('/login');
  }, []);

  const value = { user, setUser, loading, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}

// Helpers d'autorisation basés sur les permissions (miroir de utils/authz.js back).
// `user.permissions` est fourni par /auth/login, /auth/register et /users/me.
export function can(user, perm) {
  return Array.isArray(user?.permissions) && user.permissions.includes(perm);
}
// Conservé pour compat : « gère projets/sprints » = a une permission de gestion.
export function isManagerOrAdmin(user) {
  return can(user, 'project.manage') || can(user, 'sprint.manage') || can(user, 'user.manage');
}
export function isProjectMember(project, userId) {
  return (project?.members || []).some((m) => String(m._id || m) === String(userId));
}
export function canModifyTask(user, project, task) {
  if (!user) return false;
  if (can(user, 'task.manage.any')) return true;
  if (isProjectMember(project, user._id)) return true;
  const assignee = task?.assignee;
  return assignee && String(assignee._id || assignee) === String(user._id);
}
