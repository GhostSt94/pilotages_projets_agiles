import { Menu, ChevronDown, FolderKanban, LogOut, Check, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useProject } from '@/lib/project';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ROLE } from '@/lib/constants';
import { NotificationsBell } from './NotificationsBell';

export function Topbar({ title, subtitle, onOpenSidebar }) {
  const { user, logout } = useAuth();
  const { projects, currentProject, setProjectId } = useProject();

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-white/80 px-4 backdrop-blur sm:px-5">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenSidebar}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">{title}</h1>
        {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Déclencheur de la palette de commandes */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
          className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 lg:flex"
          title="Recherche & commandes"
        >
          <Search className="h-4 w-4" />
          <span>Rechercher</span>
          <kbd className="rounded border bg-slate-50 px-1.5 text-[10px] text-slate-400">⌘K</kbd>
        </button>

        {/* Notifications */}
        <NotificationsBell />

        {/* Sélecteur de projet courant */}
        {currentProject && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden gap-2 sm:inline-flex">
                <FolderKanban className="h-4 w-4 text-primary" />
                <span className="max-w-[160px] truncate font-medium">{currentProject.name}</span>
                <span className="rounded bg-slate-100 px-1.5 font-mono text-[11px] text-slate-500">
                  {currentProject.key}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>Projet courant</DropdownMenuLabel>
              {projects.map((p) => (
                <DropdownMenuItem key={p._id} onClick={() => setProjectId(p._id)}>
                  <span className="truncate">{p.name}</span>
                  {p._id === currentProject._id && <Check className="ml-auto h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Menu utilisateur */}
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
            <Avatar name={user?.name} id={user?._id} size="md" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-slate-700">
              <div className="font-medium">{user?.name}</div>
              <div className="text-xs font-normal text-slate-400">{user?.email}</div>
              <div className="mt-1 text-xs font-normal text-primary">{ROLE[user?.role]?.label}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
              <LogOut className="h-4 w-4" /> Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
