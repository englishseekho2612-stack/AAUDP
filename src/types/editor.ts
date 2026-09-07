/**
 * AI TEACHING STUDIO — PART 06 DATA MODELS
 * Multi-Track Video Timeline, Non-Destructive Versioning, Caption & Audio Editors,
 * AI Edit Assistant, Scene Management, Export Engine, Backup & Storage Management.
 */

import { AudioPreset, CameraLayoutMode, AnnotationStroke } from './teaching';
import { SupportedLanguage } from './project';

// ---------------------------------------------------------------------------
// 1. TIMELINE TRACK DEFINITIONS
// ---------------------------------------------------------------------------
export type TrackKind =
  | 'main_video'       // Track 1: Screen / Slide / Canvas
  | 'teacher_camera'   // Track 2: Instructor Camera overlay
  | 'voice_mic'        // Track 3: Primary microphone voice
  | 'bg_music'         // Track 4: Educational background music
  | 'captions'         // Track 5: Subtitles & Speech-to-text cues
  | 'annotations'      // Track 6: Whiteboard strokes & drawings
  | 'ai_effects';      // Track 7: AI Zoom, Highlights, Spotlight

export interface TimelineClip {
  id: string;
  trackId: string;
  name: string;
  startTimeMs: number;
  durationMs: number;
  sourceStartMs: number;
  sourceDurationMs: number;
  volume: number; // 0.0 to 2.0
  opacity: number; // 0.0 to 1.0
  speed: number; // 0.5 to 2.0
  isMuted: boolean;
  isLocked: boolean;
  isLinked: boolean; // Preserves sync across video + audio + camera + captions
  blobUrl?: string;
  blobId?: string;
  colorHex?: string;
  thumbnailUrl?: string;
}

export interface TimelineTrack {
  id: string;
  kind: TrackKind;
  name: string;
  orderIndex: number;
  isMuted: boolean;
  isSolo: boolean;
  isHidden: boolean;
  isLocked: boolean;
  volume: number; // 0.0 to 2.0
  opacity: number; // 0.0 to 1.0
  clips: TimelineClip[];
}

// ---------------------------------------------------------------------------
// 2. CAPTIONS & SUBTITLE MODELS (Section 8)
// ---------------------------------------------------------------------------
export type CaptionStylePreset = 'simple' | 'teaching' | 'youtube' | 'highlight';

export interface CaptionCue {
  id: string;
  startTimeMs: number;
  endTimeMs: number;
  text: string;
  speaker?: string;
  stylePreset?: CaptionStylePreset;
  fontSizePx?: number;
  alignment?: 'left' | 'center' | 'right';
  positionYPercent?: number; // Safe area positioning (default 85%)
  isHighlight?: boolean;
}

// ---------------------------------------------------------------------------
// 3. SCENE MANAGEMENT & PEDAGOGICAL STRUCTURE (Section 5 & 16)
// ---------------------------------------------------------------------------
export type PedagogicalStage =
  | 'hook'
  | 'objective'
  | 'concept'
  | 'explanation'
  | 'example'
  | 'mind_map'
  | 'question'
  | 'quiz'
  | 'summary'
  | 'homework';

export interface SceneItem {
  id: string;
  sceneNumber: number;
  title: string;
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
  pedagogicalStage?: PedagogicalStage;
  thumbnail?: string;
  notes?: string;
  cameraLayout: CameraLayoutMode;
  transitionToNext?: 'cut' | 'fade' | 'cross_dissolve' | 'slide' | 'zoom';
}

// ---------------------------------------------------------------------------
// 4. CHAPTERS & MARKERS (Section 15)
// ---------------------------------------------------------------------------
export type MarkerType =
  | 'topic'
  | 'important'
  | 'question'
  | 'example'
  | 'quiz'
  | 'homework'
  | 'exam_point';

export interface ChapterMarker {
  id: string;
  timestampMs: number;
  title: string;
  type: MarkerType;
  colorHex: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// 5. VISUAL EMPHASIS & EFFECTS (Section 14)
// ---------------------------------------------------------------------------
export type VisualEffectType =
  | 'zoom'
  | 'pan'
  | 'highlight'
  | 'spotlight'
  | 'pointer'
  | 'focus_area';

export interface VisualEmphasisEffect {
  id: string;
  type: VisualEffectType;
  startTimeMs: number;
  durationMs: number;
  targetBounds: {
    xPercent: number;
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
  };
  intensity: number; // 0 to 1
  label?: string;
  isEnabled: boolean;
}

// ---------------------------------------------------------------------------
// 6. AUDIO EDITING & BACKGROUND MUSIC (Section 9 & 10)
// ---------------------------------------------------------------------------
export interface AudioTrackSettings {
  volume: number; // 0.0 to 2.0
  gain: number; // 0.5 to 2.5
  isMuted: boolean;
  preset: AudioPreset;
  noiseReduction: boolean;
  echoReduction: boolean;
  voiceClarity: boolean;
  normalization: boolean;
  fadeInMs: number;
  fadeOutMs: number;
}

export interface BackgroundMusicTrack {
  id: string;
  title: string;
  blobUrl?: string;
  volume: number; // default 0.15 (Voice primary, music secondary)
  duckingEnabled: boolean; // Automatically lowers during teacher voice
  fadeInMs: number;
  fadeOutMs: number;
  isMuted: boolean;
}

// ---------------------------------------------------------------------------
// 7. AI EDITING ASSISTANT & NON-DESTRUCTIVE TOGGLES (Section 2, 6, 7)
// ---------------------------------------------------------------------------
export type AiEditSuggestionType =
  | 'silence_removal'
  | 'auto_zoom'
  | 'audio_enhancement'
  | 'scene_detection'
  | 'chapter_markers'
  | 'caption_polish'
  | 'repeated_words';

export interface AiEditSuggestion {
  id: string;
  type: AiEditSuggestionType;
  title: string;
  description: string;
  metric?: string;
  startTimeMs?: number;
  endTimeMs?: number;
  durationMs?: number;
  status: 'pending' | 'applied' | 'rejected';
  revertible: boolean;
  payload?: any;
}

export interface AiEditToggles {
  silenceRemovalEnabled: boolean;
  audioEnhancementEnabled: boolean;
  autoZoomEnabled: boolean;
  captionStyleEnabled: boolean;
}

// ---------------------------------------------------------------------------
// 8. QUALITY & PRIVACY AUDIT (Section 17, 30, 31, 32)
// ---------------------------------------------------------------------------
export interface QualityAuditIssue {
  id: string;
  category: 'captions' | 'audio' | 'silence' | 'scenes' | 'privacy' | 'export';
  severity: 'passed' | 'warning' | 'error';
  title: string;
  description: string;
  fixSuggestion?: string;
}

export interface PrivacyCheckResult {
  hasStudentPrivateMessages: boolean;
  hasStudentNamesOrIds: boolean;
  hasTeacherPrivateNotes: boolean;
  cleanForPublicExport: boolean;
  warnings: string[];
}

// ---------------------------------------------------------------------------
// 9. EXPORT SYSTEM & QUEUE (Section 18, 19, 20)
// ---------------------------------------------------------------------------
export type ExportResolution = '720p' | '1080p' | '4k';
export type ExportFps = 24 | 30 | 60;
export type ExportPreset =
  | 'youtube_1080p'
  | 'youtube_4k'
  | 'teaching_recording'
  | 'presentation_video'
  | 'custom';

export interface VideoExportSettings {
  preset: ExportPreset;
  resolution: ExportResolution;
  fps: ExportFps;
  format: 'mp4' | 'webm';
  videoBitrateKbps: number;
  audioBitrateKbps: number;
  includeCaptionsBurned: boolean;
  includeSeparateSrt: boolean;
  includeAnnotations: boolean;
  includeCamera: boolean;
  includeBgMusic: boolean;
}

export interface ExportJob {
  id: string;
  projectId: string;
  recordingId: string;
  title: string;
  settings: VideoExportSettings;
  status: 'queued' | 'rendering' | 'completed' | 'failed' | 'paused' | 'cancelled';
  progressPercent: number;
  estimatedSizeBytes: number;
  actualSizeBytes?: number;
  resultBlobUrl?: string;
  resultBlobId?: string;
  errorMessage?: string;
  createdAt: number;
  completedAt?: number;
}

// ---------------------------------------------------------------------------
// 10. NON-DESTRUCTIVE VERSIONING & COMPLETE TIMELINE STATE (Section 2 & 25)
// ---------------------------------------------------------------------------
export interface TimelineProjectState {
  id: string;
  projectId: string;
  recordingId: string;
  title: string;
  versionName: string; // e.g. "Original", "Teaching Edit", "YouTube Edit", "Final"
  createdAt: number;
  updatedAt: number;
  durationMs: number;
  currentTimeMs: number;
  zoomLevel: number; // 1.0 to 10.0
  isPlaying: boolean;
  
  tracks: TimelineTrack[];
  scenes: SceneItem[];
  chapters: ChapterMarker[];
  captions: CaptionCue[];
  annotations: AnnotationStroke[];
  visualEffects: VisualEmphasisEffect[];
  bgMusic: BackgroundMusicTrack | null;
  audioSettings: AudioTrackSettings;
  aiToggles: AiEditToggles;
  aiSuggestions: AiEditSuggestion[];
  
  exportHistory: ExportJob[];
}

export interface TimelineHistorySnapshot {
  timestamp: number;
  description: string;
  state: TimelineProjectState;
}
