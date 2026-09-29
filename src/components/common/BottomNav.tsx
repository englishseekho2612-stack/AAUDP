import React from 'react';
import { AppView } from '../../types/navigation';
import { useProject } from '../../context/ProjectContext';
import { Home, BookOpen, GraduationCap, Settings, Bot } from 'lucide-react';

interface BottomNavProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenAskArpitSir?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenAskArpitSir,
}) => {
  const { projects } = useProject();

  const tabs: {
    view?: AppView;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    onClick?: () => void;
  }[] = [
    {
      view: 'home',
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
    },
    {
      view: 'projects',
      label: 'Learn',
      icon: <BookOpen className="w-5 h-5" />,
      badge: projects.length,
    },
    {
      label: 'Arpit Sir',
      icon: <Bot className="w-5 h-5 text-indigo-500" />,
      onClick: onOpenAskArpitSir,
    },
    {
      view: 'teaching',
      label: 'Teach',
      icon: <GraduationCap className="w-5 h-5" />,
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
      {tabs.map((tab, idx) => {
        const isActive = tab.view ? currentView === tab.view : false;

        const handleClick = () => {
          if (tab.onClick) {
            tab.onClick();
          } else if (tab.view) {
            onNavigate(tab.view);
          }
        };

        return (
          <button
            key={tab.view || `tab-${idx}`}
            id={`bottom-nav-${tab.view || 'arpit-sir'}`}
            onClick={handleClick}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-medium transition-colors min-h-[48px] min-w-[56px] relative cursor-pointer ${
              isActive
                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              {tab.icon}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-full text-[9px] flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="mt-0.5 tracking-tight font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
