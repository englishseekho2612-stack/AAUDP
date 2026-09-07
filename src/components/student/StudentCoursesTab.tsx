import React, { useState, useEffect } from 'react';
import { Course, CurriculumLesson } from '../../types/curriculum';
import { StudentProfile, StudentLessonProgress } from '../../types/studentPortal';
import { studentPortalDatabase } from '../../storage/studentPortalDatabase';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  Play,
  Presentation,
  GitFork,
  FileText,
  HelpCircle,
  Folder,
  Layers,
  Search,
} from 'lucide-react';

interface StudentCoursesTabProps {
  student: StudentProfile;
  courses: Course[];
  onOpenLesson: (courseId: string, lessonId: string) => void;
}

export const StudentCoursesTab: React.FC<StudentCoursesTabProps> = ({
  student,
  courses,
  onOpenLesson,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || ''
  );
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({
    unit_life_processes: true,
  });
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    chap_nutrition: true,
  });
  const [progressMap, setProgressMap] = useState<Record<string, StudentLessonProgress>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProgress();
  }, [student.id]);

  const loadProgress = async () => {
    const list = await studentPortalDatabase.getAllProgressForStudent(student.id);
    const map: Record<string, StudentLessonProgress> = {};
    list.forEach((p) => {
      map[p.lessonId] = p;
    });
    setProgressMap(map);
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  if (!selectedCourse) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800">
        No enrolled courses found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Selector & Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-2xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {selectedCourse.name}
            </h2>
            <p className="text-xs text-slate-500">
              {selectedCourse.classGrade} · {selectedCourse.board} · Syllabus & Lesson Access
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {courses.length > 1 && (
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topics or lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-48 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Curriculum Hierarchy Explorer */}
      <div className="space-y-4">
        {selectedCourse.subjects.map((subject) => (
          <div key={subject.id} className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Subject: {subject.name}
              </span>
              <span className="text-xs text-slate-400">({subject.code})</span>
            </div>

            <div className="space-y-3">
              {subject.units.map((unit) => {
                const isUnitOpen = expandedUnits[unit.id] ?? true;
                return (
                  <div
                    key={unit.id}
                    className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden"
                  >
                    {/* Unit Header */}
                    <button
                      onClick={() => toggleUnit(unit.id)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {isUnitOpen ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {unit.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {unit.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {unit.chapters.length} Chapters
                      </span>
                    </button>

                    {/* Unit Chapters */}
                    {isUnitOpen && (
                      <div className="px-5 pb-5 pt-1 space-y-3 border-t border-slate-100 dark:border-slate-800">
                        {unit.chapters.map((chapter) => {
                          const isChapOpen = expandedChapters[chapter.id] ?? true;
                          return (
                            <div
                              key={chapter.id}
                              className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden"
                            >
                              <button
                                onClick={() => toggleChapter(chapter.id)}
                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors text-left cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5">
                                  {isChapOpen ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {chapter.title}
                                  </span>
                                </div>
                              </button>

                              {isChapOpen && (
                                <div className="p-3 space-y-2 border-t border-slate-200/60 dark:border-slate-800/60">
                                  {chapter.topics.map((topic) => (
                                    <div key={topic.id} className="space-y-2 pl-2">
                                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        Topic: {topic.title}
                                      </div>

                                      <div className="space-y-2">
                                        {topic.lessons
                                          .filter((les) =>
                                            searchQuery
                                              ? les.title
                                                  .toLowerCase()
                                                  .includes(searchQuery.toLowerCase())
                                              : true
                                          )
                                          .map((lesson) => {
                                            const progress = progressMap[lesson.id];
                                            const isCompleted = progress?.status === 'completed';
                                            const isInProgress = progress?.status === 'in_progress';

                                            return (
                                              <div
                                                key={lesson.id}
                                                onClick={() =>
                                                  onOpenLesson(selectedCourse.id, lesson.id)
                                                }
                                                className="p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer shadow-xs"
                                              >
                                                <div className="space-y-1">
                                                  <div className="flex items-center gap-2">
                                                    {isCompleted ? (
                                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                    ) : isInProgress ? (
                                                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                                    ) : (
                                                      <Play className="w-4 h-4 text-slate-400 shrink-0" />
                                                    )}
                                                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                                      {lesson.title}
                                                    </h4>
                                                  </div>

                                                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-slate-500">
                                                    <span>{lesson.estimatedDurationMinutes} mins</span>
                                                    <span>•</span>
                                                    {/* Published badges */}
                                                    <div className="flex items-center gap-1.5">
                                                      {lesson.hasSlides && (
                                                        <span
                                                          title="Presentation Slides Included"
                                                          className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600"
                                                        >
                                                          <Presentation className="w-3 h-3" />
                                                          Slides
                                                        </span>
                                                      )}
                                                      {lesson.hasMindMap && (
                                                        <span
                                                          title="Interactive Mind Map"
                                                          className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-600"
                                                        >
                                                          <GitFork className="w-3 h-3" />
                                                          Mind Map
                                                        </span>
                                                      )}
                                                      {lesson.hasNotes && (
                                                        <span
                                                          title="Lecture Notes"
                                                          className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600"
                                                        >
                                                          <FileText className="w-3 h-3" />
                                                          Notes
                                                        </span>
                                                      )}
                                                      {lesson.hasQuiz && (
                                                        <span
                                                          title="Practice Quiz"
                                                          className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600"
                                                        >
                                                          <HelpCircle className="w-3 h-3" />
                                                          Quiz
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="flex items-center gap-2 self-end sm:self-center">
                                                  <span
                                                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                                      isCompleted
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                        : isInProgress
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                                  >
                                                    {isCompleted
                                                      ? 'Completed'
                                                      : isInProgress
                                                      ? 'In Progress'
                                                      : 'Not Started'}
                                                  </span>

                                                  <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer">
                                                    <span>Open</span>
                                                    <Play className="w-3 h-3" />
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
          </div>
        ))}
      </div>
    </div>
  );
};
