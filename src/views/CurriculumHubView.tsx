import React, { useState, useEffect } from 'react';
import {
  Course,
  CurriculumAISuggestion,
  CurriculumLesson,
} from '../types/curriculum';
import { curriculumDatabase } from '../storage/curriculumDatabase';
import { CourseManagerModal } from '../components/curriculum/CourseManagerModal';
import { AICurriculumBuilderModal } from '../components/curriculum/AICurriculumBuilderModal';
import { LessonDetailModal } from '../components/curriculum/LessonDetailModal';
import { CurriculumTree } from '../components/curriculum/CurriculumTree';
import { ContentLibraryTab } from '../components/curriculum/ContentLibraryTab';
import { QuestionBankTab } from '../components/curriculum/QuestionBankTab';
import { ScheduleCalendarTab } from '../components/curriculum/ScheduleCalendarTab';
import { TeacherAssessmentReviewTab } from '../components/curriculum/TeacherAssessmentReviewTab';
import { AICurriculumCopilotDrawer } from '../components/curriculum/AICurriculumCopilotDrawer';
import {
  GraduationCap,
  Layers,
  Sparkles,
  Settings,
  Plus,
  BookOpen,
  Library,
  HelpCircle,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  Users,
} from 'lucide-react';

interface CurriculumHubViewProps {
  onOpenTeachingStudio: (projectId?: string) => void;
  onOpenClassroomHub: () => void;
}

type MainTab = 'curriculum' | 'content_library' | 'question_bank' | 'schedule' | 'assessment_review';

export const CurriculumHubView: React.FC<CurriculumHubViewProps> = ({
  onOpenTeachingStudio,
  onOpenClassroomHub,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<MainTab>('curriculum');

  // Modals state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showAIBuilderModal, setShowAIBuilderModal] = useState(false);
  const [activeLessonForDetail, setActiveLessonForDetail] = useState<CurriculumLesson | null>(null);
  const [showCopilotDrawer, setShowCopilotDrawer] = useState(false);
  const [copilotContext, setCopilotContext] = useState<{ chapterTitle?: string; topicTitle?: string } | undefined>(undefined);

  // Load all courses on mount
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const list = await curriculumDatabase.getAllCourses();
    setCourses(list);
    if (list.length > 0 && !selectedCourseId) {
      setSelectedCourseId(list[0].id);
    }
  };

  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Course handlers
  const handleSaveCourse = async (courseToSave: Course) => {
    await curriculumDatabase.saveCourse(courseToSave);
    await loadCourses();
    setSelectedCourseId(courseToSave.id);
  };

  const handleDuplicateCourse = async (courseId: string, copyContent: boolean) => {
    await curriculumDatabase.duplicateCourse(courseId, copyContent);
    await loadCourses();
  };

  const handleArchiveCourse = async (courseId: string) => {
    const target = courses.find((c) => c.id === courseId);
    if (target) {
      await curriculumDatabase.saveCourse({ ...target, isArchived: !target.isArchived });
      await loadCourses();
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    await curriculumDatabase.deleteCourse(courseId);
    const updated = courses.filter((c) => c.id !== courseId);
    setCourses(updated);
    if (updated.length > 0) {
      setSelectedCourseId(updated[0].id);
    } else {
      setSelectedCourseId('');
    }
  };

  // Apply AI Generated Curriculum
  const handleApplyCurriculumSuggestions = async (suggestions: CurriculumAISuggestion[]) => {
    if (!activeCourse) return;
    const cloned: Course = JSON.parse(JSON.stringify(activeCourse));
    const targetSubject = cloned.subjects[0];

    suggestions.forEach((unitSugg, uIdx) => {
      const unitId = `unit_${Date.now()}_${uIdx}`;
      targetSubject.units.push({
        id: unitId,
        courseId: activeCourse.id,
        subjectId: targetSubject.id,
        title: unitSugg.title,
        description: unitSugg.description || '',
        orderIndex: targetSubject.units.length,
        chapters: (unitSugg.chapters || []).map((chapSugg, cIdx) => {
          const chapId = `chap_${Date.now()}_${uIdx}_${cIdx}`;
          return {
            id: chapId,
            courseId: activeCourse.id,
            subjectId: targetSubject.id,
            unitId,
            title: chapSugg.title,
            description: chapSugg.description || '',
            orderIndex: cIdx,
            topics: (chapSugg.topics || []).map((topicSugg, tIdx) => {
              const topicId = `top_${Date.now()}_${uIdx}_${cIdx}_${tIdx}`;
              return {
                id: topicId,
                courseId: activeCourse.id,
                subjectId: targetSubject.id,
                unitId,
                chapterId: chapId,
                title: topicSugg.title,
                orderIndex: tIdx,
                lessons: [
                  {
                    id: `les_${Date.now()}_${uIdx}_${cIdx}_${tIdx}`,
                    courseId: activeCourse.id,
                    subjectId: targetSubject.id,
                    unitId,
                    chapterId: chapId,
                    topicId,
                    title: `${topicSugg.title} (Core Instruction)`,
                    orderIndex: 0,
                    status: 'ready_to_teach',
                    estimatedDurationMinutes: topicSugg.estimatedMinutes || 45,
                    objectives: topicSugg.learningObjectives || ['Understand core principles'],
                    tags: ['Important'],
                    sourceRefs: [],
                    hasSlides: true,
                    hasMindMap: true,
                    hasNotes: true,
                    hasQuiz: false,
                    hasAssignment: false,
                    hasRecording: false,
                    hasEditedVideo: false,
                    version: 1,
                    createdTimestamp: Date.now(),
                    updatedTimestamp: Date.now(),
                  },
                ],
              };
            }),
          };
        }),
      });
    });

    await handleSaveCourse(cloned);
  };

  // AI Copilot Add Lessons Handler
  const handleApplyCopilotLessons = async (
    chapterTitle: string,
    newLessons: { title: string; objectives: string[]; estimatedMinutes: number }[]
  ) => {
    if (!activeCourse) return;
    const cloned: Course = JSON.parse(JSON.stringify(activeCourse));
    const subj = cloned.subjects[0];

    for (const unit of subj.units) {
      const chap = unit.chapters.find((c) => c.title === chapterTitle || c.title.includes(chapterTitle));
      if (chap) {
        if (chap.topics.length === 0) {
          chap.topics.push({
            id: `top_${Date.now()}`,
            courseId: activeCourse.id,
            subjectId: subj.id,
            unitId: unit.id,
            chapterId: chap.id,
            title: 'Core Topics',
            orderIndex: 0,
            lessons: [],
          });
        }
        const targetTopic = chap.topics[0];
        newLessons.forEach((l, i) => {
          targetTopic.lessons.push({
            id: `les_${Date.now()}_${i}`,
            courseId: activeCourse.id,
            subjectId: subj.id,
            unitId: unit.id,
            chapterId: chap.id,
            topicId: targetTopic.id,
            title: l.title,
            orderIndex: targetTopic.lessons.length,
            status: 'planning',
            estimatedDurationMinutes: l.estimatedMinutes,
            objectives: l.objectives,
            tags: ['Important'],
            sourceRefs: [],
            hasSlides: false,
            hasMindMap: false,
            hasNotes: true,
            hasQuiz: false,
            hasAssignment: false,
            hasRecording: false,
            hasEditedVideo: false,
            version: 1,
            createdTimestamp: Date.now(),
            updatedTimestamp: Date.now(),
          });
        });
        break;
      }
    }

    await handleSaveCourse(cloned);
  };

  // Save modified lesson
  const handleSaveLesson = async (updatedLesson: CurriculumLesson) => {
    if (!activeCourse) return;
    const cloned: Course = JSON.parse(JSON.stringify(activeCourse));
    const subj = cloned.subjects[0];

    for (const unit of subj.units) {
      for (const chap of unit.chapters) {
        for (const topic of chap.topics) {
          const idx = topic.lessons.findIndex((l) => l.id === updatedLesson.id);
          if (idx >= 0) {
            topic.lessons[idx] = updatedLesson;
            break;
          }
        }
      }
    }

    await handleSaveCourse(cloned);
  };

  // Course readiness metrics
  const totalUnits = activeCourse?.subjects?.[0]?.units?.length || 0;
  let totalLessons = 0;
  let readyLessons = 0;

  activeCourse?.subjects?.[0]?.units?.forEach((u) => {
    u.chapters?.forEach((c) => {
      c.topics?.forEach((t) => {
        t.lessons?.forEach((l) => {
          totalLessons += 1;
          if (l.hasSlides && l.hasNotes) readyLessons += 1;
        });
      });
    });
  });

  const readinessPercent = totalLessons > 0 ? Math.round((readyLessons / totalLessons) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Course Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-950">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Curriculum & Course Management
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                Part 9
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage complete courses, hierarchical units, chapters, lesson templates, and question bank
            </p>
          </div>
        </div>

        {/* Course Switcher & Management Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {courses.length > 0 && (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.classGrade}) {c.isArchived ? '[Archived]' : ''}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  setEditingCourse(activeCourse);
                  setShowCourseModal(true);
                }}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                title="Course Settings & Batches"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setEditingCourse(null);
              setShowCourseModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Course
          </button>

          {activeCourse && (
            <>
              <button
                onClick={() => setShowAIBuilderModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800/80 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" /> Build with AI
              </button>
              <button
                onClick={() => {
                  setCopilotContext(undefined);
                  setShowCopilotDrawer(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Copilot
              </button>
            </>
          )}
        </div>
      </div>

      {/* Course Overview & Readiness Ribbon */}
      {activeCourse && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
          <div>
            <span className="text-slate-500 text-[11px] block">Academic Framework</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {activeCourse.board} • {activeCourse.classGrade}
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Structure & Lessons</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {totalUnits} Units • {totalLessons} Lessons
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Batches / Groups</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              {activeCourse.batches?.length || 1} Batch(es)
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Lesson Readiness</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {readyLessons}/{totalLessons} ({readinessPercent}%) Ready
            </span>
          </div>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'curriculum', label: 'Curriculum Hierarchy', icon: Layers },
          { id: 'content_library', label: 'Content & Media Library', icon: Library },
          { id: 'question_bank', label: 'Question Bank & Assessments', icon: HelpCircle },
          { id: 'schedule', label: 'Schedule & Pacing', icon: Calendar },
          { id: 'assessment_review', label: 'Submissions & Assessment Review', icon: CheckCircle2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as MainTab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Active Tab Content */}
      {activeCourse ? (
        <div>
          {activeTab === 'curriculum' && (
            <CurriculumTree
              course={activeCourse}
              onUpdateCourse={handleSaveCourse}
              onEditLesson={(lesson) => setActiveLessonForDetail(lesson)}
              onOpenTeachingStudio={onOpenTeachingStudio}
              onOpenAICopilot={(ctx) => {
                setCopilotContext(ctx);
                setShowCopilotDrawer(true);
              }}
            />
          )}

          {activeTab === 'content_library' && (
            <ContentLibraryTab
              course={activeCourse}
              onOpenTeachingStudio={onOpenTeachingStudio}
            />
          )}

          {activeTab === 'question_bank' && (
            <QuestionBankTab course={activeCourse} />
          )}

          {activeTab === 'schedule' && (
            <ScheduleCalendarTab course={activeCourse} />
          )}

          {activeTab === 'assessment_review' && (
            <TeacherAssessmentReviewTab course={activeCourse} />
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
            No Courses Created Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            Create your first academic course or generate a full curriculum with AI to begin organizing subjects, units, and lessons.
          </p>
          <button
            onClick={() => {
              setEditingCourse(null);
              setShowCourseModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create First Course
          </button>
        </div>
      )}

      {/* Modals and Drawers */}
      {showCourseModal && (
        <CourseManagerModal
          isOpen={showCourseModal}
          onClose={() => setShowCourseModal(false)}
          onSaveCourse={handleSaveCourse}
          onDuplicateCourse={handleDuplicateCourse}
          onArchiveCourse={handleArchiveCourse}
          onDeleteCourse={handleDeleteCourse}
          initialCourse={editingCourse}
        />
      )}

      {showAIBuilderModal && activeCourse && (
        <AICurriculumBuilderModal
          isOpen={showAIBuilderModal}
          onClose={() => setShowAIBuilderModal(false)}
          activeCourse={activeCourse}
          onApplyCurriculum={handleApplyCurriculumSuggestions}
        />
      )}

      {activeLessonForDetail && (
        <LessonDetailModal
          isOpen={Boolean(activeLessonForDetail)}
          onClose={() => setActiveLessonForDetail(null)}
          lesson={activeLessonForDetail}
          onSaveLesson={handleSaveLesson}
          onOpenTeachingStudio={onOpenTeachingStudio}
          onOpenClassroomHub={onOpenClassroomHub}
        />
      )}

      {showCopilotDrawer && activeCourse && (
        <AICurriculumCopilotDrawer
          isOpen={showCopilotDrawer}
          onClose={() => setShowCopilotDrawer(false)}
          course={activeCourse}
          initialContext={copilotContext}
          onApplyLessons={handleApplyCopilotLessons}
        />
      )}
    </div>
  );
};
