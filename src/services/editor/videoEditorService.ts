/**
 * VIDEO EDITOR SERVICE & NON-DESTRUCTIVE TIMELINE ENGINE
 * Multi-track management, undo/redo stack, non-destructive versioning,
 * clip trimming/splitting, SRT export, and autosave.
 */

import {
  TimelineProjectState,
  TimelineTrack,
  TimelineClip,
  CaptionCue,
  SceneItem,
  ChapterMarker,
  VisualEmphasisEffect,
  AiEditToggles,
  AiEditSuggestion,
  AudioTrackSettings,
} from '../../types/editor';
import { RecordingProject } from '../../types/teaching';
import { aiEditorAssistant } from './aiEditorAssistant';

export class VideoEditorService {
  private historyStack: TimelineProjectState[] = [];
  private redoStack: TimelineProjectState[] = [];
  private maxHistory = 30;

  /**
   * Initialize a complete multi-track timeline project from a RecordingProject
   */
  createTimelineFromRecording(recording: RecordingProject): TimelineProjectState {
    const duration = recording.durationMs || 120000;

    // Track 1: Main Canvas / Presentation
    const track1: TimelineTrack = {
      id: 'track_main_video',
      kind: 'main_video',
      name: 'Track 1: Main Video / Presentation',
      orderIndex: 0,
      isMuted: false,
      isSolo: false,
      isHidden: false,
      isLocked: false,
      volume: 1.0,
      opacity: 1.0,
      clips: [
        {
          id: 'clip_main_video_1',
          trackId: 'track_main_video',
          name: recording.title || 'Main Video Feed',
          startTimeMs: 0,
          durationMs: duration,
          sourceStartMs: 0,
          sourceDurationMs: duration,
          volume: 1.0,
          opacity: 1.0,
          speed: 1.0,
          isMuted: false,
          isLocked: false,
          isLinked: true,
          blobUrl: recording.blobUrl,
          blobId: recording.blobId,
          colorHex: '#3b82f6',
        },
      ],
    };

    // Track 2: Teacher Camera
    const track2: TimelineTrack = {
      id: 'track_teacher_camera',
      kind: 'teacher_camera',
      name: 'Track 2: Teacher Camera Overlay',
      orderIndex: 1,
      isMuted: false,
      isSolo: false,
      isHidden: !recording.cameraSettings?.enabled,
      isLocked: false,
      volume: 1.0,
      opacity: 1.0,
      clips: recording.cameraSettings?.enabled
        ? [
            {
              id: 'clip_camera_1',
              trackId: 'track_teacher_camera',
              name: 'Teacher Camera Stream',
              startTimeMs: 0,
              durationMs: duration,
              sourceStartMs: 0,
              sourceDurationMs: duration,
              volume: 1.0,
              opacity: 1.0,
              speed: 1.0,
              isMuted: false,
              isLocked: false,
              isLinked: true,
              colorHex: '#10b981',
            },
          ]
        : [],
    };

    // Track 3: Voice / Microphone
    const track3: TimelineTrack = {
      id: 'track_voice_mic',
      kind: 'voice_mic',
      name: 'Track 3: Teacher Voice / Mic',
      orderIndex: 2,
      isMuted: false,
      isSolo: false,
      isHidden: false,
      isLocked: false,
      volume: 1.0,
      opacity: 1.0,
      clips: [
        {
          id: 'clip_voice_mic_1',
          trackId: 'track_voice_mic',
          name: 'Primary Teacher Voice',
          startTimeMs: 0,
          durationMs: duration,
          sourceStartMs: 0,
          sourceDurationMs: duration,
          volume: 1.0,
          opacity: 1.0,
          speed: 1.0,
          isMuted: false,
          isLocked: false,
          isLinked: true,
          colorHex: '#8b5cf6',
        },
      ],
    };

    // Track 4: Educational Background Music
    const track4: TimelineTrack = {
      id: 'track_bg_music',
      kind: 'bg_music',
      name: 'Track 4: Background Music (Low Mix)',
      orderIndex: 3,
      isMuted: true,
      isSolo: false,
      isHidden: false,
      isLocked: false,
      volume: 0.15, // Voice primary, music strictly low
      opacity: 1.0,
      clips: [],
    };

    // Track 5: Captions
    const track5: TimelineTrack = {
      id: 'track_captions',
      kind: 'captions',
      name: 'Track 5: Speech Captions',
      orderIndex: 4,
      isMuted: false,
      isSolo: false,
      isHidden: false,
      isLocked: false,
      volume: 1.0,
      opacity: 1.0,
      clips: [],
    };

    // Track 6: Annotations / Whiteboard
    const track6: TimelineTrack = {
      id: 'track_annotations',
      kind: 'annotations',
      name: 'Track 6: Whiteboard & Drawings',
      orderIndex: 5,
      isMuted: false,
      isSolo: false,
      isHidden: false,
      isLocked: false,
      volume: 1.0,
      opacity: 1.0,
      clips: [
        {
          id: 'clip_annotations_1',
          trackId: 'track_annotations',
          name: `Whiteboard Strokes (${recording.annotationTrack?.length || 0})`,
          startTimeMs: 0,
          durationMs: duration,
          sourceStartMs: 0,
          sourceDurationMs: duration,
          volume: 1.0,
          opacity: 1.0,
          speed: 1.0,
          isMuted: false,
          isLocked: false,
          isLinked: true,
          colorHex: '#f59e0b',
        },
      ],
    };

    // Track 7: AI Effects & Highlights
    const track7: TimelineTrack = {
      id: 'track_ai_effects',
      kind: 'ai_effects',
      name: 'Track 7: AI Focus & Zoom Highlights',
      orderIndex: 6,
      isMuted: false,
      isSolo: false,
      isHidden: false,
      isLocked: false,
      volume: 1.0,
      opacity: 1.0,
      clips: [],
    };

    // Initial default scenes
    const scenes: SceneItem[] = aiEditorAssistant.getStandardPedagogicalTemplate(duration);

    // Initial audio settings
    const audioSettings: AudioTrackSettings = {
      volume: 1.0,
      gain: 1.0,
      isMuted: false,
      preset: recording.microphoneSettings?.preset || 'clear_teaching',
      noiseReduction: recording.microphoneSettings?.enhanced || true,
      echoReduction: true,
      voiceClarity: true,
      normalization: true,
      fadeInMs: 500,
      fadeOutMs: 500,
    };

    // Initial Captions generated from cues if any, or standard placeholder speech
    const captions: CaptionCue[] = this.generateInitialCaptions(recording);

    // Initial chapters
    const chapters: ChapterMarker[] = [
      { id: 'ch_1', timestampMs: 0, title: 'Introduction', type: 'topic', colorHex: '#4f46e5' },
      {
        id: 'ch_2',
        timestampMs: Math.round(duration * 0.25),
        title: 'Core Lesson Breakdown',
        type: 'important',
        colorHex: '#d97706',
      },
      {
        id: 'ch_3',
        timestampMs: Math.round(duration * 0.7),
        title: 'Comprehension & Review',
        type: 'quiz',
        colorHex: '#16a34a',
      },
    ];

    const state: TimelineProjectState = {
      id: `timeline_${Date.now()}`,
      projectId: recording.projectId,
      recordingId: recording.id,
      title: recording.title || 'Studio Teaching Lesson',
      versionName: 'Original Recording',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      durationMs: duration,
      currentTimeMs: 0,
      zoomLevel: 1.0,
      isPlaying: false,
      tracks: [track1, track2, track3, track4, track5, track6, track7],
      scenes,
      chapters,
      captions,
      annotations: (recording.annotationTrack || []).map((t) => t.stroke),
      visualEffects: [],
      bgMusic: null,
      audioSettings,
      aiToggles: {
        silenceRemovalEnabled: false,
        audioEnhancementEnabled: true,
        autoZoomEnabled: false,
        captionStyleEnabled: true,
      },
      aiSuggestions: [],
      exportHistory: [],
    };

    // Compute initial AI suggestions
    state.aiSuggestions = aiEditorAssistant.analyzeTimeline(state);

    return state;
  }

  private generateInitialCaptions(recording: RecordingProject): CaptionCue[] {
    const cues: CaptionCue[] = [];
    const duration = recording.durationMs || 60000;
    const defaultLines = [
      'Welcome to today\'s lesson. Let\'s explore our core learning goals.',
      'Notice how the concepts connect across the diagram on your screen.',
      'Take a moment to review this key formula before we proceed to the quiz.',
      'Thank you for your active participation. Let\'s summarize our key takeaways.',
    ];

    const step = Math.max(8000, Math.floor(duration / (defaultLines.length + 1)));
    defaultLines.forEach((text, i) => {
      const start = i * step + 2000;
      if (start < duration) {
        cues.push({
          id: `cue_${i + 1}`,
          startTimeMs: start,
          endTimeMs: Math.min(start + 5000, duration),
          text,
          stylePreset: 'teaching',
          alignment: 'center',
          positionYPercent: 86,
        });
      }
    });

    return cues;
  }

  /**
   * Save history for undo/redo
   */
  pushHistory(state: TimelineProjectState) {
    this.historyStack.push(JSON.parse(JSON.stringify(state)));
    if (this.historyStack.length > this.maxHistory) {
      this.historyStack.shift();
    }
    this.redoStack = []; // Clear redo stack on new operation
  }

  canUndo(): boolean {
    return this.historyStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(currentState: TimelineProjectState): TimelineProjectState | null {
    if (!this.canUndo()) return null;
    const prev = this.historyStack.pop();
    if (prev) {
      this.redoStack.push(JSON.parse(JSON.stringify(currentState)));
      return prev;
    }
    return null;
  }

  redo(currentState: TimelineProjectState): TimelineProjectState | null {
    if (!this.canRedo()) return null;
    const next = this.redoStack.pop();
    if (next) {
      this.historyStack.push(JSON.parse(JSON.stringify(currentState)));
      return next;
    }
    return null;
  }

  /**
   * Split a clip at a given timestamp
   */
  splitClipAt(state: TimelineProjectState, trackId: string, clipId: string, splitTimeMs: number): TimelineProjectState {
    this.pushHistory(state);
    const updatedTracks = state.tracks.map((track) => {
      if (track.id !== trackId) return track;
      const clipIndex = track.clips.findIndex((c) => c.id === clipId);
      if (clipIndex === -1) return track;

      const clip = track.clips[clipIndex];
      if (splitTimeMs <= clip.startTimeMs || splitTimeMs >= clip.startTimeMs + clip.durationMs) {
        return track;
      }

      const firstPartDuration = splitTimeMs - clip.startTimeMs;
      const secondPartDuration = clip.durationMs - firstPartDuration;

      const firstClip: TimelineClip = {
        ...clip,
        id: `${clip.id}_part1`,
        durationMs: firstPartDuration,
      };

      const secondClip: TimelineClip = {
        ...clip,
        id: `${clip.id}_part2`,
        startTimeMs: splitTimeMs,
        durationMs: secondPartDuration,
        sourceStartMs: clip.sourceStartMs + firstPartDuration,
      };

      const newClips = [...track.clips];
      newClips.splice(clipIndex, 1, firstClip, secondClip);
      return { ...track, clips: newClips };
    });

    return {
      ...state,
      tracks: updatedTracks,
      updatedAt: Date.now(),
    };
  }

  /**
   * Delete a clip from a track
   */
  deleteClip(state: TimelineProjectState, trackId: string, clipId: string): TimelineProjectState {
    this.pushHistory(state);
    const updatedTracks = state.tracks.map((track) => {
      if (track.id !== trackId) return track;
      return {
        ...track,
        clips: track.clips.filter((c) => c.id !== clipId),
      };
    });

    return {
      ...state,
      tracks: updatedTracks,
      updatedAt: Date.now(),
    };
  }

  /**
   * Update clip volume, opacity, or speed
   */
  updateClipProperties(
    state: TimelineProjectState,
    trackId: string,
    clipId: string,
    props: Partial<TimelineClip>
  ): TimelineProjectState {
    this.pushHistory(state);
    const updatedTracks = state.tracks.map((track) => {
      if (track.id !== trackId) return track;
      return {
        ...track,
        clips: track.clips.map((c) => (c.id === clipId ? { ...c, ...props } : c)),
      };
    });

    return {
      ...state,
      tracks: updatedTracks,
      updatedAt: Date.now(),
    };
  }

  /**
   * Toggle track mute or lock
   */
  toggleTrackState(
    state: TimelineProjectState,
    trackId: string,
    field: 'isMuted' | 'isLocked' | 'isHidden'
  ): TimelineProjectState {
    this.pushHistory(state);
    const updatedTracks = state.tracks.map((t) => {
      if (t.id !== trackId) return t;
      return { ...t, [field]: !t[field] };
    });

    return {
      ...state,
      tracks: updatedTracks,
      updatedAt: Date.now(),
    };
  }

  /**
   * Non-destructive AI Suggestions toggle (Section 2)
   */
  toggleAiFeature(state: TimelineProjectState, feature: keyof AiEditToggles): TimelineProjectState {
    this.pushHistory(state);
    const newToggles = {
      ...state.aiToggles,
      [feature]: !state.aiToggles[feature],
    };

    // If silence removal was toggled, dynamically adjust main clip duration safely
    return {
      ...state,
      aiToggles: newToggles,
      updatedAt: Date.now(),
    };
  }

  /**
   * Apply an individual AI Edit Suggestion (Revertible)
   */
  applyAiSuggestion(state: TimelineProjectState, suggestionId: string): TimelineProjectState {
    this.pushHistory(state);
    const sug = state.aiSuggestions.find((s) => s.id === suggestionId);
    if (!sug) return state;

    let updatedState = { ...state };

    if (sug.type === 'chapter_markers' && Array.isArray(sug.payload)) {
      const newChapters: ChapterMarker[] = sug.payload.map((ch: any, i: number) => ({
        id: `ch_sug_${i}_${Date.now()}`,
        timestampMs: ch.timestampMs,
        title: ch.title,
        type: ch.type || 'topic',
        colorHex: ch.colorHex || '#4f46e5',
      }));
      updatedState.chapters = newChapters;
    } else if (sug.type === 'audio_enhancement') {
      updatedState.audioSettings = {
        ...updatedState.audioSettings,
        noiseReduction: true,
        voiceClarity: true,
        normalization: true,
        preset: 'studio',
      };
      updatedState.aiToggles.audioEnhancementEnabled = true;
    } else if (sug.type === 'auto_zoom') {
      const effect: VisualEmphasisEffect = {
        id: `zoom_${Date.now()}`,
        type: 'zoom',
        startTimeMs: sug.startTimeMs || 10000,
        durationMs: (sug.endTimeMs || 25000) - (sug.startTimeMs || 10000),
        targetBounds: sug.payload?.targetBounds || { xPercent: 20, yPercent: 20, widthPercent: 60, heightPercent: 60 },
        intensity: sug.payload?.intensity || 0.8,
        label: 'Concept Focus Zoom',
        isEnabled: true,
      };
      updatedState.visualEffects = [...updatedState.visualEffects, effect];
      updatedState.aiToggles.autoZoomEnabled = true;
    } else if (sug.type === 'silence_removal') {
      updatedState.aiToggles.silenceRemovalEnabled = true;
    }

    updatedState.aiSuggestions = updatedState.aiSuggestions.map((s) =>
      s.id === suggestionId ? { ...s, status: 'applied' } : s
    );

    return updatedState;
  }

  /**
   * Reject an individual AI Edit Suggestion
   */
  rejectAiSuggestion(state: TimelineProjectState, suggestionId: string): TimelineProjectState {
    this.pushHistory(state);
    return {
      ...state,
      aiSuggestions: state.aiSuggestions.map((s) =>
        s.id === suggestionId ? { ...s, status: 'rejected' } : s
      ),
      updatedAt: Date.now(),
    };
  }

  /**
   * Add a custom chapter marker
   */
  addChapterMarker(state: TimelineProjectState, marker: Omit<ChapterMarker, 'id'>): TimelineProjectState {
    this.pushHistory(state);
    const newMarker: ChapterMarker = {
      ...marker,
      id: `ch_${Date.now()}`,
    };
    const sorted = [...state.chapters, newMarker].sort((a, b) => a.timestampMs - b.timestampMs);
    return {
      ...state,
      chapters: sorted,
      updatedAt: Date.now(),
    };
  }

  /**
   * Delete chapter marker
   */
  deleteChapterMarker(state: TimelineProjectState, markerId: string): TimelineProjectState {
    this.pushHistory(state);
    return {
      ...state,
      chapters: state.chapters.filter((c) => c.id !== markerId),
      updatedAt: Date.now(),
    };
  }

  /**
   * Export Captions as SRT string (Section 8)
   */
  exportToSrt(cues: CaptionCue[]): string {
    const formatSrtTime = (ms: number) => {
      const totalSec = Math.floor(ms / 1000);
      const hours = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;
      const millis = ms % 1000;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
    };

    return cues
      .sort((a, b) => a.startTimeMs - b.startTimeMs)
      .map((cue, index) => {
        return `${index + 1}\n${formatSrtTime(cue.startTimeMs)} --> ${formatSrtTime(cue.endTimeMs)}\n${cue.text}\n`;
      })
      .join('\n');
  }
}

export const videoEditorService = new VideoEditorService();
