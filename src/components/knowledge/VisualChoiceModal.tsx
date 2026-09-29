import React from 'react';
import { X, Network, GitFork, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/UIControls';

interface VisualChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVisual: (type: 'mind_map' | 'concept_tree') => void;
  hasExistingVisual?: boolean;
}

export const VisualChoiceModal: React.FC<VisualChoiceModalProps> = ({
  isOpen,
  onClose,
  onSelectVisual,
  hasExistingVisual = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                STEP 2 · Visual Learning
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              Choose Your Visual Format
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select the best visual representation for your study material
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Choice Grid */}
        <div className="p-6 space-y-4">
          {/* Option 1: Radial Mind Map */}
          <div
            onClick={() => {
              onSelectVisual('mind_map');
              onClose();
            }}
            className="group p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all cursor-pointer flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Network className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  🧠 Mind Map (Radial Network)
                </h3>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Freeform visual thinking network connecting related concepts radially outward from a central core theme.
              </p>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Best For:</span>
                <span>Brainstorming · Visual memory · Creative associations</span>
              </div>
            </div>
          </div>

          {/* Option 2: Hierarchical Concept Tree */}
          <div
            onClick={() => {
              onSelectVisual('concept_tree');
              onClose();
            }}
            className="group p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition-all cursor-pointer flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <GitFork className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  🌳 Concept Tree (Hierarchical Syllabus)
                </h3>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Structured step-by-step breakdown organizing complex subjects from Chapter down into Topics, Sub-topics, and Key Concepts.
              </p>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="font-semibold text-teal-600 dark:text-teal-400">Best For:</span>
                <span>Curriculum teaching · Exam syllabus · Step-by-step study</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            You can switch between both views at any time while studying
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
