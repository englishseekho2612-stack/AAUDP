/**
 * AI Teaching Studio — Part 03 Core AI Data Models
 * Grounded, structured, and non-destructive schemas for all 8 AI teaching tasks.
 */

import { SupportedLanguage, SourceType, SourcePriority } from './project';

export type AITaskType =
  | 'mind_map'
  | 'slides'
  | 'notes'
  | 'audio'
  | 'video'
  | 'quiz'
  | 'presentation_designer'
  | 'topic_explanation';

export type AITaskStatus =
  | 'idle'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Single Grounded Source Reference
 */
export interface AISourceCitation {
  sourceId?: string;
  sourceName: string;
  sourceType?: SourceType;
  location: string; // e.g. "Page 4", "Slide 7", "02:15", "Section 2"
  snippet?: string;
}

// -------------------------------------------------------------------------
// 1. MIND MAP & VISUAL TREE DATA MODEL
// -------------------------------------------------------------------------
export type MindMapNodeType =
  | 'ROOT'
  | 'CONCEPT'
  | 'SUBTOPIC'
  | 'DEFINITION'
  | 'EXAMPLE'
  | 'PROCESS'
  | 'COMPARISON'
  | 'IMPORTANT POINT'
  | 'QUESTION'
  | 'FORMULA'
  | 'SUMMARY';

export interface MindMapNode {
  id: string;
  parentId: string | null;
  title: string;
  shortDescription: string;
  detailedExplanation: string;
  nodeType?: MindMapNodeType;
  keyPoints: string[];
  examples: string[];
  questions: string[];
  sourceReferences: AISourceCitation[];
  teacherNotes?: string;
  isExpanded?: boolean;
  expanded?: boolean;
  editable?: boolean;
  visibility?: 'public' | 'teacher_only' | 'student_published';
  importance?: 'low' | 'medium' | 'high' | 'critical';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  order?: number;
  tags?: string[];
  position?: { x: number; y: number };
  color?: string;
  themeMetadata?: Record<string, any>;
  isExamFocus?: boolean;
  children?: MindMapNode[];
}

export interface MindMapContent {
  id: string;
  title: string;
  rootNode: MindMapNode;
  summary?: string;
  displayMode: 'tree' | 'radial' | 'outline' | 'visual_tree' | 'mind_map';
  version?: number;
  lastEditedBy?: 'ai' | 'teacher';
}

// -------------------------------------------------------------------------
// 2. PRESENTATION / SLIDES DATA MODEL
// -------------------------------------------------------------------------
export type SlideLayout =
  | 'standard'
  | 'split'
  | 'title_only'
  | 'quote'
  | 'summary'
  | 'comparison';

export interface SlideItem {
  id: string;
  order: number;
  title: string;
  subtitle?: string;
  content: string;
  bullets: string[];
  speakerNotes: string;
  visualSuggestions: string;
  sourceReferences: AISourceCitation[];
  teacherNotes?: string;
  layout?: SlideLayout;
}

export interface PresentationContent {
  id: string;
  title: string;
  description: string;
  targetAudience?: string;
  estimatedDurationMinutes?: number;
  slides: SlideItem[];
}

// -------------------------------------------------------------------------
// 3. NOTES / SUMMARY DATA MODEL
// -------------------------------------------------------------------------
export type NoteSectionType =
  | 'summary'
  | 'detailed'
  | 'exam_notes'
  | 'key_points'
  | 'important_terms'
  | 'qa';

export interface NoteTerm {
  term: string;
  definition: string;
  example?: string;
}

export interface NoteQAItem {
  question: string;
  answer: string;
  examTip?: string;
}

export interface NoteSection {
  id: string;
  heading: string;
  type: NoteSectionType;
  content: string;
  bullets?: string[];
  terms?: NoteTerm[];
  qaList?: NoteQAItem[];
  sourceReferences?: AISourceCitation[];
  teacherNotes?: string;
}

export interface NotesContent {
  id: string;
  title: string;
  subject?: string;
  grade?: string;
  format: 'summary' | 'detailed' | 'exam' | 'comprehensive';
  sections: NoteSection[];
}

// -------------------------------------------------------------------------
// 4. AUDIO DATA MODEL
// -------------------------------------------------------------------------
export type AudioContentType =
  | 'explanation'
  | 'podcast'
  | 'revision'
  | 'summary'
  | 'storytelling';

export interface AudioScriptSegment {
  speaker?: string; // e.g. "Teacher" or "Host 1"
  text: string;
  timestamp?: string;
  tone?: string;
}

export interface AudioContent {
  id: string;
  title: string;
  audioType: AudioContentType;
  script: string;
  segments: AudioScriptSegment[];
  durationEstimateSeconds: number;
  language: SupportedLanguage;
  voiceStyle: string;
  sourceReferences: AISourceCitation[];
  audioBlobId?: string; // Stored in IndexedDB blobStorage
}

// -------------------------------------------------------------------------
// 5. VIDEO DATA MODEL
// -------------------------------------------------------------------------
export interface VideoScene {
  id: string;
  order: number;
  durationSeconds: number;
  narration: string;
  visualDescription: string;
  textOverlay: string;
  transition: 'fade' | 'slide' | 'zoom' | 'cut';
  sourceReferences: AISourceCitation[];
  slideIdRef?: string;
}

export interface VideoContent {
  id: string;
  title: string;
  targetDurationMinutes: number;
  scenes: VideoScene[];
  voiceStyle: string;
  aspectRatio: '16:9' | '9:16';
  statusDescription: string;
}

// -------------------------------------------------------------------------
// 6. QUIZ / MCQ DATA MODEL
// -------------------------------------------------------------------------
export type QuestionType = 'mcq' | 'true_false' | 'short_answer';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: string[]; // For MCQ: 4 options; for True/False: ['True', 'False']
  correctAnswer: string; // Stored separately from options!
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sourceReference: AISourceCitation;
  userAnswer?: string;
}

export interface QuizContent {
  id: string;
  title: string;
  totalQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questions: QuizQuestion[];
}

// -------------------------------------------------------------------------
// 7. AI PRESENTATION DESIGNER
// -------------------------------------------------------------------------
export interface PresentationDesignPlan {
  id: string;
  topic: string;
  targetAudience: string;
  classGrade: string;
  durationMinutes: number;
  teachingStyle: string;
  visualStyle: string;
  pedagogicalPhases: {
    phase: string;
    slideIndices: number[];
    purpose: string;
  }[];
  presentation: PresentationContent;
}

// -------------------------------------------------------------------------
// 8. TOPIC EXPLANATION
// -------------------------------------------------------------------------
export interface TopicExplanationContent {
  id: string;
  topic: string;
  targetAudience: string;
  coreConcept: string;
  breakdown: {
    subtopic: string;
    explanation: string;
    realWorldAnalogy: string;
    sourceReferences: AISourceCitation[];
  }[];
  commonMisconceptions: {
    misconception: string;
    correction: string;
  }[];
  summaryTakeaway: string;
  additionalExplanation?: string; // Clearly marked if beyond sources
}

// -------------------------------------------------------------------------
// AI TASK REQUEST & HISTORY
// -------------------------------------------------------------------------
export interface AITaskSourceSelection {
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  priority: SourcePriority;
  included: boolean;
}

export interface AITaskRequest {
  taskId: string;
  projectId: string;
  projectName: string;
  taskType: AITaskType;
  teacherInstructions: string;
  outputLanguage: SupportedLanguage;
  targetAudience?: string;
  classGrade?: string;
  selectedSources: {
    sourceId: string;
    title: string;
    type: SourceType;
    priority: SourcePriority;
    segments: { location: string; text: string }[];
  }[];
  options?: {
    quizCount?: number;
    quizDifficulty?: 'easy' | 'medium' | 'hard';
    quizType?: QuestionType;
    notesFormat?: 'summary' | 'detailed' | 'exam' | 'comprehensive';
    audioType?: AudioContentType;
    slideCount?: number;
    lessonDurationMinutes?: number;
  };
}

export interface AITaskRecord {
  taskId: string;
  projectId: string;
  taskType: AITaskType;
  selectedSourceIds: string[];
  teacherInstruction: string;
  language: SupportedLanguage;
  model: string;
  status: AITaskStatus;
  createdTime: number;
  completedTime?: number;
  errorInformation?: string;
}
