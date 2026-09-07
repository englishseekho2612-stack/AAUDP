import React, { useState, useEffect } from 'react';
import { StudentProfile, StudentQuizAttempt } from '../../types/studentPortal';
import { AssessmentPlan, RevisionPlan } from '../../types/curriculum';
import { studentPortalDatabase } from '../../storage/studentPortalDatabase';
import { curriculumDatabase } from '../../storage/curriculumDatabase';
import { StudentQuizRunnerModal } from './StudentQuizRunnerModal';
import {
  RotateCcw,
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Play,
  TrendingUp,
  Brain,
  Zap,
} from 'lucide-react';

interface StudentRevisionCenterTabProps {
  student: StudentProfile;
  onOpenLesson?: (courseId: string, lessonId: string) => void;
}

export const StudentRevisionCenterTab: React.FC<StudentRevisionCenterTabProps> = ({
  student,
  onOpenLesson,
}) => {
  const [attempts, setAttempts] = useState<StudentQuizAttempt[]>([]);
  const [revisionPlans, setRevisionPlans] = useState<RevisionPlan[]>([]);
  const [generatedPracticeQuiz, setGeneratedPracticeQuiz] = useState<AssessmentPlan | null>(null);

  useEffect(() => {
    loadData();
  }, [student.id]);

  const loadData = async () => {
    const [qas, plans] = await Promise.all([
      studentPortalDatabase.getQuizAttemptsForStudent(student.id),
      curriculumDatabase.getAllRevisionPlans(),
    ]);
    setAttempts(qas);
    setRevisionPlans(plans);
  };

  // Identify weak areas from attempts < 70%
  const weakAttempts = attempts.filter((a) => a.percentage < 70);

  const handleGenerateRapidPractice = () => {
    const rapidQuiz: AssessmentPlan = {
      id: `rapid_rev_${Date.now()}`,
      courseId: 'course_class10_science_2026',
      subjectId: 'subj_science',
      type: 'practice_test',
      title: 'Rapid Revision Mastery Check: Photosynthesis & Enzymes',
      targetDate: new Date().toISOString().split('T')[0],
      durationMinutes: 15,
      totalMarks: 10,
      chapterIds: ['chap_nutrition'],
      questionIds: ['qb_photo_1', 'qb_photo_2'],
      status: 'ready',
    };
    setGeneratedPracticeQuiz(rapidQuiz);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 rounded-2xl">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Personalized Revision Center
            </h2>
            <p className="text-xs text-slate-500">
              Targeted revision plans, weak-topic reinforcement, and rapid memory practice.
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateRapidPractice}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Generate Rapid Practice Set</span>
        </button>
      </div>

      {/* Grid: Weak Topic Reinforcement & Spaced Revision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Needs Practice (Weak Topics) */}
        <div className="p-6 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Topics Needing Practice
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Detected from quiz questions where score was under 70%.
          </p>

          <div className="space-y-3">
            {weakAttempts.length > 0 ? (
              weakAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-2xl space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-900 dark:text-amber-200">
                      {attempt.quizTitle}
                    </span>
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                      Score: {attempt.percentage}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Review the light-independent Calvin cycle mechanisms and RuBisCO enzymatic fixation in the chloroplast stroma.
                  </p>
                  <button
                    onClick={handleGenerateRapidPractice}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 pt-1 cursor-pointer"
                  >
                    <span>Practice Weak Questions Now →</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No weak topics flagged! Your quiz scores are above 70%.
              </div>
            )}
          </div>
        </div>

        {/* Spaced Revision Schedule */}
        <div className="p-6 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Teacher Scheduled Revision Plans
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Structured review milestones aligned with your academic term.
          </p>

          <div className="space-y-3">
            {revisionPlans.map((plan) => (
              <div
                key={plan.id}
                className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {plan.title}
                  </span>
                  <span className="text-slate-400 font-medium">
                    Target: {plan.targetDate}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {plan.keyTopics.map((top, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium"
                    >
                      {top}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Rapid Practice Quiz Runner */}
      {generatedPracticeQuiz && (
        <StudentQuizRunnerModal
          quiz={generatedPracticeQuiz}
          student={student}
          onClose={() => setGeneratedPracticeQuiz(null)}
          onQuizCompleted={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};
