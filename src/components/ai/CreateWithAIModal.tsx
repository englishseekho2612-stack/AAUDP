/**
 * "Create with AI" Modal
 * Section 5: Source Selection, Priority, Teacher Instructions, Output Language, and Task Launcher
 * Section 12, 33, 34, 35: Indeterminate progress, Cancel, Retry, Overwrite protection
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Layers,
  Globe,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Presentation,
  FileText,
  Headphones,
  Video,
  HelpCircle,
  Palette,
  Lightbulb,
  Check,
  ChevronRight,
  RefreshCw,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import {
  TeachingProject,
  LearningSource,
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  AIOutputType,
  ProjectAIOutput,
} from '../../types/project';
import { AITaskType, AITaskRequest } from '../../types/ai';
import { aiTaskService } from '../../services/ai/aiTaskService';
import { Button, Badge } from '../common/UIControls';

export interface CreateWithAIModalProps {
  isOpen: boolean;
  project: TeachingProject;
  initialTask?: AITaskType;
  preselectedTaskType?: AIOutputType;
  onClose: () => void;
  onOutputGenerated?: (type: AIOutputType, output: ProjectAIOutput) => void;
  onGenerated?: (type: AIOutputType) => void;
}

interface TaskCardInfo {
  type: AITaskType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const AI_TASKS: TaskCardInfo[] = [
  {
    type: 'mind_map',
    title: 'Mind Map',
    description: 'Interactive hierarchical visual structure with deep topic exploration and source citations.',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400',
  },
  {
    type: 'slides',
    title: 'Presentation / Slides',
    description: 'Classroom slide deck with teaching points, speaker notes, and visual suggestions.',
    icon: <Presentation className="w-5 h-5" />,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400',
  },
  {
    type: 'notes',
    title: 'Notes & Summary',
    description: 'Structured study notes with summary, detailed analysis, glossary, and exam questions.',
    icon: <FileText className="w-5 h-5" />,
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400',
  },
  {
    type: 'quiz',
    title: 'Quiz & Assessment',
    description: 'Grounded multiple-choice and short-answer questions with explanations and citations.',
    icon: <HelpCircle className="w-5 h-5" />,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400',
  },
  {
    type: 'audio',
    title: 'Audio Lesson',
    description: 'Spoken educational script with natural teacher dialogue, podcast, or revision flow.',
    icon: <Headphones className="w-5 h-5" />,
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400',
  },
  {
    type: 'video',
    title: 'Video Storyboard',
    description: 'Instructional video scene sequence with narration, visual prompts, and timing.',
    icon: <Video className="w-5 h-5" />,
    color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400',
  },
  {
    type: 'presentation_designer',
    title: 'AI Presentation Designer',
    description: 'Custom pedagogical lesson plan tailored to duration, grade level, and visual style.',
    icon: <Palette className="w-5 h-5" />,
    color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/60 dark:text-cyan-400',
  },
  {
    type: 'topic_explanation',
    title: 'Topic Explanation',
    description: 'Crystal-clear pedagogical breakdown with real-world analogies and misconception fixes.',
    icon: <Lightbulb className="w-5 h-5" />,
    color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/60 dark:text-teal-400',
  },
];

export const CreateWithAIModal: React.FC<CreateWithAIModalProps> = ({
  isOpen,
  project,
  initialTask = 'mind_map',
  preselectedTaskType,
  onClose,
  onOutputGenerated,
  onGenerated,
}) => {
  const effectiveInitialTask = (preselectedTaskType as AITaskType) || initialTask;
  const [selectedTask, setSelectedTask] = useState<AITaskType>(effectiveInitialTask);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [selectAllSources, setSelectAllSources] = useState<boolean>(true);
  const [instructions, setInstructions] = useState<string>(project.teacherInstructions || '');
  const [language, setLanguage] = useState<SupportedLanguage>(project.language || 'en');

  // Task specific options
  const [quizCount, setQuizCount] = useState<number>(5);
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [slideCount, setSlideCount] = useState<number>(6);
  const [notesFormat, setNotesFormat] = useState<'summary' | 'detailed' | 'exam' | 'comprehensive'>('comprehensive');
  const [lessonDurationMinutes, setLessonDurationMinutes] = useState<number>(30);

  // Status & Progress State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [overwriteConfirmOpen, setOverwriteConfirmOpen] = useState<boolean>(false);

  // Initialize selected sources from project
  useEffect(() => {
    if (project.sources.length > 0) {
      // By default select all sources marked selectedForAI (or all if not specified)
      const aiSelected = project.sources
        .filter((s) => s.selectedForAI !== false)
        .map((s) => s.id);
      setSelectedSourceIds(aiSelected.length > 0 ? aiSelected : project.sources.map((s) => s.id));
    }
  }, [project.sources]);

  useEffect(() => {
    setSelectedTask(initialTask);
    setInstructions(project.teacherInstructions || '');
  }, [initialTask, project.teacherInstructions]);

  if (!isOpen) return null;

  const validSources = project.sources.filter((s) => s.status === 'ready' || (s.extractedText && s.extractedText.length > 0));

  const handleToggleSource = (id: string) => {
    if (selectedSourceIds.includes(id)) {
      const next = selectedSourceIds.filter((sId) => sId !== id);
      setSelectedSourceIds(next);
      setSelectAllSources(next.length === validSources.length);
    } else {
      const next = [...selectedSourceIds, id];
      setSelectedSourceIds(next);
      setSelectAllSources(next.length === validSources.length);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectAllSources) {
      setSelectedSourceIds([]);
      setSelectAllSources(false);
    } else {
      setSelectedSourceIds(validSources.map((s) => s.id));
      setSelectAllSources(true);
    }
  };

  // Check if output was previously modified by the teacher
  const existingOutput = (project.outputs as any)[selectedTask] as ProjectAIOutput | undefined;
  const hasTeacherEdits = Boolean(
    existingOutput &&
    existingOutput.status === 'edited' &&
    existingOutput.teacherEditedContent
  );

  const startGeneration = async () => {
    if (hasTeacherEdits && !overwriteConfirmOpen) {
      setOverwriteConfirmOpen(true);
      return;
    }
    setOverwriteConfirmOpen(false);
    setErrorMessage(null);
    setIsGenerating(true);

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setCurrentTaskId(taskId);

    setProgressMessage('Building grounded context package from sources...');

    const chosenSources = project.sources
      .filter((s) => selectedSourceIds.includes(s.id))
      .map((s) => ({
        sourceId: s.id,
        title: s.name,
        type: s.type,
        priority: s.priority || 'primary',
        segments: (s.segments || []).map((seg) => ({
          location: seg.location || 'Cited text',
          text: seg.text,
        })),
      }));

    const request: AITaskRequest = {
      taskId,
      projectId: project.id,
      projectName: project.name,
      taskType: selectedTask,
      teacherInstructions: instructions,
      outputLanguage: language,
      targetAudience: 'Students',
      classGrade: project.classGrade || 'Class 10',
      selectedSources: chosenSources,
      options: {
        quizCount,
        quizDifficulty,
        slideCount,
        notesFormat,
        lessonDurationMinutes,
      },
    };

    setTimeout(() => {
      setProgressMessage('Querying Gemini AI Engine for structured response...');
    }, 1200);

    setTimeout(() => {
      setProgressMessage('Validating schema and preserving source citations...');
    }, 3500);

    try {
      const result = await aiTaskService.executeTask(request);

      if (!result.success || !result.data) {
        setErrorMessage(result.error || 'Generation failed.');
        setIsGenerating(false);
        return;
      }

      setProgressMessage('Saving output to local project store...');

      const newOutput: ProjectAIOutput = {
        id: existingOutput?.id || `out_${selectedTask}_${Date.now()}`,
        type: selectedTask,
        title: AI_TASKS.find((t) => t.type === selectedTask)?.title || 'AI Output',
        status: 'completed',
        lastGeneratedAt: Date.now(),
        lastModifiedAt: Date.now(),
        targetLanguage: language,
        aiPromptInstructions: instructions,
        rawAiContent: result.data,
        teacherEditedContent: null,
        activeView: 'ai',
        versionHistory: [
          ...(existingOutput?.versionHistory || []),
          {
            versionId: `v_ai_${Date.now()}`,
            timestamp: Date.now(),
            author: 'ai',
            summaryOfChange: `AI generation completed with ${result.modelUsed || 'Gemini'}`,
          },
        ],
      };

      onOutputGenerated?.(selectedTask, newOutput);
      onGenerated?.(selectedTask);
      setIsGenerating(false);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during generation.');
      setIsGenerating(false);
    }
  };

  const handleCancelTask = () => {
    if (currentTaskId) {
      aiTaskService.cancelTask(currentTaskId);
      setIsGenerating(false);
      setProgressMessage('');
      setErrorMessage('Generation was cancelled by the teacher.');
    }
  };

  return (
    <div
      id="create-with-ai-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="create-with-ai-modal-container"
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Create with AI
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Part 03 Engine
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate strictly grounded teaching materials from your {validSources.length} learning source{validSources.length === 1 ? '' : 's'}.
              </p>
            </div>
          </div>
          <button
            id="btn-close-create-ai-modal"
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Overwrite Confirmation Dialog */}
          {overwriteConfirmOpen && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Replace your edited content?</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                You have previously modified this {selectedTask.replace('_', ' ')}. Regenerating with AI will create a new AI version, but your previous teacher version will remain archived in version history.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  id="btn-cancel-overwrite"
                  size="sm"
                  variant="outline"
                  onClick={() => setOverwriteConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  id="btn-confirm-replace-content"
                  size="sm"
                  variant="danger"
                  onClick={startGeneration}
                >
                  Replace & Regenerate
                </Button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2 text-xs">
                <p className="font-semibold text-rose-800 dark:text-rose-200">{errorMessage}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    id="btn-retry-generation"
                    size="sm"
                    variant="outline"
                    onClick={startGeneration}
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Retry
                  </Button>
                  <Button
                    id="btn-dismiss-error"
                    size="sm"
                    variant="ghost"
                    onClick={() => setErrorMessage(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Section A: Select AI Task */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
              1. Choose Output Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {AI_TASKS.map((t) => {
                const isSelected = selectedTask === t.type;
                return (
                  <button
                    key={t.type}
                    id={`btn-select-task-${t.type}`}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setSelectedTask(t.type)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-30 cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className={`p-2 rounded-lg ${t.color}`}>{t.icon}</div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {t.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                        {t.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section B: Select Sources */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                2. Select Grounding Sources ({selectedSourceIds.length}/{validSources.length} selected)
              </label>
              {validSources.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {selectAllSources ? 'Deselect All' : 'Select All Sources'}
                </button>
              )}
            </div>

            {validSources.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 space-y-1">
                <AlertCircle className="w-5 h-5 mx-auto text-amber-500" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  No processed learning sources available.
                </p>
                <p>Add and extract at least 1 PDF, YouTube link, slide deck, or note first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {validSources.map((source) => {
                  const isChecked = selectedSourceIds.includes(source.id);
                  const isPrimary = source.priority === 'primary';
                  return (
                    <label
                      key={source.id}
                      id={`source-select-${source.id}`}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSource(source.id)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <div className="truncate">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                            {source.name}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                            {source.type} • {source.segments?.length || 0} citations • {source.wordCount || 0} words
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                          isPrimary
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isPrimary ? 'Primary' : 'Supporting'}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section C: Teacher Instructions & Language */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                3. Teacher Instructions / Pedagogical Directives
              </label>
              <textarea
                id="ai-teacher-instructions-input"
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder='e.g. "Explain this chapter for Class 10 students in simple Hindi with focus on board exam questions."'
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'Explain in simple Hindi for Class 10',
                  'Make exam-focused points & definitions',
                  'Create an interactive 30-min class flow',
                  'Focus on real-world analogies',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setInstructions(chip)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                4. Output Language
              </label>
              <div className="space-y-1">
                <select
                  id="select-ai-output-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label} ({l.nativeLabel})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 leading-tight pt-1">
                  Source text remains in its original language while AI translates and adapts the explanation faithfully.
                </p>
              </div>

              {/* Task specific settings */}
              {selectedTask === 'quiz' && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    Questions Count & Difficulty
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={quizCount}
                      onChange={(e) => setQuizCount(Number(e.target.value))}
                      className="w-1/2 text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value={3}>3 Questions</option>
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                    </select>
                    <select
                      value={quizDifficulty}
                      onChange={(e) => setQuizDifficulty(e.target.value as any)}
                      className="w-1/2 text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
              )}

              {(selectedTask === 'slides' || selectedTask === 'presentation_designer') && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    Slide Deck Size
                  </label>
                  <select
                    value={slideCount}
                    onChange={(e) => setSlideCount(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value={5}>5 Slides (Quick summary)</option>
                    <option value={8}>8 Slides (Standard class)</option>
                    <option value={12}>12 Slides (In-depth lesson)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Indeterminate Progress Bar during Generation */}
          {isGenerating && (
            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Generating Grounded Teaching Material...
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCancelTask}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Indeterminate Animated Strip */}
              <div className="w-full h-1.5 bg-indigo-200 dark:bg-indigo-900 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full animate-pulse w-3/4" />
              </div>

              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 italic">
                {progressMessage}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {selectedSourceIds.length} source{selectedSourceIds.length === 1 ? '' : 's'} grounded • Non-destructive
          </div>
          <div className="flex items-center gap-3">
            <Button
              id="btn-cancel-create-ai"
              variant="outline"
              size="sm"
              disabled={isGenerating}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              id="btn-submit-generate-ai"
              variant="primary"
              size="sm"
              disabled={isGenerating || selectedSourceIds.length === 0}
              isLoading={isGenerating}
              onClick={startGeneration}
              icon={<Sparkles className="w-4 h-4" />}
            >
              Generate {AI_TASKS.find((t) => t.type === selectedTask)?.title}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
