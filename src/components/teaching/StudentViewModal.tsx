import React, { useState } from 'react';
import { Eye, X, ShieldCheck, Check, ExternalLink, Copy, Users } from 'lucide-react';

interface StudentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  currentSlideIndex: number;
  totalSlides: number;
  contentMode: string;
  hasCamera: boolean;
  classCode?: string;
  onOpenLiveStudentView?: () => void;
}

export const StudentViewModal: React.FC<StudentViewModalProps> = ({
  isOpen,
  onClose,
  projectName,
  currentSlideIndex,
  totalSlides,
  contentMode,
  hasCamera,
  classCode = 'STUDIO1',
  onOpenLiveStudentView,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#student?code=${classCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="student-view-modal"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>Classroom Student View Preview</span>
                <span className="text-[10px] uppercase font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                  Live Classroom
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Exact synchronized feed seen by connected students on their devices
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

        {/* Action toolbar */}
        <div className="px-5 py-2.5 bg-slate-100/60 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">Room Code:</span>
            <span className="font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
              {classCode}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Link Copied' : 'Copy Join Link'}</span>
            </button>

            {onOpenLiveStudentView && (
              <button
                onClick={() => {
                  onClose();
                  onOpenLiveStudentView();
                }}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
              >
                <span>Launch Student Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Simulated Student Screen Viewport */}
        <div className="p-5 space-y-4">
          <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex flex-col justify-between p-6 text-white">
            {/* Clean student header */}
            <div className="flex items-center justify-between text-xs z-10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-400">
                  LIVE CLASSROOM
                </span>
              </div>
              <span className="text-slate-400 text-[11px] font-mono">
                Slide {currentSlideIndex + 1} / {totalSlides}
              </span>
            </div>

            {/* Central presentation topic */}
            <div className="space-y-2 max-w-md z-10">
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                {contentMode.toUpperCase()}
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
                {projectName}
              </h2>
              <p className="text-xs text-slate-300 line-clamp-2">
                Live interactive masterclass presentation with dual-canvas synchronized slides and
                3D concepts.
              </p>
            </div>

            {/* Student footer feedback */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 z-10">
              <span>Interactive Student Client</span>
              <span className="text-emerald-400 font-semibold">Teacher Notes: Hidden</span>
            </div>

            {/* Teacher camera thumbnail */}
            {hasCamera && (
              <div className="absolute top-4 right-4 w-28 h-20 rounded-xl bg-slate-800 border border-slate-700 shadow-lg overflow-hidden flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"
                  alt="Instructor"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Privacy & Safety Audit */}
          <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-200 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Strict Privacy Confirmed</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Teacher speaker notes, telemetry settings, camera configurations, and private student
              chats are never transmitted to this broadcast view.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
