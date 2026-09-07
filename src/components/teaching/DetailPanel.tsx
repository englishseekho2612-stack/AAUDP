import React, { useState } from 'react';
import { MindMapNode, MindMapNodeType } from '../../types/ai';
import { TeacherNoteEntry } from '../../types/teaching';
import {
  X,
  Sparkles,
  HelpCircle,
  Lightbulb,
  FileQuestion,
  Bookmark,
  BookOpen,
  Volume2,
  CheckCircle2,
  ExternalLink,
  Edit3,
  Check,
  Plus,
  Send,
  Trash2,
  Tag,
  Star,
} from 'lucide-react';
import { defaultGeminiProvider } from '../../services/ai/geminiProvider';
import { extractJsonFromText } from '../../services/ai/aiOutputValidators';

interface DetailPanelProps {
  node: MindMapNode | null;
  onClose: () => void;
  onSaveTeacherNote: (note: TeacherNoteEntry) => void;
  existingTeacherNote?: TeacherNoteEntry;
  onInsertToWhiteboard?: (text: string) => void;
  onSendToClassroom?: (questionText: string) => void;
  onUpdateNode?: (updatedNode: MindMapNode) => void;
  onAddChildNodes?: (parentId: string, newNodes: MindMapNode[]) => void;
}

const ALL_NODE_TYPES: MindMapNodeType[] = [
  'ROOT',
  'CONCEPT',
  'SUBTOPIC',
  'DEFINITION',
  'EXAMPLE',
  'PROCESS',
  'COMPARISON',
  'IMPORTANT POINT',
  'QUESTION',
  'FORMULA',
  'SUMMARY',
];

export const DetailPanel: React.FC<DetailPanelProps> = ({
  node,
  onClose,
  onSaveTeacherNote,
  existingTeacherNote,
  onInsertToWhiteboard,
  onSendToClassroom,
  onUpdateNode,
  onAddChildNodes,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'ai_actions' | 'notes' | 'edit'>('content');
  const [noteContent, setNoteContent] = useState(existingTeacherNote?.content || '');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResultTitle, setAiResultTitle] = useState('');
  const [aiResultText, setAiResultText] = useState('');
  const [speaking, setSpeaking] = useState(false);

  // Edit State
  const [editTitle, setEditTitle] = useState(node?.title || '');
  const [editShortDesc, setEditShortDesc] = useState(node?.shortDescription || '');
  const [editDetailedDesc, setEditDetailedDesc] = useState(node?.detailedExplanation || '');
  const [editNodeType, setEditNodeType] = useState<MindMapNodeType>(node?.nodeType || 'CONCEPT');
  const [editExamFocus, setEditExamFocus] = useState(Boolean(node?.isExamFocus));

  // Expand with AI preview state
  const [suggestedChildren, setSuggestedChildren] = useState<
    Array<{ title: string; shortDescription: string; nodeType: MindMapNodeType; selected: boolean }>
  >([]);

  // Update edit state whenever node changes
  React.useEffect(() => {
    if (node) {
      setEditTitle(node.title);
      setEditShortDesc(node.shortDescription);
      setEditDetailedDesc(node.detailedExplanation);
      setEditNodeType(node.nodeType || 'CONCEPT');
      setEditExamFocus(Boolean(node.isExamFocus));
      setNoteContent(existingTeacherNote?.content || node.teacherNotes || '');
      setSuggestedChildren([]);
    }
  }, [node, existingTeacherNote]);

  if (!node) {
    return (
      <aside
        id="detail-panel-empty"
        aria-label="Detail Panel"
        className="w-80 lg:w-96 bg-slate-900 border-l border-slate-800 p-6 flex flex-col items-center justify-center text-center text-slate-400 shrink-0 select-none"
      >
        <BookOpen className="w-8 h-8 mb-2 text-slate-700" />
        <p className="text-sm font-semibold text-slate-300">No Topic Selected</p>
        <p className="text-xs mt-1 text-slate-500">
          Click any concept in the Mind Map or Visual Tree to view explanation, examples, questions & AI actions.
        </p>
      </aside>
    );
  }

  // Text to speech
  const handleReadAloud = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const text = `${node.title}. ${node.shortDescription}. ${node.detailedExplanation}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // AI-assisted actions
  const handleAIAction = async (
    actionType: 'explain_more' | 'simplify' | 'example' | 'question' | 'quiz' | 'expand_with_ai'
  ) => {
    setAiGenerating(true);
    setActiveTab('ai_actions');
    setSuggestedChildren([]);

    let prompt = '';
    let actionTitle = '';

    if (actionType === 'explain_more') {
      actionTitle = 'Deep Dive Explanation';
      prompt = `Provide a clear, engaging, classroom-ready explanation of "${node.title}" for students.
Context: ${node.shortDescription}. ${node.detailedExplanation}.
Format with 2-3 clear paragraphs and bold key conceptual takeaways.`;
    } else if (actionType === 'simplify') {
      actionTitle = 'Simplified Layman Explanation';
      prompt = `Explain "${node.title}" in ultra-simple, intuitive language with an everyday analogy for a beginner student.
Context: ${node.shortDescription}.`;
    } else if (actionType === 'example') {
      actionTitle = 'Classroom Real-World Analogy & Example';
      prompt = `Give 2 vivid, intuitive real-world examples or analogies to help students understand "${node.title}".
Context: ${node.shortDescription}.`;
    } else if (actionType === 'question') {
      actionTitle = 'Checkpoint Question & Model Answer';
      prompt = `Generate a high-yield conceptual question to test student understanding of "${node.title}". Include the Model Teacher Answer and common student misconceptions.`;
    } else if (actionType === 'quiz') {
      actionTitle = '3-Question Rapid Checkpoint Quiz';
      prompt = `Create 3 multiple-choice questions with 4 options (A, B, C, D) and clear answer explanations testing "${node.title}".`;
    } else if (actionType === 'expand_with_ai') {
      actionTitle = 'AI Branch Expansion Suggestions';
      prompt = `For the academic concept "${node.title}" (Context: ${node.shortDescription}), suggest 3 to 4 logical subtopics, definitions, or examples that should branch off it.
Output strictly JSON in this schema:
[
  { "title": "Subtopic title", "shortDescription": "1-sentence summary", "nodeType": "SUBTOPIC" | "DEFINITION" | "EXAMPLE" | "PROCESS" | "FORMULA" }
]`;
    }

    setAiResultTitle(actionTitle);

    try {
      const res = await defaultGeminiProvider.generate({
        prompt,
        systemInstruction:
          'You are an expert master educator providing concise, pedagogically clear teaching material grounded in the curriculum.',
      });

      if (actionType === 'expand_with_ai' && res.text) {
        try {
          const parsed = extractJsonFromText(res.text) as any[];
          if (Array.isArray(parsed)) {
            setSuggestedChildren(
              parsed.map((item) => ({
                title: String(item.title || 'New Subtopic'),
                shortDescription: String(item.shortDescription || ''),
                nodeType: (item.nodeType as MindMapNodeType) || 'SUBTOPIC',
                selected: true,
              }))
            );
            setAiResultText('Review the suggested subtopics below and click Add to append to this branch:');
          } else {
            setAiResultText(res.text);
          }
        } catch {
          setAiResultText(res.text);
        }
      } else {
        setAiResultText(res.text || `Content generated for ${node.title}`);
      }
    } catch (err) {
      setAiResultText(`Explanation summary:\n${node.detailedExplanation}`);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleApplySuggestedChildren = () => {
    if (!onAddChildNodes) return;
    const toAdd = suggestedChildren
      .filter((s) => s.selected)
      .map((s) => ({
        id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        parentId: node.id,
        title: s.title,
        shortDescription: s.shortDescription,
        detailedExplanation: s.shortDescription,
        nodeType: s.nodeType,
        keyPoints: [],
        examples: [],
        questions: [],
        sourceReferences: [],
        isExpanded: true,
        children: [],
      }));

    if (toAdd.length > 0) {
      onAddChildNodes(node.id, toAdd);
      setSuggestedChildren([]);
      setAiResultText(`Successfully appended ${toAdd.length} subtopics to "${node.title}".`);
    }
  };

  const handleSaveEdit = () => {
    if (!onUpdateNode) return;
    onUpdateNode({
      ...node,
      title: editTitle.trim() || node.title,
      shortDescription: editShortDesc.trim(),
      detailedExplanation: editDetailedDesc.trim(),
      nodeType: editNodeType,
      isExamFocus: editExamFocus,
    });
    setActiveTab('content');
  };

  const handleSaveNote = () => {
    onSaveTeacherNote({
      targetId: `node_${node.id}`,
      targetType: 'mind_map_node',
      title: node.title,
      content: noteContent,
      isPrivate: true,
      updatedAt: Date.now(),
    });
  };

  return (
    <aside
      id="teaching-detail-panel"
      aria-label="Topic Detail Panel"
      className="w-80 lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full shrink-0 select-none z-20 shadow-xl"
    >
      {/* 1. HEADER */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-950/60">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-950/80 border border-indigo-800 text-indigo-400">
              {node.nodeType || 'CONCEPT'}
            </span>
            {node.isExamFocus && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-950 text-rose-300 border border-rose-800">
                Exam Focus
              </span>
            )}
          </div>
          <h3 className="text-sm font-extrabold text-slate-100 truncate mt-1">
            {node.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. TABS */}
      <div className="flex items-center border-b border-slate-800 bg-slate-900 px-2 pt-1 gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('content')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
            activeTab === 'content'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('ai_actions')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
            activeTab === 'ai_actions'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Actions
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
            activeTab === 'edit'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
            activeTab === 'notes'
              ? 'border-amber-500 text-amber-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          Notes
        </button>
      </div>

      {/* 3. QUICK ACTION BUTTONS */}
      <div className="p-2 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between gap-1 shrink-0 flex-wrap">
        <button
          onClick={handleReadAloud}
          title="Read explanation aloud (TTS)"
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
            speaking
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Volume2 className="w-3 h-3" />
          <span>{speaking ? 'Stop' : 'Listen'}</span>
        </button>

        <button
          onClick={() => handleAIAction('explain_more')}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 cursor-pointer"
        >
          <Sparkles className="w-3 h-3" />
          <span>Explain</span>
        </button>

        <button
          onClick={() => handleAIAction('simplify')}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-teal-950/60 text-teal-300 border border-teal-800 hover:bg-teal-900 cursor-pointer"
        >
          <span>Simplify</span>
        </button>

        <button
          onClick={() => handleAIAction('example')}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 cursor-pointer"
        >
          <Lightbulb className="w-3 h-3" />
          <span>Example</span>
        </button>

        <button
          onClick={() => handleAIAction('quiz')}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-800 hover:bg-rose-900 cursor-pointer"
        >
          <FileQuestion className="w-3 h-3" />
          <span>Quiz</span>
        </button>

        <button
          onClick={() => handleAIAction('expand_with_ai')}
          title="Ask AI to suggest branches"
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800 hover:bg-purple-900 cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Expand AI</span>
        </button>
      </div>

      {/* 4. MAIN TAB CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {activeTab === 'content' && (
          <div className="space-y-4">
            {/* Short Explanation */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Overview
              </span>
              <p className="text-slate-200 leading-relaxed font-medium">
                {node.shortDescription}
              </p>
            </div>

            {/* Detailed Explanation */}
            {node.detailedExplanation && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Detailed Explanation
                </span>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                  {node.detailedExplanation}
                </p>
              </div>
            )}

            {/* Key Points */}
            {node.keyPoints?.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Important Points
                </span>
                <ul className="space-y-1.5">
                  {node.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Examples */}
            {node.examples?.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Classroom Examples
                </span>
                <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-xl p-3 space-y-1.5 text-emerald-200">
                  {node.examples.map((ex, idx) => (
                    <p key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">💡</span>
                      <span>{ex}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Checkpoint Questions */}
            {node.questions?.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Checkpoint Questions
                </span>
                <div className="bg-purple-950/30 border border-purple-800/60 rounded-xl p-3 space-y-1.5 text-purple-200">
                  {node.questions.map((q, idx) => (
                    <p key={idx} className="flex items-start gap-2">
                      <span className="text-purple-400 font-bold">❓</span>
                      <span>{q}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Source Grounding */}
            {node.sourceReferences?.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Source Grounding
                </span>
                {node.sourceReferences.map((ref, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-850 px-2.5 py-1.5 rounded-lg border border-slate-800 mb-1"
                  >
                    <span>📍</span>
                    <strong className="text-slate-100">{ref.sourceName}</strong>
                    <span className="text-slate-400">({ref.location})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Tab */}
        {activeTab === 'edit' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Node Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Node Type
              </label>
              <select
                value={editNodeType}
                onChange={(e) => setEditNodeType(e.target.value as MindMapNodeType)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs cursor-pointer"
              >
                {ALL_NODE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Short Overview
              </label>
              <textarea
                value={editShortDesc}
                onChange={(e) => setEditShortDesc(e.target.value)}
                rows={2}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Detailed Explanation
              </label>
              <textarea
                value={editDetailedDesc}
                onChange={(e) => setEditDetailedDesc(e.target.value)}
                rows={4}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="check-exam-focus"
                checked={editExamFocus}
                onChange={(e) => setEditExamFocus(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="check-exam-focus" className="text-xs text-slate-300 font-semibold cursor-pointer">
                Mark as Exam Focus Topic ⭐
              </label>
            </div>

            <button
              onClick={handleSaveEdit}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors cursor-pointer mt-2"
            >
              Save Changes
            </button>
          </div>
        )}

        {/* AI Actions Tab */}
        {activeTab === 'ai_actions' && (
          <div className="space-y-3">
            {aiGenerating ? (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
                <Sparkles className="w-6 h-6 text-indigo-400 animate-spin" />
                <p className="font-semibold text-slate-200">
                  Generating {aiResultTitle}...
                </p>
                <p className="text-[11px] text-slate-500">
                  Grounding response in curriculum sources
                </p>
              </div>
            ) : aiResultText ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-100">{aiResultTitle}</h4>
                  <div className="flex items-center gap-2">
                    {onInsertToWhiteboard && (
                      <button
                        onClick={() => onInsertToWhiteboard(aiResultText)}
                        className="text-[11px] font-semibold text-indigo-400 hover:underline cursor-pointer"
                      >
                        + Canvas
                      </button>
                    )}
                    {onSendToClassroom && (
                      <button
                        onClick={() => onSendToClassroom(aiResultText)}
                        className="text-[11px] font-semibold text-emerald-400 hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <Send className="w-2.5 h-2.5" />
                        Classroom
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700 leading-relaxed whitespace-pre-line text-slate-200">
                  {aiResultText}
                </div>

                {/* Suggested children picker */}
                {suggestedChildren.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[11px] font-bold text-slate-300">
                      Select branches to append:
                    </span>
                    {suggestedChildren.map((s, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          const copy = [...suggestedChildren];
                          copy[idx].selected = !copy[idx].selected;
                          setSuggestedChildren(copy);
                        }}
                        className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          s.selected
                            ? 'bg-indigo-950/60 border-indigo-500 text-white'
                            : 'bg-slate-850 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{s.title}</span>
                          <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-slate-800 text-indigo-400">
                            {s.nodeType}
                          </span>
                        </div>
                        {s.shortDescription && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{s.shortDescription}</p>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={handleApplySuggestedChildren}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Append Selected to Tree
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-indigo-400" />
                <p className="font-semibold text-slate-200">AI Teaching Generator</p>
                <p className="text-[11px] text-slate-400">
                  Choose an action above (Explain, Simplify, Example, Quiz, Expand AI) to generate instant educational content.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Private Teacher Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Private Note for "{node.title}"
              </span>
              <span className="text-[10px] text-slate-500">Teacher only</span>
            </div>

            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Jot down private lesson notes, reminders, or questions to address in class..."
              rows={8}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
            />

            <button
              onClick={handleSaveNote}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors cursor-pointer"
            >
              Save Private Note
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
