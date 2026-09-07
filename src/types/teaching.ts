/**
 * AI Teaching Studio — Part 04 Data Models
 * Professional Teaching Workspace, Hardware Audio DSP, Whiteboard & Annotation,
 * Voice Commands, Multi-Track Recording, and Part 05/Part 06 Integration Interfaces.
 */

import { SupportedLanguage } from './project';
import { MindMapNode } from './ai';

// ---------------------------------------------------------------------------
// 1. STUDIO LAYOUT & VIEW MODES
// ---------------------------------------------------------------------------
export type TeachingStudioLayout =
  | 'presentation_only'
  | 'presentation_camera'
  | 'mind_map_detail'
  | 'whiteboard_only'
  | 'split_view'
  | 'teacher_content';

export type CameraLayoutMode =
  | 'bubble'           // Small floating/draggable bubble
  | 'side_by_side'     // Teacher 50% / Content 50%
  | 'pip'              // Picture-in-picture in corner
  | 'fullscreen'       // Teacher camera takes over canvas
  | 'off';

export type ActiveContentMode = 'slides' | 'mind_map' | 'visual_tree' | 'whiteboard';

// ---------------------------------------------------------------------------
// 2. HARDWARE AUDIO & DSP ENHANCEMENT ENGINE
// ---------------------------------------------------------------------------
export type AudioPreset = 'natural' | 'clear_teaching' | 'studio' | 'custom';

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
  isDefault?: boolean;
}

export interface AdvancedAudioSettings {
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  highPassFilterHz: number; // e.g. 80Hz cutoff for fan/AC/rumble
  voiceClarityBoostDb: number; // 2.5kHz-4kHz peak boost (0 to 12 dB)
  compressionIntensity: number; // 0 to 100%
  compressionThresholdDb: number; // e.g. -24 dB
  compressionRatio: number; // e.g. 4
  outputGain: number; // e.g. 1.0 (0.2 to 2.5)
  limiterEnabled: boolean;
}

export interface AudioProcessingState {
  preset: AudioPreset;
  aiAutoEnhance: boolean;
  activeDeviceId: string | null;
  detectedDevices: AudioDevice[];
  micLevel: number; // 0.0 to 1.0 real-time meter
  isMuted: boolean;
  advanced: AdvancedAudioSettings;
}

export interface MicTestSample {
  rawAudioBlob: Blob | null;
  rawAudioUrl: string | null;
  durationSeconds: number;
  recordedAt: number;
}

// ---------------------------------------------------------------------------
// 3. WHITEBOARD & MULTI-LAYER ANNOTATIONS
// ---------------------------------------------------------------------------
export type AnnotationTool =
  | 'select'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'text'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'circle'
  | 'laser';

export interface Point {
  x: number;
  y: number;
}

export interface AnnotationStroke {
  id: string;
  tool: AnnotationTool;
  points: Point[];
  color: string;
  size: number;
  opacity: number;
  text?: string;
  timestamp: number; // for timeline sync in video editor
}

export interface LaserPointerState {
  active: boolean;
  x: number;
  y: number;
  lastUpdated: number;
}

// ---------------------------------------------------------------------------
// 4. MULTI-TRACK RECORDING (Part 04 + Part 06 Video Editor Foundation)
// ---------------------------------------------------------------------------
export type RecordingMode = 'clean' | 'teaching';

export interface VideoTrackInfo {
  id: string;
  name: string;
  kind: 'canvas_composite' | 'camera_isolated' | 'screen_share';
  durationMs: number;
  resolution: { width: number; height: number };
}

export interface AudioTrackInfo {
  id: string;
  name: string;
  kind: 'mic_raw' | 'mic_enhanced' | 'system_audio' | 'ai_voice' | 'background_music';
  durationMs: number;
  processed: boolean;
  presetApplied?: AudioPreset;
}

export interface CaptionCue {
  id: string;
  startTimeMs: number;
  endTimeMs: number;
  text: string;
}

export interface CaptionTrackInfo {
  id: string;
  language: SupportedLanguage;
  cues: CaptionCue[];
}

export interface AnnotationTrackItem {
  timestampMs: number;
  stroke: AnnotationStroke;
}

export interface RecordingProject {
  id: string;
  projectId: string;
  title: string;
  mode: RecordingMode;
  layout: TeachingStudioLayout;
  durationMs: number;
  createdAt: number;
  blobId?: string;
  blobUrl?: string;
  mimeType: string;
  sizeBytes: number;
  
  // Non-destructive 3-layer architecture
  status: 'original' | 'ai_enhanced' | 'teacher_edited';
  hasEnhancedAudio?: boolean;
  
  // Multi-track timeline foundation (for Part 06 Advanced Video Editor)
  videoTracks: VideoTrackInfo[];
  audioTracks: AudioTrackInfo[];
  captionTrack: CaptionTrackInfo;
  annotationTrack: AnnotationTrackItem[];
  cameraSettings: {
    enabled: boolean;
    layout: CameraLayoutMode;
    deviceId?: string;
  };
  microphoneSettings: {
    deviceId?: string;
    preset: AudioPreset;
    enhanced: boolean;
  };
}

// ---------------------------------------------------------------------------
// 5. AI VOICE COMMANDS & SPEECH RECOGNITION
// ---------------------------------------------------------------------------
export type VoiceCommandIntent =
  | 'next_slide'
  | 'prev_slide'
  | 'jump_slide'
  | 'open_mind_map'
  | 'open_visual_tree'
  | 'show_topic'
  | 'expand_branch'
  | 'collapse_branch'
  | 'explain_topic'
  | 'show_source'
  | 'show_example'
  | 'go_back'
  | 'show_notes'
  | 'start_recording'
  | 'stop_recording'
  | 'open_whiteboard'
  | 'clear_annotations'
  | 'go_fullscreen'
  | 'unknown';

export interface RecognizedVoiceCommand {
  rawTranscript: string;
  intent: VoiceCommandIntent;
  parameter?: string | number;
  confidence: number;
  timestamp: number;
  isDestructive?: boolean;
}

// ---------------------------------------------------------------------------
// 6. PRIVATE TEACHER NOTES
// ---------------------------------------------------------------------------
export interface TeacherNoteEntry {
  targetId: string; // 'project' | 'slide_<index>' | 'node_<id>' | 'topic_<title>'
  targetType: 'project' | 'slide' | 'mind_map_node' | 'topic';
  title: string;
  content: string;
  isPrivate: boolean; // Always true by default (Section 7)
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// 7. SESSION RECOVERY STATE (Section 50 & 51)
// ---------------------------------------------------------------------------
export interface TeachingSessionRecovery {
  sessionId: string;
  projectId: string;
  projectName: string;
  activeLayout: TeachingStudioLayout;
  contentMode: ActiveContentMode;
  currentSlideIndex: number;
  selectedMindMapNodeId: string | null;
  annotations: AnnotationStroke[];
  isFrozen: boolean;
  teacherNotes: Record<string, TeacherNoteEntry>;
  audioPreset: AudioPreset;
  savedAt: number;
}

// ---------------------------------------------------------------------------
// 8. PART 05 (CLASSROOM & YOUTUBE LIVE) & PART 06 INTEGRATION INTERFACES
// ---------------------------------------------------------------------------
export interface StudentViewStreamConfig {
  streamCanvas: HTMLCanvasElement | null;
  audioStream: MediaStream | null;
  hidePrivateTeacherOverlays: boolean;
  activeTopicSummary: string | null;
}

export interface YouTubeLiveBroadcastConfig {
  streamTitle: string;
  streamDescription: string;
  streamKey?: string;
  resolution: '720p' | '1080p';
  fps: 30 | 60;
  isBroadcasting: boolean;
  startedAt?: number;
}
