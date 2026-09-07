import React, { useState } from 'react';
import { LearningSource } from '../../types/project';
import { Button, Badge } from '../common/UIControls';
import {
  X,
  FileText,
  Youtube,
  Globe,
  Image as ImageIcon,
  Clock,
  HardDrive,
  Layers,
  AlertCircle,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';

interface SourceDetailsModalProps {
  source: LearningSource | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SourceDetailsModal: React.FC<SourceDetailsModalProps> = ({
  source,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'metadata' | 'segments' | 'raw'>('metadata');

  if (!isOpen || !source) return null;

  const handleCopyText = () => {
    if (source.extractedText) {
      navigator.clipboard.writeText(source.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const segments = source.segments || [];

  return (
    <div
      id="source-details-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-left"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        id="source-details-modal-container"
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {source.type.toUpperCase()} SPECIFICATION
                </span>
                <Badge variant={source.status === 'ready' ? 'success' : source.status === 'error' ? 'warning' : 'neutral'}>
                  {source.status.toUpperCase()}
                </Badge>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                {source.name}
              </h2>
            </div>
          </div>

          <button
            id="btn-close-source-details"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 text-xs font-semibold bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={() => setActiveTab('metadata')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'metadata'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Overview & Metadata
          </button>
          <button
            onClick={() => setActiveTab('segments')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'segments'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Segments & Citations</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">
              {segments.length}
            </span>
          </button>
          {source.extractedText && (
            <button
              onClick={() => setActiveTab('raw')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'raw'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Extracted Text Stream
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* TAB 1: METADATA */}
          {activeTab === 'metadata' && (
            <div className="space-y-4">
              {source.errorMessage && (
                <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Processing Error:</span>
                    <p className="mt-0.5">{source.errorMessage}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Source ID</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200 break-all">{source.id}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Date Added</span>
                  <span className="text-slate-700 dark:text-slate-200">
                    {new Date(source.createdTimestamp).toLocaleString()}
                  </span>
                </div>

                {source.metadata.fileSize !== undefined && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">File Size</span>
                    <span className="text-slate-700 dark:text-slate-200">
                      {(source.metadata.fileSize / 1024).toFixed(1)} KB ({(source.metadata.fileSize / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                )}

                {source.metadata.pageCount !== undefined && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Document Page Count</span>
                    <span className="text-slate-700 dark:text-slate-200 font-semibold">{source.metadata.pageCount} Pages</span>
                  </div>
                )}

                {source.metadata.slideCount !== undefined && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Slide Count</span>
                    <span className="text-slate-700 dark:text-slate-200 font-semibold">{source.metadata.slideCount} Slides</span>
                  </div>
                )}

                {source.metadata.dimensions && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Image Dimensions</span>
                    <span className="text-slate-700 dark:text-slate-200 font-semibold">
                      {source.metadata.dimensions.width} × {source.metadata.dimensions.height} px
                    </span>
                  </div>
                )}

                {source.wordCount !== undefined && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Word Count</span>
                    <span className="text-slate-700 dark:text-slate-200 font-semibold">
                      {source.wordCount.toLocaleString()} Words ({source.characterCount?.toLocaleString()} characters)
                    </span>
                  </div>
                )}

                {source.metadata.videoId && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">YouTube Video ID</span>
                    <span className="font-mono text-slate-700 dark:text-slate-200">{source.metadata.videoId}</span>
                  </div>
                )}

                {source.metadata.domain && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Web Domain</span>
                    <span className="text-slate-700 dark:text-slate-200">{source.metadata.domain}</span>
                  </div>
                )}
              </div>

              {/* Status explanation */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                  Processing Status Message:
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {source.statusMessage || 'All structural segments are extracted and normalized for the AI Engine.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SEGMENTS & CITATIONS */}
          {activeTab === 'segments' && (
            <div className="space-y-3">
              <p className="text-slate-500 dark:text-slate-400">
                These {segments.length} segment(s) preserve exact page/slide/timestamp coordinates so Gemini in Part 03 can provide accurate source citations:
              </p>

              {segments.length === 0 ? (
                <div className="p-6 text-center text-slate-400 border border-dashed rounded-lg">
                  No structural segments generated for this source.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {segments.map((seg, idx) => (
                    <div
                      key={seg.segmentId || idx}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-indigo-600 dark:text-indigo-400">
                          {seg.location}
                        </span>
                        {seg.heading && (
                          <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs">
                            {seg.heading}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap line-clamp-4 text-[11px] leading-relaxed">
                        {seg.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RAW EXTRACTED STREAM */}
          {activeTab === 'raw' && source.extractedText && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  Full text stream ({source.characterCount?.toLocaleString()} characters)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyText}
                  icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copied ? 'Copied' : 'Copy All'}
                </Button>
              </div>
              <textarea
                readOnly
                value={source.extractedText}
                rows={12}
                className="w-full p-3 font-mono text-[11px] bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
