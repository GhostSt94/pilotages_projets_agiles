import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, RoleRoute } from '@/components/layout/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { ProjectProvider } from '@/lib/project';
import { PageLoader } from '@/components/common/states';

// Pages d'auth chargées normalement (petites, hors du shell).
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';

// Pages applicatives chargées à la demande (code-splitting par route).
const BoardPage = lazy(() => import('@/features/board/BoardPage'));
const PlanningPage = lazy(() => import('@/features/planning/PlanningPage'));
const MyTasksPage = lazy(() => import('@/features/tasks/MyTasksPage'));
const LeavesPage = lazy(() => import('@/features/leaves/LeavesPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const TeamPage = lazy(() => import('@/features/team/TeamPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <ProjectProvider>
              <AppShell />
            </ProjectProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/board" replace />} />
        <Route path="/board" element={<Lazy><BoardPage /></Lazy>} />
        <Route path="/planning" element={<Lazy><PlanningPage /></Lazy>} />
        {/* Anciennes routes fusionnées dans « Planification ». */}
        <Route path="/backlog" element={<Navigate to="/planning" replace />} />
        <Route path="/sprints" element={<Navigate to="/planning" replace />} />
        <Route path="/my-tasks" element={<Lazy><MyTasksPage /></Lazy>} />
        <Route path="/leaves" element={<Lazy><LeavesPage /></Lazy>} />
        <Route path="/dashboard" element={<Lazy><DashboardPage /></Lazy>} />
        <Route
          path="/team"
          element={
            <RoleRoute permission="user.view">
              <Lazy><TeamPage /></Lazy>
            </RoleRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <RoleRoute permission="user.view">
              <Lazy><SettingsPage /></Lazy>
            </RoleRoute>
          }
        />
        {/* Anciennes routes regroupées dans « Paramétrage ». */}
        <Route path="/projects" element={<Navigate to="/settings?tab=projects" replace />} />
        <Route path="/users" element={<Navigate to="/settings?tab=users" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/board" replace />} />
    </Routes>
  );
}

function Lazy({ children }) {
  return <Suspense fallback={<PageLoader className="h-full" />}>{children}</Suspense>;
}
