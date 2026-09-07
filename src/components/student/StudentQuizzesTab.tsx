import React, { useState, useEffect } from 'react';
import { AssessmentPlan } from '../../types/curriculum';
import { StudentProfile } from '../../types/studentPortal';
import { studentPortalService } from '../../services/studentPortalService';
import { StudentQuizRunnerModal } from './StudentQuizRunnerModal';
import {
  HelpCircle,
  Award,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

interface StudentQuizzesTabProps {
  student: StudentProfile;
}

export const StudentQuizzesTab: React.FC<StudentQuizzesTabProps> = ({ student }) => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<AssessmentPlan | null>(null);

  useEffect(() => {
    loadQuizzes();
  }, [student.id]);

  const loadQuizzes = async () => {
    const list = await studentPortalService.getQuizzesForStudent(student.id);
    setQuizzes(list);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 rounded-2xl">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Quizzes & Assessment Tests
            </h2>
            <p className="text-xs text-slate-500">
              Timed tests and chapter checks to verify topic mastery with objective instant scoring.
            </p>
          </div>
        </div>
      </div>

      {/* Quizzes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quizzes.map((item) => {
          const q = item.quiz as AssessmentPlan;
          const hasAttempted = item.attemptsCount > 0;

          return (
            <div
              key={q.id}
              className="p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 hover:border-purple-400 dark:hover:border-purple-600 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                  {q.type.replace('_', ' ')}
                </span>

                <span className="text-xs font-mono font-bold text-slate-500">
                  {q.totalMarks} marks
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {q.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{q.durationMinutes} mins</span>
                  </span>
                  <span>•</span>
                  <span>{q.questionIds?.length || 3} questions</span>
                </div>
              </div>

              {/* Best Score or Status */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  {hasAttempted ? (
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold text-indigo-600">
                        Best: {item.bestScore}%
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({item.attemptsCount} attempts)
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Not attempted yet</span>
                  )}
                </div>

                <button
                  disabled={!item.canAttempt}
                  onClick={() => setSelectedQuiz(q)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {hasAttempted ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retake Quiz</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Quiz</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Quiz Runner Modal */}
      {selectedQuiz && (
        <StudentQuizRunnerModal
          quiz={selectedQuiz}
          student={student}
          onClose={() => setSelectedQuiz(null)}
          onQuizCompleted={() => {
            loadQuizzes();
          }}
        />
      )}
    </div>
  );
};
