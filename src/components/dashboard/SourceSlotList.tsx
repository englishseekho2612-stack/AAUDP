import React, { useState } from 'react';
import { LearningSource, SourcePriority } from '../../types/project';
import { MAX_SOURCES_PER_PROJECT } from '../../services/sourceEngineContract';
import { SourceCard } from '../sources/SourceCard';
import { AddSourceModal } from '../sources/AddSourceModal';
import { SourceDetailsModal } from '../sources/SourceDetailsModal';
import { SourcePreviewModal } from '../sources/SourcePreviewModal';
import { RemoveSourceModal } from '../sources/RemoveSourceModal';
import { SourceSearchBar } from '../sources/SourceSearchBar';
import { SourceReadyBanner } from '../sources/SourceReadyBanner';
import { TeacherInstructionsCard } from '../sources/TeacherInstructionsCard';
import {
  FileText,
  Youtube,
  Image as ImageIcon,
  Globe,
  FileSpreadsheet,
  Presentation,
  Plus,
  FolderOpen,
} from 'lucide-react';

interface SourceSlotListProps {
  projectId: string;
  sources: LearningSource[];
  teacherInstructions?: string;
  onAddSource: (source: LearningSource, replaceSourceId?: string) => void;
  onRemoveSource: (source: LearningSource) => Promise<void>;
  onTogglePriority: (sourceId: string, priority: SourcePriority) => void;
  onToggleAISelection: (sourceId: string, selected: boolean) => void;
  onMoveUp: (sourceId: string) => void;
  onMoveDown: (sourceId: string) => void;
  onSaveTeacherInstructions: (instructions: string) => Promise<void>;
  onScrollToOutputs: () => void;
}

export const SourceSlotList: React.FC<SourceSlotListProps> = ({
  projectId,
  sources,
  teacherInstructions,
  onAddSource,
  onRemoveSource,
  onTogglePriority,
  onToggleAISelection,
  onMoveUp,
  onMoveDown,
  onSaveTeacherInstructions,
  onScrollToOutputs,
}) => {
  const currentCount = sources.length;
  const isFull = currentCount >= MAX_SOURCES_PER_PROJECT;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<LearningSource | null>(null);
  const [inspectSource, setInspectSource] = useState<LearningSource | null>(null);
  const [previewSource, setPreviewSource] = useState<LearningSource | null>(null);
  const [previewInitialSegmentId, setPreviewInitialSegmentId] = useState<string | undefined>();
  const [sourceToRemove, setSourceToRemove] = useState<LearningSource | null>(null);

  const supportedTypes = [
    { label: 'YouTube Video', icon: <Youtube className="w-3.5 h-3.5 text-red-500" /> },
    { label: 'PDF Document', icon: <FileText className="w-3.5 h-3.5 text-orange-500" /> },
    { label: 'Word (DOC/DOCX)', icon: <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" /> },
    { label: 'Slides (PPT/PPTX)', icon: <Presentation className="w-3.5 h-3.5 text-amber-500" /> },
    { label: 'Diagrams / Images', icon: <ImageIcon className="w-3.5 h-3.5 text-emerald-500" /> },
    { label: 'Web Article', icon: <Globe className="w-3.5 h-3.5 text-indigo-500" /> },
    { label: 'Lesson Notes', icon: <FileText className="w-3.5 h-3.5 text-slate-500" /> },
  ];

  const handleOpenAdd = () => {
    setReplaceTarget(null);
    setIsAddModalOpen(true);
  };

  const handleOpenReplace = (src: LearningSource) => {
    setReplaceTarget(src);
    setIsAddModalOpen(true);
  };

  const handleSelectSearchResult = (sourceId: string, segmentId: string) => {
    const found = sources.find((s) => s.id === sourceId);
    if (found) {
      setPreviewInitialSegmentId(segmentId);
      setPreviewSource(found);
    }
  };

  return (
    <section id="sources-management-section" className="space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Learning Sources
            </h2>
            <span
              id="source-counter-badge"
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                currentCount === 0
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  : currentCount === MAX_SOURCES_PER_PROJECT
                  ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                  : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300'
              }`}
            >
              {currentCount} / {MAX_SOURCES_PER_PROJECT} Max
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Add up to 5 multi-format sources as foundational references for AI teaching generation.
          </p>
        </div>

        <button
          id="btn-add-sources"
          onClick={handleOpenAdd}
          disabled={isFull}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[40px] cursor-pointer ${
            isFull
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 active:scale-98 shadow-2xs'
          }`}
          title={isFull ? 'Maximum 5 sources reached' : 'Add learning source'}
        >
          <Plus className="w-4 h-4" />
          <span>Add Sources</span>
        </button>
      </div>

      {/* Visual Slot Meter */}
      <div className="grid grid-cols-5 gap-2" title={`${currentCount} of 5 source slots filled`}>
        {Array.from({ length: MAX_SOURCES_PER_PROJECT }).map((_, idx) => {
          const filled = idx < currentCount;
          return (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                filled
                  ? 'bg-indigo-600 dark:bg-indigo-500'
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          );
        })}
      </div>

      {/* Search Inside Sources (Section 27) */}
      {currentCount > 0 && (
        <SourceSearchBar
          sources={sources}
          onSelectMatch={handleSelectSearchResult}
        />
      )}

      {/* Ready Banner (Section 35) */}
      {currentCount > 0 && (
        <SourceReadyBanner
          sources={sources}
          onScrollToOutputs={onScrollToOutputs}
        />
      )}

      {/* Empty State when 0 sources */}
      {currentCount === 0 ? (
        <div
          id="empty-sources-container"
          className="border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 rounded-xl p-8 text-center space-y-4"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <FolderOpen className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              No learning sources added yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Add up to 5 learning materials (PDF textbook, Word doc, PPT slides, YouTube video, web article, or classroom notes) to ground your AI lesson generation.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 max-w-2xl mx-auto">
            {supportedTypes.map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 shadow-2xs"
              >
                {t.icon}
                <span>{t.label}</span>
              </span>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Source</span>
            </button>
          </div>
        </div>
      ) : (
        /* Source Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {sources.map((src, index) => (
            <SourceCard
              key={src.id}
              source={src}
              index={index}
              totalCount={sources.length}
              onOpenPreview={(s) => {
                setPreviewInitialSegmentId(undefined);
                setPreviewSource(s);
              }}
              onOpenDetails={(s) => setInspectSource(s)}
              onReplace={handleOpenReplace}
              onRemove={(s) => setSourceToRemove(s)}
              onTogglePriority={onTogglePriority}
              onToggleAISelection={onToggleAISelection}
              onMoveUp={(id) => onMoveUp(id)}
              onMoveDown={(id) => onMoveDown(id)}
            />
          ))}
        </div>
      )}

      {/* Teacher Instructions Directive Field (Section 38) */}
      <TeacherInstructionsCard
        instructions={teacherInstructions}
        onSaveInstructions={onSaveTeacherInstructions}
      />

      {/* MODAL 1: Add / Replace Source Modal */}
      <AddSourceModal
        projectId={projectId}
        existingSources={sources}
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setReplaceTarget(null);
        }}
        onSourceAdded={onAddSource}
        replaceTargetSource={replaceTarget}
      />

      {/* MODAL 2: Source Details Inspector */}
      <SourceDetailsModal
        source={inspectSource}
        isOpen={!!inspectSource}
        onClose={() => setInspectSource(null)}
      />

      {/* MODAL 3: Source Multi-Format Preview */}
      <SourcePreviewModal
        source={previewSource}
        isOpen={!!previewSource}
        onClose={() => {
          setPreviewSource(null);
          setPreviewInitialSegmentId(undefined);
        }}
        initialSegmentId={previewInitialSegmentId}
      />

      {/* MODAL 4: Delete Confirmation */}
      <RemoveSourceModal
        source={sourceToRemove}
        isOpen={!!sourceToRemove}
        onClose={() => setSourceToRemove(null)}
        onConfirmRemove={async (src) => {
          await onRemoveSource(src);
          setSourceToRemove(null);
        }}
      />
    </section>
  );
};
