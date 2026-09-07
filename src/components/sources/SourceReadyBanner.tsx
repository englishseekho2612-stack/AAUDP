import React from 'react';
import { LearningSource } from '../../types/project';
import { CheckCircle2, ArrowDown, Sparkles } from 'lucide-react';

interface SourceReadyBannerProps {
  sources: LearningSource[];
  onScrollToOutputs: () => void;
}

export const SourceReadyBanner: React.FC<SourceReadyBannerProps> = ({
  sources,
  onScrollToOutputs,
}) => {
  const readySources = sources.filter((s) => s.status === 'ready');
  if (readySources.length === 0) return null;

  return (
    <div
      id="sources-ready-banner"
      className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-indigo-50/80 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-indigo-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs text-xs"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Your Sources Are Ready ({readySources.length} of {sources.length} Grounded)
          </h3>
        </div>

        {/* Ready checklist chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {readySources.map((src) => (
            <span
              key={src.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/80 dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span className="max-w-[160px] truncate">{src.name}</span>
            </span>
          ))}
        </div>
      </div>

      <button
        id="btn-scroll-to-outputs"
        onClick={onScrollToOutputs}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-xs cursor-pointer active:scale-98"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Choose AI Output Below</span>
        <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
      </button>
    </div>
  );
};
