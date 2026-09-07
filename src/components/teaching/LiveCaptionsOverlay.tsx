import React, { useState } from 'react';
import { Subtitles, X, Type, MoveVertical } from 'lucide-react';

interface LiveCaptionsOverlayProps {
  transcript: string;
  isVisible: boolean;
  onClose: () => void;
}

export const LiveCaptionsOverlay: React.FC<LiveCaptionsOverlayProps> = ({
  transcript,
  isVisible,
  onClose,
}) => {
  const [position, setPosition] = useState<'bottom' | 'top'>('bottom');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  if (!isVisible || !transcript) return null;

  return (
    <div
      id="live-captions-overlay"
      className={`absolute left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-2xl w-[90%] transition-all select-none ${
        position === 'bottom' ? 'bottom-20' : 'top-16'
      }`}
    >
      <div className="bg-black/85 backdrop-blur-md border border-white/20 text-white rounded-2xl px-5 py-3 shadow-2xl flex items-center justify-between gap-4">
        {/* Caption text */}
        <p
          className={`flex-1 font-medium leading-relaxed tracking-wide text-center ${
            fontSize === 'sm'
              ? 'text-xs'
              : fontSize === 'base'
              ? 'text-sm sm:text-base'
              : 'text-base sm:text-lg'
          }`}
        >
          {transcript}
        </p>

        {/* Caption options */}
        <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() =>
              setFontSize((s) => (s === 'sm' ? 'base' : s === 'base' ? 'lg' : 'sm'))
            }
            title="Toggle Font Size"
            className="p-1 hover:bg-white/20 rounded cursor-pointer"
          >
            <Type className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPosition((p) => (p === 'bottom' ? 'top' : 'bottom'))}
            title="Toggle Top/Bottom"
            className="p-1 hover:bg-white/20 rounded cursor-pointer"
          >
            <MoveVertical className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            title="Hide Captions"
            className="p-1 hover:bg-white/20 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
