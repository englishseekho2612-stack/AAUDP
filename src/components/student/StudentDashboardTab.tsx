import React, { useState, useEffect } from 'react';
import {
  StudentProfile,
  PersonalizedLearningSuggestion,
  StudentAnnouncement,
} from '../../types/studentPortal';
import { Course, Assignment } from '../../types/curriculum';
import { ArpitAcademyLogo } from '../common/ArpitAcademyLogo';
import { studentPortalService } from '../../services/studentPortalService';
import { studentPortalDatabase } from '../../storage/studentPortalDatabase';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  FileText,
  Award,
  Bell,
  HelpCircle,
  Play,
  Layers,
  Radio,
  ExternalLink,
} from 'lucide-react';

interface StudentDashboardTabProps {
  student: StudentProfile;
  courses: Course[];
  onNavigateTab: (
    tab: 'dashboard' | 'courses' | 'assignments' | 'quizzes' | 'revision' | 'history'
  ) => void;
  onOpenLesson: (courseId: string, lessonId: string) => void;
  onOpenAssignment: (assignmentId: string) => void;
  onOpenLiveClass: (classCode: string) => void;
}

export const StudentDashboardTab: React.FC<StudentDashboardTabProps> = ({
  student,
  courses,
  onNavigateTab,
  onOpenLesson,
  onOpenAssignment,
  onOpenLiveClass,
}) => {
  const [suggestions, setSuggestions] = useState<PersonalizedLearningSuggestion[]>([]);
  const [announcements, setAnnouncements] = useState<StudentAnnouncement[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [recentQuizAttempts, setRecentQuizAttempts] = useState<any[]>([]);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinMsg, setJoinMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [student.id, courses]);

  const loadDashboardData = async () => {
    const defaultCourseId = courses[0]?.id || 'course_class10_science_2026';
    const [suggs, anns, asms, qas] = await Promise.all([
      studentPortalDatabase.getPersonalizedSuggestions(student.id, defaultCourseId),
      studentPortalDatabase.getAnnouncements(defaultCourseId),
      studentPortalService.getAssignmentsForStudent(student.id),
      studentPortalDatabase.getQuizAttemptsForStudent(student.id),
    ]);
    setSuggestions(suggs);
    setAnnouncements(anns);
    setAssignments(asms);
    setRecentQuizAttempts(qas.slice(0, 3));
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    const code = joinCodeInput.trim().toUpperCase();
    const ok = await studentPortalService.enrollStudentInClassCode(student.id, code);
    if (ok) {
      setJoinMsg({ type: 'success', text: `Enrolled in classroom code ${code} successfully!` });
      setJoinCodeInput('');
      loadDashboardData();
    } else {
      setJoinMsg({ type: 'error', text: `Could not enroll in classroom code ${code}.` });
    }
  };

  // Calculate upcoming / due soon work
  const pendingAssignments = assignments.filter((a) => a.status === 'not_started' || a.status === 'in_progress');

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner & Active Class Alert */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 border border-emerald-700/40">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white p-1 shrink-0 border-2 border-emerald-400/40 shadow-md">
            <ArpitAcademyLogo className="w-full h-full" />
          </div>
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>ARPIT ACADEMY UDAIPURA · Student Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {student.displayName}!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Learn • Teach • Understand <span className="text-orange-300">· With Arpit Sir</span>. Enrolled in {courses.length} courses.
            </p>
          </div>
        </div>

        {/* Quick Join Live Classroom widget */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-5 rounded-2xl flex flex-col gap-3 shrink-0 md:w-80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 text-indigo-200">
              <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
              Live Class Room
            </span>
            <span className="text-[11px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
              STUDIO1
            </span>
          </div>
          <p className="text-xs text-indigo-100">
            Teacher Dr. Sarah Jenkins is holding live interactive class sessions.
          </p>
          <button
            onClick={() => onOpenLiveClass('STUDIO1')}
            className="w-full py-2.5 px-4 rounded-xl bg-white text-indigo-900 font-bold text-xs hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Radio className="w-3.5 h-3.5 text-indigo-600" />
            <span>Enter Live Classroom</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Three Metric Cards: Completed Lessons, Average Quiz, Pending Work */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Course Progress
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              65% Complete
            </h3>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              2 Lessons in progress
            </span>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Quiz Average
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              68% Mastery
            </h3>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              1 attempt recorded
            </span>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Pending Work
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {pendingAssignments.length} Assignment{pendingAssignments.length === 1 ? '' : 's'}
            </h3>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              Due within 7 days
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Left Column (Courses & Recommendations), Right Column (Deadlines & Announcements) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Enrolled Courses & Personalized Suggestions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personalized Learning Suggestions */}
          <div className="p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Personalized Learning Guidance
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Evidence-based suggestions derived from your quiz attempts and progress
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('revision')}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 cursor-pointer flex items-center gap-1"
              >
                <span>Revision Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {suggestions.slice(0, 3).map((sugg) => (
                <div
                  key={sugg.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          sugg.priority === 'high'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                        }`}
                      >
                        {sugg.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {sugg.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {sugg.description}
                    </p>
                    <p className="text-[11px] text-slate-400 italic">
                      Reason: {sugg.reason}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (sugg.lessonId) {
                        onOpenLesson(sugg.courseId, sugg.lessonId);
                      } else {
                        onNavigateTab('revision');
                      }
                    }}
                    className="self-start sm:self-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <span>{sugg.lessonId ? 'Resume Lesson' : 'Practice Now'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Enrolled Courses Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>My Courses</span>
              </h2>
              <button
                onClick={() => onNavigateTab('courses')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                View Full Syllabus
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                          {course.classGrade} · {course.board || 'CBSE'}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          Academic Year {course.academicYear}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {course.name}
                      </h3>
                    </div>

                    <button
                      onClick={() => onNavigateTab('courses')}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold self-start sm:self-center cursor-pointer"
                    >
                      Open Course
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Progress bar */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Curriculum Progress</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">65%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: '65%' }}
                      />
                    </div>
                  </div>

                  {/* Quick Lesson Cards inside this course */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div
                      onClick={() => onOpenLesson(course.id, 'lesson_photosynthesis_intro')}
                      className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-400 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="truncate pr-2">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase block">
                          Completed
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                          Photosynthesis: Light Reactions
                        </span>
                      </div>
                      <Play className="w-4 h-4 text-indigo-600 shrink-0" />
                    </div>

                    <div
                      onClick={() => onOpenLesson(course.id, 'lesson_stomata_transpiration')}
                      className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-400 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="truncate pr-2">
                        <span className="text-[10px] font-bold text-amber-600 uppercase block">
                          In Progress
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                          Stomatal Dynamics & Gas Exchange
                        </span>
                      </div>
                      <Play className="w-4 h-4 text-indigo-600 shrink-0" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Deadlines, Announcements, and Join Code */}
        <div className="space-y-6">
          {/* Quick Class Join widget */}
          <div className="p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Join Another Classroom
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Enter the 6-character code given by your teacher to enroll in live sessions.
            </p>
            <form onSubmit={handleJoinClass} className="space-y-2">
              <input
                type="text"
                maxLength={8}
                placeholder="Class Code (e.g. STUDIO1)"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono font-bold tracking-widest text-xs uppercase"
              />
              <button
                type="submit"
                disabled={!joinCodeInput.trim()}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Enroll in Class</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
            {joinMsg && (
              <p
                className={`text-[11px] ${
                  joinMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {joinMsg.text}
              </p>
            )}
          </div>

          {/* Upcoming Deadlines */}
          <div className="p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Upcoming Deadlines
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('assignments')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                All
              </button>
            </div>

            <div className="space-y-2.5">
              {assignments.map((item) => (
                <div
                  key={item.assignment.id}
                  onClick={() => onOpenAssignment(item.assignment.id)}
                  className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-400 cursor-pointer space-y-1 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {item.assignment.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'graded'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : item.status === 'submitted'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Due: {item.assignment.dueDate || 'Next Week'}</span>
                    <span>Max: {item.assignment.maxScore} marks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Teacher Announcements */}
          <div className="p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Teacher Announcements
              </h3>
            </div>

            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {ann.title}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {new Date(ann.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ann.content}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                      By {ann.teacherName}
                    </span>
                    {ann.actionLink && (
                      <button
                        onClick={() => onNavigateTab(ann.actionLink!.tab)}
                        className="text-[11px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{ann.actionLink.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
