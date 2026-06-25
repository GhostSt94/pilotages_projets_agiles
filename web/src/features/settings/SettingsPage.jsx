import { useSearchParams } from 'react-router-dom';
import { FolderKanban, Building2, ShieldCheck, ScrollText } from 'lucide-react';
import { usePageHeader } from '@/components/layout/AppShell';
import { useAuth, can } from '@/lib/auth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ProjectsPage from '@/features/projects/ProjectsPage';
import UsersPage from '@/features/users/UsersPage';
import ActivityPage from '@/features/activity/ActivityPage';
import RolesPanel from './RolesPanel';

export default function SettingsPage() {
  usePageHeader('Paramétrage', 'Projets, utilisateurs, rôles et activité');
  const { user } = useAuth();
  const canRoles = can(user, 'role.manage');
  const canActivity = can(user, 'activity.view');

  const tabs = ['projects', 'users', ...(canRoles ? ['roles'] : []), ...(canActivity ? ['activity'] : [])];
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = tabs.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'projects';

  function onTabChange(value) {
    setSearchParams({ tab: value }, { replace: true });
  }

  return (
    <Tabs value={tab} onValueChange={onTabChange} className="flex h-full flex-col">
      <div className="border-b bg-white px-5 py-2.5">
        <TabsList>
          <TabsTrigger value="projects" className="gap-1.5">
            <FolderKanban className="h-4 w-4" /> Projets
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Building2 className="h-4 w-4" /> Utilisateurs
          </TabsTrigger>
          {canRoles && (
            <TabsTrigger value="roles" className="gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Rôles
            </TabsTrigger>
          )}
          {canActivity && (
            <TabsTrigger value="activity" className="gap-1.5">
              <ScrollText className="h-4 w-4" /> Activité
            </TabsTrigger>
          )}
        </TabsList>
      </div>

      <div className="flex-1 overflow-y-auto">
        <TabsContent value="projects" className="mt-0">
          <ProjectsPage />
        </TabsContent>
        <TabsContent value="users" className="mt-0">
          <UsersPage />
        </TabsContent>
        {canRoles && (
          <TabsContent value="roles" className="mt-0">
            <RolesPanel />
          </TabsContent>
        )}
        {canActivity && (
          <TabsContent value="activity" className="mt-0">
            <ActivityPage />
          </TabsContent>
        )}
      </div>
    </Tabs>
  );
}
