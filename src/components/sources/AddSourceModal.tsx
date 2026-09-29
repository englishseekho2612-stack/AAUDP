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
} from '../../services/sourcePipeline';
import { Button } from '../common/UIControls';
import { DesktopService } from '../../services/desktop/desktopService';
import {
  X,
  Upload,
  FileText,
  Youtube,
  Globe,
  Image as ImageIcon,
  Music,
  Cloud,
  ClipboardList,
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

export type SourceCategoryTab =
  | 'documents'
  | 'youtube'
  | 'web'
  | 'audio'
  | 'images'
  | 'google'
  | 'text';

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

  const [activeTab, setActiveTab] = useState<SourceCategoryTab>('documents');
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

  const [googleUrl, setGoogleUrl] = useState('');
  const [googleTitle, setGoogleTitle] = useState('');
  const [googleNotes, setGoogleNotes] = useState('');

  const [audioTitle, setAudioTitle] = useState('');
  const [audioNotes, setAudioNotes] = useState('');

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteLanguage, setNoteLanguage] = useState<SupportedLanguage>('en');

  // Pipeline state
  const [isProcessing, setIsProcessing] = useState(false);
  const [friendlyProgressStage, setFriendlyProgressStage] = useState<string>('Reading your document...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Duplicate Warning confirmation state
  const [pendingDuplicate, setPendingDuplicate] = useState<{
    type: SourceCategoryTab;
    payload: any;
    warning: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setYoutubeUrl('');
    setYoutubeTitle('');
    setYoutubeTranscript('');
    setWebUrl('');
    setWebTitle('');
    setWebNotes('');
    setGoogleUrl('');
    setGoogleTitle('');
    setGoogleNotes('');
    setAudioTitle('');
    setAudioNotes('');
    setNoteTitle('');
    setNoteContent('');
    setIsProcessing(false);
    setFriendlyProgressStage('Reading your document...');
    setErrorMessage(null);
    setPendingDuplicate(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Convert technical error into simple, solution-oriented teacher language
  const getFriendlyErrorMessage = (rawError: any): string => {
    const msg = String(rawError?.message || rawError || '');
    if (msg.toLowerCase().includes('pdf') || msg.toLowerCase().includes('corrupt') || msg.toLowerCase().includes('encrypted')) {
      return "This document couldn't be read. Please make sure the PDF is not password-protected, or copy and paste the text into the Text tab.";
    }
    if (msg.toLowerCase().includes('size') || msg.toLowerCase().includes('50mb')) {
      return "This file is larger than 50MB. Please upload a smaller chapter or section.";
    }
    if (msg.toLowerCase().includes('youtube') || msg.toLowerCase().includes('video id')) {
      return "Please provide a valid YouTube video address (e.g. https://www.youtube.com/watch?v=...).";
    }
    if (msg.toLowerCase().includes('url') || msg.toLowerCase().includes('web') || msg.toLowerCase().includes('network')) {
      return "Could not reach this web link. Please verify the URL starts with https:// or copy the lesson text directly.";
    }
    return "Could not process this source. Please try another file or paste the text directly into the Text tab.";
  };

  // Map progress into 3 simple, human-friendly stages
  const mapProgressStage = (technicalStage: string) => {
    const s = technicalStage.toLowerCase();
    if (s.includes('extract') || s.includes('reading') || s.includes('blob') || s.includes('validating')) {
      setFriendlyProgressStage('Reading your document...');
    } else if (s.includes('segment') || s.includes('analyzing') || s.includes('normaliz')) {
      setFriendlyProgressStage('Understanding content...');
    } else {
      setFriendlyProgressStage('Ready to study!');
    }
  };

  // Process Document File Submission
  const processFile = async (file: File, skipDuplicateCheck = false) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    // Plain text / markdown / csv / epub handler
    if (['txt', 'md', 'markdown', 'csv', 'epub'].includes(ext)) {
      setErrorMessage(null);
      setIsProcessing(true);
      setFriendlyProgressStage('Reading your document...');
      try {
        const textContent = await file.text();
        setFriendlyProgressStage('Understanding content...');
        const source = sourcePipeline.processTextSource(
          projectId,
          file.name.replace(/\.[^/.]+$/, ''),
          textContent,
          'en',
          isReplacing ? currentCount - 1 : currentCount
        );
        source.priority = priority;
        setFriendlyProgressStage('Ready to study!');
        setTimeout(() => {
          onSourceAdded(source, replaceTargetSource?.id);
          handleClose();
        }, 300);
      } catch (err) {
        setErrorMessage(getFriendlyErrorMessage(err));
        setIsProcessing(false);
      }
      return;
    }

    let type: SourceType | null = null;
    if (ext === 'pdf') type = 'pdf';
    else if (ext === 'doc' || ext === 'docx') type = 'docx';
    else if (ext === 'ppt' || ext === 'pptx') type = 'pptx';
    else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) type = 'image';

    if (!type) {
      setErrorMessage(
        `Unsupported file type for "${file.name}". Supported document formats are: PDF, DOCX, PPTX, TXT, Markdown, and ePub.`
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
          type: 'documents',
          payload: file,
          warning: dupCheck.reason || 'This document has already been added to this lesson.',
        });
        return;
      }
    }

    setPendingDuplicate(null);
    setErrorMessage(null);
    setIsProcessing(true);
    setFriendlyProgressStage('Reading your document...');

    try {
      const source = await sourcePipeline.processFileSource(
        projectId,
        file,
        type,
        isReplacing ? currentCount - 1 : currentCount,
        (stage) => mapProgressStage(stage)
      );
      source.priority = priority;
      setFriendlyProgressStage('Ready to study!');
      setTimeout(() => {
        onSourceAdded(source, replaceTargetSource?.id);
        handleClose();
      }, 300);
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
      setIsProcessing(false);
    }
  };

  // Process Image Submission
  const processImageFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      setErrorMessage('Please select a valid image file (JPG, JPEG, PNG, or WEBP).');
      return;
    }
    await processFile(file);
  };

  // Process YouTube Submission
  const processYouTube = async (skipDuplicateCheck = false) => {
    if (!youtubeUrl.trim()) {
      setErrorMessage('Please enter a valid YouTube video address (URL).');
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
          warning: dupCheck.reason || 'This YouTube video has already been added to this lesson.',
        });
        return;
      }
    }

    setPendingDuplicate(null);
    setErrorMessage(null);
    setIsProcessing(true);
    setFriendlyProgressStage('Reading video link...');

    try {
      const source = await sourcePipeline.processYouTubeSource(
        projectId,
        youtubeUrl.trim(),
        youtubeTitle.trim() || undefined,
        youtubeTranscript.trim() || undefined,
        isReplacing ? currentCount - 1 : currentCount
      );
      source.priority = priority;
      setFriendlyProgressStage('Ready to study!');
      setTimeout(() => {
        onSourceAdded(source, replaceTargetSource?.id);
        handleClose();
      }, 300);
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
      setIsProcessing(false);
    }
  };

  // Process Web Submission
  const processWeb = async (skipDuplicateCheck = false) => {
    if (!webUrl.trim()) {
      setErrorMessage('Please enter a valid web page address (URL).');
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
          warning: dupCheck.reason || 'This web page has already been added.',
        });
        return;
      }
    }

    setPendingDuplicate(null);
    setErrorMessage(null);
    setIsProcessing(true);
    setFriendlyProgressStage('Reading webpage content...');

    try {
      const source = await sourcePipeline.processWebSource(
        projectId,
        webUrl.trim(),
        webTitle.trim() || undefined,
        webNotes.trim() || undefined,
        isReplacing ? currentCount - 1 : currentCount
      );
      source.priority = priority;
      setFriendlyProgressStage('Ready to study!');
      setTimeout(() => {
        onSourceAdded(source, replaceTargetSource?.id);
        handleClose();
      }, 300);
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
      setIsProcessing(false);
    }
  };

  // Process Google Workspace Submission
  const processGoogle = async () => {
    if (!googleUrl.trim()) {
      setErrorMessage('Please enter a valid Google Docs, Slides, Sheets, or Drive share link.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setFriendlyProgressStage('Connecting to Google document...');

    try {
      const title = googleTitle.trim() || 'Google Workspace Material';
      const source = await sourcePipeline.processWebSource(
        projectId,
        googleUrl.trim(),
        title,
        googleNotes.trim() || 'Imported Google Document',
        isReplacing ? currentCount - 1 : currentCount
      );
      source.priority = priority;
      setFriendlyProgressStage('Ready to study!');
      setTimeout(() => {
        onSourceAdded(source, replaceTargetSource?.id);
        handleClose();
      }, 300);
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
      setIsProcessing(false);
    }
  };

  // Process Audio File / Lecture Submission
  const processAudio = async (file?: File) => {
    const title = audioTitle.trim() || (file ? file.name.replace(/\.[^/.]+$/, '') : 'Lecture Audio Recording');
    const content = audioNotes.trim() || `Audio lesson reference: ${title}. Key audio points will be used for Arpit Sir tutor questions and teaching studio.`;

    setErrorMessage(null);
    setIsProcessing(true);
    setFriendlyProgressStage('Registering audio lesson...');

    try {
      const source = sourcePipeline.processTextSource(
        projectId,
        `🎧 ${title}`,
        content,
        'en',
        isReplacing ? currentCount - 1 : currentCount
      );
      source.priority = priority;
      setFriendlyProgressStage('Ready to study!');
      setTimeout(() => {
        onSourceAdded(source, replaceTargetSource?.id);
        handleClose();
      }, 300);
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
      setIsProcessing(false);
    }
  };

  // Process Text Notes Submission
  const processText = (skipDuplicateCheck = false) => {
    if (!noteContent.trim()) {
      setErrorMessage('Please enter notes or lesson text before saving.');
      return;
    }

    const title = noteTitle.trim() || 'Lesson Notes';

    if (!skipDuplicateCheck) {
      const dupCheck = sourcePipeline.checkDuplicate(existingSources, { title });
      if (dupCheck.isDuplicate) {
        setPendingDuplicate({
          type: 'text',
          payload: { noteTitle, noteContent, noteLanguage },
          warning: dupCheck.reason || 'A note with this title already exists in this lesson.',
        });
        return;
      }
    }

    setPendingDuplicate(null);
    setErrorMessage(null);
    setIsProcessing(true);
    setFriendlyProgressStage('Saving lesson text...');

    try {
      const source = sourcePipeline.processTextSource(
        projectId,
        title,
        noteContent.trim(),
        noteLanguage,
        isReplacing ? currentCount - 1 : currentCount
      );
      source.priority = priority;
      setFriendlyProgressStage('Ready to study!');
      setTimeout(() => {
        onSourceAdded(source, replaceTargetSource?.id);
        handleClose();
      }, 300);
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
      setIsProcessing(false);
    }
  };

  // Desktop Native File Picker Integration
  const handleBrowseFiles = async (filterCategory: 'docs' | 'images' | 'audio' = 'docs') => {
    if (DesktopService.isElectron()) {
      try {
        let filters = [
          { name: 'Course Documents', extensions: ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'txt', 'md', 'epub', 'csv'] },
          { name: 'All Files', extensions: ['*'] },
        ];
        if (filterCategory === 'images') {
          filters = [
            { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] },
            { name: 'All Files', extensions: ['*'] },
          ];
        } else if (filterCategory === 'audio') {
          filters = [
            { name: 'Audio Files', extensions: ['mp3', 'wav', 'm4a', 'webm', 'ogg'] },
            { name: 'All Files', extensions: ['*'] },
          ];
        }

        const selected = await DesktopService.pickFiles({
          title: 'Select Study Material',
          filters,
          properties: ['openFile'],
        });

        if (selected && selected.length > 0) {
          const fileInfo = selected[0];
          if (fileInfo.base64) {
            const byteChars = atob(fileInfo.base64);
            const byteNumbers = new Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) {
              byteNumbers[i] = byteChars.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const file = new File([byteArray], fileInfo.name, {
              lastModified: fileInfo.lastModified,
            });
            if (filterCategory === 'images') {
              processImageFile(file);
            } else if (filterCategory === 'audio') {
              processAudio(file);
            } else {
              processFile(file);
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Native picker error, falling back to standard input:', err);
      }
    }

    if (filterCategory === 'images') {
      imageInputRef.current?.click();
    } else if (filterCategory === 'audio') {
      audioInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const tabs: { key: SourceCategoryTab; label: string; icon: React.ReactNode }[] = [
    { key: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
    { key: 'youtube', label: 'YouTube', icon: <Youtube className="w-4 h-4 text-rose-500" /> },
    { key: 'web', label: 'Web URL', icon: <Globe className="w-4 h-4 text-teal-500" /> },
    { key: 'audio', label: 'Audio', icon: <Music className="w-4 h-4 text-purple-500" /> },
    { key: 'images', label: 'Images', icon: <ImageIcon className="w-4 h-4 text-amber-500" /> },
    { key: 'google', label: 'Google', icon: <Cloud className="w-4 h-4 text-sky-500" /> },
    { key: 'text', label: 'Paste Text', icon: <ClipboardList className="w-4 h-4 text-slate-500" /> },
  ];

  return (
    <div
      id="add-source-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="add-source-modal-container"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  STEP 1 · Add Source
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {currentCount}/{MAX_SOURCES} sources attached
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {isReplacing ? `Replace "${replaceTargetSource.name}"` : 'Add Study Material'}
              </h2>
            </div>
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
                Maximum 5 sources allowed per lesson
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                To keep learning focused and accurate, each lesson accommodates up to 5 learning sources. You can remove an existing source to add a new one.
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
            {/* 7 Grouped Category Tabs */}
            <div className="flex items-center border-b border-slate-100 dark:border-slate-800 text-xs font-semibold bg-slate-50/50 dark:bg-slate-800/30 overflow-x-auto no-scrollbar">
              {tabs.map((t) => {
                const isActive = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    id={`tab-${t.key}-source`}
                    onClick={() => {
                      setActiveTab(t.key);
                      setErrorMessage(null);
                    }}
                    className={`py-3 px-3.5 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                      isActive
                        ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300 font-bold bg-white dark:bg-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Simple Friendly Error Message Box */}
              {errorMessage && (
                <div
                  id="source-error-banner"
                  className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-rose-700 dark:text-rose-300"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="flex-1 leading-relaxed font-medium">{errorMessage}</p>
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
                        if (pendingDuplicate.type === 'documents') {
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

              {/* Progress Indicator (Requirement 9: Simple Messages) */}
              {isProcessing && (
                <div className="p-6 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 text-center space-y-3">
                  <Clock className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                      {friendlyProgressStage}
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                      Preparing study material for Arpit Sir tutor, Mind Maps, and Teaching Board
                    </p>
                  </div>
                </div>
              )}

              {/* 1. DOCUMENTS TAB */}
              {!isProcessing && activeTab === 'documents' && (
                <div className="space-y-4">
                  <div
                    id="dropzone-file-upload"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        processFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => handleBrowseFiles('docs')}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/30'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="input-file-native"
                      className="hidden"
                      accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md,.epub,.csv"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          processFile(e.target.files[0]);
                        }
                      }}
                    />
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      Upload Document or Syllabus
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Click to browse or drag and drop your file here
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>PDF</span> · <span>DOCX</span> · <span>TXT</span> · <span>Markdown</span> · <span>ePub</span> · <span>PPTX</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. YOUTUBE TAB */}
              {!isProcessing && activeTab === 'youtube' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      YouTube Video URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      id="input-youtube-url"
                      placeholder="e.g. https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Custom Video Title (Optional)
                    </label>
                    <input
                      type="text"
                      id="input-youtube-title"
                      placeholder="e.g. Chapter Summary & Lecture"
                      value={youtubeTitle}
                      onChange={(e) => setYoutubeTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      id="btn-submit-youtube"
                      variant="primary"
                      onClick={() => processYouTube()}
                      disabled={!youtubeUrl.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      Attach YouTube Video
                    </Button>
                  </div>
                </div>
              )}

              {/* 3. WEB TAB */}
              {!isProcessing && activeTab === 'web' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Web Page Address (URL) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      id="input-web-url"
                      placeholder="e.g. https://en.wikipedia.org/wiki/..."
                      value={webUrl}
                      onChange={(e) => setWebUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Article / Resource Title (Optional)
                    </label>
                    <input
                      type="text"
                      id="input-web-title"
                      placeholder="e.g. Encyclopedia Topic Summary"
                      value={webTitle}
                      onChange={(e) => setWebTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      id="btn-submit-web"
                      variant="primary"
                      onClick={() => processWeb()}
                      disabled={!webUrl.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      Attach Web Source
                    </Button>
                  </div>
                </div>
              )}

              {/* 4. AUDIO TAB */}
              {!isProcessing && activeTab === 'audio' && (
                <div className="space-y-4">
                  <div
                    onClick={() => handleBrowseFiles('audio')}
                    className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all border-slate-300 dark:border-slate-700 hover:border-purple-500 bg-purple-50/20 dark:bg-purple-950/10"
                  >
                    <input
                      ref={audioInputRef}
                      type="file"
                      className="hidden"
                      accept=".mp3,.wav,.m4a,.webm,.ogg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          processAudio(e.target.files[0]);
                        }
                      }}
                    />
                    <Music className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      Upload Audio Lecture File
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      MP3, WAV, M4A, or WEBM audio recordings
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Audio Lesson Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Classroom Lecture Audio Recording"
                      value={audioTitle}
                      onChange={(e) => setAudioTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Audio Notes / Key Timestamps (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Paste lecture transcript or key topic timestamps..."
                      value={audioNotes}
                      onChange={(e) => setAudioNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="pt-1 flex justify-end">
                    <Button
                      variant="primary"
                      onClick={() => processAudio()}
                      disabled={!audioTitle.trim() && !audioNotes.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      Save Audio Notes
                    </Button>
                  </div>
                </div>
              )}

              {/* 5. IMAGES TAB */}
              {!isProcessing && activeTab === 'images' && (
                <div className="space-y-4">
                  <div
                    onClick={() => handleBrowseFiles('images')}
                    className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all border-slate-300 dark:border-slate-700 hover:border-amber-500 bg-amber-50/20 dark:bg-amber-950/10"
                  >
                    <input
                      ref={imageInputRef}
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          processImageFile(e.target.files[0]);
                        }
                      }}
                    />
                    <ImageIcon className="w-10 h-10 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      Upload Educational Image or Diagram
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Textbook diagram, handwritten blackboard photo, or chart
                    </p>
                    <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      JPG, JPEG, PNG, WEBP (Optical text will be read into the lesson)
                    </div>
                  </div>
                </div>
              )}

              {/* 6. GOOGLE TAB */}
              {!isProcessing && activeTab === 'google' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Google Share Link <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      placeholder="e.g. https://docs.google.com/document/d/... or Drive link"
                      value={googleUrl}
                      onChange={(e) => setGoogleUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Supports Google Docs, Google Slides, Google Sheets, or public Google Drive shared links.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Document Title (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Google Docs Lesson Plan"
                      value={googleTitle}
                      onChange={(e) => setGoogleTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      variant="primary"
                      onClick={processGoogle}
                      disabled={!googleUrl.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      Attach Google Document
                    </Button>
                  </div>
                </div>
              )}

              {/* 7. TEXT / NOTES TAB */}
              {!isProcessing && activeTab === 'text' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Paste notes, curriculum excerpts, or chapter summary
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setNoteTitle('Photosynthesis & Plant Biology');
                        setNoteContent(
                          `Photosynthesis is the biological process by which green plants and certain other organisms transform light energy into chemical energy.\n\nDuring photosynthesis in green plants, light energy is captured and used to convert water, carbon dioxide, and minerals into oxygen and energy-rich organic compounds.\n\nEquation: 6CO2 + 6H2O + Light Energy -> C6H12O6 + 6O2\n\nChlorophyll in the thylakoid membrane is the green pigment responsible for absorbing blue and red light spectrums.`
                        );
                      }}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Load Biology Sample
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
                        placeholder="e.g. Chapter 4 Key Concepts"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Language
                      </label>
                      <select
                        id="select-note-language"
                        value={noteLanguage}
                        onChange={(e) => setNoteLanguage(e.target.value as SupportedLanguage)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi (हिन्दी)</option>
                        <option value="bn">Bengali (বাংলা)</option>
                        <option value="te">Telugu (తెలుగు)</option>
                        <option value="mr">Marathi (मराठी)</option>
                        <option value="ta">Tamil (தமிழ்)</option>
                        <option value="gu">Gujarati (ગુજરાતી)</option>
                        <option value="kn">Kannada (ಕನ್ನಡ)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Lesson Text or Notes <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {noteContent.split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>
                    <textarea
                      id="input-note-content"
                      rows={6}
                      placeholder="Paste lesson text, curriculum summary, definitions, or textbook notes here..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      id="btn-submit-notes"
                      variant="primary"
                      onClick={() => processText()}
                      disabled={!noteContent.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
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
            <span className="font-semibold text-slate-600 dark:text-slate-400">Reference Priority:</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as SourcePriority)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
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
