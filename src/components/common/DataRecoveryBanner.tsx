import React, { useState, useEffect } from 'react';
import { recoveryService, RecoverableItem } from '../../services/storage/recoveryService';
import { useProject } from '../../context/ProjectContext';
import { ShieldAlert, RotateCcw, Trash2, X, CheckCircle2 } from 'lucide-react';

export const DataRecoveryBanner: React.FC = () => {
  const { openProject, showToast, activeProject } = useProject();
  const [items, setItems] = useState<RecoverableItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const update = () => {
      setItems(recoveryService.getRecoverableItems());
    };
    update();
    return recoveryService.subscribe(update);
  }, []);

  if (items.length === 0) return null;

  const handleRecover = async (item: RecoverableItem) => {
    try {
      if (item.projectId) {
        // If restoring a project/draft, ensure we open the project
        if (!activeProject || activeProject.id !== item.projectId) {
          await openProject(item.projectId);
        }
      }

      showToast(`Recovered "${item.title}". Restored from ${item.lastUpdatedFormatted}.`, 'success');
      recoveryService.discardItem(item.id);
    } catch (e: any) {
      showToast(e?.message || 'Failed to apply recovery item.', 'error');
    }
  };

  const handleDiscard = (item: RecoverableItem) => {
    recoveryService.discardItem(item.id);
    showToast(`Discarded recovery item "${item.title}".`, 'info');
  };

  const handleDismissAll = () => {
    recoveryService.clearAll();
    showToast('Cleared all recovery snapshots.', 'info');
  };

  const primaryItem = items[0];

  return (
    <div
      id="data-recovery-banner"
      className="bg-amber-500/10 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2.5 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 transition-all"
    >
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <div>
          <span className="font-bold">Unsaved Session Recovered: </span>
          <span>
            {primaryItem.title} ({primaryItem.lastUpdatedFormatted})
          </span>
          {items.length > 1 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-2 underline font-semibold text-amber-700 dark:text-amber-300 cursor-pointer"
            >
              +{items.length - 1} more
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleRecover(primaryItem)}
          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Recover</span>
        </button>
        <button
          onClick={() => handleDiscard(primaryItem)}
          className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          <span>Discard</span>
        </button>
        <button
          onClick={handleDismissAll}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          title="Dismiss all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
