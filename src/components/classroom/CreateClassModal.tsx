import React, { useState } from 'react';
import { X, Calendar, Clock, BookOpen, Sparkles, Check } from 'lucide-react';
import { classroomService } from '../../services/classroom/classroomClientService';
import { Project } from '../../types/project';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassCreated: (classCode: string) => void;
  projects?: Project[];
  activeProjectId?: string | null;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onClose,
  onClassCreated,
  projects = [],
  activeProjectId,
}) => {
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [teacherName, setTeacherName] = useState('Dr. Sarah Jenkins');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(activeProjectId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) {
      setError('Please enter a class name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await classroomService.createClass({
      className: className.trim(),
      subject: subject.trim() || undefined,
      teacherName: teacherName.trim(),
      description: description.trim() || undefined,
      durationMinutes,
      scheduledTime: scheduledTime || undefined,
      associatedProjectId: selectedProjectId || undefined,
    });

    setIsSubmitting(false);

    if (result.success && result.session) {
      onClassCreated(result.session.classCode);
      onClose();
    } else {
      setError(result.error || 'Failed to create classroom session.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="create-class-modal"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 border border-blue-200 dark:border-blue-800">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Create New Classroom
              </h3>
              <p className="text-xs text-slate-500">
                Generate a private live teaching room with 6-character student code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              Class Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AP Biology: Cellular Respiration & ATP Cycle"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                Subject
              </label>
              <input
                type="text"
                placeholder="e.g. Biology, History, Physics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                Teacher Display Name
              </label>
              <input
                type="text"
                required
                placeholder="Teacher Name"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Associated Lesson Project (Part 01 - 04 integration) */}
          {projects.length > 0 && (
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block flex items-center justify-between">
                <span>Link Existing Teaching Project (Optional)</span>
                <span className="text-[10px] text-blue-600 font-normal">
                  Auto-loads Slides & Mind Map
                </span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value="">None (Start with blank canvas)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.subject ? `(${p.subject})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes (Standard)</option>
                <option value={60}>60 Minutes</option>
                <option value={90}>90 Minutes (Deep Dive)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                Schedule Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              Class Description / Objectives
            </label>
            <textarea
              rows={2}
              placeholder="Summary of topics covered, prerequisites, or preparation notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-xl font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl cursor-pointer shadow-sm transition-all"
            >
              {isSubmitting ? 'Generating Room...' : 'Create Classroom'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
