import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  Film,
  Sparkles,
  Settings,
  Layers,
  X,
  FileText,
  Loader2,
  Play,
} from 'lucide-react';
import {
  TimelineProjectState,
  VideoExportSettings,
  ExportPreset,
  ExportResolution,
  ExportFps,
  ExportJob,
} from '../../types/editor';
import { exportEngine } from '../../services/editor/exportEngine';

interface ExportModalProps {
  isOpen: boolean;
  state: TimelineProjectState;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  state,
  onClose,
}) => {
  const [preset, setPreset] = useState<ExportPreset>('youtube_1080p');
  const [resolution, setResolution] = useState<ExportResolution>('1080p');
  const [fps, setFps] = useState<ExportFps>(30);
  const [format, setFormat] = useState<'mp4' | 'webm'>('mp4');
  const [includeCaptionsBurned, setIncludeCaptionsBurned] = useState(true);
  const [includeSeparateSrt, setIncludeSeparateSrt] = useState(true);

  const [currentJob, setCurrentJob] = useState<ExportJob | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const unsub = exportEngine.onJobUpdate((job) => {
      setCurrentJob({ ...job });
      if (job.status === 'completed' || job.status === 'failed') {
        setIsExporting(false);
      }
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  // Presets mapping
  const handleSelectPreset = (p: ExportPreset) => {
    setPreset(p);
    switch (p) {
      case 'youtube_1080p':
        setResolution('1080p');
        setFps(30);
        setFormat('mp4');
        break;
      case 'youtube_4k':
        setResolution('4k');
        setFps(60);
        setFormat('mp4');
        break;
      case 'teaching_recording':
        setResolution('1080p');
        setFps(30);
        setFormat('webm');
        break;
      case 'presentation_video':
        setResolution('720p');
        setFps(24);
        setFormat('mp4');
        break;
      case 'custom':
        break;
    }
  };

  const currentSettings: VideoExportSettings = {
    preset,
    resolution,
    fps,
    format,
    videoBitrateKbps: resolution === '4k' ? 20000 : resolution === '1080p' ? 6000 : 3000,
    audioBitrateKbps: 192,
    includeCaptionsBurned,
    includeSeparateSrt,
    includeAnnotations: true,
    includeCamera: true,
    includeBgMusic: Boolean(state.bgMusic && !state.bgMusic.isMuted),
  };

  const estimation = exportEngine.calculateEstimation(currentSettings, state.durationMs);

  const handleStartRender = async () => {
    setIsExporting(true);
    const job = await exportEngine.startExport(state, currentSettings);
    setCurrentJob(job);
  };

  return (
    <div
      id="video-export-modal"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Master Video Rendering & Export
              </h3>
              <p className="text-xs text-slate-400">
                High quality client-side video composition • Non-destructive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Active Job Progress View */}
          {isExporting || currentJob?.status === 'completed' ? (
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 space-y-4 text-center">
              {currentJob?.status === 'completed' ? (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto animate-spin">
                  <Loader2 className="w-6 h-6" />
                </div>
              )}

              <div>
                <h4 className="text-base font-bold text-slate-100">
                  {currentJob?.status === 'completed'
                    ? 'Rendering Complete!'
                    : 'Compositing Video Tracks...'}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {currentJob?.status === 'completed'
                    ? `Ready for download • ${((currentJob.actualSizeBytes || 0) / 1024 / 1024).toFixed(1)} MB`
                    : `Rendering frame buffer (${currentJob?.progressPercent || 0}%)`}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${currentJob?.progressPercent || 0}%` }}
                />
              </div>

              {/* Action Buttons when completed */}
              {currentJob?.status === 'completed' && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => currentJob && exportEngine.downloadVideo(currentJob)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Master Video</span>
                  </button>

                  <button
                    onClick={() => exportEngine.downloadSrt(state)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Download Subtitles (.SRT)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Presets Selection (Section 18) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">Export Preset</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'youtube_1080p', label: 'YouTube 1080p' },
                    { id: 'youtube_4k', label: 'YouTube 4K UHD' },
                    { id: 'teaching_recording', label: 'Class Archive' },
                    { id: 'presentation_video', label: 'Compact 720p' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPreset(p.id as ExportPreset)}
                      className={`p-2.5 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                        preset === p.id
                          ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Technical Settings Grid */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                {/* Resolution */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Resolution</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as ExportResolution)}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                  >
                    <option value="720p">720p (1280x720)</option>
                    <option value="1080p">1080p (1920x1080)</option>
                    <option value="4k">4K (3840x2160)</option>
                  </select>
                </div>

                {/* Framerate */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Framerate</label>
                  <select
                    value={fps}
                    onChange={(e) => setFps(Number(e.target.value) as ExportFps)}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                  >
                    <option value={24}>24 fps (Cinematic)</option>
                    <option value={30}>30 fps (Standard)</option>
                    <option value={60}>60 fps (Smooth)</option>
                  </select>
                </div>

                {/* Format / Container */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Container</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as 'mp4' | 'webm')}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                  >
                    <option value="mp4">MP4 (H.264 / AAC)</option>
                    <option value="webm">WebM (VP9 / Opus)</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeCaptionsBurned}
                    onChange={(e) => setIncludeCaptionsBurned(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Burn styled captions directly into video output</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeSeparateSrt}
                    onChange={(e) => setIncludeSeparateSrt(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Generate separate .SRT file for YouTube / LMS upload</span>
                </label>
              </div>

              {/* File Size & Codec Estimation (Section 19) */}
              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/70 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Export Parameters & Estimation
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[9px]">Est. Size</span>
                    <span className="font-bold text-emerald-400">{estimation.formattedSize}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[9px]">Duration</span>
                    <span className="font-bold text-slate-200">{estimation.formattedDuration}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[9px]">Video Track</span>
                    <span className="font-bold text-slate-200">{estimation.fpsText}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[9px]">Audio Track</span>
                    <span className="font-bold text-slate-200">{estimation.audioBitrateText}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isExporting && currentJob?.status !== 'completed' && (
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-start-video-render"
              onClick={handleStartRender}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Film className="w-4 h-4" />
              <span>Start Rendering</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
