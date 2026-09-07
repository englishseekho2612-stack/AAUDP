import React, { useState, useEffect } from 'react';
import { LearningSource, SourceSegment } from '../../types/project';
import { blobStorage } from '../../storage/blobStorage';
import { Button } from '../common/UIControls';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  Presentation,
  Youtube,
  Globe,
  Image as ImageIcon,
  Copy,
  Check,
} from 'lucide-react';

interface SourcePreviewModalProps {
  source: LearningSource | null;
  isOpen: boolean;
  onClose: () => void;
  initialSegmentId?: string;
}

export const SourcePreviewModal: React.FC<SourcePreviewModalProps> = ({
  source,
  isOpen,
  onClose,
  initialSegmentId,
}) => {
  const [currentPageOrSlide, setCurrentPageOrSlide] = useState(1);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [copied, setCopied] = useState(false);

  // Load blob for image preview
  useEffect(() => {
    let activeUrl: string | null = null;
    if (source && source.type === 'image' && source.blobId) {
      blobStorage.getBlob(source.blobId).then((blob) => {
        if (blob) {
          activeUrl = URL.createObjectURL(blob);
          setImageUrl(activeUrl);
        }
      });
    }

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
      setImageUrl(null);
      setImageZoom(1);
    };
  }, [source]);

  // Jump to specific segment page/slide if provided
  useEffect(() => {
    if (source && initialSegmentId && source.segments) {
      const targetSeg = source.segments.find((s) => s.segmentId === initialSegmentId);
      if (targetSeg) {
        if (targetSeg.pageNumber) {
          setCurrentPageOrSlide(targetSeg.pageNumber);
        } else if (targetSeg.slideNumber) {
          setCurrentPageOrSlide(targetSeg.slideNumber);
        }
      }
    } else {
      setCurrentPageOrSlide(1);
    }
  }, [source, initialSegmentId]);

  if (!isOpen || !source) return null;

  const segments = source.segments || [];

  const handleCopySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // PDF Preview Logic
  const renderPDFPreview = () => {
    const pageSegments = segments.filter((s) => s.pageNumber === currentPageOrSlide);
    const totalPages = source.metadata.pageCount || Math.max(1, ...segments.map((s) => s.pageNumber || 1));

    return (
      <div className="flex flex-col h-full space-y-4">
        {/* Navigation Toolbar */}
        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg text-xs font-semibold">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPageOrSlide((p) => Math.max(1, p - 1))}
              disabled={currentPageOrSlide <= 1}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {currentPageOrSlide} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPageOrSlide((p) => Math.min(totalPages, p + 1))}
              disabled={currentPageOrSlide >= totalPages}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const text = pageSegments.map((s) => s.text).join('\n\n');
                handleCopySnippet(text);
              }}
              icon={copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            >
              {copied ? 'Copied' : 'Copy Page'}
            </Button>
          </div>
        </div>

        {/* Page Content Render */}
        <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3 font-serif leading-relaxed text-sm text-slate-800 dark:text-slate-200 shadow-inner">
          {pageSegments.length > 0 ? (
            pageSegments.map((seg, idx) => (
              <div key={idx} className="space-y-1.5">
                {seg.heading && (
                  <h4 className="font-sans font-bold text-base text-slate-900 dark:text-slate-100 border-b pb-1 border-slate-100 dark:border-slate-800">
                    {seg.heading}
                  </h4>
                )}
                <p className="whitespace-pre-wrap">{seg.text}</p>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 font-sans text-xs">
              No textual stream found on Page {currentPageOrSlide} (scanned page or diagram).
            </div>
          )}
        </div>
      </div>
    );
  };

  // PPTX Preview Logic
  const renderPPTXPreview = () => {
    const totalSlides = source.metadata.slideCount || Math.max(1, ...segments.map((s) => s.slideNumber || 1));
    const currentSlideSegment = segments.find((s) => s.slideNumber === currentPageOrSlide);

    return (
      <div className="flex flex-col h-full space-y-4">
        {/* Navigation Toolbar */}
        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg text-xs font-semibold">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPageOrSlide((s) => Math.max(1, s - 1))}
              disabled={currentPageOrSlide <= 1}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Slide {currentPageOrSlide} of {totalSlides}
            </span>
            <button
              onClick={() => setCurrentPageOrSlide((s) => Math.min(totalSlides, s + 1))}
              disabled={currentPageOrSlide >= totalSlides}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-normal">
            {currentSlideSegment?.heading || `Slide ${currentPageOrSlide}`}
          </span>
        </div>

        {/* Slide Card Preview */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="w-full max-w-xl aspect-16/10 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6 shadow-md flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  Slide {currentPageOrSlide}
                </span>
                <Presentation className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">
                {currentSlideSegment?.heading || `Slide ${currentPageOrSlide}`}
              </h3>
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pr-2">
                {currentSlideSegment?.text || '[Empty slide content]'}
              </div>
            </div>

            <div className="text-right text-[10px] text-slate-400">
              Presentation Asset
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Image Preview Logic
  const renderImagePreview = () => {
    return (
      <div className="flex flex-col h-full space-y-3">
        {/* Controls */}
        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {source.metadata.dimensions
              ? `${source.metadata.dimensions.width} × ${source.metadata.dimensions.height} px`
              : 'Image Viewer'}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setImageZoom((z) => Math.max(0.5, z - 0.25))}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-medium px-1">
              {(imageZoom * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => setImageZoom((z) => Math.min(3, z + 0.25))}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setImageZoom(1)}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Canvas Container */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-950/80 rounded-lg min-h-[300px]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={source.name}
              style={{ transform: `scale(${imageZoom})`, transformOrigin: 'center center' }}
              className="max-h-[60vh] max-w-full object-contain rounded transition-transform duration-150"
            />
          ) : (
            <div className="text-center text-slate-400 text-xs">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <span>Loading image from local project storage...</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // YouTube Preview Logic
  const renderYouTubePreview = () => {
    const videoId = source.metadata.videoId;
    const embedUrl = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;

    return (
      <div className="flex flex-col h-full space-y-4">
        {embedUrl ? (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
            <iframe
              src={embedUrl}
              title={source.name}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-100 dark:bg-slate-800 rounded-lg">
            <Youtube className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-semibold">{source.name}</p>
          </div>
        )}

        {/* Metadata & Transcript Status */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              YouTube Source Information
            </span>
            {source.metadata.url && (
              <a
                href={source.metadata.url as string}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <span>Open in YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <p className="text-slate-600 dark:text-slate-400">
            {source.metadata.hasTranscript
              ? 'Official/provided captions registered with timestamp references.'
              : 'Video verified. Automatic audio-to-text extraction will be processed in Part 03 with Gemini multimodal grounding.'}
          </p>

          {segments.length > 0 && segments[0].timestamp && (
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              <span className="font-semibold block text-slate-700 dark:text-slate-300">
                Timestamp Segments:
              </span>
              {segments.map((seg, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800 flex items-start gap-2"
                >
                  <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 rounded">
                    {seg.timestamp || seg.location}
                  </span>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300">
                    {seg.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Web URL Preview Logic
  const renderWebPreview = () => {
    return (
      <div className="flex flex-col h-full space-y-4 text-xs">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="truncate">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Original Web Address</span>
            <a
              href={source.metadata.url as string}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline truncate inline-flex items-center gap-1"
            >
              <span>{source.metadata.url as string}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
          <span className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-mono text-[11px]">
            {source.metadata.domain}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {source.name}
          </h3>
          {source.extractedText ? (
            <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed font-serif">
              {source.extractedText}
            </p>
          ) : (
            <div className="p-6 text-center text-slate-400 space-y-2">
              <Globe className="w-8 h-8 mx-auto opacity-50" />
              <p>Web URL reference verified.</p>
              <p className="text-[11px] max-w-md mx-auto">
                Full dynamic web search & grounding will query this domain during Part 03 AI generation.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Plain Text / DOCX Reader Logic
  const renderTextReader = () => {
    return (
      <div className="flex flex-col h-full space-y-3">
        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {source.wordCount?.toLocaleString() || 0} Words ({segments.length} Sections)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopySnippet(source.extractedText || '')}
            icon={copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          >
            {copied ? 'Copied' : 'Copy Text'}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-4 font-serif text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
          {segments.length > 0 ? (
            segments.map((seg, idx) => (
              <div key={idx} className="space-y-1">
                {seg.heading && (
                  <h4 className="font-sans font-bold text-sm text-slate-900 dark:text-slate-100 border-b pb-0.5 border-slate-100 dark:border-slate-800">
                    {seg.heading}
                  </h4>
                )}
                <p className="whitespace-pre-wrap">{seg.text}</p>
              </div>
            ))
          ) : (
            <p className="whitespace-pre-wrap">{source.extractedText || 'No text extracted.'}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      id="source-preview-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs text-left"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        id="source-preview-modal-container"
        className="w-full max-w-4xl h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 truncate">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              {source.type.toUpperCase()} PREVIEW
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {source.name}
            </h2>
          </div>

          <button
            id="btn-close-source-preview"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-hidden p-4 sm:p-5">
          {source.type === 'pdf' && renderPDFPreview()}
          {source.type === 'pptx' && renderPPTXPreview()}
          {source.type === 'image' && renderImagePreview()}
          {source.type === 'youtube' && renderYouTubePreview()}
          {source.type === 'web' && renderWebPreview()}
          {(source.type === 'text' || source.type === 'docx') && renderTextReader()}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500">
          <span>Non-destructive preview: original document is retained offline.</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
};
