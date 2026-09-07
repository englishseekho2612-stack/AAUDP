import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../types/project';
import { Button, Input } from '../components/common/UIControls';
import { PlusCircle, ArrowLeft } from 'lucide-react';

interface CreateProjectViewProps {
  onCancel: () => void;
  onProjectCreated: (id: string) => void;
}

export const CreateProjectView: React.FC<CreateProjectViewProps> = ({
  onCancel,
  onProjectCreated,
}) => {
  const { createProject } = useProject();

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const quickPresets = [
    { name: 'Class 10 English — His First Flight', subject: 'English', grade: 'Class 10', lang: 'en' as SupportedLanguage },
    { name: 'Class 12 Physics — Electromagnetic Induction', subject: 'Physics', grade: 'Class 12', lang: 'hinglish' as SupportedLanguage },
    { name: 'Class 9 Science — Matter in Our Surroundings', subject: 'Science', grade: 'Class 9', lang: 'hi' as SupportedLanguage },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project Name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const newProj = await createProject({
        name: name.trim(),
        subject: subject.trim() || undefined,
        classGrade: classGrade.trim() || undefined,
        language,
      });
      onProjectCreated(newProj.id);
    } catch (err) {
      console.error('Failed to create project:', err);
      setError('Failed to create project. Please verify inputs.');
      setIsSubmitting(false);
    }
  };

  const applyPreset = (preset: typeof quickPresets[0]) => {
    setName(preset.name);
    setSubject(preset.subject);
    setClassGrade(preset.grade);
    setLanguage(preset.lang);
    setError('');
  };

  return (
    <div id="create-project-view" className="max-w-2xl mx-auto space-y-6 pb-16">
      <div className="flex items-center gap-2">
        <button
          id="btn-back-from-create"
          onClick={onCancel}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          aria-label="Back to previous view"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Create New Teaching Project
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Define your curriculum topic and teaching specifications.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div>
            <Input
              id="input-project-name"
              label="Project Name *"
              placeholder="e.g. Class 10 English — His First Flight"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              error={error}
              helperText="Give your project a descriptive title representing the chapter or lesson."
              autoFocus
            />
          </div>

          {/* Quick Presets for Teachers */}
          <div className="pt-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Quick Suggestions
            </span>
            <div className="flex flex-wrap gap-2">
              {quickPresets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  id={`btn-preset-${idx}`}
                  onClick={() => applyPreset(p)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Subject (Optional) */}
            <div>
              <Input
                id="input-project-subject"
                label="Subject (Optional)"
                placeholder="e.g. English, Physics, Science"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Class / Grade (Optional) */}
            <div>
              <Input
                id="input-project-grade"
                label="Class / Grade (Optional)"
                placeholder="e.g. Class 10, Grade 12"
                value={classGrade}
                onChange={(e) => setClassGrade(e.target.value)}
              />
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label
              htmlFor="select-create-language"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Primary Teaching Language
            </label>
            <select
              id="select-create-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors min-h-[44px] cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label} ({lang.nativeLabel})
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Supports Hindi, English, Hinglish, and international languages.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              id="btn-cancel-create-project"
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              id="btn-submit-create-project"
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              icon={<PlusCircle className="w-4 h-4" />}
            >
              Create Project Workspace
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
