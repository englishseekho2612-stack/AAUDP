import React, { useState, useRef } from 'react';
import {
  LearningSource,
  SourceType,
  SourcePriority,
  SupportedLanguage,
} from '../../types/project';
import {
  sourcePipeline,
  MAX_SOURCES,
  DuplicateCheckResult,
} from '../../services/sourcePipeline';
import { Button } from '../common/UIControls';
import { DesktopService } from '../../services/desktop/desktopService';
import {
  X,
  Upload,
  FileText,
  Youtube,
  Globe,
  Presentation,
  FileSpreadsheet,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface AddSourceModalProps {
  projectId: string;
  existingSources: LearningSource[];
  isOpen: boolean;
  onClose: () => void;
  onSourceAdded: (newSource: LearningSource, replacedSourceId?: string) => void;
  replaceTargetSource?: LearningSource | null;
}

type TabType = 'file' | 'youtube' | 'web' | 'text';

export const AddSourceModal: React.FC<AddSourceModalProps> = ({
  projectId,
  existingSources,
  isOpen,
  onClose,
  onSourceAdded,
  replaceTargetSource,
}) => {
  const isReplacing = !!replaceTargetSource;
  const currentCount = existingSources.length;
  const isAtLimit = !isReplacing && currentCount >= MAX_SOURCES;

  const [activeTab, setActiveTab] = useState<TabType>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [priority, setPriority] = useState<SourcePriority>(
    currentCount === 0 ? 'primary' : 'supporting'
  );

  // Form states
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [youtubeTranscript, setYoutubeTranscript] = useState('');

  const [webUrl, setWebUrl] = useState('');
  const [webTitle, setWebTitle] = useState('');
  const [webNotes, setWebNotes] = useState('');

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteLanguage, setNoteLanguage] = useState<SupportedLanguage>('en');

  // Pipeline state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Duplicate Warning confirmation state
  const [pendingDuplicate, setPendingDuplicate] = useState<{
    type: TabType;
    payload: any;
    warning: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setYoutubeUrl('');
    setYoutubeTitle('');
    setYoutubeTranscript('');
    setWebUrl('');
    setWebTitle('');
    setWebNotes('');
    setNoteTitle('');
    setNoteContent('');
    setIsProcessing(false);
    setProgressStage('');
    setErrorMessage(null);
    setPendingDuplicate(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Helper to map file extension to SourceType
  const getSourceTypeFromFile = (file: File): SourceType | null => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'doc' || ext === 'docx') return 'docx';
    if (ext === 'ppt' || ext === 'pptx') return 'pptx';
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) return 'image';
    return null;
  };

  // Process File Submission
  const processFile = async (file: File, skipDuplicateCheck = false) => {
    const type = getSourceTypeFromFile(file);
    if (!type) {
      setErrorMessage(
        `Unsupported file type for "${file.name}". Supported formats are: PDF, DOCX, PPTX, and Images (JPG, PNG, WEBP).`
      );
      return;
    }

    if (!skipDuplicateCheck) {
      const dupCheck = sourcePipeline.checkDuplicate(existingSources, {
        fileName: file.name,
        fileSize: file.size,
      });
      if (dupCheck.isDuplicate) {
        setPendingDuplicate({
          type: 'file',
          payload: file,
          warning: dupCheck.reason || 'This source already exists in this project.',
        });
        return;
      }
    }

    setPendingDuplicate(null);
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const source = await sourcePipeline.processFileSource(
        projectId,
        file,
        type,
        isReplacing ? currentCount - 1 : currentCount,
        (stage) => setProgressStage(stage)
      );
      source.priority = priority;

      onSourceAdded(source, replaceTargetSource?.id);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error processing source file.');
      setIsProcessing(false);
    }
  };

  // Process YouTube Submission
  const processYouTube = async (skipDuplicateCheck = false) => {
    if (!youtubeUrl.trim()) {
      setErrorMessage('Please enter a valid YouTube video URL.');
      return;
    }

    if (!skipDuplicateCheck) {
      const dupCheck = sourcePipeline.checkDuplicate(existingSources, {
        url: youtubeUrl.trim(),
      });
      if (dupCheck.isDuplicate) {
        setPendingDuplicate({
          type: 'youtube',
          payload: { youtubeUrl, youtubeTitle, youtubeTranscript },
          warning: dupCheck.reason || 'This YouTube video is already added to this project.',
        });
        return;
      }
    }

    setPendingDuplicate(null);
    setErrorMessage(null);
    setIsProcessing(true);
    setProgressStage('Validating YouTube video reference...');

    try {
      const source = await sourcePipeline.processYouTubeSource(
        projectId,
        youtubeUrl.trim(),
        youtubeTitle.trim() || undefined,
        youtubeTranscript.trim() || undefined,
        isReplacing ? currentCount - 1 : currentCount
      );
      source.priority = priority;

      onSourceAdded(source, replaceTargetSource?.id);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to validate YouTube URL.');
      setIsProcessing(false);
    }
  };

  // Process Web Submission
  const processWeb = async (skipDuplicateCheck = false) => {
    if (!webUrl.trim()) {
      setErrorMessage('Please enter a valid Web address (URL).');
      return;
    }

    if (!skipDuplicateCheck) {
      const dupCheck = sourcePipeline.checkDuplicate(existingSources, {
        url: webUrl.trim(),
      });
      if (dupCheck.isDuplicate) {
        setPendingDuplicate({
          type: 'web',
          payload: { webUrl, webTitle, webNotes },
          warning: dupCheck.reason || 'This web address is already in this project.',
        });
        return;
      }
    }

    setPendingDuplicate(null);
    setErrorMessage(null);
    setIsProcessing(true);
    setProgressStage('Validating web link and domain...');

    try {
      const source = await sourcePipeline.processWebSource(
        projectId,
        webUrl.trim(),
        webTitle.trim() || undefined,
        webNotes.trim() || undefined,
        isReplacing ? currentCount - 1 : currentCount
      );
      source.priority = priority;

      onSourceAdded(source, replaceTargetSource?.id);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to process web link.');
      setIsProcessing(false);
    }
  };

  // Process Text Notes Submission
  const processText = (skipDuplicateCheck = false) => {
    if (!noteContent.trim()) {
      setErrorMessage('Please enter notes or lesson text before saving.');
      return;
    }

    const title = noteTitle.trim() || 'Teacher Notes';

    if (!skipDuplicateCheck) {
      const dupCheck = sourcePipeline.checkDuplicate(existingSources, {
        title,
      });
      if (dupCheck.isDuplicate) {
        setPendingDuplicate({
          type: 'text',
          payload: { noteTitle, noteContent, noteLanguage },
          warning: dupCheck.reason || 'A note with this title already exists.',
        });
        return;
      }
    }

    setPendingDuplicate(null);
    setErrorMessage(null);
    setIsProcessing(true);
    setProgressStage('Creating lesson segments...');

    try {
      const source = sourcePipeline.processTextSource(
        projectId,
        title,
        noteContent.trim(),
        noteLanguage,
        isReplacing ? currentCount - 1 : currentCount
      );
      source.priority = priority;

      onSourceAdded(source, replaceTargetSource?.id);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save notes.');
      setIsProcessing(false);
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleBrowseFiles = async () => {
    if (DesktopService.isElectron()) {
      try {
        const selected = await DesktopService.pickFiles({
          title: 'Select Course Documents or Media',
          filters: [
            {
              name: 'Supported Course Documents & Media',
              extensions: ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'txt', 'png', 'jpg', 'jpeg', 'webp'],
            },
            { name: 'All Files', extensions: ['*'] },
          ],
        });

        if (selected && selected.length > 0) {
          const item = selected[0];
          if (item.base64) {
            const byteCharacters = atob(item.base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const file = new File([byteArray], item.name, {
              type: item.extension === 'pdf' ? 'application/pdf' : 'application/octet-stream',
              lastModified: item.lastModified,
            });
            await processFile(file);
            return;
          }
        }
      } catch (err) {
        console.warn('Native picker error, falling back to standard input:', err);
      }
    }
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  return (
    <div
      id="add-source-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs text-left"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        id="add-source-modal-container"
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {isReplacing ? `Replace Source: ${replaceTargetSource?.name}` : 'Add Learning Source'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                {currentCount} / {MAX_SOURCES} Slots
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add up to 5 verified sources (PDF, Word, Slides, Images, YouTube, Web, or Notes) for teaching reference.
            </p>
          </div>

          <button
            id="btn-close-add-modal"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Max 5 Sources Guard */}
        {isAtLimit ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Maximum 5 sources allowed per project.
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                To maintain focused pedagogical grounding and strict memory limits, each project accommodates a maximum of 5 learning sources.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Button variant="primary" onClick={handleClose}>
                Back to Sources
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Category Tab Bar */}
            <div className="grid grid-cols-4 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold bg-slate-50/50 dark:bg-slate-800/30">
              <button
                id="tab-file-source"
                onClick={() => {
                  setActiveTab('file');
                  setErrorMessage(null);
                }}
                className={`py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'file'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Documents & Media</span>
              </button>

              <button
                id="tab-youtube-source"
                onClick={() => {
                  setActiveTab('youtube');
                  setErrorMessage(null);
                }}
                className={`py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'youtube'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Youtube className="w-4 h-4 text-red-500" />
                <span>YouTube</span>
              </button>

              <button
                id="tab-web-source"
                onClick={() => {
                  setActiveTab('web');
                  setErrorMessage(null);
                }}
                className={`py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'web'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Globe className="w-4 h-4 text-indigo-500" />
                <span>Web URL</span>
              </button>

              <button
                id="tab-text-source"
                onClick={() => {
                  setActiveTab('text');
                  setErrorMessage(null);
                }}
                className={`py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'text'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Text / Notes</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Error Message Box */}
              {errorMessage && (
                <div
                  id="source-error-banner"
                  className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2 text-rose-700 dark:text-rose-300"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="flex-1">{errorMessage}</p>
                </div>
              )}

              {/* Duplicate Warning Dialog */}
              {pendingDuplicate && (
                <div
                  id="duplicate-warning-banner"
                  className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 space-y-2.5 text-amber-900 dark:text-amber-200"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Duplicate Source Detected:</span>
                      <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                        {pendingDuplicate.warning}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingDuplicate(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (pendingDuplicate.type === 'file') {
                          processFile(pendingDuplicate.payload, true);
                        } else if (pendingDuplicate.type === 'youtube') {
                          processYouTube(true);
                        } else if (pendingDuplicate.type === 'web') {
                          processWeb(true);
                        } else if (pendingDuplicate.type === 'text') {
                          processText(true);
                        }
                      }}
                    >
                      Add Anyway
                    </Button>
                  </div>
                </div>
              )}

              {/* Progress Indicator */}
              {isProcessing && (
                <div className="p-5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900 text-center space-y-2">
                  <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Processing Learning Source...
                  </h4>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                    {progressStage || 'Validating format and integrity...'}
                  </p>
                </div>
              )}

              {/* TAB 1: FILE DRAG & DROP */}
              {!isProcessing && activeTab === 'file' && (
                <div className="space-y-4">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-99'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/20'
                    }`}
                    onClick={handleBrowseFiles}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                      className="hidden"
                    />

                    <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6" />
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Drag & drop files here, or click to browse
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      Supports PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, and WEBP. Maximum file size: 50MB.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                      <span className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-[10px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-orange-500" /> PDF
                      </span>
                      <span className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-[10px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <FileSpreadsheet className="w-3 h-3 text-blue-500" /> Word (.docx)
                      </span>
                      <span className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-[10px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Presentation className="w-3 h-3 text-amber-500" /> Slides (.pptx)
                      </span>
                      <span className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-[10px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-emerald-500" /> Images
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: YOUTUBE URL */}
              {!isProcessing && activeTab === 'youtube' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      YouTube Video URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      id="input-youtube-url"
                      placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Custom Video Title (Optional)
                    </label>
                    <input
                      type="text"
                      id="input-youtube-title"
                      placeholder="e.g. Physics Chapter 3: Gravitation Lecture"
                      value={youtubeTitle}
                      onChange={(e) => setYoutubeTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Transcript or Video Notes (Optional)
                    </label>
                    <textarea
                      id="input-youtube-transcript"
                      rows={3}
                      placeholder="Paste official captions, lesson transcript or timestamped notes (e.g., 01:23 Topic introduction)..."
                      value={youtubeTranscript}
                      onChange={(e) => setYoutubeTranscript(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Audio grounding will link with Gemini in Part 03.
                    </span>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      id="btn-submit-youtube"
                      variant="primary"
                      onClick={() => processYouTube()}
                      disabled={!youtubeUrl.trim()}
                    >
                      Verify & Add YouTube Video
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 3: WEB URL */}
              {!isProcessing && activeTab === 'web' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Web Address / Article URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      id="input-web-url"
                      placeholder="https://en.wikipedia.org/wiki/... or educational website"
                      value={webUrl}
                      onChange={(e) => setWebUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Web Resource Title (Optional)
                    </label>
                    <input
                      type="text"
                      id="input-web-title"
                      placeholder="e.g. NCERT Science Chapter Summary"
                      value={webTitle}
                      onChange={(e) => setWebTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Article Content or Excerpt (Optional)
                    </label>
                    <textarea
                      id="input-web-notes"
                      rows={3}
                      placeholder="Paste key article paragraphs or lesson excerpts from this web page..."
                      value={webNotes}
                      onChange={(e) => setWebNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      id="btn-submit-web"
                      variant="primary"
                      onClick={() => processWeb()}
                      disabled={!webUrl.trim()}
                    >
                      Verify & Add Web Source
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 4: TEXT / NOTES */}
              {!isProcessing && activeTab === 'text' && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Quick Test Source:</span>
                    <button
                      type="button"
                      id="btn-load-photosynthesis-sample"
                      onClick={() => {
                        setNoteTitle('Photosynthesis — Biology Core Curriculum');
                        setNoteContent(`Topic: Photosynthesis\n\nOverview:\nPhotosynthesis is the process by which green plants and certain other organisms transform light energy into chemical energy. During photosynthesis in green plants, light energy is captured and used to convert water, carbon dioxide, and minerals into oxygen and energy-rich organic compounds (glucose).\n\nKey Mechanisms and Concepts:\n1. Chloroplast Structure:\nPhotosynthesis occurs within the chloroplasts of plant cells. Chloroplasts contain thylakoid membranes arranged into stacks called grana, bathed in an aqueous fluid termed stroma. Chlorophyll pigments embedded in thylakoid membranes absorb light wavelengths.\n\n2. Light Reactions (Thylakoid Membrane):\nLight-dependent reactions occur across the thylakoid membrane. Solar photons excite electrons in chlorophyll, causing photolysis of water molecules (releasing O2 gas). Electron transport generates proton gradients that drive ATP synthase to produce ATP and reduce NADP+ to NADPH.\n\n3. Dark Reactions / Calvin Cycle (Stroma):\nThe light-independent reactions (Calvin cycle) take place in the stroma. Carbon dioxide is fixed by the enzyme RuBisCO into 3-phosphoglycerate (3-PGA), which is then reduced using ATP and NADPH produced during the light reactions to form G3P and glucose. RuBP is continuously regenerated.\n\n4. ATP Production & Energy Currency:\nATP synthesis via photophosphorylation stores high-energy chemical bonds that fuel carbon fixation and plant metabolic processes.\n\n5. Factors Affecting Photosynthesis:\nKey limiting factors include Light Intensity, Carbon Dioxide Concentration, Temperature, and Water Availability (Blackman's Principle of Limiting Factors).`);
                        setNoteLanguage('en');
                      }}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      🧪 Load Photosynthesis Test Sample
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Note / Lesson Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="input-note-title"
                        placeholder="e.g. Chapter 4 Key Concepts & Definitions"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Primary Language
                      </label>
                      <select
                        id="select-note-language"
                        value={noteLanguage}
                        onChange={(e) => setNoteLanguage(e.target.value as SupportedLanguage)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi (हिन्दी)</option>
                        <option value="bn">Bengali (বাংলা)</option>
                        <option value="te">Telugu (తెలుగు)</option>
                        <option value="mr">Marathi (मराठी)</option>
                        <option value="ta">Tamil (தமிழ்)</option>
                        <option value="gu">Gujarati (ગુજરાતી)</option>
                        <option value="kn">Kannada (ಕನ್ನಡ)</option>
                        <option value="ml">Malayalam (മലയാളം)</option>
                        <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Lesson Text or Notes <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {noteContent.split(/\s+/).filter(Boolean).length} words · {noteContent.length} chars
                      </span>
                    </div>
                    <textarea
                      id="input-note-content"
                      rows={6}
                      placeholder="Paste lesson text, curriculum summary, definitions, or textbook notes here..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      id="btn-submit-notes"
                      variant="primary"
                      onClick={() => processText()}
                      disabled={!noteContent.trim()}
                    >
                      Save Lesson Notes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Default Priority:</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as SourcePriority)}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="primary">Primary Reference</option>
              <option value="supporting">Supporting Reference</option>
            </select>
          </div>

          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
