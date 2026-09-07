import React, { useState, useEffect } from 'react';
import { Course, Assignment, AssessmentPlan } from '../../types/curriculum';
import {
  StudentProfile,
  StudentAssignmentSubmission,
  StudentQuizAttempt,
  TeacherStudentControls,
  StudentAnnouncement,
} from '../../types/studentPortal';
import { studentPortalDatabase } from '../../storage/studentPortalDatabase';
import { studentPortalService } from '../../services/studentPortalService';
import {
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Settings,
  Bell,
  Send,
  UserCheck,
  AlertCircle,
  HelpCircle,
  Check,
  X,
  Edit3,
  Download,
} from 'lucide-react';

interface TeacherAssessmentReviewTabProps {
  course: Course;
}

export const TeacherAssessmentReviewTab: React.FC<TeacherAssessmentReviewTabProps> = ({
  course,
}) => {
  const [subTab, setSubTab] = useState<'submissions' | 'quizzes' | 'controls' | 'announcements'>(
    'submissions'
  );

  // Submissions state
  const [submissions, setSubmissions] = useState<StudentAssignmentSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<StudentAssignmentSubmission | null>(null);
  const [teacherScoreInput, setTeacherScoreInput] = useState<number>(0);
  const [teacherFeedbackInput, setTeacherFeedbackInput] = useState<string>('');
  const [isAiGradingLoading, setIsAiGradingLoading] = useState(false);
  const [aiGradingSuggestion, setAiGradingSuggestion] = useState<any | null>(null);

  // Quiz attempts state
  const [quizAttempts, setQuizAttempts] = useState<StudentQuizAttempt[]>([]);

  // Teacher Controls state
  const [controls, setControls] = useState<TeacherStudentControls | null>(null);
  const [controlsSavedMsg, setControlsSavedMsg] = useState(false);

  // Announcement state
  const [announcements, setAnnouncements] = useState<StudentAnnouncement[]>([]);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [annSuccessMsg, setAnnSuccessMsg] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [course.id]);

  const loadAllData = async () => {
    const [allSubs, ctrl, anns] = await Promise.all([
      studentPortalDatabase.getAllSubmissions(),
      studentPortalDatabase.getTeacherControls(course.id),
      studentPortalDatabase.getAnnouncements(course.id),
    ]);
    const filteredSubs = allSubs.filter((s) => s.courseId === course.id);
    setSubmissions(filteredSubs);
    setControls(ctrl);
    setAnnouncements(anns);

    // load quiz attempts
    const students = await studentPortalDatabase.getAllStudents();
    let allQas: StudentQuizAttempt[] = [];
    for (const s of students) {
      const qas = await studentPortalDatabase.getQuizAttemptsForStudent(s.id);
      allQas = [...allQas, ...qas.filter((q) => q.courseId === course.id)];
    }
    setQuizAttempts(allQas);
  };

  const handleSelectSubmission = (sub: StudentAssignmentSubmission) => {
    setSelectedSubmission(sub);
    setTeacherScoreInput(sub.score || 0);
    setTeacherFeedbackInput(sub.feedback || '');
    setAiGradingSuggestion(null);
  };

  const handleRequestAiGradeAssist = async () => {
    if (!selectedSubmission) return;
    setIsAiGradingLoading(true);
    setAiGradingSuggestion(null);

    const res = await studentPortalService.requestAiGradingAssist({
      studentName: selectedSubmission.studentName,
      assignmentTitle: 'Assignment ' + selectedSubmission.assignmentId,
      instructions:
        'Explain cellular respiration vs photosynthesis with chemical equations and diagrams.',
      studentResponse: selectedSubmission.textContent,
      maxScore: selectedSubmission.maxScore,
    });

    setIsAiGradingLoading(false);
    if (res.success && res.evaluation) {
      setAiGradingSuggestion(res.evaluation);
      // Pre-fill inputs for teacher review
      setTeacherScoreInput(res.evaluation.suggestedScore);
      setTeacherFeedbackInput(res.evaluation.suggestedFeedback);
    }
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission) return;
    await studentPortalService.gradeAssignmentSubmission({
      submissionId: selectedSubmission.id,
      score: teacherScoreInput,
      feedback: teacherFeedbackInput,
    });
    setSelectedSubmission(null);
    loadAllData();
  };

  const handleSaveControls = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!controls) return;
    await studentPortalDatabase.saveTeacherControls(controls);
    setControlsSavedMsg(true);
    setTimeout(() => setControlsSavedMsg(false), 3000);
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) return;

    await studentPortalDatabase.saveAnnouncement({
      id: `ann_${Date.now()}`,
      courseId: course.id,
      title: newAnnTitle.trim(),
      content: newAnnContent.trim(),
      type: 'general',
      publishedAt: Date.now(),
      teacherName: 'Dr. Sarah Jenkins',
      priority: 'normal',
    });

    setNewAnnTitle('');
    setNewAnnContent('');
    setAnnSuccessMsg(true);
    setTimeout(() => setAnnSuccessMsg(false), 3000);
    loadAllData();
  };

  const handleExportAnalyticsReport = () => {
    const csvRows: string[] = [
      'Record Type,Student Name,Title / Topic,Score,Max Score,Status,Feedback,Date',
    ];

    submissions.forEach((s) => {
      csvRows.push(
        `"Assignment","${s.studentName || 'Student'}","Assignment ${s.assignmentId}","${s.score ?? 'Ungraded'}","${s.maxScore}","${s.status}","${(s.feedback || '').replace(/"/g, '""')}","${new Date(s.submittedAt).toLocaleDateString()}"`
      );
    });

    quizAttempts.forEach((q) => {
      csvRows.push(
        `"Quiz","${q.studentName || 'Student'}","Quiz ${q.quizId}","${q.score}","${q.maxScore}","completed","${(q.aiAnalysis?.summary || '').replace(/"/g, '""')}","${new Date(q.completedAt).toLocaleDateString()}"`
      );
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${course.name.replace(/[^a-zA-Z0-9]/g, '_')}_Analytics_Report.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Sub Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubTab('submissions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
              subTab === 'submissions'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Assignment Submissions ({submissions.length})</span>
          </button>

          <button
            onClick={() => setSubTab('quizzes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
              subTab === 'quizzes'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Quiz Attempts & Misconceptions ({quizAttempts.length})</span>
          </button>

          <button
            onClick={() => setSubTab('controls')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
              subTab === 'controls'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Student AI & Assessment Controls</span>
          </button>

          <button
            onClick={() => setSubTab('announcements')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
              subTab === 'announcements'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Announcements ({announcements.length})</span>
          </button>
        </div>

        {/* Report Export Button */}
        <button
          onClick={handleExportAnalyticsReport}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center gap-2 transition-colors cursor-pointer shadow-xs ml-auto"
          title="Export CSV gradebook & analytics report"
        >
          <Download className="w-4 h-4" />
          <span>Export Analytics Report (CSV)</span>
        </button>
      </div>

      {/* SUB TAB 1: ASSIGNMENT SUBMISSIONS & AI GRADE ASSIST */}
      {subTab === 'submissions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submissions List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Student Submissions Queue
            </h3>
            {submissions.map((s) => (
              <div
                key={s.id}
                onClick={() => handleSelectSubmission(s)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1.5 ${
                  selectedSubmission?.id === s.id
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {s.studentName}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      s.status === 'graded'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">
                  "{s.textContent}"
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Max: {s.maxScore} marks</span>
                  {s.score !== undefined && (
                    <span className="font-bold text-emerald-600">
                      Score: {s.score}/{s.maxScore}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Submission Detail & Teacher Evaluation Box */}
          <div className="lg:col-span-2">
            {selectedSubmission ? (
              <div className="p-6 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Reviewing: {selectedSubmission.studentName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Submitted on {new Date(selectedSubmission.submittedAt || '').toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={handleRequestAiGradeAssist}
                    disabled={isAiGradingLoading}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAiGradingLoading ? 'Analyzing Work...' : 'AI Grade Assist'}</span>
                  </button>
                </div>

                {/* Student Work Content */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Student Written Answer
                  </span>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                    {selectedSubmission.textContent}
                  </div>
                </div>

                {/* AI Suggestion Box (If generated) */}
                {aiGradingSuggestion && (
                  <div className="p-5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-3xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200">
                          AI Grading Recommendation (Teacher Has Final Control)
                        </h4>
                      </div>
                      <span className="text-xs font-bold font-mono text-purple-700 dark:text-purple-300">
                        Suggested Score: {aiGradingSuggestion.suggestedScore} / {selectedSubmission.maxScore}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong>AI Justification:</strong> {aiGradingSuggestion.rationale}
                    </p>

                    <div className="text-xs text-purple-900 dark:text-purple-200 bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-purple-100 dark:border-purple-900">
                      <strong>Suggested Feedback:</strong> {aiGradingSuggestion.suggestedFeedback}
                    </div>
                  </div>
                )}

                {/* Teacher Final Scoring Form */}
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Assigned Score (Max: {selectedSubmission.maxScore})
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={selectedSubmission.maxScore}
                        value={teacherScoreInput}
                        onChange={(e) => setTeacherScoreInput(Number(e.target.value))}
                        className="w-32 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Private Teacher Feedback to Student
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Write feedback, praise, or areas for improvement..."
                      value={teacherFeedbackInput}
                      onChange={(e) => setTeacherFeedbackInput(e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setSelectedSubmission(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveGrade}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save & Return Grade to Student</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-xs text-slate-400">
                Select a student submission from the queue to view work and grade.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB TAB 2: QUIZ ATTEMPTS & MISCONCEPTIONS */}
      {subTab === 'quizzes' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Student Quiz Performance & Misconceptions Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 font-medium">Total Quiz Attempts</span>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {quizAttempts.length}
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 font-medium">Class Average Mastery</span>
                <div className="text-xl font-bold text-indigo-600">68%</div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 font-medium">Flagged Misconception</span>
                <div className="text-xs font-bold text-rose-600 mt-1">
                  Calvin Cycle Daytime Dependence
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Recent Student Attempts
              </h4>
              {quizAttempts.map((qa) => (
                <div
                  key={qa.id}
                  className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {qa.studentName}
                    </span>
                    <span className="text-slate-500 block">
                      Quiz: {qa.quizTitle} · Duration: {Math.round(qa.durationSeconds / 60)} mins
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-indigo-600 text-sm block">
                      {qa.percentage}%
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {qa.score} / {qa.totalPossibleScore} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 3: STUDENT CONTROLS & PEDAGOGICAL POLICY */}
      {subTab === 'controls' && controls && (
        <form
          onSubmit={handleSaveControls}
          className="max-w-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6"
        >
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Teacher Student Learning & Assessment Controls
            </h3>
            <p className="text-xs text-slate-500">
              Set pedagogical boundaries for AI hints and quiz answer visibility.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  Allow AI Learning Hints
                </span>
                <span className="text-[11px] text-slate-500">
                  Allow students to ask AI for guidance while studying or attempting tests
                </span>
              </div>
              <input
                type="checkbox"
                checked={controls.allowAiHints}
                onChange={(e) => setControls({ ...controls, allowAiHints: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                AI Hint Mode
              </label>
              <select
                value={controls.aiHintMode}
                onChange={(e) =>
                  setControls({ ...controls, aiHintMode: e.target.value as any })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value="hint_only">Hint Only (Clues without answers)</option>
                <option value="step_by_step">Step-by-Step Guidance (Pedagogical progression)</option>
                <option value="concept_explanation">Concept Explanation (Background theory only)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Quiz Answers Reveal Policy
              </label>
              <select
                value={controls.revealQuizAnswers}
                onChange={(e) =>
                  setControls({ ...controls, revealQuizAnswers: e.target.value as any })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value="after_submission">Immediately after submission</option>
                <option value="manual_only">Manual release by teacher only</option>
                <option value="after_deadline">Only after test deadline passes</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  Allow Late Submissions
                </span>
                <span className="text-[11px] text-slate-500">
                  Allow students to turn in assignments after the due date with a "Late" tag
                </span>
              </div>
              <input
                type="checkbox"
                checked={controls.allowLateSubmissions}
                onChange={(e) =>
                  setControls({ ...controls, allowLateSubmissions: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {controlsSavedMsg ? (
              <span className="text-xs text-emerald-600 font-bold">
                ✓ Controls updated successfully!
              </span>
            ) : (
              <div />
            )}
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Save Control Settings
            </button>
          </div>
        </form>
      )}

      {/* SUB TAB 4: ANNOUNCEMENTS COMPOSER */}
      {subTab === 'announcements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* New Announcement Form */}
          <form
            onSubmit={handleCreateAnnouncement}
            className="p-6 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Publish Student Announcement
            </h3>
            <p className="text-xs text-slate-500">
              Announcements will display on the student portal dashboard immediately.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Announcement Title..."
                value={newAnnTitle}
                onChange={(e) => setNewAnnTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
              <textarea
                rows={4}
                placeholder="Announcement details, test schedules, or classroom reminders..."
                value={newAnnContent}
                onChange={(e) => setNewAnnContent(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            {annSuccessMsg && (
              <p className="text-xs text-emerald-600 font-bold">
                ✓ Announcement broadcasted to students!
              </p>
            )}

            <button
              type="submit"
              disabled={!newAnnTitle.trim() || !newAnnContent.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Announcement</span>
            </button>
          </form>

          {/* Past Announcements Feed */}
          <div className="p-6 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Published Course Announcements
            </h3>
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                    <span>{ann.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(ann.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
