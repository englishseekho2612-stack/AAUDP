import React, { useState, useEffect } from 'react';
import { Button, Input } from './UIControls';
import { Edit3, X } from 'lucide-react';

interface RenameModalProps {
  isOpen: boolean;
  initialName: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  initialName,
  onConfirm,
  onCancel,
}) => {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(initialName);
    setError('');
  }, [initialName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name cannot be empty.');
      return;
    }
    onConfirm(name.trim());
  };

  return (
    <div
      id="rename-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        id="rename-modal-container"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="btn-close-rename-modal"
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Rename Project
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter a new title for this teaching project
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input
            id="input-rename-project"
            label="Project Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            error={error}
            autoFocus
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              id="btn-cancel-rename"
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              id="btn-confirm-rename"
              type="submit"
              variant="primary"
            >
              Save Name
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
