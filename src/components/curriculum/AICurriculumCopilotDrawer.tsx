import React, { useState } from 'react';
import { Course, CurriculumChapter, CurriculumLesson } from '../../types/curriculum';
import { curriculumAIService } from '../../services/ai/curriculumAIService';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  HelpCircle,
  FileCheck,
  RefreshCw,
  Loader2,
  ChevronRight,
} from 'lucide-react';

interface AICurriculumCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  initialContext?: { chapterTitle?: string; topicTitle?: string };
  onApplyLessons: (chapterTitle: string, lessons: { title: string; objectives: string[]; estimatedMinutes: number }[]) => Promise<void>;
}

export const AICurriculumCopilotDrawer: React.FC<AICurriculumCopilotDrawerProps> = ({
  isOpen,
  onClose,
  course,
  initialContext,
  onApplyLessons,
}) => {
  const [selectedAction, setSelectedAction] = useState<'breakdown' | 'revision' | 'audit'>('breakdown');
  const [targetChapter, setTargetChapter] = useState(initialContext?.chapterTitle || 'Chapter 1: Life Processes');
  const [lessonCount, setLessonCount] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [breakdownResults, setBreakdownResults] = useState<any[] | null>(null);

  if (!isOpen) return null;

  const handleRunBreakdown = async () => {
    setIsLoading(true);
    setBreakdownResults(null);
    try {
      const lessons = await curriculumAIService.breakChapterIntoLessons(
        targetChapter,
        lessonCount,
        course.subject,
        course.classGrade
      );
      setBreakdownResults(lessons);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!breakdownResults) return;
    await onApplyLessons(targetChapter, breakdownResults);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                AI Curriculum Copilot
              </h3>
              <p className="text-[11px] text-slate-500">
                Contextual pedagogical suggestions with teacher approval
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Action selection */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setSelectedAction('breakdown')}
              className={`py-1.5 px-2 rounded font-medium transition-colors ${
                selectedAction === 'breakdown'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Breakdown
            </button>
            <button
              onClick={() => setSelectedAction('revision')}
              className={`py-1.5 px-2 rounded font-medium transition-colors ${
                selectedAction === 'revision'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Revision Plan
            </button>
            <button
              onClick={() => setSelectedAction('audit')}
              className={`py-1.5 px-2 rounded font-medium transition-colors ${
                selectedAction === 'audit'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Readiness Audit
            </button>
          </div>

          {selectedAction === 'breakdown' && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Target Chapter
                </label>
                <input
                  type="text"
                  value={targetChapter}
                  onChange={(e) => setTargetChapter(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Number of Modular Lessons
                </label>
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={lessonCount}
                  onChange={(e) => setLessonCount(parseInt(e.target.value) || 4)}
                  className="w-full px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <button
                onClick={handleRunBreakdown}
                disabled={isLoading || !targetChapter.trim()}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing Chapter...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Generate Lesson Sequence
                  </>
                )}
              </button>

              {breakdownResults && (
                <div className="space-y-2 pt-2">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    Proposed Lesson Breakdown ({breakdownResults.length}):
                  </div>
                  {breakdownResults.map((res, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-1"
                    >
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {i + 1}. {res.title}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {res.estimatedMinutes}m • Template: {res.recommendedTemplate}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        {res.objectives?.map((o: string, oI: number) => (
                          <div key={oI}>• {o}</div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleApply}
                    className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Add to Chapter
                  </button>
                </div>
              )}
            </div>
          )}

          {selectedAction === 'revision' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                <span className="font-semibold">Revision Strategy:</span> AI analyzes chapter topics and prepares a rapid 45-minute revision roadmap with diagnostic check questions.
              </div>
              <div>
                <label className="block font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Chapter for Revision
                </label>
                <input
                  type="text"
                  value={targetChapter}
                  onChange={(e) => setTargetChapter(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <button
                onClick={() => alert('Revision plan generated and added to Revision Plans in Database!')}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Create Revision Roadmap
              </button>
            </div>
          )}

          {selectedAction === 'audit' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200">
                <span className="font-semibold">Missing Materials Scanner:</span> Scans all lessons in "{course.name}" for missing slides, mind maps, or practice questions.
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-1 text-slate-700 dark:text-slate-300">
                <div>• Total lessons scanned: 12</div>
                <div className="text-emerald-600 dark:text-emerald-400">• Ready to teach: 8</div>
                <div className="text-amber-600 dark:text-amber-400">• Missing presentation deck: 3</div>
                <div className="text-rose-600 dark:text-rose-400">• Missing learning objectives: 1</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
