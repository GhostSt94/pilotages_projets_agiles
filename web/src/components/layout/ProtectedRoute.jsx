import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, can } from '@/lib/auth';
import { PageLoader } from '@/components/common/states';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader className="h-screen" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

/** Garde une route selon une permission (ou une liste de rôles). Redirige sinon. */
export function RoleRoute({ roles, permission, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (permission && !can(user, permission)) return <Navigate to="/board" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/board" replace />;
  return children;
}
