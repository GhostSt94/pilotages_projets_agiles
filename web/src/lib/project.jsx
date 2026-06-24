import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';

const ProjectContext = createContext(null);
const KEY = 'cadence.projectId';

export function useProjectsQuery() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data,
  });
}

export function ProjectProvider({ children }) {
  const { data: projects = [], isLoading } = useProjectsQuery();
  const [projectId, setProjectId] = useState(() => localStorage.getItem(KEY) || null);

  // Sélectionne automatiquement le premier projet si aucun n'est choisi/valide.
  useEffect(() => {
    if (isLoading || !projects.length) return;
    const valid = projects.some((p) => p._id === projectId);
    if (!valid) {
      setProjectId(projects[0]._id);
    }
  }, [projects, isLoading, projectId]);

  useEffect(() => {
    if (projectId) localStorage.setItem(KEY, projectId);
  }, [projectId]);

  const currentProject = useMemo(
    () => projects.find((p) => p._id === projectId) || null,
    [projects, projectId]
  );

  const value = { projects, isLoading, projectId, setProjectId, currentProject };
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject doit être utilisé dans <ProjectProvider>');
  return ctx;
}
