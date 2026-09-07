import React, { useRef, useState } from 'react';
import {
  Scissors,
  Trash2,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Video,
  Camera,
  Mic,
  Music,
  Subtitles,
  PenTool,
  Sparkles,
  Link,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { TimelineProjectState, TimelineTrack, TimelineClip, TrackKind } from '../../types/editor';

interface TimelineEditorProps {
  state: TimelineProjectState;
  onTimeChange: (newTimeMs: number) => void;
  onSplitClip: (trackId: string, clipId: string, splitTimeMs: number) => void;
  onDeleteClip: (trackId: string, clipId: string) => void;
  onToggleTrack: (trackId: string, field: 'isMuted' | 'isLocked' | 'isHidden') => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  state,
  onTimeChange,
  onSplitClip,
  onDeleteClip,
  onToggleTrack,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const [zoom, setZoom] = useState(1.0);
  const [selectedClip, setSelectedClip] = useState<{ trackId: string; clipId: string } | null>(null);
  const timelineTracksRef = useRef<HTMLDivElement>(null);

  // Pixel scaling: at 1.0x, 1000ms = 20px
  const msToPixels = (ms: number) => (ms / 1000) * 20 * zoom;
  const pixelsToMs = (px: number) => (px / (20 * zoom)) * 1000;

  const totalWidthPx = Math.max(800, msToPixels(state.durationMs));
  const playheadPx = msToPixels(state.currentTimeMs);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineTracksRef.current) return;
    const rect = timelineTracksRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + timelineTracksRef.current.scrollLeft;
    const newMs = Math.max(0, Math.min(state.durationMs, pixelsToMs(clickX)));
    onTimeChange(newMs);
  };

  const handleSplitAtPlayhead = () => {
    if (selectedClip) {
      onSplitClip(selectedClip.trackId, selectedClip.clipId, state.currentTimeMs);
    } else {
      // Find clip in Track 1 (Main Video) at current playhead
      const mainTrack = state.tracks.find((t) => t.kind === 'main_video');
      const clip = mainTrack?.clips.find(
        (c) => c.startTimeMs < state.currentTimeMs && state.currentTimeMs < c.startTimeMs + c.durationMs
      );
      if (clip && mainTrack) {
        onSplitClip(mainTrack.id, clip.id, state.currentTimeMs);
      }
    }
  };

  const handleDeleteSelected = () => {
    if (selectedClip) {
      onDeleteClip(selectedClip.trackId, selectedClip.clipId);
      setSelectedClip(null);
    }
  };

  const getTrackIcon = (kind: TrackKind) => {
    switch (kind) {
      case 'main_video':
        return <Video className="w-3.5 h-3.5 text-blue-400" />;
      case 'teacher_camera':
        return <Camera className="w-3.5 h-3.5 text-emerald-400" />;
      case 'voice_mic':
        return <Mic className="w-3.5 h-3.5 text-purple-400" />;
      case 'bg_music':
        return <Music className="w-3.5 h-3.5 text-pink-400" />;
      case 'captions':
        return <Subtitles className="w-3.5 h-3.5 text-amber-400" />;
      case 'annotations':
        return <PenTool className="w-3.5 h-3.5 text-orange-400" />;
      case 'ai_effects':
        return <Sparkles className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  // Generate ruler markers every 10 or 30 seconds
  const stepSec = zoom > 2 ? 5 : zoom > 1 ? 15 : 30;
  const totalSec = Math.ceil(state.durationMs / 1000);
  const rulerTicks = [];
  for (let s = 0; s <= totalSec; s += stepSec) {
    rulerTicks.push(s);
  }

  return (
    <div
      id="video-editor-timeline-panel"
      className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl select-none"
    >
      {/* 1. TIMELINE TOOLBAR */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs">
        {/* Left: Tools (Split, Delete, Undo, Redo) */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-timeline-split"
            onClick={handleSplitAtPlayhead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-colors cursor-pointer"
            title="Split clip at playhead"
          >
            <Scissors className="w-3.5 h-3.5 text-indigo-400" />
            <span>Split Clip</span>
          </button>

          <button
            id="btn-timeline-delete"
            onClick={handleDeleteSelected}
            disabled={!selectedClip}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold border transition-colors cursor-pointer ${
              selectedClip
                ? 'bg-rose-950/60 border-rose-800 text-rose-300 hover:bg-rose-900'
                : 'bg-slate-900 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
            }`}
            title="Delete selected clip"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Undo / Redo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg border transition-colors ${
              canUndo
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white cursor-pointer'
                : 'bg-slate-900 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
            }`}
            title="Undo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg border transition-colors ${
              canRedo
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white cursor-pointer'
                : 'bg-slate-900 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
            }`}
            title="Redo"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Zoom slider & Multi-track indicator */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            7 Synced Tracks
          </span>
          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-slate-300 w-8 text-center">
              {zoom.toFixed(1)}x
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3.0, z + 0.25))}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. TRACKS CONTAINER (Headers + Scrollable Tracks Area) */}
      <div className="flex flex-1 overflow-hidden relative min-h-[280px]">
        {/* Left: Track Header Controls (Fixed width) */}
        <div className="w-48 shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col z-20">
          {/* Ruler spacer */}
          <div className="h-7 border-b border-slate-800 px-3 flex items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tracks</span>
          </div>

          {/* Track Headers */}
          {state.tracks.map((track) => (
            <div
              key={track.id}
              className="h-10 px-3 border-b border-slate-800 flex items-center justify-between gap-1 text-[11px] bg-slate-950/70"
            >
              <div className="flex items-center gap-1.5 truncate">
                {getTrackIcon(track.kind)}
                <span className="font-semibold text-slate-300 truncate" title={track.name}>
                  {track.name.split(':')[1] || track.name}
                </span>
              </div>

              {/* Mute & Lock buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleTrack(track.id, 'isMuted')}
                  className={`p-1 rounded cursor-pointer ${
                    track.isMuted ? 'text-rose-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={track.isMuted ? 'Unmute' : 'Mute'}
                >
                  {track.isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => onToggleTrack(track.id, 'isLocked')}
                  className={`p-1 rounded cursor-pointer ${
                    track.isLocked ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={track.isLocked ? 'Unlock' : 'Lock'}
                >
                  {track.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Scrollable Tracks & Timeline Canvas */}
        <div
          ref={timelineTracksRef}
          onClick={handleTimelineClick}
          className="flex-1 overflow-x-auto overflow-y-hidden relative cursor-pointer bg-slate-900/40"
        >
          {/* Inner content sized to total duration */}
          <div style={{ width: `${totalWidthPx}px` }} className="relative h-full">
            {/* Timeline Ruler */}
            <div className="h-7 border-b border-slate-800 flex items-center relative bg-slate-950/90 text-[10px] text-slate-400 font-mono select-none">
              {rulerTicks.map((sec) => (
                <div
                  key={sec}
                  className="absolute top-0 bottom-0 border-l border-slate-800 pl-1 pt-1"
                  style={{ left: `${msToPixels(sec * 1000)}px` }}
                >
                  {Math.floor(sec / 60)}:{(sec % 60).toString().padStart(2, '0')}
                </div>
              ))}
            </div>

            {/* Track Lanes */}
            {state.tracks.map((track) => (
              <div
                key={track.id}
                className="h-10 border-b border-slate-800/80 relative bg-slate-900/20 flex items-center"
              >
                {/* Render clips inside this track */}
                {track.clips.map((clip) => {
                  const clipLeft = msToPixels(clip.startTimeMs);
                  const clipWidth = Math.max(12, msToPixels(clip.durationMs));
                  const isSelected = selectedClip?.clipId === clip.id;

                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClip({ trackId: track.id, clipId: clip.id });
                      }}
                      style={{
                        left: `${clipLeft}px`,
                        width: `${clipWidth}px`,
                        backgroundColor: clip.colorHex ? `${clip.colorHex}25` : '#3b82f625',
                        borderColor: clip.colorHex || '#3b82f6',
                      }}
                      className={`absolute top-1 bottom-1 rounded-lg border-2 px-2 flex items-center justify-between text-[10px] font-semibold text-slate-100 overflow-hidden cursor-pointer shadow-xs transition-shadow ${
                        isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-950' : 'hover:brightness-110'
                      }`}
                    >
                      <span className="truncate">{clip.name}</span>
                      <span className="text-[9px] text-slate-400 ml-1 font-mono">
                        {(clip.durationMs / 1000).toFixed(1)}s
                      </span>
                    </div>
                  );
                })}

                {/* Special rendering for Track 5 Captions */}
                {track.kind === 'captions' &&
                  state.captions.map((cue) => {
                    const cueLeft = msToPixels(cue.startTimeMs);
                    const cueWidth = Math.max(16, msToPixels(cue.endTimeMs - cue.startTimeMs));
                    return (
                      <div
                        key={cue.id}
                        style={{ left: `${cueLeft}px`, width: `${cueWidth}px` }}
                        className="absolute top-1 bottom-1 rounded-md bg-amber-500/20 border border-amber-500/60 px-1.5 flex items-center text-[9px] text-amber-200 truncate"
                        title={cue.text}
                      >
                        {cue.text}
                      </div>
                    );
                  })}
              </div>
            ))}

            {/* Playhead Indicator Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none"
              style={{ left: `${playheadPx}px` }}
            >
              {/* Playhead Header Scrub Handle */}
              <div className="w-3.5 h-3.5 bg-rose-500 rounded-b-md shadow-md -translate-x-[6px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
