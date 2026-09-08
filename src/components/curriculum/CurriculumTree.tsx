import React, { useState, useMemo } from 'react';
import {
  Course,
  CourseSubject,
  CurriculumUnit,
  CurriculumChapter,
  CurriculumTopic,
  CurriculumLesson,
} from '../../types/curriculum';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Video,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  BookOpen,
  Layers,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from 'lucide-react';

interface CurriculumTreeProps {
  course: Course;
  onUpdateCourse: (updatedCourse: Course) => Promise<void>;
  onEditLesson: (lesson: CurriculumLesson) => void;
  onOpenTeachingStudio: (projectId?: string) => void;
  onOpenAICopilot: (context?: { chapterTitle?: string; topicTitle?: string }) => void;
}

export const CurriculumTree: React.FC<CurriculumTreeProps> = ({
  course,
  onUpdateCourse,
  onEditLesson,
  onOpenTeachingStudio,
  onOpenAICopilot,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // Node editing state
  const [editingNode, setEditingNode] = useState<{
    type: 'unit' | 'chapter' | 'topic' | 'lesson';
    id: string;
    parentId?: string;
    currentTitle: string;
  } | null>(null);

  // New item modal/inline state
  const [addingChildTo, setAddingChildTo] = useState<{
    parentId: string;
    type: 'unit' | 'chapter' | 'topic' | 'lesson';
  } | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');

  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    id: string;
    title: string;
    type: string;
    childrenCount: number;
    action: () => Promise<void>;
  } | null>(null);

  // Active Subject (default to first)
  const primarySubject = course.subjects?.[0];

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const expandAll = () => {
    const allU: Record<string, boolean> = {};
    const allC: Record<string, boolean> = {};
    primarySubject?.units?.forEach((u) => {
      allU[u.id] = true;
      u.chapters?.forEach((c) => {
        allC[c.id] = true;
      });
    });
    setExpandedUnits(allU);
    setExpandedChapters(allC);
  };

  const collapseAll = () => {
    setExpandedUnits({});
    setExpandedChapters({});
  };

  // Helper to deep clone and update subject tree
  const updateTree = async (mutator: (subject: CourseSubject) => void) => {
    if (!primarySubject) return;
    const clonedCourse: Course = JSON.parse(JSON.stringify(course));
    const subj = clonedCourse.subjects[0];
    mutator(subj);
    clonedCourse.updatedTimestamp = Date.now();
    await onUpdateCourse(clonedCourse);
  };

  // ADD Handlers
  const handleConfirmAdd = async () => {
    if (!addingChildTo || !newItemTitle.trim()) return;
    const title = newItemTitle.trim();
    const { parentId, type } = addingChildTo;

    await updateTree((subj) => {
      if (type === 'unit') {
        subj.units.push({
          id: `unit_${Date.now()}`,
          courseId: course.id,
          subjectId: subj.id,
          title,
          description: '',
          orderIndex: subj.units.length,
          chapters: [],
        });
      } else if (type === 'chapter') {
        const unit = subj.units.find((u) => u.id === parentId);
        if (unit) {
          unit.chapters.push({
            id: `chap_${Date.now()}`,
            courseId: course.id,
            subjectId: subj.id,
            unitId: unit.id,
            title,
            description: '',
            orderIndex: unit.chapters.length,
            topics: [],
          });
          setExpandedUnits((prev) => ({ ...prev, [unit.id]: true }));
        }
      } else if (type === 'topic') {
        for (const unit of subj.units) {
          const chap = unit.chapters.find((c) => c.id === parentId);
          if (chap) {
            chap.topics.push({
              id: `topic_${Date.now()}`,
              courseId: course.id,
              subjectId: subj.id,
              unitId: unit.id,
              chapterId: chap.id,
              title,
              orderIndex: chap.topics.length,
              lessons: [],
            });
            setExpandedChapters((prev) => ({ ...prev, [chap.id]: true }));
            break;
          }
        }
      } else if (type === 'lesson') {
        for (const unit of subj.units) {
          for (const chap of unit.chapters) {
            const topic = chap.topics.find((t) => t.id === parentId);
            if (topic) {
              topic.lessons.push({
                id: `lesson_${Date.now()}`,
                courseId: course.id,
                subjectId: subj.id,
                unitId: unit.id,
                chapterId: chap.id,
                topicId: topic.id,
                title,
                orderIndex: topic.lessons.length,
                status: 'not_started',
                estimatedDurationMinutes: 45,
                objectives: [],
                tags: ['Important'],
                sourceRefs: [],
                hasSlides: false,
                hasMindMap: false,
                hasNotes: false,
                hasQuiz: false,
                hasAssignment: false,
                hasRecording: false,
                hasEditedVideo: false,
                version: 1,
                createdTimestamp: Date.now(),
                updatedTimestamp: Date.now(),
              });
              break;
            }
          }
        }
      }
    });

    setAddingChildTo(null);
    setNewItemTitle('');
  };

  // DELETE Handlers with Child Confirmation
  const confirmDeleteUnit = (unit: CurriculumUnit) => {
    const childLessonsCount = unit.chapters.reduce(
      (acc, c) => acc + c.topics.reduce((tAcc, t) => tAcc + t.lessons.length, 0),
      0
    );
    setDeleteConfirmation({
      id: unit.id,
      title: unit.title,
      type: 'Unit',
      childrenCount: childLessonsCount,
      action: async () => {
        await updateTree((subj) => {
          subj.units = subj.units.filter((u) => u.id !== unit.id);
        });
      },
    });
  };

  const confirmDeleteChapter = (chapter: CurriculumChapter) => {
    const childLessonsCount = chapter.topics.reduce((tAcc, t) => tAcc + t.lessons.length, 0);
    setDeleteConfirmation({
      id: chapter.id,
      title: chapter.title,
      type: 'Chapter',
      childrenCount: childLessonsCount,
      action: async () => {
        await updateTree((subj) => {
          for (const unit of subj.units) {
            unit.chapters = unit.chapters.filter((c) => c.id !== chapter.id);
          }
        });
      },
    });
  };

  const confirmDeleteTopic = (topic: CurriculumTopic) => {
    setDeleteConfirmation({
      id: topic.id,
      title: topic.title,
      type: 'Topic',
      childrenCount: topic.lessons.length,
      action: async () => {
        await updateTree((subj) => {
          for (const unit of subj.units) {
            for (const chap of unit.chapters) {
              chap.topics = chap.topics.filter((t) => t.id !== topic.id);
            }
          }
        });
      },
    });
  };

  const confirmDeleteLesson = (lesson: CurriculumLesson) => {
    setDeleteConfirmation({
      id: lesson.id,
      title: lesson.title,
      type: 'Lesson',
      childrenCount: 0,
      action: async () => {
        await updateTree((subj) => {
          for (const unit of subj.units) {
            for (const chap of unit.chapters) {
              for (const topic of chap.topics) {
                topic.lessons = topic.lessons.filter((l) => l.id !== lesson.id);
              }
            }
          }
        });
      },
    });
  };

  // REORDER Handlers (Move Up / Move Down)
  const moveUnit = async (idx: number, direction: 'up' | 'down') => {
    if (!primarySubject) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= primarySubject.units.length) return;

    await updateTree((subj) => {
      const temp = subj.units[idx];
      subj.units[idx] = subj.units[targetIdx];
      subj.units[targetIdx] = temp;
    });
  };

  // Search filter
  const isMatch = (text: string) => text.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search units, chapters, lessons..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={expandAll}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Collapse All
          </button>
          <button
            onClick={() => setAddingChildTo({ parentId: primarySubject?.id || '', type: 'unit' })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Unit
          </button>
        </div>
      </div>

      {/* Curriculum Hierarchy Tree */}
      <div className="space-y-3">
        {(!primarySubject?.units || primarySubject.units.length === 0) && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
              No Curriculum Units Yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
              Get started by adding units manually, or use the AI Curriculum Builder to generate a complete syllabus-grounded structure.
            </p>
            <button
              onClick={() => setAddingChildTo({ parentId: primarySubject?.id || '', type: 'unit' })}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Add First Unit
            </button>
          </div>
        )}

        {primarySubject?.units?.map((unit, unitIdx) => {
          const isUnitExpanded = expandedUnits[unit.id] ?? true;

          return (
            <div
              key={unit.id}
              className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-all"
            >
              {/* Unit Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2.5 flex-1 cursor-pointer" onClick={() => toggleUnit(unit.id)}>
                  <div className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    {isUnitExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      Unit {unitIdx + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {unit.title}
                    </h4>
                  </div>
                </div>

                {/* Unit Action Controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveUnit(unitIdx, 'up')}
                    disabled={unitIdx === 0}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded"
                    title="Move Unit Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveUnit(unitIdx, 'down')}
                    disabled={unitIdx === primarySubject.units.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded"
                    title="Move Unit Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setAddingChildTo({ parentId: unit.id, type: 'chapter' })}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Chapter
                  </button>
                  <button
                    onClick={() => confirmDeleteUnit(unit)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete Unit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Unit Content: Chapters */}
              {isUnitExpanded && (
                <div className="p-3 sm:p-4 space-y-3">
                  {unit.chapters.length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-400 italic">
                      No chapters in this unit. Click "Add Chapter" above.
                    </div>
                  )}

                  {unit.chapters.map((chapter, chapIdx) => {
                    const isChapterExpanded = expandedChapters[chapter.id] ?? true;

                    return (
                      <div
                        key={chapter.id}
                        className="border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-800/40 overflow-hidden"
                      >
                        {/* Chapter Row */}
                        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60">
                          <div
                            className="flex items-center gap-2 cursor-pointer flex-1"
                            onClick={() => toggleChapter(chapter.id)}
                          >
                            {isChapterExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              Ch {chapIdx + 1}: {chapter.title}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({chapter.topics.length} topics)
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* AI Chapter Copilot Shortcut */}
                            <button
                              onClick={() => onOpenAICopilot({ chapterTitle: chapter.title })}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded"
                              title="Use AI Copilot on Chapter"
                            >
                              <Sparkles className="w-3 h-3" /> AI Plan
                            </button>
                            <button
                              onClick={() => setAddingChildTo({ parentId: chapter.id, type: 'topic' })}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded"
                            >
                              <Plus className="w-3 h-3" /> Topic
                            </button>
                            <button
                              onClick={() => confirmDeleteChapter(chapter)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Delete Chapter"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Topics & Lessons */}
                        {isChapterExpanded && (
                          <div className="p-3 space-y-3">
                            {chapter.topics.length === 0 && (
                              <div className="text-center py-2 text-[11px] text-slate-400 italic">
                                No topics. Click "+ Topic" above.
                              </div>
                            )}

                            {chapter.topics.map((topic) => (
                              <div
                                key={topic.id}
                                className="pl-3 border-l-2 border-indigo-200 dark:border-indigo-800/60 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    • {topic.title}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => setAddingChildTo({ parentId: topic.id, type: 'lesson' })}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded"
                                    >
                                      <Plus className="w-3 h-3" /> Add Lesson
                                    </button>
                                    <button
                                      onClick={() => confirmDeleteTopic(topic)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* Lessons List */}
                                <div className="space-y-1.5">
                                  {topic.lessons.map((lesson) => {
                                    const isReady = Boolean(lesson.hasSlides && lesson.hasNotes);

                                    return (
                                      <div
                                        key={lesson.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                                      >
                                        <div className="flex items-center gap-2.5">
                                          {isReady ? (
                                            <span title="Ready to Teach">
                                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            </span>
                                          ) : (
                                            <span title="Preparation in Progress">
                                              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                            </span>
                                          )}
                                          <div>
                                            <div className="text-xs font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                              <span>{lesson.title}</span>
                                              {lesson.tags?.map((t) => (
                                                <span
                                                  key={t}
                                                  className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-normal"
                                                >
                                                  {t}
                                                </span>
                                              ))}
                                            </div>
                                            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                              <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {lesson.estimatedDurationMinutes}m
                                              </span>
                                              <span>•</span>
                                              <span className="capitalize">{lesson.status.replace('_', ' ')}</span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                          <button
                                            onClick={() => onOpenTeachingStudio(lesson.teachingProjectId)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800"
                                            title="Open Teaching Studio directly"
                                          >
                                            <Video className="w-3 h-3" /> Teach
                                          </button>
                                          <button
                                            onClick={() => onEditLesson(lesson)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                                          >
                                            <Edit2 className="w-3 h-3" /> Plan / Edit
                                          </button>
                                          <button
                                            onClick={() => confirmDeleteLesson(lesson)}
                                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                            title="Delete Lesson"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Item Modal */}
      {addingChildTo && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Add New {addingChildTo.type}
            </h4>
            <input
              type="text"
              autoFocus
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmAdd()}
              placeholder={`Enter ${addingChildTo.type} title...`}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddingChildTo(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                disabled={!newItemTitle.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
              >
                Add {addingChildTo.type}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Protective Delete Confirmation Modal (Section 6 & 44) */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-sm">
              <AlertCircle className="w-5 h-5" />
              <span>Confirm Delete: {deleteConfirmation.type}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-slate-100">"{deleteConfirmation.title}"</span>?
            </p>
            {deleteConfirmation.childrenCount > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-800 dark:text-amber-300">
                <span className="font-bold">Warning:</span> This {deleteConfirmation.type.toLowerCase()} contains{' '}
                <span className="font-bold">{deleteConfirmation.childrenCount}</span> child lesson(s). Deleting will remove these hierarchical associations.
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteConfirmation.action();
                  setDeleteConfirmation(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
