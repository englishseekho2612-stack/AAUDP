import React, { useState } from 'react';
import {
  CurriculumLesson,
  LessonStatus,
  LessonTemplate,
  ContentTag,
} from '../../types/curriculum';
import { useProject } from '../../context/ProjectContext';
import { DEFAULT_LESSON_TEMPLATES } from '../../data/defaultLessonTemplates';
import {
  X,
  Video,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  Lock,
  Tag,
  Clock,
  BookOpen,
} from 'lucide-react';

interface LessonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: CurriculumLesson;
  onSaveLesson: (lesson: CurriculumLesson) => Promise<void>;
  onOpenTeachingStudio?: (projectId?: string) => void;
  onOpenClassroomHub?: () => void;
}

const STATUS_OPTIONS: { value: LessonStatus; label: string; color: string }[] = [
  { value: 'not_started', label: 'Not Started', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'planning', label: 'In Planning', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
  { value: 'content_ready', label: 'Content Ready', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
  { value: 'ready_to_teach', label: 'Ready to Teach', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { value: 'teaching_completed', label: 'Taught / Delivered', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
  { value: 'needs_revision', label: 'Needs Revision', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
  { value: 'completed', label: 'Archived / Complete', color: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200' },
];

const AVAILABLE_TAGS: ContentTag[] = [
  'Important',
  'Revision',
  'Exam',
  'Homework',
  'Difficult',
  'Example',
  'Diagram',
  'Activity',
  'Practice',
];

export const LessonDetailModal: React.FC<LessonDetailModalProps> = ({
  isOpen,
  onClose,
  lesson,
  onSaveLesson,
  onOpenTeachingStudio,
  onOpenClassroomHub,
}) => {
  const { projects } = useProject();

  const [title, setTitle] = useState(lesson.title);
  const [status, setStatus] = useState<LessonStatus>(lesson.status);
  const [estimatedDuration, setEstimatedDuration] = useState(lesson.estimatedDurationMinutes || 45);
  const [objectives, setObjectives] = useState<string[]>(lesson.objectives || []);
  const [newObjective, setNewObjective] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(lesson.templateId || 'standard_lesson');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(lesson.teachingProjectId || '');
  const [teacherPrivateNotes, setTeacherPrivateNotes] = useState(lesson.teacherNotes || '');
  const [tags, setTags] = useState<ContentTag[]>(lesson.tags || []);

  // Material checklist toggles
  const [hasSlides, setHasSlides] = useState(Boolean(lesson.hasSlides));
  const [hasMindMap, setHasMindMap] = useState(Boolean(lesson.hasMindMap));
  const [hasNotes, setHasNotes] = useState(Boolean(lesson.hasNotes));
  const [hasQuiz, setHasQuiz] = useState(Boolean(lesson.hasQuiz));
  const [hasAssignment, setHasAssignment] = useState(Boolean(lesson.hasAssignment));
  const [hasRecording, setHasRecording] = useState(Boolean(lesson.hasRecording));

  if (!isOpen) return null;

  const currentTemplate = DEFAULT_LESSON_TEMPLATES.find((t) => t.id === selectedTemplateId) || DEFAULT_LESSON_TEMPLATES[0];

  const handleAddObjective = () => {
    if (!newObjective.trim()) return;
    setObjectives([...objectives, newObjective.trim()]);
    setNewObjective('');
  };

  const handleRemoveObjective = (idx: number) => {
    setObjectives(objectives.filter((_, i) => i !== idx));
  };

  const toggleTag = (tag: ContentTag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleSave = async () => {
    const updatedLesson: CurriculumLesson = {
      ...lesson,
      title: title.trim(),
      status,
      estimatedDurationMinutes: estimatedDuration,
      objectives,
      templateId: selectedTemplateId,
      teachingProjectId: selectedProjectId || undefined,
      teacherNotes: teacherPrivateNotes,
      tags,
      hasSlides,
      hasMindMap,
      hasNotes,
      hasQuiz,
      hasAssignment,
      hasRecording,
      updatedTimestamp: Date.now(),
    };

    await onSaveLesson(updatedLesson);
    onClose();
  };

  // Readiness Calculation
  const isObjectivesReady = objectives.length > 0;
  const isMaterialsReady = hasSlides && hasNotes;
  const isFullyReady = isObjectivesReady && isMaterialsReady;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Lesson Plan & Readiness Workbench
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure lesson objectives, materials, template structure, and linked teaching studio project
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Readiness Banner */}
          <div
            className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
              isFullyReady
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {isFullyReady ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              <span>
                {isFullyReady
                  ? 'Lesson is Ready to Teach! Objectives defined, presentation slides and notes available.'
                  : 'Lesson Preparation Checklist: ensure objectives, presentation slides, and notes are ready.'}
              </span>
            </div>
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              {isFullyReady ? 'Ready' : 'Pending'}
            </span>
          </div>

          {/* Title & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Lesson Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Delivery Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LessonStatus)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration & Project Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Duration (Minutes)
              </label>
              <input
                type="number"
                min={15}
                max={180}
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(parseInt(e.target.value) || 45)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Link Studio Project (Artifacts)
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- None (Stand-alone Curriculum Item) --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.subject})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lesson Template Selector (Section 45) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/40">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" /> Pedagogical Lesson Template
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {DEFAULT_LESSON_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`px-2.5 py-2 rounded-lg text-xs font-medium text-left border transition-colors ${
                    selectedTemplateId === tpl.id
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-500 font-semibold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="truncate">{tpl.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                    {tpl.sections.length} pedagogical sections
                  </div>
                </button>
              ))}
            </div>

            {/* Template Section Preview */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-1.5 items-center">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Sections:</span>
              {currentTemplate.sections.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {s.title} ({s.estimatedMinutes}m)
                </span>
              ))}
            </div>
          </div>

          {/* Learning Objectives */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Learning Objectives (Bloom's Taxonomy)
            </label>
            <div className="space-y-2 mb-2">
              {objectives.map((obj, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                >
                  <span>• {obj}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveObjective(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddObjective())}
                placeholder="e.g. Identify the limiting factors of the light-dependent stage..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddObjective}
                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" /> Add
              </button>
            </div>
          </div>

          {/* Teaching Material Readiness Checklist */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Teaching Material Inventory
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { label: 'Slide Deck', checked: hasSlides, set: setHasSlides },
                { label: 'Mind Map', checked: hasMindMap, set: setHasMindMap },
                { label: 'Lesson Notes', checked: hasNotes, set: setHasNotes },
                { label: 'Quiz / Checks', checked: hasQuiz, set: setHasQuiz },
                { label: 'Assignment', checked: hasAssignment, set: setHasAssignment },
                { label: 'Video / Rec', checked: hasRecording, set: setHasRecording },
              ].map((item, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs ${
                    item.checked
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 font-medium'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => item.set(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Content Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map((t) => {
                const isSelected = tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Teacher-Only Private Notes (Strict Student Isolation) */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Teacher Private Script & Notes (Excluded from Student Package)
            </label>
            <textarea
              rows={3}
              value={teacherPrivateNotes}
              onChange={(e) => setTeacherPrivateNotes(e.target.value)}
              placeholder="Teaching prompts, common student misconceptions to target, pedagogical pacing notes..."
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            {onOpenTeachingStudio && (
              <button
                type="button"
                onClick={() => {
                  onOpenTeachingStudio(selectedProjectId || undefined);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800"
              >
                <Video className="w-3.5 h-3.5" /> Open in Teaching Studio
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm"
            >
              Save Lesson
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
