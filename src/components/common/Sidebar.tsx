import React from 'react';
import { AppView } from '../../types/navigation';
import { useProject } from '../../context/ProjectContext';
import { ArpitAcademyLogo } from './ArpitAcademyLogo';
import {
  Home,
  FolderKanban,
  PlusCircle,
  Video,
  Users,
  Film,
  HardDrive,
  ShieldCheck,
  Settings,
  Sparkles,
  ChevronRight,
  GraduationCap,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { projects, activeProject } = useProject();

  const primaryNavItems: { view: AppView; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      view: 'home',
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
    },
    {
      view: 'projects',
      label: 'Projects & Workspace',
      icon: <FolderKanban className="w-5 h-5" />,
      badge: projects.length,
    },
    {
      view: 'teaching',
      label: 'Teaching Studio',
      icon: <Video className="w-5 h-5" />,
      badge: 'Live',
    },
    {
      view: 'classroom_hub',
      label: 'Classroom Hub',
      icon: <Users className="w-5 h-5" />,
    },
    {
      view: 'curriculum',
      label: 'Curriculum & Courses',
      icon: <GraduationCap className="w-5 h-5" />,
    },
    {
      view: 'student_portal',
      label: 'Student Portal',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      view: 'video_editor',
      label: 'AI Video Editor',
      icon: <Film className="w-5 h-5" />,
    },
  ];

  const systemNavItems: { view: AppView; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      view: 'storage_manager',
      label: 'Device Storage',
      icon: <HardDrive className="w-5 h-5" />,
    },
    {
      view: 'system_qa',
      label: 'System Diagnostic (QA)',
      icon: <ShieldCheck className="w-5 h-5" />,
    },
    {
      view: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside
      id="desktop-sidebar"
      className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[calc(100vh-4rem)] p-4 justify-between"
    >
      <div className="space-y-6">
        {/* Navigation items */}
        <nav className="space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block mb-1.5">
              Studio & Teaching
            </span>
            <div className="space-y-0.5">
              {primaryNavItems.map((item) => {
                const isActive = currentView === item.view;
                return (
                  <button
                    key={item.view}
                    id={`sidebar-nav-${item.view}`}
                    onClick={() => onNavigate(item.view)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[40px] cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block mb-1.5">
              System & Tools
            </span>
            <div className="space-y-0.5">
              {systemNavItems.map((item) => {
                const isActive = currentView === item.view;
                return (
                  <button
                    key={item.view}
                    id={`sidebar-nav-${item.view}`}
                    onClick={() => onNavigate(item.view)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[40px] cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Active Project Quick Card if loaded */}
        {activeProject && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block mb-2">
              Workspace
            </span>
            <button
              id="sidebar-active-project-card"
              onClick={() => onNavigate('project_dashboard')}
              className={`w-full p-3 rounded-lg border text-left transition-all ${
                currentView === 'project_dashboard'
                  ? 'border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  Current Session
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate mt-1">
                {activeProject.name}
              </p>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span>{activeProject.sources.length}/5 Sources</span>
                <span>•</span>
                <span className="uppercase">{activeProject.language}</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Academy Brand Identity & Local Storage Indicator */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50/80 to-teal-50/40 dark:from-emerald-950/20 dark:to-slate-900 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-emerald-600/30 bg-white shadow-xs">
            <ArpitAcademyLogo className="w-full h-full" />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 block truncate">
              ARPIT ACADEMY
            </span>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block truncate">
              Udaipura
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 block truncate">
              Learn • Teach • Understand
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 dark:text-slate-400">
          <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="truncate text-[11px]">
            <span className="font-medium text-slate-700 dark:text-slate-300">IndexedDB Local</span> · Ready
          </div>
        </div>
      </div>
    </aside>
  );
};
