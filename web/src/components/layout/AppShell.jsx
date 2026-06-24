import { createContext, useContext, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { SidebarContent } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';

const HeaderContext = createContext(() => {});

/** À appeler dans chaque page pour renseigner le titre de la topbar. */
export function usePageHeader(title, subtitle) {
  const setHeader = useContext(HeaderContext);
  useEffect(() => {
    setHeader({ title, subtitle });
  }, [title, subtitle, setHeader]);
}

export function AppShell() {
  const [header, setHeader] = useState({ title: 'Cadence', subtitle: '' });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <HeaderContext.Provider value={setHeader}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar desktop */}
        <aside className="hidden w-64 shrink-0 border-r bg-white md:block">
          <SidebarContent />
        </aside>

        {/* Drawer mobile */}
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogContent className="left-0 top-0 h-full max-w-64 translate-x-0 translate-y-0 rounded-none p-0">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </DialogContent>
        </Dialog>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar title={header.title} subtitle={header.subtitle} onOpenSidebar={() => setMobileOpen(true)} />
          <main key={location.pathname} className="flex-1 overflow-y-auto animate-in fade-in-50 duration-300">
            <Outlet />
          </main>
        </div>

        <CommandPalette />
      </div>
    </HeaderContext.Provider>
  );
}
