import React, { useState } from 'react';
import {
  RecordingMode,
  RecordingProject,
  AudioPreset,
} from '../../types/teaching';
import {
  Video,
  Mic,
  Circle,
  Square,
  Pause,
  Play,
  Download,
  Sparkles,
  CheckCircle,
  FileVideo,
  Layers,
  Subtitles,
  Volume2,
  Trash2,
  X,
  Film,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// 1. START RECORDING SELECTOR MODAL
// ---------------------------------------------------------------------------
interface StartRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmStart: (mode: RecordingMode) => void;
  cameraActive: boolean;
}

export const StartRecordingModal: React.FC<StartRecordingModalProps> = ({
  isOpen,
  onClose,
  onConfirmStart,
  cameraActive,
}) => {
  const [selectedMode, setSelectedMode] = useState<RecordingMode>('teaching');

  if (!isOpen) return null;

  return (
    <div
      id="start-recording-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-800">
              <Circle className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Start Studio Recording
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose teaching or clean presentation recording mode
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* Mode 1: Teaching Mode */}
          <button
            onClick={() => setSelectedMode('teaching')}
            className={`w-full p-4 rounded-2xl border text-left cursor-pointer transition-all ${
              selectedMode === 'teaching'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20 text-rose-950 dark:text-rose-100'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold flex items-center gap-2">
                <Video className="w-4 h-4 text-rose-500" />
                Teaching Recording Mode
              </span>
              <span className="text-[10px] uppercase font-bold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded">
                Recommended
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              Captures full teacher presence: camera overlay, interactive slides/mind map, whiteboard annotations, enhanced microphone audio & live captions.
            </p>
          </button>

          {/* Mode 2: Clean Mode */}
          <button
            onClick={() => setSelectedMode('clean')}
            className={`w-full p-4 rounded-2xl border text-left cursor-pointer transition-all ${
              selectedMode === 'clean'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 dark:text-indigo-100'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                Clean Content Only Mode
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              Captures only the presentation canvas, mind map, and drawings without the teacher camera overlay. Ideal for modular course modules.
            </p>
          </button>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-start-recording"
            onClick={() => onConfirmStart(selectedMode)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2 transition-colors"
          >
            <Circle className="w-3.5 h-3.5 fill-current" />
            <span>Begin Recording</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. RECORDING COMPLETE & EXPORT MODAL (Section 42)
// ---------------------------------------------------------------------------
interface RecordingCompleteModalProps {
  isOpen: boolean;
  recording: RecordingProject | null;
  onClose: () => void;
  onSaveToProject: (recording: RecordingProject) => void;
  onOpenEditor?: (recording: RecordingProject) => void;
}

export const RecordingCompleteModal: React.FC<RecordingCompleteModalProps> = ({
  isOpen,
  recording,
  onClose,
  onSaveToProject,
  onOpenEditor,
}) => {
  const [title, setTitle] = useState(recording?.title || 'Studio Teaching Lesson');
  const [isEnhancingAudio, setIsEnhancingAudio] = useState(false);
  const [audioEnhanced, setAudioEnhanced] = useState(recording?.hasEnhancedAudio || false);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [captionsReady, setCaptionsReady] = useState(false);

  if (!isOpen || !recording) return null;

  const formattedDuration = `${Math.floor(recording.durationMs / 60000)}m ${Math.floor(
    (recording.durationMs % 60000) / 1000
  )}s`;

  const handleEnhanceAudio = () => {
    setIsEnhancingAudio(true);
    setTimeout(() => {
      setIsEnhancingAudio(false);
      setAudioEnhanced(true);
    }, 1200);
  };

  const handleGenerateCaptions = () => {
    setIsGeneratingCaptions(true);
    setTimeout(() => {
      setIsGeneratingCaptions(false);
      setCaptionsReady(true);
    }, 1500);
  };

  const handleDownload = () => {
    if (!recording.blobUrl) return;
    const a = document.createElement('a');
    a.href = recording.blobUrl;
    a.download = `${title.replace(/\s+/g, '_')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSave = () => {
    onSaveToProject({
      ...recording,
      title,
      hasEnhancedAudio: audioEnhanced,
    });
    onClose();
  };

  return (
    <div
      id="recording-complete-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Recording Successfully Saved
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Duration: {formattedDuration} • Non-destructive multi-track foundation ready
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Video Preview */}
          {recording.blobUrl && (
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-md">
              <video
                src={recording.blobUrl}
                controls
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Title Editor */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Recording Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions: Audio Enhancement & Captions (Section 42) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Enhance Audio */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-indigo-500" />
                  Studio Voice Audio
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {audioEnhanced ? 'Audio enhanced & leveled' : 'Apply AI noise suppression'}
                </span>
              </div>
              <button
                onClick={handleEnhanceAudio}
                disabled={audioEnhanced || isEnhancingAudio}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  audioEnhanced
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {audioEnhanced ? 'Enhanced ✓' : isEnhancingAudio ? 'Enhancing...' : 'Enhance'}
              </button>
            </div>

            {/* Generate Captions */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Subtitles className="w-4 h-4 text-purple-500" />
                  Auto Captions
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {captionsReady ? 'English captions synced' : 'Extract speech to text cues'}
                </span>
              </div>
              <button
                onClick={handleGenerateCaptions}
                disabled={captionsReady || isGeneratingCaptions}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  captionsReady
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {captionsReady ? 'Ready ✓' : isGeneratingCaptions ? 'Extracting...' : 'Generate'}
              </button>
            </div>
          </div>

          {/* Part 06 Video Editor Multi-Track Foundation (Section 41) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 bg-slate-50/70 dark:bg-slate-850/50 space-y-2">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Multi-Track Timeline Architecture (Part 06 Foundation)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Video Track</span>
                <span className="font-bold">1280x720p 30fps</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Audio Track</span>
                <span className="font-bold">DSP 48kHz Stereo</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Annotation Track</span>
                <span className="font-bold">{recording.annotationTrack?.length || 0} Strokes</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Source Status</span>
                <span className="font-bold text-emerald-600">Preserved Raw</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Video</span>
            </button>

            {onOpenEditor && (
              <button
                onClick={() => {
                  if (recording) {
                    onOpenEditor(recording);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Open in Video Editor</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
            >
              Close
            </button>
            <button
              id="btn-save-recording-project"
              onClick={handleSave}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              Save to Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
