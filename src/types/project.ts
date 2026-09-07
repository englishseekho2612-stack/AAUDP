/**
 * Core Data Models for AI Teaching Studio
 * Non-destructive, modular data architecture supporting Android and Web platforms.
 */

export type SupportedLanguage = 'en' | 'hi' | 'hinglish' | 'es' | 'fr' | 'de' | 'other';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'hinglish', label: 'Hinglish', nativeLabel: 'Hinglish (Hindi + English)' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'other', label: 'Other', nativeLabel: 'Other Language' },
];

/**
 * Supported Source Types (Maximum 5 sources per project)
 * Part 02 will implement the active Source Engine.
 */
export type SourceType =
  | 'youtube'
  | 'pdf'
  | 'docx'
  | 'pptx'
  | 'image'
  | 'web'
  | 'text'
  | 'other';

export type SourceProcessingStatus =
  | 'idle'
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'error';

export type SourcePipelineStage =
  | 'idle'
  | 'validating'
  | 'storing'
  | 'extracting'
  | 'normalizing'
  | 'ready'
  | 'failed';

export type SourcePriority = 'primary' | 'supporting';

/**
 * Structural Source Segment
 * Preserves page numbers, slide numbers, headings, or timestamps for precise citation.
 */
export interface SourceSegment {
  segmentId: string;
  sourceId: string;
  text: string;
  location: string; // e.g. "Page 1", "Slide 3", "02:15", "Section 1"
  pageNumber?: number;
  slideNumber?: number;
  timestamp?: string;
  heading?: string;
}

export interface SourceMetadata {
  originalFileName?: string;
  fileSize?: number;
  mimeType?: string;
  durationSeconds?: number;
  pageCount?: number;
  slideCount?: number;
  dimensions?: { width: number; height: number };
  url?: string;
  domain?: string;
  videoId?: string;
  channelTitle?: string;
  authorOrChannel?: string;
  lastExtractedLength?: number;
  fileHash?: string;
  hasTranscript?: boolean;
  transcriptSource?: 'official' | 'manual' | 'pending';
  [key: string]: unknown;
}

/**
 * Non-Destructive Source Model
 * Always maintains reference to the raw original material
 */
export interface LearningSource {
  id: string;
  projectId: string;
  type: SourceType;
  name: string;
  originalRef: string; // URL, blob key, or local storage identifier
  blobId?: string;     // Reference to binary blob stored in blobStorage
  metadata: SourceMetadata;
  status: SourceProcessingStatus;
  stage?: SourcePipelineStage;
  statusMessage?: string;
  extractedText?: string;
  segments?: SourceSegment[];
  wordCount?: number;
  characterCount?: number;
  priority?: SourcePriority;
  selectedForAI?: boolean;
  orderIndex?: number;
  errorMessage?: string;
  createdTimestamp: number;
  updatedTimestamp: number;
}

/**
 * AI Output Types chosen explicitly by the teacher
 */
export type AIOutputType =
  | 'mind_map'
  | 'slides'
  | 'notes'
  | 'audio'
  | 'video'
  | 'quiz'
  | 'presentation_designer'
  | 'topic_explanation';

export type OutputStatus =
  | 'not_started'
  | 'queued'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'edited';

/**
 * Non-Destructive 3-Layer Output Architecture:
 * 1. Original Source
 * 2. Raw AI Generated Output (never destroyed)
 * 3. Teacher Modified Version (edits made on top)
 */
export interface OutputVersionHistory {
  versionId: string;
  timestamp: number;
  author: 'ai' | 'teacher';
  summaryOfChange?: string;
}

export interface ProjectAIOutput<TContent = unknown> {
  id: string;
  type: AIOutputType;
  title: string;
  status: OutputStatus;
  lastGeneratedAt?: number;
  lastModifiedAt?: number;
  targetLanguage: SupportedLanguage;
  aiPromptInstructions?: string;
  
  // Non-destructive content layers
  rawAiContent?: TContent | null;       // Immutable AI result
  teacherEditedContent?: TContent | null; // Teacher adjustments
  activeView: 'ai' | 'teacher' | 'split'; // Compare / preview mode
  
  versionHistory: OutputVersionHistory[];
  errorMessage?: string;
}

/**
 * Teaching Preferences & Module states (Prepared for Parts 04, 05, 06)
 */
export interface TeachingPreferences {
  cameraEnabledDefault: boolean;
  microphoneId?: string;
  cameraId?: string;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  voiceClarityBoost: boolean;
  defaultWhiteboardTheme: 'dark' | 'light';
  studentChatMode: 'teacher_only' | 'broadcast' | 'disabled';
}

/**
 * Complete Project Data Structure
 */
export interface TeachingProject {
  id: string;
  name: string;
  subject?: string;
  classGrade?: string;
  language: SupportedLanguage;
  createdTimestamp: number;
  updatedTimestamp: number;
  lastOpenedTimestamp: number;
  
  // Strict constraint: 0 to 5 sources
  sources: LearningSource[];
  
  // AI Outputs dictionary
  outputs: {
    mind_map: ProjectAIOutput;
    slides: ProjectAIOutput;
    notes: ProjectAIOutput;
    audio: ProjectAIOutput;
    video: ProjectAIOutput;
    quiz: ProjectAIOutput;
    presentation_designer?: ProjectAIOutput;
    topic_explanation?: ProjectAIOutput;
  };
  
  // Teacher instructions for future AI generation (Section 38)
  teacherInstructions?: string;

  // Project-specific teaching settings
  teachingPreferences: TeachingPreferences;
  
  // Versioning & local metadata
  schemaVersion: number;
  isArchived?: boolean;
}

/**
 * Source Grouping Architecture (Section 26)
 */
export interface SourceGroup {
  id: string;
  projectId: string;
  name: string;
  sourceIds: string[];
}

/**
 * Standardized AI Context Package (Section 37 & Section 50)
 * Prepared for Part 03 Gemini AI Engine
 */
export interface AIContextPackage {
  projectId: string;
  projectName: string;
  language: SupportedLanguage;
  teacherInstructions?: string;
  sources: {
    sourceId: string;
    title: string;
    type: SourceType;
    priority: SourcePriority;
    segments: SourceSegment[];
    totalWords: number;
  }[];
  totalSegments: number;
  totalWordCount: number;
  targetTask?: AIOutputType;
  generatedAt: number;
}

/**
 * Global User Settings
 */
export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserSettings {
  theme: ThemeMode;
  interfaceLanguage: SupportedLanguage;
  defaultAILanguage: SupportedLanguage;
  defaultSubject?: string;
  defaultClassGrade?: string;
  teachingPreferences: TeachingPreferences;
}

export type Project = TeachingProject;
