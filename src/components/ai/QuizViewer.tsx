/**
 * Quiz & Assessment Viewer & Editor
 * Section 23, 24, 25: Interactive student simulation, teacher editor, source citations,
 * and exam paper export.
 */

import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit3,
  Save,
  BookOpen,
  Download,
  RotateCcw,
  Check,
  RefreshCw,
  Award,
} from 'lucide-react';
import { QuizContent, QuizQuestion } from '../../types/ai';
import { ProjectAIOutput, SupportedLanguage } from '../../types/project';
import { Button, Badge } from '../common/UIControls';

export interface QuizViewerProps {
  output: ProjectAIOutput<QuizContent>;
  language: SupportedLanguage;
  onSaveTeacherEdits: (editedContent: QuizContent) => void;
  onRestoreAI: () => void;
  onSwitchView: (view: 'ai' | 'teacher' | 'split') => void;
}

export const QuizViewer: React.FC<QuizViewerProps> = ({
  output,
  language,
  onSaveTeacherEdits,
  onRestoreAI,
  onSwitchView,
}) => {
  const isTeacherEdited = Boolean(output.teacherEditedContent);
  const activeContent: QuizContent =
    output.activeView === 'ai' || !output.teacherEditedContent
      ? (output.rawAiContent as QuizContent)
      : (output.teacherEditedContent as QuizContent);

  const [workingQuiz, setWorkingQuiz] = useState<QuizContent>(
    JSON.parse(JSON.stringify(activeContent || { title: 'Assessment Quiz', questions: [] }))
  );

  const [activeTab, setActiveTab] = useState<'practice' | 'review' | 'edit'>('review');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState<boolean>(false);

  // Editing Question State
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQuestionText, setEditQuestionText] = useState<string>('');
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editCorrectAnswer, setEditCorrectAnswer] = useState<string>('');
  const [editExplanation, setEditExplanation] = useState<string>('');

  React.useEffect(() => {
    if (activeContent) {
      setWorkingQuiz(JSON.parse(JSON.stringify(activeContent)));
      setSelectedAnswers({});
      setShowResults(false);
    }
  }, [output.activeView, output.lastModifiedAt]);

  const questions = workingQuiz.questions || [];

  if (!activeContent || questions.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        <HelpCircle className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <p className="font-semibold text-slate-700 dark:text-slate-300">No quiz questions generated yet.</p>
        <p className="text-xs text-slate-400 mt-1">Use "Create with AI" to generate a quiz.</p>
      </div>
    );
  }

  const saveQuizChanges = (newQuestions: QuizQuestion[]) => {
    const updated: QuizContent = {
      ...workingQuiz,
      totalQuestions: newQuestions.length,
      questions: newQuestions,
    };
    setWorkingQuiz(updated);
    onSaveTeacherEdits(updated);
  };

  const startEditQuestion = (q: QuizQuestion) => {
    setEditingQuestionId(q.id);
    setEditQuestionText(q.question);
    setEditOptions([...q.options]);
    setEditCorrectAnswer(q.correctAnswer);
    setEditExplanation(q.explanation);
  };

  const handleSaveQuestion = (qId: string) => {
    const next = questions.map((q) =>
      q.id === qId
        ? {
            ...q,
            question: editQuestionText.trim() || q.question,
            options: editOptions,
            correctAnswer: editCorrectAnswer,
            explanation: editExplanation,
          }
        : q
    );
    saveQuizChanges(next);
    setEditingQuestionId(null);
  };

  const handleAddQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q_${Date.now()}`,
      type: 'mcq',
      question: 'New question text?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      explanation: 'Explanation of correct answer grounded in source text.',
      difficulty: 'medium',
      sourceReference: {
        sourceName: 'Course Source',
        location: 'Section 1',
      },
    };
    const next = [...questions, newQ];
    saveQuizChanges(next);
    startEditQuestion(newQ);
  };

  const handleDeleteQuestion = (qId: string) => {
    if (questions.length <= 1) {
      alert('Quiz must contain at least 1 question.');
      return;
    }
    const next = questions.filter((q) => q.id !== qId);
    saveQuizChanges(next);
  };

  // Calculate score in practice mode
  const score = questions.reduce((acc, q) => {
    return acc + (selectedAnswers[q.id] === q.correctAnswer ? 1 : 0);
  }, 0);

  // Export question paper vs answer key
  const handleExport = (includeAnswers: boolean) => {
    let text = `${workingQuiz.title.toUpperCase()}\n`;
    text += `Difficulty: ${workingQuiz.difficulty} • Total Questions: ${questions.length}\n`;
    text += `====================================================\n\n`;

    questions.forEach((q, idx) => {
      text += `Q${idx + 1}: ${q.question}\n`;
      q.options.forEach((opt, optIdx) => {
        const letter = String.fromCharCode(65 + optIdx);
        text += `  (${letter}) ${opt}\n`;
      });

      if (includeAnswers) {
        text += `\n* Correct Answer: ${q.correctAnswer}\n`;
        text += `* Explanation: ${q.explanation}\n`;
        text += `* Source Reference: ${q.sourceReference.sourceName} (${q.sourceReference.location})\n`;
      }
      text += '\n----------------------------------------------------\n\n';
    });

    const filename = `${workingQuiz.title.replace(/\s+/g, '_')}_${includeAnswers ? 'teacher_key' : 'student_paper'}.txt`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="quiz-viewer" className="flex flex-col h-[780px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      {/* Quiz Top Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {workingQuiz.title}
              {isTeacherEdited ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  Teacher Edited
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  Original AI Output
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              {questions.length} questions • Difficulty: {workingQuiz.difficulty}
            </p>
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-2">
          {/* Practice vs Review Tabs */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs mr-2">
            <button
              type="button"
              onClick={() => setActiveTab('review')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                activeTab === 'review'
                  ? 'bg-white dark:bg-slate-900 shadow-xs font-bold text-amber-600'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Teacher Key
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('practice');
                setShowResults(false);
              }}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                activeTab === 'practice'
                  ? 'bg-white dark:bg-slate-900 shadow-xs font-bold text-indigo-600'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Interactive Test
            </button>
          </div>

          {isTeacherEdited && (
            <Button size="sm" variant="outline" onClick={onRestoreAI} icon={<RotateCcw className="w-3.5 h-3.5" />}>
              Restore AI
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExport(false)}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Student Paper
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExport(true)}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Answer Key
          </Button>

          <Button size="sm" variant="primary" onClick={handleAddQuestion} icon={<Plus className="w-3.5 h-3.5" />}>
            Add Question
          </Button>
        </div>
      </div>

      {/* Main Question List Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full space-y-6">
        {/* Practice Mode Score Banner */}
        {activeTab === 'practice' && showResults && (
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-indigo-600" />
              <div>
                <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                  Your Score: {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
                </h4>
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  {score === questions.length ? 'Perfect score!' : 'Review the grounded explanations below.'}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedAnswers({});
                setShowResults(false);
              }}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Retake
            </Button>
          </div>
        )}

        {questions.map((q, idx) => {
          const isEditing = editingQuestionId === q.id;
          const userAnswer = selectedAnswers[q.id];
          const isCorrect = userAnswer === q.correctAnswer;

          return (
            <div
              key={q.id}
              id={`quiz-q-${q.id}`}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Question {idx + 1}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {q.difficulty} • {q.type.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {!isEditing && (
                    <>
                      <button
                        type="button"
                        onClick={() => startEditQuestion(q)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg cursor-pointer"
                        title="Edit Question"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Editing Form */}
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Question Text
                    </label>
                    <textarea
                      rows={2}
                      value={editQuestionText}
                      onChange={(e) => setEditQuestionText(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Options (Click radio to mark correct answer)
                    </label>
                    {editOptions.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct_${q.id}`}
                          checked={editCorrectAnswer === opt}
                          onChange={() => setEditCorrectAnswer(opt)}
                          className="w-4 h-4 text-emerald-600"
                          title="Set as correct answer"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const copy = [...editOptions];
                            copy[optIdx] = e.target.value;
                            if (editCorrectAnswer === opt) {
                              setEditCorrectAnswer(e.target.value);
                            }
                            setEditOptions(copy);
                          }}
                          className="flex-1 text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Explanation
                    </label>
                    <textarea
                      rows={3}
                      value={editExplanation}
                      onChange={(e) => setEditExplanation(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingQuestionId(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => handleSaveQuestion(q.id)} icon={<Save className="w-3.5 h-3.5" />}>
                      Save Question
                    </Button>
                  </div>
                </div>
              ) : (
                /* Question Render */
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {q.question}
                  </h4>

                  {/* Options List */}
                  <div className="space-y-2">
                    {q.options.map((option, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isOptionCorrect = option === q.correctAnswer;
                      const isUserPick = userAnswer === option;

                      // Style computation based on mode
                      let optionStyle = 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300';

                      if (activeTab === 'review') {
                        if (isOptionCorrect) {
                          optionStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold';
                        }
                      } else if (activeTab === 'practice') {
                        if (showResults) {
                          if (isOptionCorrect) {
                            optionStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold';
                          } else if (isUserPick && !isOptionCorrect) {
                            optionStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                          }
                        } else if (isUserPick) {
                          optionStyle = 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold ring-1 ring-indigo-500';
                        }
                      }

                      return (
                        <div
                          key={optIdx}
                          onClick={() => {
                            if (activeTab === 'practice' && !showResults) {
                              setSelectedAnswers((prev) => ({ ...prev, [q.id]: option }));
                            }
                          }}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                            activeTab === 'practice' && !showResults ? 'cursor-pointer hover:border-slate-400' : ''
                          } ${optionStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                              {letter}
                            </span>
                            <span>{option}</span>
                          </div>

                          {activeTab === 'review' && isOptionCorrect && (
                            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="w-4 h-4" /> Correct Answer
                            </span>
                          )}

                          {activeTab === 'practice' && showResults && isOptionCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}

                          {activeTab === 'practice' && showResults && isUserPick && !isOptionCorrect && (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation & Citations (Shown in review mode or practice results) */}
                  {(activeTab === 'review' || (activeTab === 'practice' && showResults)) && (
                    <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1.5 text-xs">
                      <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                        Grounded Explanation:
                      </div>
                      <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                        {q.explanation}
                      </p>
                      {q.sourceReference && (
                        <div className="pt-1 text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                          Reference: {q.sourceReference.sourceName} • {q.sourceReference.location}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Practice Mode Submit Button */}
        {activeTab === 'practice' && !showResults && (
          <div className="pt-4 flex justify-center">
            <Button
              size="lg"
              variant="primary"
              onClick={() => setShowResults(true)}
              icon={<Check className="w-4 h-4" />}
            >
              Submit & Check Answers
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
