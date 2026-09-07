import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../types/studentPortal';
import { Course, CurriculumLesson } from '../types/curriculum';
import { studentPortalDatabase } from '../storage/studentPortalDatabase';
import { studentPortalService } from '../services/studentPortalService';
import { StudentDashboardTab } from '../components/student/StudentDashboardTab';
import { StudentCoursesTab } from '../components/student/StudentCoursesTab';
import { StudentAssignmentsTab } from '../components/student/StudentAssignmentsTab';
import { StudentQuizzesTab } from '../components/student/StudentQuizzesTab';
import { StudentRevisionCenterTab } from '../components/student/StudentRevisionCenterTab';
import { StudentHistoryTab } from '../components/student/StudentHistoryTab';
import { StudentLessonViewerModal } from '../components/student/StudentLessonViewerModal';
import { AssignmentSubmissionModal } from '../components/student/AssignmentSubmissionModal';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  HelpCircle,
  RotateCcw,
  History,
  GraduationCap,
  User,
  Radio,
  Sparkles,
} from 'lucide-react';

interface StudentPortalViewProps {
  onJoinLiveClass?: (classCode: string) => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({ onJoinLiveClass }) => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [activeStudent, setActiveStudent] = useState<StudentProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'courses' | 'assignments' | 'quizzes' | 'revision' | 'history'
  >('dashboard');

  // Modal states
  const [activeLessonModal, setActiveLessonModal] = useState<{
    lesson: CurriculumLesson;
    courseId: string;
  } | null>(null);

  const [activeAssignmentModal, setActiveAssignmentModal] = useState<any | null>(null);

  useEffect(() => {
    loadStudentsAndCourses();
  }, []);

  const loadStudentsAndCourses = async () => {
    const list = await studentPortalDatabase.getAllStudents();
    setStudents(list);
    if (list.length > 0) {
      setActiveStudent(list[0]);
      const studentCourses = await studentPortalService.getStudentCourses(list[0].id);
      setCourses(studentCourses);
    }
  };

  const handleSwitchStudent = async (studentId: string) => {
    const s = students.find((item) => item.id === studentId);
    if (s) {
      setActiveStudent(s);
      const studentCourses = await studentPortalService.getStudentCourses(s.id);
      setCourses(studentCourses);
    }
  };

  const handleOpenLesson = async (courseId: string, lessonId: string) => {
    // Find lesson in courses
    for (const c of courses) {
      for (const subj of c.subjects) {
        for (const u of subj.units) {
          for (const chap of u.chapters) {
            for (const top of chap.topics) {
              const l = top.lessons.find((item) => item.id === lessonId);
              if (l) {
                setActiveLessonModal({ lesson: l, courseId: c.id });
                return;
              }
            }
          }
        }
      }
    }
  };

  const handleOpenAssignment = async (assignmentId: string) => {
    const asms = await studentPortalService.getAssignmentsForStudent(activeStudent?.id || '');
    const found = asms.find((a) => a.assignment.id === assignmentId);
    if (found) {
      setActiveAssignmentModal(found.assignment);
    }
  };

  if (!activeStudent) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <GraduationCap className="w-10 h-10 text-indigo-600 mx-auto animate-bounce" />
          <p className="text-sm font-semibold text-slate-500">Loading Student Learning Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Bar with Profile Switcher & Live Room Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Student Learning Portal
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Access your enrolled courses, slides, interactive mind maps, and evaluations.
            </p>
          </div>
        </div>

        {/* Student Profile Switcher */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <User className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-500">Student Profile:</span>
            <select
              value={activeStudent.id}
              onChange={(e) => handleSwitchStudent(e.target.value)}
              className="text-xs font-bold bg-transparent border-none focus:outline-none text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.displayName} {st.classGrade ? `(${st.classGrade})` : ''}
                </option>
              ))}
            </select>
          </div>

          {onJoinLiveClass && (
            <button
              onClick={() => onJoinLiveClass('STUDIO1')}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span>Live Class</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'courses'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Courses & Syllabus</span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'assignments'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Assignments</span>
        </button>

        <button
          onClick={() => setActiveTab('quizzes')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'quizzes'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Quizzes</span>
        </button>

        <button
          onClick={() => setActiveTab('revision')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'revision'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Revision Center</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>History & Certificates</span>
        </button>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'dashboard' && (
        <StudentDashboardTab
          student={activeStudent}
          courses={courses}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onOpenLesson={handleOpenLesson}
          onOpenAssignment={handleOpenAssignment}
          onOpenLiveClass={(code) => onJoinLiveClass && onJoinLiveClass(code)}
        />
      )}

      {activeTab === 'courses' && (
        <StudentCoursesTab
          student={activeStudent}
          courses={courses}
          onOpenLesson={handleOpenLesson}
        />
      )}

      {activeTab === 'assignments' && (
        <StudentAssignmentsTab
          student={activeStudent}
          onOpenAssignmentModal={handleOpenAssignment}
        />
      )}

      {activeTab === 'quizzes' && <StudentQuizzesTab student={activeStudent} />}

      {activeTab === 'revision' && (
        <StudentRevisionCenterTab
          student={activeStudent}
          onOpenLesson={handleOpenLesson}
        />
      )}

      {activeTab === 'history' && (
        <StudentHistoryTab student={activeStudent} courses={courses} />
      )}

      {/* Modals */}
      {activeLessonModal && (
        <StudentLessonViewerModal
          lesson={activeLessonModal.lesson}
          courseId={activeLessonModal.courseId}
          student={activeStudent}
          onClose={() => setActiveLessonModal(null)}
          onLessonUpdated={() => {
            // refresh data
          }}
        />
      )}

      {activeAssignmentModal && (
        <AssignmentSubmissionModal
          assignment={activeAssignmentModal}
          student={activeStudent}
          onClose={() => setActiveAssignmentModal(null)}
          onSubmitted={() => {
            setActiveAssignmentModal(null);
          }}
        />
      )}
    </div>
  );
};
