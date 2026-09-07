import React, { useState } from 'react';
import { Button } from '../common/UIControls';
import { Sparkles, Check, HelpCircle } from 'lucide-react';

interface TeacherInstructionsCardProps {
  instructions?: string;
  onSaveInstructions: (instructions: string) => Promise<void>;
}

export const TeacherInstructionsCard: React.FC<TeacherInstructionsCardProps> = ({
  instructions = '',
  onSaveInstructions,
}) => {
  const [value, setValue] = useState(instructions);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveInstructions(value.trim());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const samplePrompts = [
    'Explain this chapter for Class 10 students in simple English and Hindi concepts',
    'Create exam-focused notes with high-yield revision summaries',
    'Focus on numerical problem solving and formula derivations',
  ];

  return (
    <div
      id="teacher-instructions-section"
      className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-2xs text-xs"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Teacher Instructions for AI Engine
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Custom teaching directives saved to project context for Part 03 generation.
            </p>
          </div>
        </div>

        <Button
          id="btn-save-teacher-instructions"
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          icon={isSaved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : undefined}
        >
          {isSaved ? 'Saved' : isSaving ? 'Saving...' : 'Save Instructions'}
        </Button>
      </div>

      <textarea
        id="input-teacher-instructions"
        rows={2}
        placeholder="e.g. Explain this chapter for Class 10 students in simple Hindi, or emphasize conceptual diagram questions..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {/* Quick Suggestion Chips */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="text-slate-400 font-medium">Quick suggestions:</span>
        {samplePrompts.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setValue(prompt)}
            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer truncate max-w-xs"
            title={prompt}
          >
            &ldquo;{prompt}&rdquo;
          </button>
        ))}
      </div>
    </div>
  );
};
