import { useAuth, isManagerOrAdmin, can } from '@/lib/auth';

/** Affiche ses enfants selon une permission (ou managerOrAdmin / rôles). */
export function RoleGate({ roles, managerOrAdmin, permission, children, fallback = null }) {
  const { user } = useAuth();
  if (!user) return fallback;
  if (permission) return can(user, permission) ? children : fallback;
  if (managerOrAdmin) return isManagerOrAdmin(user) ? children : fallback;
  if (roles) return roles.includes(user.role) ? children : fallback;
  return children;
}
