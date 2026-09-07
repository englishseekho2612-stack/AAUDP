import React from 'react';
import { LearningSource, SourcePriority } from '../../types/project';
import { Badge, Button } from '../common/UIControls';
import {
  FileText,
  Youtube,
  Image as ImageIcon,
  Globe,
  FileSpreadsheet,
  Presentation,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Info,
  Trash2,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Star,
  CheckSquare,
  Square,
} from 'lucide-react';

interface SourceCardProps {
  source: LearningSource;
  index: number;
  totalCount: number;
  onOpenPreview: (source: LearningSource) => void;
  onOpenDetails: (source: LearningSource) => void;
  onReplace: (source: LearningSource) => void;
  onRemove: (source: LearningSource) => void;
  onTogglePriority: (sourceId: string, priority: SourcePriority) => void;
  onToggleAISelection: (sourceId: string, selected: boolean) => void;
  onMoveUp: (sourceId: string) => void;
  onMoveDown: (sourceId: string) => void;
}

export const SourceCard: React.FC<SourceCardProps> = ({
  source,
  index,
  totalCount,
  onOpenPreview,
  onOpenDetails,
  onReplace,
  onRemove,
  onTogglePriority,
  onToggleAISelection,
  onMoveUp,
  onMoveDown,
}) => {
  const getSourceIcon = () => {
    switch (source.type) {
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-500" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-orange-500" />;
      case 'docx':
        return <FileSpreadsheet className="w-5 h-5 text-blue-500" />;
      case 'pptx':
        return <Presentation className="w-5 h-5 text-amber-500" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-emerald-500" />;
      case 'web':
        return <Globe className="w-5 h-5 text-indigo-500" />;
      case 'text':
      default:
        return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  const getTypeLabel = () => {
    switch (source.type) {
      case 'youtube':
        return 'YouTube';
      case 'pdf':
        return 'PDF';
      case 'docx':
        return 'Word (DOCX)';
      case 'pptx':
        return 'Slides (PPTX)';
      case 'image':
        return 'Image';
      case 'web':
        return 'Web Link';
      case 'text':
        return 'Notes';
      default:
        return 'Source';
    }
  };

  const getMetricSummary = () => {
    if (source.type === 'pdf' && source.metadata.pageCount) {
      return `${source.metadata.pageCount} ${source.metadata.pageCount === 1 ? 'Page' : 'Pages'}`;
    }
    if (source.type === 'pptx' && source.metadata.slideCount) {
      return `${source.metadata.slideCount} ${source.metadata.slideCount === 1 ? 'Slide' : 'Slides'}`;
    }
    if (source.type === 'image' && source.metadata.dimensions) {
      return `${source.metadata.dimensions.width}×${source.metadata.dimensions.height}`;
    }
    if ((source.type === 'docx' || source.type === 'text') && source.wordCount) {
      return `${source.wordCount.toLocaleString()} Words`;
    }
    if (source.type === 'youtube' && source.metadata.videoId) {
      return `ID: ${source.metadata.videoId}`;
    }
    if (source.type === 'web' && source.metadata.domain) {
      return `${source.metadata.domain}`;
    }
    if (source.metadata.fileSize) {
      return `${(source.metadata.fileSize / 1024).toFixed(0)} KB`;
    }
    return '';
  };

  const isReady = source.status === 'ready';
  const isFailed = source.status === 'error';
  const isProcessing = source.status === 'processing' || source.status === 'pending';
  const isSelected = source.selectedForAI !== false;
  const isPrimary = source.priority === 'primary';

  return (
    <div
      id={`source-card-${source.id}`}
      className={`relative flex flex-col justify-between bg-white dark:bg-slate-900 border rounded-xl p-4 sm:p-5 transition-all shadow-2xs hover:shadow-sm ${
        isFailed
          ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
          : isSelected
          ? 'border-slate-200 dark:border-slate-800'
          : 'border-slate-200/60 dark:border-slate-800/60 opacity-75'
      }`}
    >
      <div className="space-y-3">
        {/* Top Header Row: AI Selection Checkbox + Order Badges + Reorder Controls */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              id={`btn-toggle-ai-${source.id}`}
              onClick={() => onToggleAISelection(source.id, !isSelected)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer min-h-[32px]"
              title={isSelected ? 'Included in future AI tasks' : 'Excluded from AI tasks'}
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-[11px]">Use for AI</span>
            </button>

            {/* Primary vs Supporting Toggle */}
            <button
              id={`btn-toggle-priority-${source.id}`}
              onClick={() =>
                onTogglePriority(source.id, isPrimary ? 'supporting' : 'primary')
              }
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                isPrimary
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
              title="Toggle Primary or Supporting reference"
            >
              <Star className={`w-3 h-3 ${isPrimary ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>{isPrimary ? 'Primary' : 'Supporting'}</span>
            </button>
          </div>

          {/* Reorder Buttons (Move Up / Move Down) */}
          <div className="flex items-center gap-0.5 text-slate-400">
            <button
              id={`btn-move-up-${source.id}`}
              disabled={index === 0}
              onClick={() => onMoveUp(source.id)}
              className="p-1 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Move Up"
              aria-label="Move Up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              id={`btn-move-down-${source.id}`}
              disabled={index === totalCount - 1}
              onClick={() => onMoveDown(source.id)}
              className="p-1 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Move Down"
              aria-label="Move Down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Source Icon & Title */}
        <div className="flex items-start gap-3 pt-1">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shrink-0">
            {getSourceIcon()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                #{index + 1} · {getTypeLabel()}
              </span>
              {getMetricSummary() && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    {getMetricSummary()}
                  </span>
                </>
              )}
            </div>

            <h3
              className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5"
              title={source.name}
            >
              {source.name}
            </h3>

            {/* Friendly Status Line */}
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              {isReady && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready for AI</span>
                </span>
              )}

              {isProcessing && (
                <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>{source.statusMessage || 'Processing...'}</span>
                </span>
              )}

              {isFailed && (
                <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium truncate">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{source.statusMessage || 'Processing failed'}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Row: Open, Details, Replace, Remove */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            id={`btn-open-source-${source.id}`}
            variant="outline"
            size="sm"
            onClick={() => onOpenPreview(source)}
            icon={<Eye className="w-3.5 h-3.5" />}
          >
            Open
          </Button>

          <Button
            id={`btn-details-source-${source.id}`}
            variant="ghost"
            size="sm"
            onClick={() => onOpenDetails(source)}
            icon={<Info className="w-3.5 h-3.5" />}
          >
            Details
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            id={`btn-replace-source-${source.id}`}
            variant="ghost"
            size="sm"
            onClick={() => onReplace(source)}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            title="Replace with new version"
          >
            Replace
          </Button>

          <Button
            id={`btn-remove-source-${source.id}`}
            variant="ghost"
            size="sm"
            onClick={() => onRemove(source)}
            icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
            className="hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600"
            title="Remove source"
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
};
