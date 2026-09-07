import React, { useState } from 'react';
import { Course, CourseBatch, CurriculumBoard } from '../../types/curriculum';
import { SupportedLanguage } from '../../types/project';
import { X, Plus, Trash2, Copy, Archive, Layers, Calendar, Clock, Globe } from 'lucide-react';

interface CourseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCourse: (course: Course) => Promise<void>;
  onDuplicateCourse?: (courseId: string, copyContent: boolean) => Promise<void>;
  onArchiveCourse?: (courseId: string) => Promise<void>;
  onDeleteCourse?: (courseId: string) => Promise<void>;
  initialCourse?: Course | null;
}

const BOARDS: CurriculumBoard[] = [
  'CBSE',
  'ICSE',
  'Cambridge (IGCSE/A-Levels)',
  'IB (International Baccalaureate)',
  'State Board',
  'National Curriculum',
  'Higher Education',
  'Vocational / Skill',
  'Custom / Other',
];

const LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'hinglish', label: 'Hinglish (Hindi in Latin script)' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'other', label: 'Other / Regional Language' },
];

export const CourseManagerModal: React.FC<CourseManagerModalProps> = ({
  isOpen,
  onClose,
  onSaveCourse,
  onDuplicateCourse,
  onArchiveCourse,
  onDeleteCourse,
  initialCourse,
}) => {
  const isEditing = Boolean(initialCourse);

  const [name, setName] = useState(initialCourse?.name || '');
  const [subject, setSubject] = useState(initialCourse?.subject || '');
  const [classGrade, setClassGrade] = useState(initialCourse?.classGrade || 'Class 10');
  const [academicYear, setAcademicYear] = useState(initialCourse?.academicYear || '2026–27');
  const [board, setBoard] = useState<CurriculumBoard>(initialCourse?.board || 'CBSE');
  const [language, setLanguage] = useState<SupportedLanguage>(initialCourse?.language || 'en');
  const [description, setDescription] = useState(initialCourse?.description || '');
  const [weeklyTeachingHours, setWeeklyTeachingHours] = useState(initialCourse?.weeklyTeachingHours || 4);
  const [targetCompletionDate, setTargetCompletionDate] = useState(initialCourse?.targetCompletionDate || '2027-02-28');
  const [batches, setBatches] = useState<CourseBatch[]>(
    initialCourse?.batches && initialCourse.batches.length > 0
      ? initialCourse.batches
      : [{ id: `batch_${Date.now()}`, name: 'Section A (Default)', studentCount: 30 }]
  );

  const [isDeleting, setIsDeleting] = useState(false);
  const [duplicateOption, setDuplicateOption] = useState<'structure_only' | 'structure_and_content'>('structure_only');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  if (!isOpen) return null;

  const handleAddBatch = () => {
    const nextLetter = String.fromCharCode(65 + batches.length);
    setBatches([
      ...batches,
      { id: `batch_${Date.now()}_${batches.length}`, name: `Section ${nextLetter}`, studentCount: 30 },
    ]);
  };

  const handleRemoveBatch = (index: number) => {
    if (batches.length <= 1) return;
    setBatches(batches.filter((_, i) => i !== index));
  };

  const handleBatchChange = (index: number, field: keyof CourseBatch, val: any) => {
    const updated = [...batches];
    updated[index] = { ...updated[index], [field]: val };
    setBatches(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim()) return;

    const courseToSave: Course = {
      id: initialCourse?.id || `course_${Date.now()}`,
      name: name.trim(),
      subject: subject.trim(),
      classGrade: classGrade.trim(),
      academicYear: academicYear.trim(),
      board,
      language,
      description: description.trim(),
      weeklyTeachingHours,
      targetCompletionDate,
      batches,
      subjects: initialCourse?.subjects || [
        {
          id: `subj_${Date.now()}`,
          courseId: initialCourse?.id || `course_${Date.now()}`,
          name: subject.trim(),
          units: [],
        },
      ],
      isArchived: initialCourse?.isArchived || false,
      createdTimestamp: initialCourse?.createdTimestamp || Date.now(),
      updatedTimestamp: Date.now(),
    };

    await onSaveCourse(courseToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {isEditing ? 'Course Settings & Metadata' : 'Create New Academic Course'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Full academic course container spanning subjects, units, chapters, and batches
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Course Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Course Title *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Class 10 Science (Comprehensive)"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Primary Subject *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Science, Mathematics, English"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Grade / Class */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Class / Grade *
              </label>
              <input
                type="text"
                required
                value={classGrade}
                onChange={(e) => setClassGrade(e.target.value)}
                placeholder="e.g. Class 10, Grade 12"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Academic Year
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g. 2026–27"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Board / Curriculum */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Board / Curriculum Framework
              </label>
              <select
                value={board}
                onChange={(e) => setBoard(e.target.value as CurriculumBoard)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {BOARDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Language of Instruction
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Teaching Hours / Week */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Weekly Teaching Hours
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={weeklyTeachingHours}
                onChange={(e) => setWeeklyTeachingHours(parseInt(e.target.value) || 4)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Target Completion Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Target Completion Date
              </label>
              <input
                type="date"
                value={targetCompletionDate}
                onChange={(e) => setTargetCompletionDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Course Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Course Description & Pedagogical Goals
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Overview of curriculum scope, syllabus coverage, and learning milestones..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Batches Configuration */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Batches / Sections (Section 44)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage multiple student groups. Student records remain isolated per batch.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddBatch}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80"
              >
                <Plus className="w-3.5 h-3.5" /> Add Batch
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {batches.map((batch, index) => (
                <div
                  key={batch.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80"
                >
                  <input
                    type="text"
                    value={batch.name}
                    onChange={(e) => handleBatchChange(index, 'name', e.target.value)}
                    placeholder="e.g. Section 10-A"
                    className="flex-1 px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Students:</span>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={batch.studentCount || 30}
                      onChange={(e) => handleBatchChange(index, 'studentCount', parseInt(e.target.value) || 30)}
                      className="w-16 px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  {batches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBatch(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Destructive / Secondary Actions (if Editing) */}
          {isEditing && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {onDuplicateCourse && (
                  <button
                    type="button"
                    onClick={() => setShowDuplicateModal(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <Copy className="w-3.5 h-3.5" /> Duplicate Course
                  </button>
                )}
                {onArchiveCourse && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (initialCourse) {
                        await onArchiveCourse(initialCourse.id);
                        onClose();
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80"
                  >
                    <Archive className="w-3.5 h-3.5" />{' '}
                    {initialCourse?.isArchived ? 'Unarchive Course' : 'Archive Course'}
                  </button>
                )}
              </div>

              {onDeleteCourse && (
                <div>
                  {!isDeleting ? (
                    <button
                      type="button"
                      onClick={() => setIsDeleting(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Course...
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                        Confirm course deletion?
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (initialCourse) {
                            await onDeleteCourse(initialCourse.id);
                            onClose();
                          }
                        }}
                        className="px-2.5 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700"
                      >
                        Yes, Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDeleting(false)}
                        className="px-2 py-1 text-slate-500 rounded text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
            >
              {isEditing ? 'Save Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>

      {/* Duplicate Course Sub-Modal (Section 43) */}
      {showDuplicateModal && initialCourse && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 max-w-md w-full shadow-2xl">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Duplicate Course: {initialCourse.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Select duplication depth for the new academic year or batch.
            </p>
            <div className="space-y-3 mb-5">
              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <input
                  type="radio"
                  name="dup_opt"
                  checked={duplicateOption === 'structure_only'}
                  onChange={() => setDuplicateOption('structure_only')}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Copy Structure Only (Recommended)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Copies Subjects, Units, Chapters, and Topics without duplicating large media files or recordings.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <input
                  type="radio"
                  name="dup_opt"
                  checked={duplicateOption === 'structure_and_content'}
                  onChange={() => setDuplicateOption('structure_and_content')}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Copy Structure + Content References
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Links existing slides, notes, and mind maps as reusable shared references.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onDuplicateCourse) {
                    await onDuplicateCourse(initialCourse.id, duplicateOption === 'structure_and_content');
                  }
                  setShowDuplicateModal(false);
                  onClose();
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
              >
                Confirm Duplication
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
