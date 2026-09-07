import React, { useState, useEffect } from 'react';
import { AssessmentPlan, QuestionBankItem } from '../../types/curriculum';
import {
  StudentProfile,
  StudentQuizAttempt,
  QuizAttemptAnswer,
} from '../../types/studentPortal';
import { studentPortalService } from '../../services/studentPortalService';
import { curriculumDatabase } from '../../storage/curriculumDatabase';
import { studentPortalDatabase } from '../../storage/studentPortalDatabase';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  Award,
  HelpCircle,
} from 'lucide-react';

interface StudentQuizRunnerModalProps {
  quiz: AssessmentPlan;
  student: StudentProfile;
  onClose: () => void;
  onQuizCompleted?: () => void;
}

export const StudentQuizRunnerModal: React.FC<StudentQuizRunnerModalProps> = ({
  quiz,
  student,
  onClose,
  onQuizCompleted,
}) => {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, { optionIndex?: number; text?: string }>
  >({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(
    (quiz.durationMinutes || 30) * 60
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedAttempt, setCompletedAttempt] = useState<StudentQuizAttempt | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // AI Hint state
  const [hintContent, setHintContent] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [quiz.id]);

  // Countdown timer
  useEffect(() => {
    if (completedAttempt) return;
    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [completedAttempt]);

  const loadQuestions = async () => {
    const all = await curriculumDatabase.getAllQuestions();
    const filtered = all.filter((q) => quiz.questionIds.includes(q.id));
    if (filtered.length > 0) {
      setQuestions(filtered);
    } else {
      // Fallback sample questions if not explicitly matched
      setQuestions(all.slice(0, 3));
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], optionIndex },
    }));
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], text },
    }));
  };

  const handleRequestHint = async () => {
    const q = questions[currentIndex];
    if (!q) return;
    setIsHintLoading(true);
    setHintContent(null);
    const res = await studentPortalService.requestAiHint({
      question: q.text,
      context: `Topic: ${q.topicId || 'Science'}. Type: ${q.type}`,
      studentName: student.displayName,
    });
    setIsHintLoading(false);
    if (res.success && res.hint) {
      setHintContent(res.hint);
    } else {
      setHintContent(res.error || 'AI hints are disabled for this quiz.');
    }
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    const answersPayload = questions.map((q) => {
      const recorded = selectedAnswers[q.id];
      return {
        questionId: q.id,
        selectedOptionIndex: recorded?.optionIndex,
        textResponse: recorded?.text,
      };
    });

    const attempt = await studentPortalService.submitQuizAttempt({
      quizId: quiz.id,
      quizTitle: quiz.title,
      courseId: quiz.courseId,
      studentId: student.id,
      studentName: student.displayName,
      durationSeconds: (quiz.durationMinutes || 30) * 60 - timeRemainingSeconds,
      answers: answersPayload,
    });

    setIsSubmitting(false);
    setShowConfirmSubmit(false);
    setCompletedAttempt(attempt);
    if (onQuizCompleted) onQuizCompleted();
  };

  const currentQ = questions[currentIndex];
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Assessment Test
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {quiz.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {!completedAttempt && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(timeRemainingSeconds)}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* VIEW A: COMPLETED RESULT VIEW */}
          {completedAttempt ? (
            <div className="space-y-6 max-w-xl mx-auto py-4">
              <div className="p-6 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-3xl text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Quiz Completed!
                </h3>
                <div className="text-3xl font-black font-mono text-indigo-600">
                  {completedAttempt.percentage}%
                </div>
                <p className="text-xs text-slate-500">
                  You scored {completedAttempt.score} out of {completedAttempt.totalPossibleScore} points.
                </p>
                {completedAttempt.teacherFeedback && (
                  <div className="p-3 bg-white dark:bg-slate-850 rounded-2xl text-xs text-slate-700 dark:text-slate-300 border border-indigo-100 dark:border-indigo-900">
                    <strong>Feedback:</strong> {completedAttempt.teacherFeedback}
                  </div>
                )}
              </div>

              {/* Answers Review breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Question Breakdown & Explanations
                </h4>
                {completedAttempt.answers.map((ans, idx) => {
                  const q = questions.find((item) => item.id === ans.questionId);
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border ${
                        ans.isCorrect
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                          : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span>Question {idx + 1}</span>
                        <span className={ans.isCorrect ? 'text-emerald-600' : 'text-rose-600'}>
                          {ans.isCorrect ? 'Correct (+marks)' : 'Incorrect (0 marks)'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                        {q?.text}
                      </p>
                      {ans.feedback && (
                        <p className="text-[11px] text-slate-500 mt-2 italic">
                          {ans.feedback}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* VIEW B: ACTIVE QUIZ RUNNER */
            <div className="space-y-6">
              {/* Question Navigation Bubbles */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {questions.map((q, idx) => {
                  const isAnswered =
                    selectedAnswers[q.id]?.optionIndex !== undefined ||
                    Boolean(selectedAnswers[q.id]?.text);
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setHintContent(null);
                      }}
                      className={`w-8 h-8 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Current Question Card */}
              {currentQ && (
                <div className="p-6 bg-slate-50/60 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      Question {currentIndex + 1} of {questions.length} · {currentQ.marks || 1} mark
                    </span>

                    <button
                      onClick={handleRequestHint}
                      disabled={isHintLoading}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-purple-200 dark:border-purple-800"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isHintLoading ? 'Loading hint...' : 'Hint'}</span>
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {currentQ.text}
                  </h3>

                  {/* AI Hint Box if requested */}
                  {hintContent && (
                    <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
                      {hintContent}
                    </div>
                  )}

                  {/* Options Selector for MCQ / True-False */}
                  {currentQ.options && currentQ.options.length > 0 ? (
                    <div className="space-y-2.5">
                      {currentQ.options.map((opt, optIdx) => {
                        const isSelected = selectedAnswers[currentQ.id]?.optionIndex === optIdx;
                        return (
                          <div
                            key={opt.id || optIdx}
                            onClick={() => handleSelectOption(currentQ.id, optIdx)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-900 dark:text-indigo-100 font-semibold'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-600 text-white'
                                  : 'border-slate-300 text-slate-500'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </div>
                            <span className="text-xs sm:text-sm">{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Subjective / Short Answer Textarea */
                    <textarea
                      rows={4}
                      placeholder="Write your answer..."
                      value={selectedAnswers[currentQ.id]?.text || ''}
                      onChange={(e) => handleTextAnswer(currentQ.id, e.target.value)}
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs"
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-between">
          {completedAttempt ? (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Results
              </button>
            </div>
          ) : (
            <>
              <button
                disabled={currentIndex === 0}
                onClick={() => {
                  setCurrentIndex((i) => i - 1);
                  setHintContent(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-3">
                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => {
                      setCurrentIndex((i) => i + 1);
                      setHintContent(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmSubmit(true)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Quiz</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Submit Confirmation Dialog */}
        {showConfirmSubmit && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Finish and Submit Quiz?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                You have answered questions for <strong>{quiz.title}</strong>. Are you ready to submit your responses for evaluation?
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Review Questions
                </button>
                <button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  {isSubmitting ? 'Evaluating...' : 'Yes, Submit Now'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
