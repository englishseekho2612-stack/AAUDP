import React from 'react';
import { LearningSource } from '../../types/project';
import { Button } from '../common/UIControls';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface RemoveSourceModalProps {
  source: LearningSource | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRemove: (source: LearningSource) => void;
}

export const RemoveSourceModal: React.FC<RemoveSourceModalProps> = ({
  source,
  isOpen,
  onClose,
  onConfirmRemove,
}) => {
  if (!isOpen || !source) return null;

  return (
    <div
      id="remove-source-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-left"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        id="remove-source-modal-container"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Remove this source from the project?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              You are about to remove <strong className="text-slate-700 dark:text-slate-200">&ldquo;{source.name}&rdquo;</strong>.
              This will safely clear its segments and free up 1 source slot in your project.
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
            <span>Type: <strong>{source.type.toUpperCase()}</strong></span>
            {source.metadata.pageCount && <span> · {source.metadata.pageCount} Pages</span>}
            {source.metadata.slideCount && <span> · {source.metadata.slideCount} Slides</span>}
            {source.wordCount && <span> · {source.wordCount.toLocaleString()} Words</span>}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            id="btn-confirm-remove-source"
            variant="danger"
            size="sm"
            onClick={() => onConfirmRemove(source)}
          >
            Yes, Remove Source
          </Button>
        </div>
      </div>
    </div>
  );
};
