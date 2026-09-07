import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Subtitles,
  Compass,
  Film,
  ShieldCheck,
  RotateCcw,
  RotateCw,
  Save,
  ArrowLeft,
  Layers,
  ChevronDown,
  Check,
  FolderArchive,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { TimelineProjectState, AiEditToggles } from '../types/editor';
import { videoEditorService } from '../services/editor/videoEditorService';
import { exportEngine } from '../services/editor/exportEngine';
import { EditorPreviewPlayer } from '../components/editor/EditorPreviewPlayer';
import { TimelineEditor } from '../components/editor/TimelineEditor';
import { AiSuggestionsDrawer } from '../components/editor/AiSuggestionsDrawer';
import { CaptionInspector } from '../components/editor/CaptionInspector';
import { SceneManagerDrawer } from '../components/editor/SceneManagerDrawer';
import { QualityAuditModal } from '../components/editor/QualityAuditModal';
import { ExportModal } from '../components/editor/ExportModal';

interface VideoEditorViewProps {
  onExit: () => void;
}

type ActiveTab = 'ai_suggestions' | 'captions' | 'scenes';

export const VideoEditorView: React.FC<VideoEditorViewProps> = ({ onExit }) => {
  const { activeProject } = useProject();

  // 1. Initial Timeline State Initialization
  const [timelineState, setTimelineState] = useState<TimelineProjectState>(() => {
    // Generate fresh non-destructive timeline from active project
    return videoEditorService.createTimelineFromRecording({
      id: `rec_${activeProject?.id || 'demo'}`,
      projectId: activeProject?.id || 'demo_proj',
      title: activeProject?.name || 'Studio Teaching Lesson',
      mode: 'teaching',
      layout: 'presentation_camera',
      durationMs: 180000, // 3 mins default
      createdAt: Date.now(),
      mimeType: 'video/webm',
      sizeBytes: 15400000,
      status: 'original',
      videoTracks: [
        {
          id: 'vid_composite_1',
          name: 'Teaching Composite',
          kind: 'canvas_composite',
          durationMs: 180000,
          resolution: { width: 1920, height: 1080 },
        },
      ],
      audioTracks: [
        {
          id: 'aud_mic_1',
          name: 'Teacher Microphone',
          kind: 'mic_enhanced',
          durationMs: 180000,
          processed: true,
        },
      ],
      captionTrack: {
        id: 'cap_track_1',
        language: (activeProject?.language as any) || 'en',
        cues: [],
      },
      annotationTrack: [],
      cameraSettings: { enabled: true, layout: 'bubble' },
      microphoneSettings: { preset: 'clear_teaching', enhanced: true },
    });
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('ai_suggestions');
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [activeVersion, setActiveVersion] = useState<'original' | 'teaching_edit' | 'youtube_edit'>('teaching_edit');

  // Playback ticker
  useEffect(() => {
    let interval: number | null = null;
    if (timelineState.isPlaying) {
      interval = window.setInterval(() => {
        setTimelineState((prev) => {
          if (prev.currentTimeMs >= prev.durationMs) {
            return { ...prev, isPlaying: false, currentTimeMs: 0 };
          }
          return { ...prev, currentTimeMs: prev.currentTimeMs + 200 };
        });
      }, 200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timelineState.isPlaying]);

  // Handlers for Timeline Operations
  const handleTimeUpdate = (newTimeMs: number) => {
    setTimelineState((prev) => ({ ...prev, currentTimeMs: newTimeMs }));
  };

  const handleTogglePlay = () => {
    setTimelineState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleSplitClip = (trackId: string, clipId: string, splitTimeMs: number) => {
    const updated = videoEditorService.splitClipAt(timelineState, trackId, clipId, splitTimeMs);
    setTimelineState(updated);
  };

  const handleDeleteClip = (trackId: string, clipId: string) => {
    const updated = videoEditorService.deleteClip(timelineState, trackId, clipId);
    setTimelineState(updated);
  };

  const handleToggleTrack = (trackId: string, field: 'isMuted' | 'isLocked' | 'isHidden') => {
    const updated = videoEditorService.toggleTrackState(timelineState, trackId, field);
    setTimelineState(updated);
  };

  const handleUndo = () => {
    const prev = videoEditorService.undo(timelineState);
    if (prev) setTimelineState(prev);
  };

  const handleRedo = () => {
    const next = videoEditorService.redo(timelineState);
    if (next) setTimelineState(next);
  };

  const handleToggleAiFeature = (feature: keyof AiEditToggles) => {
    const updated = videoEditorService.toggleAiFeature(timelineState, feature);
    setTimelineState(updated);
  };

  const handleApplyAiSuggestion = (sugId: string) => {
    const updated = videoEditorService.applyAiSuggestion(timelineState, sugId);
    setTimelineState(updated);
  };

  const handleRejectAiSuggestion = (sugId: string) => {
    const updated = videoEditorService.rejectAiSuggestion(timelineState, sugId);
    setTimelineState(updated);
  };

  return (
    <div
      id="video-editor-view-root"
      className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden select-none"
    >
      {/* 1. TOP MASTER BAR */}
      <header className="h-14 px-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-xs flex items-center justify-between gap-3 z-30 shrink-0">
        {/* Left: Back + Project Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Exit Video Editor"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-wide truncate max-w-[200px] sm:max-w-xs">
              {timelineState.title}
            </h2>

            {/* Non-Destructive Version Badge (Section 2) */}
            <div className="relative inline-block">
              <button
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span className="capitalize">{activeVersion.replace('_', ' ')}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Center: Tabs Switcher (AI, Captions, Scenes) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('ai_suggestions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'ai_suggestions'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Assistant</span>
          </button>

          <button
            onClick={() => setActiveTab('captions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'captions'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span>Captions ({timelineState.captions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('scenes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'scenes'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Scenes ({timelineState.scenes.length})</span>
          </button>
        </div>

        {/* Right: Quality Check & Export Buttons */}
        <div className="flex items-center gap-2">
          {/* Quality Audit Button */}
          <button
            id="btn-open-quality-audit"
            onClick={() => setIsQualityModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 cursor-pointer transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Quality & Privacy Check</span>
          </button>

          {/* Export Video Master */}
          <button
            id="btn-open-export-modal"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md cursor-pointer transition-colors"
          >
            <Film className="w-4 h-4" />
            <span>Export Video</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE (Preview + Timeline on Left, Drawer on Right) */}
      <div className="flex flex-1 overflow-hidden p-3 gap-3">
        {/* Left Column: Player & Timeline */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">
          {/* Preview Monitor */}
          <div className="max-w-4xl w-full mx-auto shrink-0">
            <EditorPreviewPlayer
              state={timelineState}
              onTimeUpdate={handleTimeUpdate}
              onTogglePlay={handleTogglePlay}
            />
          </div>

          {/* Multi-Track Timeline */}
          <div className="flex-1 min-h-[280px]">
            <TimelineEditor
              state={timelineState}
              onTimeChange={handleTimeUpdate}
              onSplitClip={handleSplitClip}
              onDeleteClip={handleDeleteClip}
              onToggleTrack={handleToggleTrack}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={videoEditorService.canUndo()}
              canRedo={videoEditorService.canRedo()}
            />
          </div>
        </div>

        {/* Right Column: Active Inspector Drawer */}
        <div className="w-80 shrink-0 hidden lg:flex flex-col">
          {activeTab === 'ai_suggestions' && (
            <AiSuggestionsDrawer
              state={timelineState}
              onApplySuggestion={handleApplyAiSuggestion}
              onRejectSuggestion={handleRejectAiSuggestion}
              onToggleAiFeature={handleToggleAiFeature}
            />
          )}

          {activeTab === 'captions' && (
            <CaptionInspector
              captions={timelineState.captions}
              currentTimeMs={timelineState.currentTimeMs}
              onUpdateCaptions={(cues) => setTimelineState((prev) => ({ ...prev, captions: cues }))}
              onDownloadSrt={() => exportEngine.downloadSrt(timelineState)}
              onSeekTo={handleTimeUpdate}
            />
          )}

          {activeTab === 'scenes' && (
            <SceneManagerDrawer
              scenes={timelineState.scenes}
              durationMs={timelineState.durationMs}
              onUpdateScenes={(scenes) => setTimelineState((prev) => ({ ...prev, scenes }))}
              onSeekTo={handleTimeUpdate}
            />
          )}
        </div>
      </div>

      {/* 3. MODALS */}
      <QualityAuditModal
        isOpen={isQualityModalOpen}
        state={timelineState}
        onClose={() => setIsQualityModalOpen(false)}
        onProceedToExport={() => {
          setIsQualityModalOpen(false);
          setIsExportModalOpen(true);
        }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        state={timelineState}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};
