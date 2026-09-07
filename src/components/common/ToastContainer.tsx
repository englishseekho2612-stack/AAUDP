import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useProject();

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const icon =
          toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-blue-500 shrink-0" />
          );

        const borderClass =
          toast.type === 'success'
            ? 'border-emerald-200 dark:border-emerald-800'
            : toast.type === 'error'
            ? 'border-rose-200 dark:border-rose-800'
            : 'border-blue-200 dark:border-blue-800';

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 border ${borderClass} rounded-lg shadow-lg text-sm text-slate-800 dark:text-slate-100 transition-all`}
          >
            <div className="flex items-center gap-2.5">
              {icon}
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              id={`btn-dismiss-toast-${toast.id}`}
              onClick={() => dismissToast(toast.id)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
