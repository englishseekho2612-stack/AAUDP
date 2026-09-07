import React, { useState, useEffect } from 'react';
import { CurriculumLesson } from '../../types/curriculum';
import { StudentProfile, StudentLessonProgress } from '../../types/studentPortal';
import { studentPortalService } from '../../services/studentPortalService';
import {
  X,
  Presentation,
  GitFork,
  FileText,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  Lock,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  MessageSquare,
  BookOpen,
} from 'lucide-react';

interface StudentLessonViewerModalProps {
  lesson: CurriculumLesson;
  courseId: string;
  student: StudentProfile;
  onClose: () => void;
  onLessonUpdated?: () => void;
}

// Sample published student slides for immediate interactive presentation
const SAMPLE_SLIDES = [
  {
    title: 'Photosynthesis: The Engine of Life',
    subtitle: 'Dual phases of energy transduction in autotrophs',
    points: [
      'Solar electromagnetic radiation is converted into chemical bond energy.',
      'Equation: 6CO₂ + 6H₂O + photons → C₆H₁₂O₆ + 6O₂.',
      'Chloroplast anatomy: outer membrane, thylakoid discs, granum stacks, and stroma fluid.',
    ],
  },
  {
    title: 'Phase 1: Light-Dependent Reactions (Thylakoid)',
    subtitle: 'Photolysis of water & generation of ATP / NADPH',
    points: [
      'Photons excite reaction center chlorophyll P680 in Photosystem II.',
      'Water molecule photolysis: 2H₂O → 4H⁺ + 4e⁻ + O₂↑.',
      'Proton gradient drives ATP synthase; terminal electron acceptor NADP⁺ reduces to NADPH.',
    ],
  },
  {
    title: 'Phase 2: Light-Independent Reactions (Calvin Cycle)',
    subtitle: 'Daylight carbon fixation in the stroma',
    points: [
      'Enzyme RuBisCO catalyzes the carboxylation of ribulose-1,5-bisphosphate (RuBP).',
      'Requires 18 ATP and 12 NADPH per synthesized glucose molecule.',
      'Occurs during daytime when ATP/NADPH from light reactions are abundant.',
    ],
  },
  {
    title: 'Factors Limiting Photosynthetic Rate',
    subtitle: 'Blackman’s Principle of Limiting Factors',
    points: [
      'Light intensity: saturation point reached when chlorophyll reaction centers are fully excited.',
      'Carbon dioxide concentration: major rate-limiting factor under high ambient light.',
      'Temperature: optimal between 25°C–35°C; extreme heat denatures RuBisCO enzymes.',
    ],
  },
];

// Sample clean student mind map tree (teacher private notes strictly removed!)
const SAMPLE_MIND_MAP_NODES = [
  {
    id: 'root',
    title: 'Photosynthesis Mechanism',
    category: 'Core Process',
    children: ['light_rxn', 'calvin_cycle', 'limiting_factors'],
  },
  {
    id: 'light_rxn',
    title: '1. Light-Dependent Reactions',
    category: 'Thylakoid Membrane',
    children: ['psii_photolysis', 'atp_synthase'],
  },
  {
    id: 'psii_photolysis',
    title: 'Photolysis of H₂O',
    category: 'Oxygen Evolution (O₂)',
    children: [],
  },
  {
    id: 'atp_synthase',
    title: 'Chemiosmotic ATP & NADPH',
    category: 'Energy Carriers',
    children: [],
  },
  {
    id: 'calvin_cycle',
    title: '2. Light-Independent Calvin Cycle',
    category: 'Stroma Matrix',
    children: ['rubisco_fixation', 'glucose_synthesis'],
  },
  {
    id: 'rubisco_fixation',
    title: 'RuBisCO Enzyme Fixation',
    category: 'Carbon Capture',
    children: [],
  },
  {
    id: 'glucose_synthesis',
    title: 'Triose Phosphate to Glucose',
    category: 'Carbohydrate Storage',
    children: [],
  },
  {
    id: 'limiting_factors',
    title: '3. Limiting Environmental Factors',
    category: 'Physiological Rates',
    children: ['co2_conc', 'temp_enzymes'],
  },
  {
    id: 'co2_conc',
    title: 'CO₂ Saturation Curve',
    category: 'Atmospheric Factor',
    children: [],
  },
  {
    id: 'temp_enzymes',
    title: 'Temperature & Enzyme Kinetics',
    category: 'Kinetic Optimum (30°C)',
    children: [],
  },
];

export const StudentLessonViewerModal: React.FC<StudentLessonViewerModalProps> = ({
  lesson,
  courseId,
  student,
  onClose,
  onLessonUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'slides' | 'mindmap' | 'notes' | 'ask_teacher'>(
    'slides'
  );
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState<StudentLessonProgress | null>(null);

  // Mind map zoom & expanded state
  const [mindMapZoom, setMindMapZoom] = useState(1);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    root: true,
    light_rxn: true,
    calvin_cycle: true,
    limiting_factors: true,
  });

  // Direct Teacher Question form
  const [questionText, setQuestionText] = useState('');
  const [questionSent, setQuestionSent] = useState(false);

  // AI Hint Drawer state
  const [showAiHintDrawer, setShowAiHintDrawer] = useState(false);
  const [hintPrompt, setHintPrompt] = useState('');
  const [hintResponse, setHintResponse] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);

  useEffect(() => {
    loadProgress();
    // Track access and initial slide
    studentPortalService.recordLessonInteraction(student.id, courseId, lesson.id, {
      slideIndex: 0,
      timeSpentDeltaSeconds: 10,
    });
  }, [lesson.id]);

  const loadProgress = async () => {
    const p = await studentPortalService.getLessonProgress(student.id, lesson.id);
    setProgress(p);
  };

  const handleSlideChange = (newIndex: number) => {
    setCurrentSlideIndex(newIndex);
    studentPortalService.recordLessonInteraction(student.id, courseId, lesson.id, {
      slideIndex: newIndex,
      timeSpentDeltaSeconds: 15,
    });
    loadProgress();
  };

  const handleNotesRead = () => {
    studentPortalService.recordLessonInteraction(student.id, courseId, lesson.id, {
      notesRead: true,
      timeSpentDeltaSeconds: 30,
    });
    loadProgress();
  };

  const handleMindMapExplored = () => {
    studentPortalService.recordLessonInteraction(student.id, courseId, lesson.id, {
      mindMapExplored: true,
      timeSpentDeltaSeconds: 20,
    });
    loadProgress();
  };

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    await studentPortalService.askTeacherQuestion({
      studentId: student.id,
      studentName: student.displayName,
      courseId,
      lessonId: lesson.id,
      topicTitle: lesson.title,
      question: questionText.trim(),
    });
    setQuestionSent(true);
    setQuestionText('');
  };

  const handleRequestAiHint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hintPrompt.trim()) return;
    setIsHintLoading(true);
    setHintResponse(null);
    const res = await studentPortalService.requestAiHint({
      question: hintPrompt.trim(),
      context: lesson.title + ': ' + lesson.objectives.join('; '),
      studentName: student.displayName,
    });
    setIsHintLoading(false);
    if (res.success && res.hint) {
      setHintResponse(res.hint);
    } else {
      setHintResponse(res.error || 'AI hints are currently disabled by your teacher.');
    }
  };

  const isCompleted = progress?.status === 'completed';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                  Lesson
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {isCompleted ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate max-w-md sm:max-w-xl">
                {lesson.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAiHintDrawer(!showAiHintDrawer)}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-purple-200 dark:border-purple-800"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Ask AI for a Hint</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto py-2">
            <button
              onClick={() => setActiveTab('slides')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'slides'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Presentation className="w-4 h-4" />
              <span>Slides Presentation</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('mindmap');
                handleMindMapExplored();
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'mindmap'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <GitFork className="w-4 h-4" />
              <span>Interactive Mind Map</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('notes');
                handleNotesRead();
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'notes'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Lecture Notes</span>
            </button>

            <button
              onClick={() => setActiveTab('ask_teacher')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'ask_teacher'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask Teacher Privately</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5 text-blue-500" />
            <span>Student View Mode (Teacher notes hidden)</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60 dark:bg-slate-900/60 relative">
          {/* TAB 1: PRESENTATION SLIDES */}
          {activeTab === 'slides' && (
            <div className="h-full flex flex-col items-center justify-between gap-4 max-w-4xl mx-auto">
              <div className="w-full flex-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                    <span>
                      Slide {currentSlideIndex + 1} of {SAMPLE_SLIDES.length}
                    </span>
                    <span>{lesson.title}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {SAMPLE_SLIDES[currentSlideIndex].title}
                  </h3>

                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {SAMPLE_SLIDES[currentSlideIndex].subtitle}
                  </p>

                  <ul className="space-y-3 pt-4">
                    {SAMPLE_SLIDES[currentSlideIndex].points.map((pt, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                      >
                        <span className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Class 10 Biology Masterclass</span>
                  <span>Dr. Sarah Jenkins</span>
                </div>
              </div>

              {/* Slide Controls */}
              <div className="flex items-center gap-4 bg-white dark:bg-slate-850 px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <button
                  disabled={currentSlideIndex === 0}
                  onClick={() => handleSlideChange(currentSlideIndex - 1)}
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                  {currentSlideIndex + 1} / {SAMPLE_SLIDES.length}
                </span>

                <button
                  disabled={currentSlideIndex === SAMPLE_SLIDES.length - 1}
                  onClick={() => handleSlideChange(currentSlideIndex + 1)}
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE MIND MAP */}
          {activeTab === 'mindmap' && (
            <div className="h-full flex flex-col space-y-3">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs text-slate-500">
                  Click nodes to expand or collapse. Teacher notes are strictly filtered.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMindMapZoom((z) => Math.min(1.5, z + 0.1))}
                    className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMindMapZoom((z) => Math.max(0.7, z - 0.1))}
                    className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 overflow-auto shadow-inner">
                <div
                  className="min-w-[600px] space-y-4 transition-transform origin-top-left"
                  style={{ transform: `scale(${mindMapZoom})` }}
                >
                  {SAMPLE_MIND_MAP_NODES.map((node) => (
                    <div
                      key={node.id}
                      onClick={() => {
                        setExpandedNodes((prev) => ({ ...prev, [node.id]: !prev[node.id] }));
                        handleMindMapExplored();
                      }}
                      className="p-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-purple-400 cursor-pointer max-w-md transition-all shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {node.title}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                          {node.category}
                        </span>
                      </div>
                      {node.children.length > 0 && (
                        <p className="text-[11px] text-slate-400 mt-1">
                          {node.children.length} sub-branches connected
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LECTURE NOTES */}
          {activeTab === 'notes' && (
            <div className="max-w-3xl mx-auto bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-sm">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Comprehensive Lecture Notes
                </h3>
                <p className="text-xs text-slate-500">
                  Official student study notes prepared by teacher Dr. Sarah Jenkins
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  1. Fundamental Principles
                </h4>
                <p>
                  Autotrophic nutrition in green plants relies on photon capture by chlorophyll pigments situated within the thylakoid membranes of chloroplasts. This multi-step biochemical process couples light absorption with water photolysis and Calvin cycle carbohydrate synthesis.
                </p>

                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm pt-2">
                  2. Learning Objectives & Exam Focus
                </h4>
                <ul className="space-y-1.5 list-disc list-inside">
                  {lesson.objectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>

                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm pt-2">
                  3. Key Vocabulary
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-indigo-600 block">Photolysis</span>
                    <span className="text-slate-500 text-xs">
                      Light-activated water splitting releasing hydrogen ions, electrons, and molecular oxygen.
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-indigo-600 block">RuBisCO</span>
                    <span className="text-slate-500 text-xs">
                      Ribulose-1,5-bisphosphate carboxylase-oxygenase, the primary enzyme fixing atmospheric CO₂.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={handleNotesRead}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Notes as Read</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: ASK TEACHER PRIVATELY */}
          {activeTab === 'ask_teacher' && (
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Ask Your Teacher a Private Question
                </h3>
                <p className="text-xs text-slate-500">
                  Your question is submitted directly to the teacher's classroom inbox. Other students cannot see your private question.
                </p>
              </div>

              {questionSent && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300">
                  ✓ Your question has been delivered to Dr. Sarah Jenkins. You will see her reply in your Student Dashboard.
                </div>
              )}

              <form onSubmit={handleSendQuestion} className="space-y-3">
                <textarea
                  rows={4}
                  placeholder="Type your question about this lesson..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs"
                />
                <button
                  type="submit"
                  disabled={!questionText.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Question to Teacher</span>
                </button>
              </form>
            </div>
          )}

          {/* FLOATING / SLIDING AI HINT DRAWER */}
          {showAiHintDrawer && (
            <div className="absolute right-4 top-4 bottom-4 w-80 sm:w-96 bg-white dark:bg-slate-850 border border-purple-200 dark:border-purple-900/60 rounded-3xl shadow-2xl p-5 flex flex-col justify-between z-20">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      AI Learning Hint Assistant
                    </h4>
                  </div>
                  <button
                    onClick={() => setShowAiHintDrawer(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Teacher configured mode: <strong>Step-by-Step Guidance</strong>. Hints guide your understanding without revealing direct exam answers.
                </p>

                {hintResponse && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
                    {hintResponse}
                  </div>
                )}
              </div>

              <form onSubmit={handleRequestAiHint} className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  placeholder="Ask for a clue or concept hint..."
                  value={hintPrompt}
                  onChange={(e) => setHintPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
                <button
                  type="submit"
                  disabled={!hintPrompt.trim() || isHintLoading}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isHintLoading ? 'Generating Hint...' : 'Get Pedagogical Hint'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer with Completion Action */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Recorded Time: {Math.round((progress?.timeSpentSeconds || 30) / 60)} mins
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                studentPortalService.recordLessonInteraction(student.id, courseId, lesson.id, {
                  notesRead: true,
                  mindMapExplored: true,
                  timeSpentDeltaSeconds: 60,
                });
                onClose();
                if (onLessonUpdated) onLessonUpdated();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Lesson</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
