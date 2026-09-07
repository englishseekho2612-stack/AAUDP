import React from 'react';
import { TeachingStudioLayout, ActiveContentMode } from '../../types/teaching';
import {
  Video,
  Mic,
  Maximize2,
  Minimize2,
  Settings,
  Circle,
  Square,
  Radio,
  Users,
  Eye,
  ArrowLeft,
  Sliders,
  Layers,
} from 'lucide-react';
import { Badge } from '../common/UIControls';

interface TeachingTopBarProps {
  projectName: string;
  activeLayout: TeachingStudioLayout;
  onLayoutChange: (layout: TeachingStudioLayout) => void;
  contentMode: ActiveContentMode;
  onContentModeChange: (mode: ActiveContentMode) => void;
  currentSlideIndex: number;
  totalSlides: number;
  selectedTopicTitle?: string;
  isRecording: boolean;
  recordingFormattedTime: string;
  onStartRecordingClick: () => void;
  onStopRecordingClick: () => void;
  onOpenAudioSettings: () => void;
  onOpenCameraSettings: () => void;
  onOpenStudentViewPreview: () => void;
  onOpenYouTubeLiveModal: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onExitStudio: () => void;
  classCode?: string;
  studentCount?: number;
  raisedHandsCount?: number;
  onOpenClassroomPanel?: () => void;
}

export const TeachingTopBar: React.FC<TeachingTopBarProps> = ({
  projectName,
  activeLayout,
  onLayoutChange,
  contentMode,
  onContentModeChange,
  currentSlideIndex,
  totalSlides,
  selectedTopicTitle,
  isRecording,
  recordingFormattedTime,
  onStartRecordingClick,
  onStopRecordingClick,
  onOpenAudioSettings,
  onOpenCameraSettings,
  onOpenStudentViewPreview,
  onOpenYouTubeLiveModal,
  isFullscreen,
  onToggleFullscreen,
  onExitStudio,
  classCode,
  studentCount = 0,
  raisedHandsCount = 0,
  onOpenClassroomPanel,
}) => {
  return (
    <header
      id="teaching-studio-top-bar"
      className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 flex items-center justify-between gap-2 select-none z-30 shrink-0"
    >
      {/* Left: Exit Studio + Project Info & Lesson Tracker */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          id="btn-exit-teaching-studio"
          onClick={onExitStudio}
          title="Exit Teaching Studio"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exit Studio</span>
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[140px] sm:max-w-[220px]">
              {projectName}
            </h1>
            <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Studio
            </span>
          </div>

          {/* Current Slide / Topic tracker (Section 4) */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {contentMode === 'slides' ? (
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                Slide {totalSlides > 0 ? `${currentSlideIndex + 1} / ${totalSlides}` : '0 / 0'}
              </span>
            ) : contentMode === 'mind_map' || contentMode === 'visual_tree' ? (
              <span className="truncate">
                {contentMode === 'visual_tree' ? 'Tree Topic: ' : 'Topic: '}
                <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  {selectedTopicTitle || 'Root Overview'}
                </strong>
              </span>
            ) : (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Digital Whiteboard Canvas
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center: Content & Layout switchers */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Content Mode Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            id="tab-mode-slides"
            onClick={() => onContentModeChange('slides')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              contentMode === 'slides'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Slides
          </button>
          <button
            id="tab-mode-mindmap"
            onClick={() => onContentModeChange('mind_map')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              contentMode === 'mind_map'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Mind Map
          </button>
          <button
            id="tab-mode-visual-tree"
            onClick={() => onContentModeChange('visual_tree')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              contentMode === 'visual_tree'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Visual Tree
          </button>
          <button
            id="tab-mode-whiteboard"
            onClick={() => onContentModeChange('whiteboard')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              contentMode === 'whiteboard'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Whiteboard
          </button>
        </div>

        {/* Layout dropdown */}
        <div className="flex items-center gap-1">
          <select
            id="select-studio-layout"
            value={activeLayout}
            onChange={(e) => onLayoutChange(e.target.value as TeachingStudioLayout)}
            className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="presentation_only">Presentation Only</option>
            <option value="presentation_camera">Presentation + Camera</option>
            <option value="mind_map_detail">Mind Map + Detail Panel</option>
            <option value="split_view">Split View</option>
            <option value="teacher_content">Teacher + Content</option>
            <option value="whiteboard_only">Whiteboard Only</option>
          </select>
        </div>
      </div>

      {/* Right: Record status + Part 05 previews + Settings + Fullscreen */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* RECORDING CONTROL & TIMER (Section 38 & 39) */}
        {isRecording ? (
          <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-2.5 py-1 rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping shrink-0" />
            <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-300">
              {recordingFormattedTime}
            </span>
            <button
              id="btn-stop-recording-topbar"
              onClick={onStopRecordingClick}
              className="ml-1 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded cursor-pointer transition-colors"
            >
              Stop
            </button>
          </div>
        ) : (
          <button
            id="btn-start-recording-topbar"
            onClick={onStartRecordingClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Circle className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Record</span>
          </button>
        )}

        {/* Part 05 Interactive Classroom Panel button */}
        {classCode && onOpenClassroomPanel && (
          <button
            id="btn-topbar-classroom-panel"
            onClick={onOpenClassroomPanel}
            title={`Interactive Classroom (${studentCount} students connected)`}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-mono text-[11px] hidden sm:inline">{classCode}</span>
            {studentCount > 0 && (
              <span className="text-[10px] bg-blue-600 text-white font-mono px-1.5 py-0.2 rounded-full">
                {studentCount}
              </span>
            )}
            {raisedHandsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>
        )}

        {/* Part 05 Classroom Student View Preview button */}
        <button
          id="btn-preview-student-view"
          onClick={onOpenStudentViewPreview}
          title="Student View Preview (Part 05 Integration)"
          className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer hidden sm:inline-flex"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Part 05 YouTube Live Broadcast Hub button */}
        <button
          id="btn-open-youtube-live-hub"
          onClick={onOpenYouTubeLiveModal}
          title="YouTube Live Broadcast Hub (Part 05 Integration)"
          className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 rounded-lg transition-colors cursor-pointer hidden md:inline-flex"
        >
          <Radio className="w-4 h-4" />
        </button>

        {/* Mic & DSP Settings trigger */}
        <button
          id="btn-topbar-audio-settings"
          onClick={onOpenAudioSettings}
          title="Microphone & Audio DSP Settings"
          className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Camera Settings trigger */}
        <button
          id="btn-topbar-camera-settings"
          onClick={onOpenCameraSettings}
          title="Camera Device Settings"
          className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          <Video className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle (Section 55) */}
        <button
          id="btn-toggle-fullscreen"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen Studio'}
          className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
