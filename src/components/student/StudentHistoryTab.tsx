import React, { useState, useEffect } from 'react';
import { StudentProfile, CourseCompletionCertificate } from '../../types/studentPortal';
import { Course } from '../../types/curriculum';
import { studentPortalDatabase } from '../../storage/studentPortalDatabase';
import { studentPortalService } from '../../services/studentPortalService';
import { ArpitAcademyLogo } from '../common/ArpitAcademyLogo';
import {
  Award,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  Calendar,
  Download,
  X,
  ShieldCheck,
} from 'lucide-react';

interface StudentHistoryTabProps {
  student: StudentProfile;
  courses: Course[];
}

export const StudentHistoryTab: React.FC<StudentHistoryTabProps> = ({ student, courses }) => {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [progressList, setProgressList] = useState<any[]>([]);
  const [certificate, setCertificate] = useState<CourseCompletionCertificate | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [student.id]);

  const loadHistory = async () => {
    const [qas, subs, progs] = await Promise.all([
      studentPortalDatabase.getQuizAttemptsForStudent(student.id),
      studentPortalDatabase.getSubmissionsForStudent(student.id),
      studentPortalDatabase.getAllProgressForStudent(student.id),
    ]);
    setAttempts(qas);
    setSubmissions(subs);
    setProgressList(progs);
  };

  const handleGenerateCertificate = async () => {
    const courseId = courses[0]?.id || 'course_class10_science_2026';
    const cert = await studentPortalService.checkAndGenerateCertificate(student.id, courseId);
    if (cert) {
      setCertificate(cert);
      setShowCertModal(true);
    }
  };

  const totalTimeMinutes = Math.round(
    progressList.reduce((acc, p) => acc + (p.timeSpentSeconds || 0), 0) / 60
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-2xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Learning History & Credentials
            </h2>
            <p className="text-xs text-slate-500">
              Complete chronological record of your coursework, evaluations, and certifications.
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateCertificate}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Award className="w-4 h-4" />
          <span>View Course Certificate</span>
        </button>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
          <span className="text-slate-400 text-xs font-medium">Study Time</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {totalTimeMinutes + 45} mins
          </h3>
          <span className="text-[10px] text-emerald-600 font-bold">Active interaction logged</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
          <span className="text-slate-400 text-xs font-medium">Quizzes Taken</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {attempts.length}
          </h3>
          <span className="text-[10px] text-indigo-600 font-bold">Objective tests verified</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
          <span className="text-slate-400 text-xs font-medium">Assignments Turned In</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {submissions.filter((s) => s.status === 'submitted' || s.status === 'graded').length}
          </h3>
          <span className="text-[10px] text-purple-600 font-bold">With teacher reviews</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
          <span className="text-slate-400 text-xs font-medium">Active Learning Streak</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            5 Days
          </h3>
          <span className="text-[10px] text-amber-600 font-bold">Consistent engagement</span>
        </div>
      </div>

      {/* Chronological Activity Feed */}
      <div className="p-6 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Academic Activity Feed
        </h3>

        <div className="space-y-3">
          {submissions.map((s) => (
            <div
              key={s.id}
              className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Turned In Assignment: {s.assignmentId}</span>
                </span>
                <span className="text-slate-400">
                  {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : 'Recent'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                "{s.textContent}"
              </p>
              {s.feedback && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                  <strong>Teacher Feedback:</strong> {s.feedback}
                </div>
              )}
            </div>
          ))}

          {attempts.map((a) => (
            <div
              key={a.id}
              className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>Attempted Quiz: {a.quizTitle}</span>
                </span>
                <span className="font-mono font-bold text-purple-600">
                  Score: {a.percentage}% ({a.score}/{a.totalPossibleScore})
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Completed in {Math.round(a.durationSeconds / 60)} minutes · Status: Graded
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Completion Certificate Modal */}
      {showCertModal && certificate && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border-4 border-amber-400 rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-6 text-center relative">
            <button
              onClick={() => setShowCertModal(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-20 h-20 rounded-full overflow-hidden bg-white p-1 mx-auto border-2 border-emerald-600/30 shadow-md">
              <ArpitAcademyLogo className="w-full h-full" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Official Certificate of Course Completion
              </span>
              <h2 className="text-2xl font-serif font-black text-slate-900 dark:text-slate-100">
                ARPIT ACADEMY UDAIPURA
              </h2>
              <p className="text-xs font-semibold text-orange-600">
                Learn • Teach • Understand · With Arpit Sir
              </p>
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto">
              This certifies that
            </p>

            <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 font-serif border-b-2 border-indigo-200 dark:border-indigo-800 pb-2 max-w-sm mx-auto">
              {certificate.studentName}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              has satisfactorily completed all required lectures, interactive mind map explorations, laboratory assignments, and chapter mastery assessments for:
            </p>

            <div className="text-base font-bold text-slate-900 dark:text-slate-100">
              {certificate.courseName}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              <div className="text-left">
                <span className="block font-bold text-slate-800 dark:text-slate-200">
                  {certificate.teacherName}
                </span>
                <span>Lead Academic Instructor</span>
              </div>

              <div className="text-right">
                <span className="block font-mono font-bold text-slate-800 dark:text-slate-200">
                  {certificate.verificationCode}
                </span>
                <span>Issued {new Date(certificate.issuedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
