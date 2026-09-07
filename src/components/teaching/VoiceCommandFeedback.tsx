import React from 'react';
import { RecognizedVoiceCommand } from '../../types/teaching';
import { Zap, AlertTriangle } from 'lucide-react';

interface VoiceCommandFeedbackProps {
  lastCommand: RecognizedVoiceCommand | null;
  pendingDestructiveCommand: RecognizedVoiceCommand | null;
  onConfirmDestructive: () => void;
  onCancelDestructive: () => void;
}

export const VoiceCommandFeedback: React.FC<VoiceCommandFeedbackProps> = ({
  lastCommand,
  pendingDestructiveCommand,
  onConfirmDestructive,
  onCancelDestructive,
}) => {
  // Destructive Confirmation Dialog (Section 33)
  if (pendingDestructiveCommand) {
    return (
      <div
        id="voice-command-confirm-modal"
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none"
      >
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200 dark:border-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Confirm Voice Action
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI Voice detected command: "{pendingDestructiveCommand.rawTranscript}"
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Do you wish to clear all current whiteboard drawings? This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onCancelDestructive}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-destructive-voice-command"
              onClick={onConfirmDestructive}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Clear Annotations
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!lastCommand) return null;

  return (
    <div
      id="voice-command-pill"
      className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200"
    >
      <div className="bg-purple-600/90 text-white px-4 py-2 rounded-full text-xs font-bold tracking-wide shadow-xl backdrop-blur-xs flex items-center gap-2">
        <Zap className="w-3.5 h-3.5" />
        <span>Voice Action: "{lastCommand.rawTranscript}"</span>
      </div>
    </div>
  );
};
