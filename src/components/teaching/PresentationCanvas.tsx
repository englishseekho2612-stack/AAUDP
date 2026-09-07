import React, { useState, useEffect } from 'react';
import { PresentationContent, SlideItem } from '../../types/ai';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileText,
  List,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface PresentationCanvasProps {
  presentation: PresentationContent | null;
  currentSlideIndex: number;
  onSlideChange: (index: number) => void;
  onSelectTopicForDetail?: (title: string, explanation: string) => void;
  onExplainWithAI?: (topic: string) => void;
}

export const PresentationCanvas: React.FC<PresentationCanvasProps> = ({
  presentation,
  currentSlideIndex,
  onSlideChange,
  onSelectTopicForDetail,
  onExplainWithAI,
}) => {
  const [showNotes, setShowNotes] = useState(false);
  const [showSlideList, setShowSlideList] = useState(false);

  // Fallback demo slides if the project hasn't generated slides yet
  const slides: SlideItem[] = presentation?.slides?.length
    ? presentation.slides
    : [
        {
          id: 'default_s1',
          order: 1,
          title: 'Photosynthesis — Core Biology',
          subtitle: 'Class 10 Biology Curriculum',
          content: 'The biochemical process transforming light energy into chemical fuel.',
          bullets: [
            'Occurs primarily in plant leaf chloroplasts',
            'Light reactions generate ATP and NADPH',
            'Calvin cycle fixes atmospheric CO2 into glucose',
            'Essential for Earth’s atmospheric oxygen equilibrium',
          ],
          speakerNotes:
            'Introduce the dual nature of light-dependent and dark reactions before diving into chloroplast anatomy.',
          visualSuggestions:
            'Diagram of a leaf cross-section showing mesophyll cells and stomata.',
          sourceReferences: [
            { sourceName: 'Photosynthesis Core Biology Curriculum', location: 'Section 1' },
          ],
        },
        {
          id: 'default_s2',
          order: 2,
          title: 'Chloroplast Structure & Thylakoids',
          subtitle: 'Anatomy of the Photosynthetic Unit',
          content: 'Double-membrane organelle housing grana stacks and stroma fluid.',
          bullets: [
            'Outer & Inner membranes enclose the stroma fluid',
            'Thylakoid sacs stacked into coin-like grana',
            'Chlorophyll pigments embedded in thylakoid lipid bilayer',
            'Lumen provides proton gradient accumulator for ATP synthase',
          ],
          speakerNotes:
            'Ask students why the thylakoid arrangement maximizes surface area for photon absorption.',
          visualSuggestions:
            'Close-up cutaway diagram of a chloroplast pointing to thylakoid lumen and stroma.',
          sourceReferences: [
            { sourceName: 'Photosynthesis Core Biology Curriculum', location: 'Section 2' },
          ],
        },
        {
          id: 'default_s3',
          order: 3,
          title: 'The Light Reactions (Thylakoid Membrane)',
          subtitle: 'Photolysis & Energy Harvesting',
          content: 'Conversion of solar photons into chemical energy currency.',
          bullets: [
            'Photons excite reaction center chlorophyll in Photosystem II and I',
            'Photolysis of water (H2O → 2H+ + 2e- + 1/2 O2)',
            'Electron transport chain pumps protons into thylakoid lumen',
            'ATP Synthase rotary enzyme produces ATP via chemiosmosis',
          ],
          speakerNotes:
            'Emphasize that oxygen released is a byproduct of water photolysis, not carbon dioxide splitting.',
          visualSuggestions:
            'Z-scheme electron transport chain flow chart from PS II to PS I.',
          sourceReferences: [
            { sourceName: 'Photosynthesis Core Biology Curriculum', location: 'Section 3' },
          ],
        },
        {
          id: 'default_s4',
          order: 4,
          title: 'The Calvin Cycle (Stroma)',
          subtitle: 'Light-Independent Carbon Fixation',
          content: 'Fixation of CO2 into 3-carbon sugars powered by ATP and NADPH.',
          bullets: [
            'Carbon fixation catalyzed by RuBisCO enzyme',
            '3-PGA reduced to G3P using NADPH and ATP from light reactions',
            'RuBP is regenerated to sustain cyclic operation',
            'Produces glucose, starch, and cellular building blocks',
          ],
          speakerNotes:
            'Highlight that although "dark reactions" do not require direct photons, they stop when ATP runs out.',
          visualSuggestions: 'Circular flow diagram of the 3 Calvin cycle phases.',
          sourceReferences: [
            { sourceName: 'Photosynthesis Core Biology Curriculum', location: 'Section 4' },
          ],
        },
      ];

  const totalSlides = slides.length;
  const currentSlide = slides[currentSlideIndex] || slides[0];

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      onSlideChange(currentSlideIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentSlideIndex < totalSlides - 1) {
      onSlideChange(currentSlideIndex + 1);
    }
  };

  return (
    <div
      id="presentation-canvas-container"
      className="relative w-full h-full flex flex-col justify-between bg-slate-900 select-none overflow-hidden"
    >
      {/* 16:9 Aspect Ratio Slide Viewport */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 min-h-0">
        <div
          id="active-slide-card"
          className="relative w-full max-w-5xl aspect-video bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-12 flex flex-col justify-between overflow-hidden text-white"
        >
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

          {/* Slide Header */}
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                {currentSlide.subtitle || 'Lesson Concept'}
              </span>
              <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                {currentSlideIndex + 1} / {totalSlides}
              </span>
            </div>

            <h2
              className="text-xl sm:text-3xl font-extrabold text-white mt-2 cursor-pointer hover:text-indigo-300 transition-colors"
              onClick={() =>
                onSelectTopicForDetail?.(currentSlide.title, currentSlide.content)
              }
              title="Click to view topic breakdown in Detail Panel"
            >
              {currentSlide.title}
            </h2>

            {currentSlide.content && (
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-3xl">
                {currentSlide.content}
              </p>
            )}
          </div>

          {/* Slide Bullet Points */}
          <div className="relative z-10 my-auto py-3 sm:py-6">
            <ul className="space-y-2.5 sm:space-y-3.5">
              {currentSlide.bullets?.map((bullet, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-xs sm:text-base text-slate-200 group cursor-pointer"
                  onClick={() => onSelectTopicForDetail?.(bullet, bullet)}
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0 group-hover:scale-125 transition-transform" />
                  <span className="group-hover:text-indigo-200 transition-colors leading-relaxed">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Slide Footer: Source Citation */}
          <div className="relative z-10 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              {currentSlide.sourceReferences?.length ? (
                <span className="text-[11px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60">
                  📍 {currentSlide.sourceReferences[0].sourceName} ({currentSlide.sourceReferences[0].location})
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Core Curriculum</span>
              )}
            </div>

            {onExplainWithAI && (
              <button
                id="btn-slide-explain-ai"
                onClick={() => onExplainWithAI(currentSlide.title)}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Explain Deeper</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Slide Navigation Bottom Bar */}
      <div className="bg-slate-950/90 border-t border-slate-800 px-4 py-2 flex items-center justify-between gap-2 shrink-0">
        {/* Left: Speaker Notes Toggle (Private to teacher) */}
        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-speaker-notes"
            onClick={() => setShowNotes(!showNotes)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              showNotes
                ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Speaker Notes</span>
          </button>

          <button
            id="btn-toggle-slide-list"
            onClick={() => setShowSlideList(!showSlideList)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              showSlideList
                ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Slide List</span>
          </button>
        </div>

        {/* Center: Previous / Next Controls + Slide Indicator (Section 4) */}
        <div className="flex items-center gap-3">
          <button
            id="btn-prev-slide"
            onClick={handlePrev}
            disabled={currentSlideIndex === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span
            id="slide-counter-display"
            className="text-xs font-bold text-slate-200 font-mono"
          >
            {currentSlideIndex + 1} / {totalSlides}
          </span>

          <button
            id="btn-next-slide"
            onClick={handleNext}
            disabled={currentSlideIndex === totalSlides - 1}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Quick Jump Dropdown */}
        <div className="flex items-center gap-2">
          <select
            id="select-jump-slide"
            value={currentSlideIndex}
            onChange={(e) => onSlideChange(parseInt(e.target.value, 10))}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none cursor-pointer"
          >
            {slides.map((s, idx) => (
              <option key={s.id} value={idx}>
                Slide {idx + 1}: {s.title.slice(0, 24)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Private Speaker Notes Drawer (Section 4 & 7) */}
      {showNotes && (
        <div
          id="speaker-notes-drawer"
          className="absolute bottom-12 left-4 right-4 max-w-xl bg-slate-800/95 backdrop-blur-md border border-amber-500/40 rounded-xl p-4 shadow-2xl z-40 text-slate-200 space-y-2 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Teacher Speaker Notes (Private)
            </span>
            <button
              onClick={() => setShowNotes(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {currentSlide.speakerNotes || 'No specific speaker notes for this slide.'}
          </p>
          {currentSlide.visualSuggestions && (
            <p className="text-[11px] text-slate-400 italic">
              💡 Visual cue: {currentSlide.visualSuggestions}
            </p>
          )}
        </div>
      )}

      {/* Slide Thumbnails Drawer */}
      {showSlideList && (
        <div
          id="slide-thumbnails-drawer"
          className="absolute bottom-12 left-4 right-4 max-h-48 overflow-x-auto bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-xl p-3 shadow-2xl z-40 flex items-center gap-3 animate-in fade-in duration-200"
        >
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                onSlideChange(idx);
                setShowSlideList(false);
              }}
              className={`shrink-0 w-36 aspect-video bg-slate-900 rounded-lg p-2 border text-left flex flex-col justify-between cursor-pointer transition-all ${
                currentSlideIndex === idx
                  ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                  : 'border-slate-700 hover:border-slate-500'
              }`}
            >
              <span className="text-[10px] font-bold text-slate-400">Slide {idx + 1}</span>
              <p className="text-[11px] font-semibold text-white truncate">{s.title}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
