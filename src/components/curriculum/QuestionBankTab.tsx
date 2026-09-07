import React, { useState, useEffect } from 'react';
import {
  QuestionBankItem,
  QuestionType,
  QuestionDifficulty,
  Assignment,
  AssessmentPlan,
  Course,
} from '../../types/curriculum';
import { curriculumDatabase } from '../../storage/curriculumDatabase';
import { curriculumAIService } from '../../services/ai/curriculumAIService';
import {
  HelpCircle,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Edit2,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  Calendar,
  X,
  Loader2,
} from 'lucide-react';

interface QuestionBankTabProps {
  course: Course;
}

export const QuestionBankTab: React.FC<QuestionBankTabProps> = ({ course }) => {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assessments, setAssessments] = useState<AssessmentPlan[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'questions' | 'assessments' | 'assignments'>('questions');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Question editing modal state
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null);
  const [showNewQuestionModal, setShowNewQuestionModal] = useState(false);

  // AI Assistant Modal state
  const [showAIAssistantModal, setShowAIAssistantModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('Light Reactions & Photolysis');
  const [aiCount, setAiCount] = useState(3);
  const [aiDifficulty, setAiDifficulty] = useState<QuestionDifficulty>('medium');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDrafts, setAiDrafts] = useState<any[]>([]);

  // Assessment plan modal state
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [newAssessmentTitle, setNewAssessmentTitle] = useState('');
  const [newAssessmentDuration, setNewAssessmentDuration] = useState(45);
  const [newAssessmentMarks, setNewAssessmentMarks] = useState(25);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Load data
  useEffect(() => {
    loadData();
  }, [course.id]);

  const loadData = async () => {
    const qList = await curriculumDatabase.getAllQuestions();
    const aList = await curriculumDatabase.getAllAssignments();
    const planList = await curriculumDatabase.getAllAssessmentPlans();
    setQuestions(qList);
    setAssignments(aList);
    setAssessments(planList);
  };

  const handleSaveQuestion = async (q: QuestionBankItem) => {
    await curriculumDatabase.saveQuestion(q);
    await loadData();
    setShowNewQuestionModal(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = async (id: string) => {
    await curriculumDatabase.deleteQuestion(id);
    await loadData();
  };

  // Trigger AI Question Generation
  const handleAIGenerate = async () => {
    setAiLoading(true);
    setAiDrafts([]);
    try {
      const drafts = await curriculumAIService.generateQuestionBankItems({
        topic: aiTopic,
        chapter: course.subject,
        subject: course.subject,
        count: aiCount,
        types: ['mcq', 'conceptual', 'short_answer'],
        difficulty: aiDifficulty,
        sourceReference: `Course: ${course.name}`,
      });
      setAiDrafts(drafts);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcceptAIDraft = async (draft: any) => {
    const newItem: QuestionBankItem = {
      id: `qb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      subjectId: course.subjects?.[0]?.id || 'subj_default',
      topicId: aiTopic,
      sourceAttribution: aiTopic,
      type: draft.type,
      questionText: draft.questionText,
      options: draft.options,
      correctOptionIndex: draft.correctOptionIndex,
      marks: draft.marks || 1,
      difficulty: draft.difficulty || 'medium',
      tags: draft.tags || ['Important'],
      answerKey: draft.answerKey,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
    };
    await curriculumDatabase.saveQuestion(newItem);
    setAiDrafts((prev) => prev.filter((d) => d !== draft));
    await loadData();
  };

  // Create assessment plan
  const handleCreateAssessment = async () => {
    if (!newAssessmentTitle.trim()) return;
    const plan: AssessmentPlan = {
      id: `asmt_${Date.now()}`,
      courseId: course.id,
      subjectId: course.subjects?.[0]?.id || 'subj_default',
      type: 'unit_test',
      title: newAssessmentTitle.trim(),
      targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      durationMinutes: newAssessmentDuration,
      totalMarks: newAssessmentMarks,
      chapterIds: [],
      questionIds: selectedQuestionIds,
      status: 'ready',
    };
    await curriculumDatabase.saveAssessmentPlan(plan);
    await loadData();
    setShowAssessmentModal(false);
    setNewAssessmentTitle('');
    setSelectedQuestionIds([]);
  };

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    const matchDiff = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
    const matchType = selectedType === 'all' || q.type === selectedType;
    const matchQuery =
      !searchQuery.trim() ||
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.topicId || q.sourceAttribution || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchDiff && matchType && matchQuery;
  });

  return (
    <div className="space-y-4">
      {/* Sub-Tabs: Questions / Assessments / Assignments */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {[
            { id: 'questions', label: `Question Bank (${questions.length})`, icon: HelpCircle },
            { id: 'assessments', label: `Assessment Plans (${assessments.length})`, icon: FileCheck },
            { id: 'assignments', label: `Assignments (${assignments.length})`, icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'questions' && (
            <>
              <button
                onClick={() => setShowAIAssistantModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100"
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Question Author
              </button>
              <button
                onClick={() => {
                  setEditingQuestion(null);
                  setShowNewQuestionModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Question
              </button>
            </>
          )}

          {activeSubTab === 'assessments' && (
            <button
              onClick={() => setShowAssessmentModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Plan Assessment
            </button>
          )}
        </div>
      </div>

      {/* QUESTIONS SUB-TAB */}
      {activeSubTab === 'questions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions by text or topic..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="advanced">Advanced</option>
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Types</option>
                <option value="mcq">MCQ</option>
                <option value="short_answer">Short Answer</option>
                <option value="long_answer">Long Answer</option>
                <option value="conceptual">Conceptual</option>
              </select>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-3">
            {filteredQuestions.length === 0 && (
              <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-xs text-slate-500">
                No questions match your criteria. Use "Add Question" or "AI Question Author" to populate the repository.
              </div>
            )}

            {filteredQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      {q.type.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                        q.difficulty === 'hard' || q.difficulty === 'advanced'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                      }`}
                    >
                      {q.difficulty}
                    </span>
                    <span className="text-xs text-slate-500">• {q.marks} Mark(s)</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingQuestion(q);
                        setShowNewQuestionModal(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Q{idx + 1}. {q.questionText}
                </div>

                {/* MCQ Options */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`px-3 py-1.5 text-xs rounded-lg border ${
                          q.correctOptionIndex === oIdx
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}. {opt}
                        {q.correctOptionIndex === oIdx && ' (Correct Answer)'}
                      </div>
                    ))}
                  </div>
                )}

                {/* Answer Key & Explanation */}
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Answer Key: </span>
                    {q.answerKey.correctAnswer}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Explanation: </span>
                    {q.answerKey.explanation}
                  </div>
                  {q.answerKey.markingGuidance && (
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Marking Guidance: </span>
                      {q.answerKey.markingGuidance}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ASSESSMENTS SUB-TAB */}
      {activeSubTab === 'assessments' && (
        <div className="space-y-3">
          {assessments.map((asmt) => (
            <div
              key={asmt.id}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                    {asmt.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {asmt.title}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {asmt.durationMinutes} mins
                  </span>
                  <span>•</span>
                  <span>{asmt.totalMarks} Marks</span>
                  <span>•</span>
                  <span>{asmt.questionIds.length} Linked Questions</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Target: {asmt.targetDate}
                  </span>
                </div>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Ready to Deliver
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ASSIGNMENTS SUB-TAB */}
      {activeSubTab === 'assignments' && (
        <div className="space-y-3">
          {assignments.map((asgn) => (
            <div
              key={asgn.id}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {asgn.title}
                </h4>
                <span className="text-xs font-medium text-slate-500">
                  Due: {asgn.dueDate || 'Open'} • {asgn.totalMarks} Marks
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">{asgn.instructions}</p>
              {asgn.rubric && asgn.rubric.length > 0 && (
                <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2 rounded border border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Marking Rubric: </span>
                  {asgn.rubric.map((r, i) => (
                    <span key={i} className="mr-2">
                      {r.criteria} ({r.maxMarks}m)
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AI Question Author Modal */}
      {showAIAssistantModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-2xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  AI Question Bank Assistant
                </h4>
              </div>
              <button
                onClick={() => setShowAIAssistantModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Generate curriculum-aligned exam and concept questions with step-by-step answer keys and marking guidance. Teacher review is required before saving to the question bank.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Topic or Concept
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Difficulty
                </label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value as QuestionDifficulty)}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleAIGenerate}
              disabled={aiLoading || !aiTopic.trim()}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating Questions...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate Question Drafts
                </>
              )}
            </button>

            {/* Generated drafts */}
            {aiDrafts.length > 0 && (
              <div className="space-y-3 pt-2 max-h-80 overflow-y-auto pr-1">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Generated Drafts ({aiDrafts.length}):
                </div>
                {aiDrafts.map((d, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-purple-200 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/20 space-y-2 text-xs"
                  >
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {d.questionText}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="font-semibold">Answer:</span> {d.answerKey?.correctAnswer}
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleAcceptAIDraft(d)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept & Save to Bank
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plan Assessment Modal */}
      {showAssessmentModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Plan New Academic Assessment
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Assessment Title
                </label>
                <input
                  type="text"
                  value={newAssessmentTitle}
                  onChange={(e) => setNewAssessmentTitle(e.target.value)}
                  placeholder="e.g. Unit 1 Mid-Term Test"
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    value={newAssessmentDuration}
                    onChange={(e) => setNewAssessmentDuration(parseInt(e.target.value) || 45)}
                    className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={newAssessmentMarks}
                    onChange={(e) => setNewAssessmentMarks(parseInt(e.target.value) || 25)}
                    className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAssessmentModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAssessment}
                disabled={!newAssessmentTitle.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded text-xs font-semibold"
              >
                Save Assessment Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
