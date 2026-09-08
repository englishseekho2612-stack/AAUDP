import React, { useState, useEffect } from 'react';
import { DesktopService } from '../../services/desktop/desktopService';
import { Minus, Square, Copy, X, Maximize2, Minimize2 } from 'lucide-react';

export const WindowsTitleBar: React.FC = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const electronActive = DesktopService.isElectron();
    setIsElectron(electronActive);

    if (electronActive && window.electronAPI?.onWindowStateChange) {
      window.electronAPI.isMaximized().then(setIsMaximized).catch(() => {});
      window.electronAPI.isFullscreen().then(setIsFullscreen).catch(() => {});

      const cleanup = window.electronAPI.onWindowStateChange((state) => {
        setIsMaximized(state.isMaximized);
        setIsFullscreen(state.isFullscreen);
      });
      return cleanup;
    }
  }, []);

  // Global Desktop Keyboard Shortcuts (Ctrl+S, Ctrl+O, F11, Esc)
  useEffect(() => {
    if (!isElectron) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        DesktopService.toggleFullscreen().then(setIsFullscreen).catch(() => {});
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isElectron]);

  if (!isElectron) {
    return null;
  }

  return (
    <div
      id="windows-desktop-titlebar"
      className="h-9 w-full bg-slate-900 border-b border-slate-800 text-slate-300 flex items-center justify-between select-none z-50 text-xs transition-colors"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* App Branding & Icon */}
      <div className="flex items-center gap-2 px-3 no-drag" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <img src="/logo.svg" alt="App Logo" className="w-4 h-4 rounded-sm pointer-events-none" />
        <span className="font-semibold text-slate-200 tracking-wide">AI Teaching Studio</span>
        <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 rounded px-1.5 py-0.2">
          Windows Desktop
        </span>
      </div>

      {/* Center Drag Region */}
      <div className="flex-1 h-full" />

      {/* Window Controls (Minimize, Maximize, Fullscreen, Close) */}
      <div
        className="flex items-center h-full no-drag"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          type="button"
          onClick={() => DesktopService.toggleFullscreen().then(setIsFullscreen)}
          title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Enter Fullscreen (F11)'}
          className="h-full px-3 hover:bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={() => DesktopService.minimizeWindow()}
          title="Minimize"
          className="h-full px-3.5 hover:bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => DesktopService.maximizeWindow()}
          title={isMaximized ? 'Restore Down' : 'Maximize'}
          className="h-full px-3.5 hover:bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors"
        >
          {isMaximized ? <Copy className="w-3 h-3 rotate-180" /> : <Square className="w-3 h-3" />}
        </button>

        <button
          type="button"
          onClick={() => DesktopService.closeWindow()}
          title="Close"
          className="h-full px-4 hover:bg-red-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
