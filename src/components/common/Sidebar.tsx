import React from 'react';
import { AppView } from '../../types/navigation';
import { useProject } from '../../context/ProjectContext';
import {
  Home,
  BookOpen,
  GraduationCap,
  Users,
  Film,
  HardDrive,
  ShieldCheck,
  Settings,
  Bot,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenAskArpitSir?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onOpenAskArpitSir,
}) => {
  const { projects } = useProject();

  // Primary 3 actions
  const primaryNavItems: { view: AppView; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      view: 'home',
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
    },
    {
      view: 'projects',
      label: '📚 Learn (My Lessons)',
      icon: <BookOpen className="w-5 h-5" />,
      badge: projects.length,
    },
    {
      view: 'teaching',
      label: '🎓 Teach (Teaching Board)',
      icon: <GraduationCap className="w-5 h-5" />,
      badge: 'Live',
    },
  ];

  // Secondary classroom hubs
  const classroomNavItems: { view: AppView; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      view: 'classroom_hub',
      label: 'Classroom Hub',
      icon: <Users className="w-5 h-5" />,
    },
    {
      view: 'curriculum',
      label: 'Curriculum & Courses',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      view: 'student_portal',
      label: 'Student Portal',
      icon: <Users className="w-5 h-5" />,
    },
    {
      view: 'video_editor',
      label: 'AI Video Editor',
      icon: <Film className="w-5 h-5" />,
    },
  ];

  const systemNavItems: { view: AppView; label: string; icon: React.ReactNode }[] = [
    {
      view: 'storage_manager',
      label: 'Device Storage',
      icon: <HardDrive className="w-5 h-5" />,
    },
    {
      view: 'system_qa',
      label: 'Diagnostic QA',
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
      className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[calc(100vh-4rem)] p-4 justify-between select-none"
    >
      <div className="space-y-6">
        {/* Ask Arpit Sir Dedicated Mentor Button */}
        {onOpenAskArpitSir && (
          <div className="pt-1">
            <button
              id="sidebar-btn-ask-arpit-sir"
              onClick={onOpenAskArpitSir}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-indigo-900/90 to-purple-900/90 text-white shadow-md hover:shadow-lg hover:scale-102 transition-all flex items-center justify-between group cursor-pointer border border-indigo-500/40 text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight flex items-center gap-1">
                    <span>Ask Arpit Sir</span>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                  </div>
                  <div className="text-[10px] text-indigo-200 leading-tight">
                    Instant AI Learning Tutor
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full text-indigo-100">
                Ask →
              </span>
            </button>
          </div>
        )}

        {/* Primary 3 Actions */}
        <nav className="space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block mb-1.5">
              Classroom Activities
            </span>
            <div className="space-y-0.5">
              {primaryNavItems.map((item) => {
                const isActive = currentView === item.view;
                return (
                  <button
                    key={item.view}
                    id={`sidebar-nav-${item.view}`}
                    onClick={() => onNavigate(item.view)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors min-h-[42px] cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200'
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
              Hubs & Tools
            </span>
            <div className="space-y-0.5">
              {classroomNavItems.map((item) => {
                const isActive = currentView === item.view;
                return (
                  <button
                    key={item.view}
                    id={`sidebar-nav-${item.view}`}
                    onClick={() => onNavigate(item.view)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[36px] cursor-pointer ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-slate-400">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block mb-1.5">
              System
            </span>
            <div className="space-y-0.5">
              {systemNavItems.map((item) => {
                const isActive = currentView === item.view;
                return (
                  <button
                    key={item.view}
                    id={`sidebar-nav-${item.view}`}
                    onClick={() => onNavigate(item.view)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[36px] cursor-pointer ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-slate-400">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </div>

      {/* Brand Footer */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-slate-500 space-y-1">
        <div className="font-bold text-slate-600 dark:text-slate-400">
          Arpit Academy Udaipura
        </div>
        <div>Developed by Arpit Digital Hub</div>
      </div>
    </aside>
  );
};
