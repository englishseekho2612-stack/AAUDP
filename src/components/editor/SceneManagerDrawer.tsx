import React, { useState } from 'react';
import {
  Layers,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Trash2,
  Sparkles,
  Camera,
  Compass,
} from 'lucide-react';
import { SceneItem, PedagogicalStage } from '../../types/editor';
import { aiEditorAssistant } from '../../services/editor/aiEditorAssistant';

interface SceneManagerDrawerProps {
  scenes: SceneItem[];
  durationMs: number;
  onUpdateScenes: (scenes: SceneItem[]) => void;
  onSeekTo: (timeMs: number) => void;
}

export const SceneManagerDrawer: React.FC<SceneManagerDrawerProps> = ({
  scenes,
  durationMs,
  onUpdateScenes,
  onSeekTo,
}) => {
  const formatMs = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleApplyPedagogicalTemplate = () => {
    if (scenes.length > 0 && !window.confirm('Apply 8-stage educational template to structure this lesson?')) {
      return;
    }
    const template = aiEditorAssistant.getStandardPedagogicalTemplate(durationMs);
    onUpdateScenes(template);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= scenes.length) return;
    const updated = [...scenes];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    onUpdateScenes(updated);
  };

  const handleDelete = (id: string) => {
    onUpdateScenes(scenes.filter((s) => s.id !== id));
  };

  const getStageColor = (stage?: PedagogicalStage) => {
    switch (stage) {
      case 'hook':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'objective':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'concept':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'explanation':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'example':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'mind_map':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'quiz':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'summary':
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div
      id="scene-manager-drawer"
      className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-xs"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100">Scene Structure & Flow</h3>
            <span className="text-[10px] text-slate-400">{scenes.length} pedagogical sections</span>
          </div>
        </div>

        <button
          onClick={handleApplyPedagogicalTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-semibold transition-colors cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Apply Template</span>
        </button>
      </div>

      {/* Scenes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {scenes.map((scene, idx) => (
          <div
            key={scene.id}
            onClick={() => onSeekTo(scene.startTimeMs)}
            className="p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-700 transition-all cursor-pointer space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold font-mono text-[10px] text-slate-300">
                  {idx + 1}
                </span>
                <span className="font-bold text-slate-200">{scene.title}</span>
              </div>

              {/* Up / Down Reorder */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMove(idx, 'up');
                  }}
                  disabled={idx === 0}
                  className="p-1 text-slate-500 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMove(idx, 'down');
                  }}
                  disabled={idx === scenes.length - 1}
                  className="p-1 text-slate-500 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(scene.id);
                  }}
                  className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Badges: Time, Stage, Camera */}
            <div className="flex items-center gap-2 flex-wrap text-[10px]">
              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                {formatMs(scene.startTimeMs)} - {formatMs(scene.endTimeMs)}
              </span>

              {scene.pedagogicalStage && (
                <span className={`px-2 py-0.5 rounded border capitalize font-semibold ${getStageColor(scene.pedagogicalStage)}`}>
                  {scene.pedagogicalStage}
                </span>
              )}

              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 flex items-center gap-1">
                <Camera className="w-2.5 h-2.5" />
                {scene.cameraLayout}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
