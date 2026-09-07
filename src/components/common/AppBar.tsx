import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import { AppView } from '../../types/navigation';
import { ArpitAcademyLogo } from './ArpitAcademyLogo';
import {
  Sparkles,
  Sun,
  Moon,
  CheckCircle,
  Clock,
  ArrowLeft,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface AppBarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onBackToProjects?: () => void;
}

export const AppBar: React.FC<AppBarProps> = ({
  currentView,
  onNavigate,
  onBackToProjects,
}) => {
  const { resolvedTheme, setTheme } = useTheme();
  const { activeProject, isSaving, lastSaved } = useProject();

  // Network offline state monitoring (Section 9)
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'offline' | 'reconnecting'>(
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'connected'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setNetworkStatus('reconnecting');
      setTimeout(() => setNetworkStatus('connected'), 1500);
    };

    const handleOffline = () => {
      setNetworkStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const isInsideProject = currentView === 'project_dashboard' && activeProject;

  return (
    <header
      id="main-app-bar"
      className="sticky top-0 z-40 h-16 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between transition-colors"
    >
      <div className="flex items-center gap-3">
        {isInsideProject ? (
          <div className="flex items-center gap-2.5">
            <button
              id="btn-appbar-back"
              onClick={onBackToProjects}
              className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Back to All Projects"
              aria-label="Back to projects"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Active Project
              </span>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {activeProject.name}
              </h1>
            </div>
          </div>
        ) : (
          <button
            id="btn-brand-home"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 group text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-emerald-700/20 shadow-xs group-hover:scale-105 transition-transform bg-white">
              <ArpitAcademyLogo className="w-full h-full" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-slate-100 block leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                ARPIT ACADEMY UDAIPURA
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 tracking-wide block">
                Learn • Teach • Understand <span className="hidden sm:inline font-normal text-slate-400">· With Arpit Sir</span>
              </span>
            </div>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Network Status Pill (Section 9) */}
        {networkStatus === 'offline' && (
          <div
            id="network-status-offline"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900"
            title="Device is offline. All local project features and video editing remain operational."
          >
            <WifiOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span className="hidden sm:inline">Offline (Local Mode)</span>
          </div>
        )}

        {networkStatus === 'reconnecting' && (
          <div
            id="network-status-reconnecting"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 animate-pulse"
          >
            <Wifi className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Reconnecting...</span>
          </div>
        )}

        {isInsideProject && (
          <div
            id="auto-save-indicator"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800"
          >
            {isSaving ? (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span>Auto-saving...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {lastSaved ? 'Saved locally' : 'Local storage ready'}
                </span>
              </>
            )}
          </div>
        )}

        <button
          id="btn-toggle-theme"
          onClick={toggleTheme}
          className="p-2.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle theme mode"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600" />
          )}
        </button>
      </div>
    </header>
  );
};
