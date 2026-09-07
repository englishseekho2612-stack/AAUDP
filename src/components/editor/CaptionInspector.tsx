import React, { useState } from 'react';
import {
  Subtitles,
  Plus,
  Trash2,
  Download,
  Search,
  Sparkles,
  Layers,
  Check,
} from 'lucide-react';
import { CaptionCue, CaptionStylePreset } from '../../types/editor';

interface CaptionInspectorProps {
  captions: CaptionCue[];
  currentTimeMs: number;
  onUpdateCaptions: (cues: CaptionCue[]) => void;
  onDownloadSrt: () => void;
  onSeekTo: (timeMs: number) => void;
}

export const CaptionInspector: React.FC<CaptionInspectorProps> = ({
  captions,
  currentTimeMs,
  onUpdateCaptions,
  onDownloadSrt,
  onSeekTo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<CaptionStylePreset>('teaching');

  const formatMs = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleTextChange = (id: string, newText: string) => {
    const updated = captions.map((c) => (c.id === id ? { ...c, text: newText } : c));
    onUpdateCaptions(updated);
  };

  const handleDeleteCue = (id: string) => {
    const updated = captions.filter((c) => c.id !== id);
    onUpdateCaptions(updated);
  };

  const handleAddCueAtCurrent = () => {
    const newCue: CaptionCue = {
      id: `cue_${Date.now()}`,
      startTimeMs: currentTimeMs,
      endTimeMs: currentTimeMs + 3500,
      text: 'New subtitle cue...',
      stylePreset: selectedPreset,
      alignment: 'center',
      positionYPercent: 86,
    };
    const updated = [...captions, newCue].sort((a, b) => a.startTimeMs - b.startTimeMs);
    onUpdateCaptions(updated);
  };

  const handleApplyPresetAll = (preset: CaptionStylePreset) => {
    setSelectedPreset(preset);
    const updated = captions.map((c) => ({ ...c, stylePreset: preset }));
    onUpdateCaptions(updated);
  };

  const handleReplaceAll = () => {
    if (!searchQuery.trim()) return;
    const updated = captions.map((c) => ({
      ...c,
      text: c.text.replaceAll(searchQuery, replaceQuery),
    }));
    onUpdateCaptions(updated);
    setSearchQuery('');
    setReplaceQuery('');
  };

  const filteredCaptions = captions.filter((c) =>
    c.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      id="caption-inspector-drawer"
      className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-xs"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Subtitles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100">Captions & Subtitle Editor</h3>
            <span className="text-[10px] text-slate-400">{captions.length} timed speech cues</span>
          </div>
        </div>

        <button
          onClick={onDownloadSrt}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
          title="Export standard SRT format"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>Export SRT</span>
        </button>
      </div>

      {/* Style Presets (Section 8) */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800 space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Subtitle Visual Presets
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {(['teaching', 'youtube', 'highlight', 'simple'] as CaptionStylePreset[]).map((p) => (
            <button
              key={p}
              onClick={() => handleApplyPresetAll(p)}
              className={`p-1.5 rounded-lg border text-center capitalize font-semibold transition-all cursor-pointer ${
                selectedPreset === p
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Replace */}
      <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        {searchQuery && (
          <>
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="w-28 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              onClick={handleReplaceAll}
              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg cursor-pointer"
            >
              Replace
            </button>
          </>
        )}
      </div>

      {/* Subtitles List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredCaptions.map((cue) => {
          const isActive = cue.startTimeMs <= currentTimeMs && currentTimeMs <= cue.endTimeMs;
          return (
            <div
              key={cue.id}
              onClick={() => onSeekTo(cue.startTimeMs)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/30'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1 text-[10px] font-mono text-slate-400">
                <span className="text-amber-400/90 font-bold">
                  {formatMs(cue.startTimeMs)} → {formatMs(cue.endTimeMs)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCue(cue.id);
                  }}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded cursor-pointer"
                  title="Delete cue"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <textarea
                value={cue.text}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleTextChange(cue.id, e.target.value)}
                rows={2}
                className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
              />
            </div>
          );
        })}
      </div>

      {/* Footer Add Cue */}
      <div className="p-3 border-t border-slate-800 bg-slate-950">
        <button
          onClick={handleAddCueAtCurrent}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Cue at Current Playhead ({formatMs(currentTimeMs)})</span>
        </button>
      </div>
    </div>
  );
};
