import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize2,
  Volume2,
  VolumeX,
  Shield,
  Eye,
  Layers,
  Sparkles,
  Camera,
} from 'lucide-react';
import { TimelineProjectState, CaptionCue, VisualEmphasisEffect } from '../../types/editor';

interface EditorPreviewPlayerProps {
  state: TimelineProjectState;
  onTimeUpdate: (timeMs: number) => void;
  onTogglePlay: () => void;
}

export const EditorPreviewPlayer: React.FC<EditorPreviewPlayerProps> = ({
  state,
  onTimeUpdate,
  onTogglePlay,
}) => {
  const [showSafeArea, setShowSafeArea] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const mainVideoClip = state.tracks
    .find((t) => t.kind === 'main_video')
    ?.clips.find((c) => c.startTimeMs <= state.currentTimeMs && state.currentTimeMs < c.startTimeMs + c.durationMs);

  const cameraTrack = state.tracks.find((t) => t.kind === 'teacher_camera');
  const isCameraVisible = cameraTrack && !cameraTrack.isHidden && !cameraTrack.isMuted;

  // Active caption cue
  const activeCaption = state.captions.find(
    (c) => c.startTimeMs <= state.currentTimeMs && state.currentTimeMs <= c.endTimeMs
  );

  // Active visual zoom effect
  const activeZoom = state.visualEffects.find(
    (v) => v.isEnabled && v.startTimeMs <= state.currentTimeMs && state.currentTimeMs <= v.startTimeMs + v.durationMs
  );

  const formatTimecode = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const f = Math.floor((ms % 1000) / 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${f}`;
  };

  const handleStep = (deltaMs: number) => {
    const newTime = Math.max(0, Math.min(state.durationMs, state.currentTimeMs + deltaMs));
    onTimeUpdate(newTime);
  };

  // Caption style classes
  const getCaptionStyles = (cue: CaptionCue) => {
    switch (cue.stylePreset) {
      case 'teaching':
        return 'bg-amber-950/80 text-amber-200 border border-amber-500/40 text-sm font-bold shadow-lg';
      case 'youtube':
        return 'bg-black/90 text-yellow-300 font-extrabold uppercase tracking-wide text-sm shadow-xl';
      case 'highlight':
        return 'bg-indigo-900/90 text-white font-bold border-2 border-indigo-400 text-sm shadow-2xl';
      case 'simple':
      default:
        return 'bg-black/75 text-white text-xs font-semibold';
    }
  };

  return (
    <div
      id="video-editor-preview-container"
      className="flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl select-none"
    >
      {/* 1. PREVIEW MONITOR STAGE */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        {/* Main Video Feed */}
        {mainVideoClip?.blobUrl ? (
          <video
            ref={videoRef}
            src={mainVideoClip.blobUrl}
            className={`w-full h-full object-contain transition-transform duration-500 ${
              activeZoom ? 'scale-125 translate-x-[-10%] translate-y-[-5%]' : 'scale-100'
            }`}
          />
        ) : (
          <div
            className={`w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 transition-transform duration-500 ${
              activeZoom ? 'scale-125' : 'scale-100'
            }`}
          >
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
              <Layers className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white max-w-md">{state.title}</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Non-destructive teaching canvas • Multi-track synchronizer active
            </p>
          </div>
        )}

        {/* Safe Area 90% Guide Overlay (Section 8 & 17) */}
        {showSafeArea && (
          <div className="absolute inset-[5%] border border-dashed border-yellow-400/50 pointer-events-none flex flex-col justify-between p-2">
            <span className="text-[10px] text-yellow-400 font-mono tracking-wider bg-black/60 px-1.5 py-0.5 rounded self-start">
              TITLE SAFE 90%
            </span>
            <span className="text-[10px] text-yellow-400 font-mono tracking-wider bg-black/60 px-1.5 py-0.5 rounded self-end">
              ACTION SAFE
            </span>
          </div>
        )}

        {/* Teacher Camera Overlay (Track 2) */}
        {isCameraVisible && (
          <div className="absolute top-4 right-4 z-20 w-32 sm:w-40 aspect-video rounded-xl overflow-hidden border-2 border-indigo-500/60 bg-slate-900 shadow-2xl flex flex-col items-center justify-center text-indigo-300">
            <Camera className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">Teacher Cam</span>
            <span className="text-[9px] text-slate-400">Track 2 (Synced)</span>
          </div>
        )}

        {/* AI Focus Zoom Indicator */}
        {activeZoom && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600/90 text-white rounded-lg text-[11px] font-bold shadow-lg animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Focus Zoom (1.25x)</span>
          </div>
        )}

        {/* Captions Overlay (Track 5) */}
        {activeCaption && (
          <div
            className="absolute z-20 left-0 right-0 px-6 flex justify-center pointer-events-none"
            style={{ bottom: `${100 - (activeCaption.positionYPercent || 86)}%` }}
          >
            <div className={`px-4 py-2 rounded-xl text-center max-w-2xl ${getCaptionStyles(activeCaption)}`}>
              {activeCaption.text}
            </div>
          </div>
        )}
      </div>

      {/* 2. MONITOR CONTROLS & TIMECODE */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
        {/* Left: Timecode */}
        <div className="flex items-center gap-2 font-mono">
          <span className="text-white font-bold bg-slate-800 px-2 py-1 rounded-md text-xs border border-slate-700">
            {formatTimecode(state.currentTimeMs)}
          </span>
          <span className="text-slate-500">/</span>
          <span className="text-slate-400 text-xs">{formatTimecode(state.durationMs)}</span>
        </div>

        {/* Center: Playback Transport Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleStep(-5000)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Step Back 5s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            id="btn-editor-play-pause"
            onClick={onTogglePlay}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md active:scale-95 transition-all cursor-pointer"
            title={state.isPlaying ? 'Pause' : 'Play'}
          >
            {state.isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => handleStep(5000)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Step Forward 5s"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Tools, Safe Area & Volume */}
        <div className="flex items-center gap-2">
          {/* Safe Area Toggle */}
          <button
            onClick={() => setShowSafeArea(!showSafeArea)}
            className={`p-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              showSafeArea
                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                : 'text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
            title="Toggle Title Safe Area Guides"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Safe Area</span>
          </button>

          {/* Volume */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
