import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Volume2,
  Scissors,
  Bookmark,
  Zap,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { TimelineProjectState, AiEditSuggestion, AiEditToggles } from '../../types/editor';

interface AiSuggestionsDrawerProps {
  state: TimelineProjectState;
  onApplySuggestion: (suggestionId: string) => void;
  onRejectSuggestion: (suggestionId: string) => void;
  onToggleAiFeature: (feature: keyof AiEditToggles) => void;
}

export const AiSuggestionsDrawer: React.FC<AiSuggestionsDrawerProps> = ({
  state,
  onApplySuggestion,
  onRejectSuggestion,
  onToggleAiFeature,
}) => {
  return (
    <div
      id="ai-suggestions-drawer"
      className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-xs"
    >
      {/* 1. Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100">AI Assistant & Suggestions</h3>
            <span className="text-[10px] text-slate-400">Non-destructive educational enhancements</span>
          </div>
        </div>
      </div>

      {/* 2. Non-Destructive Global Toggles (Section 2 & 7) */}
      <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Non-Destructive AI Layer Toggles
        </span>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {/* Silence Removal */}
          <button
            onClick={() => onToggleAiFeature('silenceRemovalEnabled')}
            className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              state.aiToggles.silenceRemovalEnabled
                ? 'bg-indigo-950/70 border-indigo-500/60 text-indigo-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <Scissors className="w-3.5 h-3.5 text-indigo-400" />
              Trim Pauses
            </span>
            <span className="text-[10px] font-bold">
              {state.aiToggles.silenceRemovalEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Audio Enhancement */}
          <button
            onClick={() => onToggleAiFeature('audioEnhancementEnabled')}
            className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              state.aiToggles.audioEnhancementEnabled
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              Studio Voice
            </span>
            <span className="text-[10px] font-bold">
              {state.aiToggles.audioEnhancementEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Auto Zoom */}
          <button
            onClick={() => onToggleAiFeature('autoZoomEnabled')}
            className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              state.aiToggles.autoZoomEnabled
                ? 'bg-purple-950/70 border-purple-500/60 text-purple-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              Auto Zoom
            </span>
            <span className="text-[10px] font-bold">
              {state.aiToggles.autoZoomEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Caption Style */}
          <button
            onClick={() => onToggleAiFeature('captionStyleEnabled')}
            className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              state.aiToggles.captionStyleEnabled
                ? 'bg-amber-950/70 border-amber-500/60 text-amber-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              Teaching Style
            </span>
            <span className="text-[10px] font-bold">
              {state.aiToggles.captionStyleEnabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Suggestions List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Detected Edit Opportunities ({state.aiSuggestions.filter((s) => s.status === 'pending').length})
          </span>
        </div>

        {state.aiSuggestions.map((sug) => (
          <div
            key={sug.id}
            className={`p-3 rounded-xl border transition-all ${
              sug.status === 'applied'
                ? 'bg-emerald-950/20 border-emerald-900/40 text-slate-300'
                : sug.status === 'rejected'
                ? 'bg-slate-950/40 border-slate-800 opacity-60 text-slate-400'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-bold text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                {sug.title}
              </span>
              {sug.metric && (
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[10px] font-bold font-mono">
                  {sug.metric}
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              {sug.description}
            </p>

            {/* Action Buttons */}
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
              {sug.status === 'pending' ? (
                <div className="flex items-center gap-2 w-full justify-end">
                  <button
                    onClick={() => onRejectSuggestion(sug.id)}
                    className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => onApplySuggestion(sug.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Apply</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`font-semibold text-[10px] flex items-center gap-1 ${
                      sug.status === 'applied' ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {sug.status === 'applied' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Applied (Reversible)
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Dismissed
                      </>
                    )}
                  </span>
                  <button
                    onClick={() => onApplySuggestion(sug.id)}
                    className="text-[10px] text-slate-400 hover:text-indigo-400 underline cursor-pointer"
                  >
                    {sug.status === 'applied' ? 'Reapply' : 'Undo dismiss'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 4. Pedagogical Notice */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2 text-[10px] text-slate-400">
        <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span>You remain in complete control. Raw recordings are never modified or overwritten.</span>
      </div>
    </div>
  );
};
