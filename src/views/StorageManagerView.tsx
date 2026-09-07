import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Trash2,
  RefreshCw,
  FolderArchive,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
} from 'lucide-react';
import {
  storageManagerService,
  StorageOverview,
} from '../services/storage/storageManagerService';

interface StorageManagerViewProps {
  onBack: () => void;
}

export const StorageManagerView: React.FC<StorageManagerViewProps> = ({ onBack }) => {
  const [overview, setOverview] = useState<StorageOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const loadStorage = async () => {
    setIsLoading(true);
    try {
      const data = await storageManagerService.getStorageOverview();
      setOverview(data);
    } catch (e) {
      console.error('Error loading storage info:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStorage();
  }, []);

  const handleClearCache = async () => {
    const cleared = await storageManagerService.clearTemporaryCaches();
    setNotice(`Cleaned temporary caches successfully (${cleared} bytes reclaimed).`);
    setTimeout(() => setNotice(null), 3500);
    loadStorage();
  };

  return (
    <div
      id="storage-manager-view-root"
      className="max-w-5xl mx-auto space-y-6 pb-12 select-none"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-indigo-500" />
              Device Storage & Media Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Local-first IndexedDB binary store • Offline data boundaries
            </p>
          </div>
        </div>

        <button
          onClick={loadStorage}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {notice && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* 1. Storage Usage Meter Card */}
        {overview && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Device Footprint
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {overview.formattedUsed}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    used of {overview.formattedQuota} available
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {overview.percentUsed}%
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Allocated</span>
              </div>
            </div>

            {/* Visual Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(4, overview.percentUsed)}%` }}
              />
            </div>
          </div>
        )}

        {/* 2. Categorized Storage Breakdown */}
        {overview && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Category Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {overview.breakdown.map((cat) => (
                <div
                  key={cat.category}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{cat.category}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {cat.formattedSize} • {cat.itemCount} items
                    </span>
                  </div>

                  {cat.canClean && cat.category.includes('Temporary') && (
                    <button
                      onClick={handleClearCache}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                    >
                      Clear Cache
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Safety Notice */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
          <Database className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-300 block mb-0.5">Offline-First Architecture</span>
            <span>
              All video recordings, audio tracks, and classroom exports are securely preserved on your local machine via browser IndexedDB. Files are never transmitted to external cloud servers without explicit teacher export.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
