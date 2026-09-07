/**
 * Presentation & Slide Deck Viewer & Editor
 * Section 17, 18, 19, 20: Slide presentation, speaker notes drawer, visual prompt suggestion,
 * slide editor (reorder, duplicate, add, delete), and layer versioning.
 */

import React, { useState } from 'react';
import {
  Presentation,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Edit3,
  Save,
  BookOpen,
  Image as ImageIcon,
  MessageSquare,
  Download,
  RotateCcw,
  LayoutGrid,
  Maximize,
  Sparkles,
} from 'lucide-react';
import { PresentationContent, SlideItem } from '../../types/ai';
import { ProjectAIOutput, SupportedLanguage } from '../../types/project';
import { Button, Badge } from '../common/UIControls';

export interface PresentationViewerProps {
  output: ProjectAIOutput<PresentationContent>;
  language: SupportedLanguage;
  onSaveTeacherEdits: (editedContent: PresentationContent) => void;
  onRestoreAI: () => void;
  onSwitchView: (view: 'ai' | 'teacher' | 'split') => void;
}

export const PresentationViewer: React.FC<PresentationViewerProps> = ({
  output,
  language,
  onSaveTeacherEdits,
  onRestoreAI,
  onSwitchView,
}) => {
  const isTeacherEdited = Boolean(output.teacherEditedContent);
  const activeContent: PresentationContent =
    output.activeView === 'ai' || !output.teacherEditedContent
      ? (output.rawAiContent as PresentationContent)
      : (output.teacherEditedContent as PresentationContent);

  const [workingDeck, setWorkingDeck] = useState<PresentationContent>(
    JSON.parse(JSON.stringify(activeContent || { title: 'Presentation', slides: [] }))
  );

  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'slide' | 'grid'>('slide');
  const [isEditingSlide, setIsEditingSlide] = useState<boolean>(false);

  // Slide Edit Fields
  const [editTitle, setEditTitle] = useState<string>('');
  const [editSubtitle, setEditSubtitle] = useState<string>('');
  const [editBulletsText, setEditBulletsText] = useState<string>('');
  const [editSpeakerNotes, setEditSpeakerNotes] = useState<string>('');
  const [editVisualSuggestions, setEditVisualSuggestions] = useState<string>('');

  React.useEffect(() => {
    if (activeContent) {
      setWorkingDeck(JSON.parse(JSON.stringify(activeContent)));
      setCurrentSlideIndex(0);
    }
  }, [output.activeView, output.lastModifiedAt]);

  const slides = workingDeck.slides || [];
  const currentSlide: SlideItem | undefined = slides[currentSlideIndex];

  // Sync edit form when slide changes
  React.useEffect(() => {
    if (currentSlide) {
      setEditTitle(currentSlide.title);
      setEditSubtitle(currentSlide.subtitle || '');
      setEditBulletsText((currentSlide.bullets || []).join('\n'));
      setEditSpeakerNotes(currentSlide.speakerNotes || '');
      setEditVisualSuggestions(currentSlide.visualSuggestions || '');
      setIsEditingSlide(false);
    }
  }, [currentSlideIndex, currentSlide?.id]);

  if (!activeContent || slides.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        <Presentation className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <p className="font-semibold text-slate-700 dark:text-slate-300">No slides generated yet.</p>
        <p className="text-xs text-slate-400 mt-1">Use "Create with AI" to generate a presentation.</p>
      </div>
    );
  }

  const saveDeckChanges = (newSlides: SlideItem[]) => {
    const updated: PresentationContent = {
      ...workingDeck,
      slides: newSlides.map((s, idx) => ({ ...s, order: idx + 1 })),
    };
    setWorkingDeck(updated);
    onSaveTeacherEdits(updated);
  };

  const handleSaveCurrentSlide = () => {
    if (!currentSlide) return;
    const updatedBullets = editBulletsText
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean);

    const updatedSlides = slides.map((s, idx) =>
      idx === currentSlideIndex
        ? {
            ...s,
            title: editTitle.trim() || s.title,
            subtitle: editSubtitle.trim(),
            bullets: updatedBullets,
            speakerNotes: editSpeakerNotes,
            visualSuggestions: editVisualSuggestions,
          }
        : s
    );

    saveDeckChanges(updatedSlides);
    setIsEditingSlide(false);
  };

  const handleAddSlide = () => {
    const newSlide: SlideItem = {
      id: `slide_${Date.now()}`,
      order: slides.length + 1,
      title: 'New Slide Title',
      subtitle: '',
      content: '',
      bullets: ['Key point 1', 'Key point 2'],
      speakerNotes: 'Notes for the teacher to speak in class.',
      visualSuggestions: 'Suggested illustration or diagram.',
      sourceReferences: [],
      layout: 'standard',
    };
    const next = [...slides, newSlide];
    saveDeckChanges(next);
    setCurrentSlideIndex(next.length - 1);
    setIsEditingSlide(true);
  };

  const handleDuplicateSlide = (idx: number) => {
    const target = slides[idx];
    if (!target) return;
    const duplicated: SlideItem = {
      ...target,
      id: `slide_${Date.now()}`,
      title: `${target.title} (Copy)`,
    };
    const next = [...slides.slice(0, idx + 1), duplicated, ...slides.slice(idx + 1)];
    saveDeckChanges(next);
    setCurrentSlideIndex(idx + 1);
  };

  const handleDeleteSlide = (idx: number) => {
    if (slides.length <= 1) {
      alert('A presentation must have at least 1 slide.');
      return;
    }
    const next = slides.filter((_, i) => i !== idx);
    saveDeckChanges(next);
    setCurrentSlideIndex(Math.max(0, idx - 1));
  };

  const handleMoveSlide = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;
    const next = [...slides];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    saveDeckChanges(next);
    setCurrentSlideIndex(targetIdx);
  };

  const handleExportText = () => {
    let text = `PRESENTATION: ${workingDeck.title}\n====================================\n\n`;
    slides.forEach((s, idx) => {
      text += `SLIDE ${idx + 1}: ${s.title}\n`;
      if (s.subtitle) text += `Subtitle: ${s.subtitle}\n`;
      text += `Points:\n${s.bullets.map((b) => `  * ${b}`).join('\n')}\n`;
      if (s.speakerNotes) text += `Speaker Notes:\n  ${s.speakerNotes}\n`;
      if (s.visualSuggestions) text += `Visual Idea: ${s.visualSuggestions}\n`;
      if (s.sourceReferences && s.sourceReferences.length > 0) {
        text += `Sources: ${s.sourceReferences.map((r) => `${r.sourceName} (${r.location})`).join(', ')}\n`;
      }
      text += '\n------------------------------------\n\n';
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workingDeck.title.replace(/\s+/g, '_')}_presentation.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="presentation-viewer" className="flex flex-col h-[780px] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      {/* Presentation Top Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {workingDeck.title}
              {isTeacherEdited ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  Teacher Edited
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  Original AI Output
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              {slides.length} slides • {workingDeck.estimatedDurationMinutes || 30} mins estimated class time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isTeacherEdited && (
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs mr-2">
              <button
                type="button"
                onClick={() => onSwitchView('ai')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  output.activeView === 'ai'
                    ? 'bg-white dark:bg-slate-900 shadow-xs font-bold text-blue-600'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Original AI
              </button>
              <button
                type="button"
                onClick={() => onSwitchView('teacher')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  output.activeView === 'teacher'
                    ? 'bg-white dark:bg-slate-900 shadow-xs font-bold text-amber-600'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Teacher Edits
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'slide' ? 'grid' : 'slide')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            {viewMode === 'slide' ? 'Grid View' : 'Single Slide'}
          </button>

          {isTeacherEdited && (
            <Button size="sm" variant="outline" onClick={onRestoreAI} icon={<RotateCcw className="w-3.5 h-3.5" />}>
              Restore AI
            </Button>
          )}

          <Button size="sm" variant="outline" onClick={handleExportText} icon={<Download className="w-3.5 h-3.5" />}>
            Export Handout
          </Button>

          <Button size="sm" variant="primary" onClick={handleAddSlide} icon={<Plus className="w-3.5 h-3.5" />}>
            Add Slide
          </Button>
        </div>
      </div>

      {/* Main Workspace */}
      {viewMode === 'grid' ? (
        /* GRID VIEW OF ALL SLIDES */
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                onClick={() => {
                  setCurrentSlideIndex(idx);
                  setViewMode('slide');
                }}
                className={`p-4 rounded-xl border bg-white dark:bg-slate-800 shadow-xs cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between h-48 ${
                  idx === currentSlideIndex
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold mb-1">
                    <span>SLIDE {idx + 1}</span>
                    {slide.sourceReferences && slide.sourceReferences.length > 0 && (
                      <span className="text-blue-500 font-normal">Grounded</span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                    {slide.title}
                  </h4>
                  {slide.subtitle && (
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{slide.subtitle}</p>
                  )}
                </div>

                <div className="space-y-1">
                  {slide.bullets.slice(0, 2).map((b, bIdx) => (
                    <p key={bIdx} className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                      • {b}
                    </p>
                  ))}
                  {slide.bullets.length > 2 && (
                    <span className="text-[9px] text-slate-400">+{slide.bullets.length - 2} more points</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* SINGLE SLIDE CAROUSEL & EDITOR VIEW */
        <div className="flex-1 flex overflow-hidden">
          {/* Slide Stage / Canvas */}
          <div className="flex-1 p-8 flex flex-col items-center justify-center overflow-y-auto">
            {/* The 16:9 Presentation Card */}
            <div
              id="active-slide-card"
              className="w-full max-w-3xl aspect-[16/9] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Slide Background Subtle Accent */}
              <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />

              {/* Slide Header */}
              <div>
                <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold mb-2">
                  <span>
                    SLIDE {currentSlideIndex + 1} OF {slides.length}
                  </span>
                  {currentSlide?.sourceReferences && currentSlide.sourceReferences.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{currentSlide.sourceReferences[0].location}</span>
                    </div>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                  {currentSlide?.title}
                </h2>
                {currentSlide?.subtitle && (
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                    {currentSlide.subtitle}
                  </p>
                )}
              </div>

              {/* Slide Bullet Content */}
              <div className="my-auto py-4 space-y-3">
                {currentSlide?.bullets.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2" />
                    <p className="text-base text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>

              {/* Slide Footer with Visual Idea Chip */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                {currentSlide?.visualSuggestions ? (
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px] bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate max-w-md">Idea: {currentSlide.visualSuggestions}</span>
                  </div>
                ) : (
                  <div />
                )}
                <span className="text-slate-400 font-mono text-[11px]">
                  {workingDeck.title} • {currentSlideIndex + 1}
                </span>
              </div>
            </div>

            {/* Slide Navigation Bar */}
            <div className="flex items-center gap-4 mt-6">
              <button
                id="btn-prev-slide"
                type="button"
                disabled={currentSlideIndex === 0}
                onClick={() => setCurrentSlideIndex((i) => Math.max(0, i - 1))}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 cursor-pointer shadow-xs"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-20 text-center">
                {currentSlideIndex + 1} / {slides.length}
              </span>

              <button
                id="btn-next-slide"
                type="button"
                disabled={currentSlideIndex === slides.length - 1}
                onClick={() => setCurrentSlideIndex((i) => Math.min(slides.length - 1, i + 1))}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 cursor-pointer shadow-xs"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right Side Slide Details & Editor Drawer */}
          <div className="w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shadow-lg">
            {/* Drawer Top */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Slide Controls
              </h4>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Move Slide Up"
                  disabled={currentSlideIndex === 0}
                  onClick={() => handleMoveSlide(currentSlideIndex, 'up')}
                  className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Move Slide Down"
                  disabled={currentSlideIndex === slides.length - 1}
                  onClick={() => handleMoveSlide(currentSlideIndex, 'down')}
                  className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Duplicate Slide"
                  onClick={() => handleDuplicateSlide(currentSlideIndex)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Delete Slide"
                  onClick={() => handleDeleteSlide(currentSlideIndex)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {isEditingSlide ? (
                /* EDIT FORM */
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Slide Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={editSubtitle}
                      onChange={(e) => setEditSubtitle(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Slide Bullets (One per line)
                    </label>
                    <textarea
                      rows={4}
                      value={editBulletsText}
                      onChange={(e) => setEditBulletsText(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Speaker Notes (Script to say aloud)
                    </label>
                    <textarea
                      rows={3}
                      value={editSpeakerNotes}
                      onChange={(e) => setEditSpeakerNotes(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Visual Illustration Suggestion
                    </label>
                    <input
                      type="text"
                      value={editVisualSuggestions}
                      onChange={(e) => setEditVisualSuggestions(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Button size="sm" variant="outline" onClick={() => setIsEditingSlide(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="primary" onClick={handleSaveCurrentSlide} icon={<Save className="w-3.5 h-3.5" />}>
                      Save Slide
                    </Button>
                  </div>
                </div>
              ) : (
                /* VIEW DETAILS */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Content Details
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingSlide(true)}
                      icon={<Edit3 className="w-3.5 h-3.5" />}
                    >
                      Edit Slide
                    </Button>
                  </div>

                  {/* Speaker Notes */}
                  {currentSlide?.speakerNotes && (
                    <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                        Teacher Speaking Notes
                      </span>
                      <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed italic">
                        "{currentSlide.speakerNotes}"
                      </p>
                    </div>
                  )}

                  {/* Visual Suggestions */}
                  {currentSlide?.visualSuggestions && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Visual Concept Idea
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        {currentSlide.visualSuggestions}
                      </p>
                    </div>
                  )}

                  {/* Grounded Citations */}
                  {currentSlide?.sourceReferences && currentSlide.sourceReferences.length > 0 && (
                    <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        Source References
                      </span>
                      {currentSlide.sourceReferences.map((ref, idx) => (
                        <div
                          key={idx}
                          className="text-xs text-blue-900 dark:text-blue-200 bg-white/70 dark:bg-slate-900/70 p-2 rounded-lg border border-blue-100 dark:border-blue-900/40"
                        >
                          <span className="font-semibold">{ref.sourceName}</span>
                          <span className="text-[11px] text-blue-600 dark:text-blue-400 ml-1.5">
                            • {ref.location}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
