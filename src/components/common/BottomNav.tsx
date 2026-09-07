import React from 'react';
import { AppView } from '../../types/navigation';
import { useProject } from '../../context/ProjectContext';
import { Home, FolderKanban, Plus, Video, Users, Settings, GraduationCap } from 'lucide-react';

interface BottomNavProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const { projects } = useProject();

  const tabs: { view: AppView; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      view: 'home',
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
    },
    {
      view: 'curriculum',
      label: 'Courses',
      icon: <GraduationCap className="w-5 h-5" />,
    },
    {
      view: 'projects',
      label: 'Projects',
      icon: <FolderKanban className="w-5 h-5" />,
      badge: projects.length,
    },
    {
      view: 'create',
      label: 'New',
      icon: <Plus className="w-6 h-6" />,
    },
    {
      view: 'classroom_hub',
      label: 'Classroom',
      icon: <Users className="w-5 h-5" />,
    },
    {
      view: 'teaching',
      label: 'Studio',
      icon: <Video className="w-5 h-5" />,
    },
    {
      view: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <nav
      id="mobile-bottom-navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2"
    >
      {tabs.map((tab) => {
        const isSpecialCreate = tab.view === 'create';
        const isActive = currentView === tab.view;

        if (isSpecialCreate) {
          return (
            <button
              key={tab.view}
              id={`bottom-nav-${tab.view}`}
              onClick={() => onNavigate(tab.view)}
              className="relative -top-3 w-12 h-12 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 active:scale-95 transition-transform min-h-[48px] min-w-[48px]"
              aria-label="Create New Project"
            >
              <Plus className="w-6 h-6" />
            </button>
          );
        }

        return (
          <button
            key={tab.view}
            id={`bottom-nav-${tab.view}`}
            onClick={() => onNavigate(tab.view)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors min-h-[44px] min-w-[44px] relative ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              {tab.icon}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-[9px] flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
