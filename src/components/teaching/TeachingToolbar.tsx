import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PenTool,
  Highlighter,
  Eraser,
  Type,
  Minus,
  ArrowRight,
  Square,
  Circle,
  Sparkles,
  BookOpen,
  Camera,
  Snowflake,
  Undo2,
  Redo2,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  Sliders,
  Volume2,
  Radio,
  Zap,
} from 'lucide-react';
import {
  AnnotationTool,
  CameraLayoutMode,
  ActiveContentMode,
} from '../../types/teaching';

interface TeachingToolbarProps {
  // Mic
  isMicMuted: boolean;
  micLevel: number;
  onToggleMute: () => void;
  onOpenAudioSettings: () => void;

  // Camera
  isCameraActive: boolean;
  cameraLayout: CameraLayoutMode;
  onToggleCamera: () => void;
  onChangeCameraLayout: (layout: CameraLayoutMode) => void;

  // Content
  contentMode: ActiveContentMode;
  onContentModeChange: (mode: ActiveContentMode) => void;

  // Whiteboard / Annotation Tools
  activeTool: AnnotationTool;
  onSelectTool: (tool: AnnotationTool) => void;
  penColor: string;
  onChangePenColor: (color: string) => void;
  penSize: number;
  onChangePenSize: (size: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClearAnnotations: () => void;
  showAnnotations: boolean;
  onToggleShowAnnotations: () => void;

  // Freeze & Snapshot
  isFrozen: boolean;
  onToggleFreeze: () => void;
  onCaptureSnapshot: () => void;

  // AI & Notes
  onOpenAIAssistant: () => void;
  onOpenTeacherNotes: () => void;

  // Voice Command Push-to-Talk (Section 32)
  isPushToTalkActive: boolean;
  onPushToTalkDown: () => void;
  onPushToTalkUp: () => void;
  voiceCommandAvailable: boolean;
}

const PEN_COLORS = [
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#ffffff', // White
  '#0f172a', // Dark slate
];

export const TeachingToolbar: React.FC<TeachingToolbarProps> = ({
  isMicMuted,
  micLevel,
  onToggleMute,
  onOpenAudioSettings,
  isCameraActive,
  cameraLayout,
  onToggleCamera,
  onChangeCameraLayout,
  contentMode,
  onContentModeChange,
  activeTool,
  onSelectTool,
  penColor,
  onChangePenColor,
  penSize,
  onChangePenSize,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearAnnotations,
  showAnnotations,
  onToggleShowAnnotations,
  isFrozen,
  onToggleFreeze,
  onCaptureSnapshot,
  onOpenAIAssistant,
  onOpenTeacherNotes,
  isPushToTalkActive,
  onPushToTalkDown,
  onPushToTalkUp,
  voiceCommandAvailable,
}) => {
  const [showPenMenu, setShowPenMenu] = useState(false);
  const [showCameraMenu, setShowCameraMenu] = useState(false);

  return (
    <aside
      id="teaching-controls-toolbar"
      aria-label="Teaching Controls"
      className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 flex flex-wrap items-center justify-between gap-2 max-w-full z-20 shrink-0"
    >
      {/* SECTION A: AUDIO & CAMERA CONTROLS */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Mic toggle with dynamic level meter */}
        <div className="relative flex items-center">
          <button
            id="btn-toolbar-mic-toggle"
            onClick={onToggleMute}
            title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
              isMicMuted
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
            }`}
          >
            {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span className="hidden sm:inline">{isMicMuted ? 'Muted' : 'Mic On'}</span>
            {/* Real-time Level Pill */}
            {!isMicMuted && (
              <span
                className="w-1.5 h-3 bg-emerald-500 rounded-full transition-transform"
                style={{ transform: `scaleY(${Math.max(0.2, micLevel * 2.5)})` }}
              />
            )}
          </button>

          <button
            id="btn-toolbar-mic-settings"
            onClick={onOpenAudioSettings}
            title="Audio DSP Settings"
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer min-h-[44px]"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Camera toggle & layout popover */}
        <div className="relative">
          <div className="flex items-center">
            <button
              id="btn-toolbar-camera-toggle"
              onClick={onToggleCamera}
              title={isCameraActive ? 'Turn Camera Off' : 'Turn Camera On'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
                isCameraActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {isCameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              <span className="hidden sm:inline">{isCameraActive ? 'Cam On' : 'Cam Off'}</span>
            </button>

            {isCameraActive && (
              <button
                id="btn-toolbar-camera-layout"
                onClick={() => setShowCameraMenu(!showCameraMenu)}
                title="Camera Overlay Layout"
                className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer min-h-[44px]"
              >
                <ChevronUp className={`w-3.5 h-3.5 transition-transform ${showCameraMenu ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          {/* Camera layout dropdown */}
          {showCameraMenu && isCameraActive && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl w-48 space-y-1 z-50">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-2 block">
                Camera Layout
              </span>
              {[
                { id: 'bubble', label: 'Floating Bubble' },
                { id: 'pip', label: 'Picture-in-Picture' },
                { id: 'side_by_side', label: 'Side by Side' },
                { id: 'fullscreen', label: 'Teacher Fullscreen' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onChangeCameraLayout(opt.id as CameraLayoutMode);
                    setShowCameraMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    cameraLayout === opt.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION B: WHITEBOARD & ANNOTATION TOOLS (Sections 22 - 28) */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Pen tool popover */}
        <div className="relative">
          <button
            id="btn-tool-pen"
            onClick={() => {
              if (activeTool === 'pen') {
                setShowPenMenu(!showPenMenu);
              } else {
                onSelectTool('pen');
                setShowPenMenu(true);
              }
            }}
            title="Pen Tool (Click again for sizes & colors)"
            className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
              activeTool === 'pen'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PenTool className="w-4 h-4" style={{ color: activeTool === 'pen' ? '#fff' : penColor }} />
            <span className="hidden md:inline">Pen</span>
          </button>

          {/* Pen Color & Size Popover */}
          {showPenMenu && (
            <div className="absolute bottom-full left-0 mb-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl w-60 space-y-3 z-50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Pen Colors</span>
                <span
                  className="w-4 h-4 rounded-full border border-slate-300"
                  style={{ backgroundColor: penColor }}
                />
              </div>

              {/* Colors Grid */}
              <div className="grid grid-cols-4 gap-2">
                {PEN_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => onChangePenColor(c)}
                    className={`w-7 h-7 rounded-full border cursor-pointer transition-transform ${
                      penColor === c ? 'scale-110 ring-2 ring-indigo-500 ring-offset-2' : 'border-slate-300'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Stroke Size */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Stroke Size</span>
                  <span className="font-bold">{penSize}px</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="24"
                  value={penSize}
                  onChange={(e) => onChangePenSize(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <button
                onClick={() => setShowPenMenu(false)}
                className="w-full py-1 text-center text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                Close Menu
              </button>
            </div>
          )}
        </div>

        {/* Highlighter */}
        <button
          id="btn-tool-highlighter"
          onClick={() => onSelectTool('highlighter')}
          title="Highlighter"
          className={`p-2 sm:px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
            activeTool === 'highlighter'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Highlighter className="w-4 h-4" />
        </button>

        {/* Laser Pointer (Section 28) */}
        <button
          id="btn-tool-laser"
          onClick={() => onSelectTool('laser')}
          title="Laser Pointer (Fading temporary dot)"
          className={`p-2 sm:px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
            activeTool === 'laser'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Radio className="w-4 h-4" />
        </button>

        {/* Arrow / Line / Shapes */}
        <button
          id="btn-tool-arrow"
          onClick={() => onSelectTool('arrow')}
          title="Arrow Tool"
          className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
            activeTool === 'arrow'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          id="btn-tool-rect"
          onClick={() => onSelectTool('rect')}
          title="Rectangle Tool"
          className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] hidden sm:inline-flex ${
            activeTool === 'rect'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Square className="w-4 h-4" />
        </button>

        <button
          id="btn-tool-circle"
          onClick={() => onSelectTool('circle')}
          title="Circle Tool"
          className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] hidden sm:inline-flex ${
            activeTool === 'circle'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Circle className="w-4 h-4" />
        </button>

        {/* Text */}
        <button
          id="btn-tool-text"
          onClick={() => onSelectTool('text')}
          title="Text Tool"
          className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] hidden sm:inline-flex ${
            activeTool === 'text'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Type className="w-4 h-4" />
        </button>

        {/* Eraser */}
        <button
          id="btn-tool-eraser"
          onClick={() => onSelectTool('eraser')}
          title="Eraser Tool"
          className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
            activeTool === 'eraser'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Eraser className="w-4 h-4" />
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            id="btn-undo-annotation"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            id="btn-redo-annotation"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Show/Hide Annotations */}
        <button
          id="btn-toggle-show-annotations"
          onClick={onToggleShowAnnotations}
          title={showAnnotations ? 'Hide Annotations' : 'Show Annotations'}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer min-h-[44px]"
        >
          {showAnnotations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Clear Annotations */}
        <button
          id="btn-clear-annotations"
          onClick={onClearAnnotations}
          title="Clear Current Annotations"
          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer min-h-[44px]"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* SECTION C: FREEZE, SNAPSHOT, AI, NOTES, PUSH-TO-TALK */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Freeze Screen (Section 25) */}
        <button
          id="btn-freeze-screen"
          onClick={onToggleFreeze}
          title={isFrozen ? 'Resume Normal Screen' : 'Freeze Screen for Annotation'}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
            isFrozen
              ? 'bg-cyan-500 text-white animate-pulse shadow-md'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Snowflake className="w-4 h-4" />
          <span className="hidden md:inline">{isFrozen ? 'Resume' : 'Freeze'}</span>
        </button>

        {/* Capture Snapshot (Section 27) */}
        <button
          id="btn-capture-snapshot"
          onClick={onCaptureSnapshot}
          title="Capture Snapshot Image (Canvas + Annotations)"
          className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer min-h-[44px]"
        >
          <Camera className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        {/* AI Assistant (Section 65) */}
        <button
          id="btn-open-ai-assistant"
          onClick={onOpenAIAssistant}
          title="Open AI Studio Assistant"
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer min-h-[44px]"
        >
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="hidden lg:inline">AI Help</span>
        </button>

        {/* Private Teacher Notes (Section 7) */}
        <button
          id="btn-open-teacher-notes"
          onClick={onOpenTeacherNotes}
          title="Open Private Teacher Notes"
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer min-h-[44px]"
        >
          <BookOpen className="w-4 h-4 text-amber-600" />
          <span className="hidden lg:inline">Notes</span>
        </button>

        {/* Voice Command Push-to-Talk (Section 31-32) */}
        {voiceCommandAvailable && (
          <button
            id="btn-push-to-talk"
            onMouseDown={onPushToTalkDown}
            onMouseUp={onPushToTalkUp}
            onTouchStart={onPushToTalkDown}
            onTouchEnd={onPushToTalkUp}
            title="Hold to speak AI Voice Command (e.g. 'Next slide', 'Open whiteboard')"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none min-h-[44px] ${
              isPushToTalkActive
                ? 'bg-purple-600 text-white ring-4 ring-purple-300 animate-pulse'
                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">{isPushToTalkActive ? 'Listening...' : 'Voice Cmd'}</span>
          </button>
        )}
      </div>
    </aside>
  );
};
