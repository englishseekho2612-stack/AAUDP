import React, { useState } from 'react';
import { Course, CurriculumAISuggestion, CurriculumBoard } from '../../types/curriculum';
import { curriculumAIService, CurriculumBuilderParams } from '../../services/ai/curriculumAIService';
import {
  Sparkles,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Layers,
  ChevronRight,
  ChevronDown,
  Loader2,
  Upload,
} from 'lucide-react';

interface AICurriculumBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCourse: Course;
  onApplyCurriculum: (suggestions: CurriculumAISuggestion[]) => Promise<void>;
}

const BOARDS: CurriculumBoard[] = [
  'CBSE',
  'ICSE',
  'Cambridge (IGCSE/A-Levels)',
  'IB (International Baccalaureate)',
  'State Board',
  'National Curriculum',
  'Higher Education',
  'Vocational / Skill',
  'Custom / Other',
];

export const AICurriculumBuilderModal: React.FC<AICurriculumBuilderModalProps> = ({
  isOpen,
  onClose,
  activeCourse,
  onApplyCurriculum,
}) => {
  const [subject, setSubject] = useState(activeCourse.subject);
  const [classGrade, setClassGrade] = useState(activeCourse.classGrade);
  const [board, setBoard] = useState<CurriculumBoard>(activeCourse.board);
  const [academicDuration, setAcademicDuration] = useState('Full Academic Year (9 Months)');
  const [availableDays, setAvailableDays] = useState(140);
  const [targetCompletionDate, setTargetCompletionDate] = useState(activeCourse.targetCompletionDate || '2027-02-28');
  const [syllabusText, setSyllabusText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    suggestions: CurriculumAISuggestion[];
    note: string;
    groundedInSource: boolean;
  } | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>({ 0: true });

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) setSyllabusText(text);
    };
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);

    try {
      const params: CurriculumBuilderParams = {
        subject,
        classGrade,
        board,
        academicDuration,
        availableTeachingDays: availableDays,
        targetCompletionDate,
        syllabusSourceText: syllabusText.trim() || undefined,
        language: activeCourse.language,
      };

      const res = await curriculumAIService.buildCurriculumProposal(params);
      setResult(res);
      setExpandedUnits({ 0: true, 1: true });
    } catch (err) {
      console.error('Failed to generate curriculum:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!result || !result.suggestions.length) return;
    await onApplyCurriculum(result.suggestions);
    onClose();
  };

  const toggleUnit = (idx: number) => {
    setExpandedUnits((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Build Academic Curriculum with AI
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  Teacher-Approved Workflow
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ground in official syllabus source or generate structured academic breakdown with units, chapters, and pacing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!result ? (
            /* Input Form */
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Class / Grade
                  </label>
                  <input
                    type="text"
                    value={classGrade}
                    onChange={(e) => setClassGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Curriculum / Board
                  </label>
                  <select
                    value={board}
                    onChange={(e) => setBoard(e.target.value as CurriculumBoard)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {BOARDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Academic Term / Duration
                  </label>
                  <input
                    type="text"
                    value={academicDuration}
                    onChange={(e) => setAcademicDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Available Teaching Days
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={300}
                    value={availableDays}
                    onChange={(e) => setAvailableDays(parseInt(e.target.value) || 120)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={targetCompletionDate}
                    onChange={(e) => setTargetCompletionDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Authoritative Syllabus Grounding Input (Section 7) */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Authoritative Syllabus / Curriculum Source (Optional Grounding)
                    </span>
                  </div>
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100">
                    <Upload className="w-3.5 h-3.5" /> Upload Text/Syllabus
                    <input type="file" accept=".txt,.json,.md,.csv" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  Paste official syllabus chapter outlines or course guidelines. Content directly present in the source will be tagged as{' '}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">[SOURCE CURRICULUM]</span>.
                </p>
                <textarea
                  rows={4}
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  placeholder="Paste syllabus chapters, learning objectives, or unit breakdown here..."
                  className="w-full px-3 py-2 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Grounding & Integrity Disclaimer (Section 6 & 7) */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Pedagogical Compliance Notice:</span> AI suggests topic structure and lesson pacing based on standard frameworks. Suggestions are not certified as official government/board curriculum unless verified against an authoritative source. All items require teacher review before applying.
                </div>
              </div>
            </div>
          ) : (
            /* Proposal Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{result.note}</span>
                </div>
                <button
                  onClick={() => setResult(null)}
                  className="text-xs underline font-semibold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900"
                >
                  Adjust Parameters
                </button>
              </div>

              {/* Suggestions Tree Preview */}
              <div className="space-y-3">
                {result.suggestions.map((unit, unitIdx) => (
                  <div
                    key={unitIdx}
                    className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-800/70"
                  >
                    <div
                      onClick={() => toggleUnit(unitIdx)}
                      className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
                    >
                      <div className="flex items-center gap-2.5">
                        {expandedUnits[unitIdx] ? (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {unit.title}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                            unit.origin === 'SOURCE_CURRICULUM'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                          }`}
                        >
                          {unit.origin === 'SOURCE_CURRICULUM' ? 'Source Curriculum' : 'AI Suggestion'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ~{unit.estimatedLessons || 4} Lessons
                      </span>
                    </div>

                    {expandedUnits[unitIdx] && (
                      <div className="p-4 space-y-3 border-t border-slate-200 dark:border-slate-800">
                        {unit.chapters?.map((chap, chapIdx) => (
                          <div
                            key={chapIdx}
                            className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {chap.title}
                              </h5>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {chap.topics?.length || 0} topics
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{chap.description}</p>
                            <div className="space-y-1.5 pl-2 border-l-2 border-indigo-200 dark:border-indigo-900">
                              {chap.topics?.map((topic, tIdx) => (
                                <div key={tIdx} className="text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                  <span>• {topic.title}</span>
                                  <span className="text-[10px] text-slate-400">{topic.estimatedMinutes} min</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Cancel
          </button>

          {!result ? (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !subject.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Structure...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Curriculum Proposal
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve & Apply to Course
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
