/**
 * Video Storyboard Viewer & Player
 * Section 29, 30, 31: Scene sequencing, storyboard simulation player, text overlays,
 * transitions, and scene editing.
 */

import React, { useState, useEffect } from 'react';
import {
  Video,
  Play,
  Pause,
  Plus,
  Trash2,
  Edit3,
  Save,
  BookOpen,
  Film,
  RotateCcw,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { VideoContent, VideoScene } from '../../types/ai';
import { ProjectAIOutput, SupportedLanguage } from '../../types/project';
import { Button, Badge } from '../common/UIControls';

export interface VideoViewerProps {
  output: ProjectAIOutput<VideoContent>;
  language: SupportedLanguage;
  onSaveTeacherEdits: (editedContent: VideoContent) => void;
  onRestoreAI: () => void;
  onSwitchView: (view: 'ai' | 'teacher' | 'split') => void;
}

export const VideoViewer: React.FC<VideoViewerProps> = ({
  output,
  language,
  onSaveTeacherEdits,
  onRestoreAI,
  onSwitchView,
}) => {
  const isTeacherEdited = Boolean(output.teacherEditedContent);
  const activeContent: VideoContent =
    output.activeView === 'ai' || !output.teacherEditedContent
      ? (output.rawAiContent as VideoContent)
      : (output.teacherEditedContent as VideoContent);

  const [workingVideo, setWorkingVideo] = useState<VideoContent>(
    JSON.parse(JSON.stringify(activeContent || { title: 'Video Plan', scenes: [] }))
  );

  const [activeSceneIdx, setActiveSceneIdx] = useState<number>(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);

  // Edit fields
  const [editNarration, setEditNarration] = useState<string>('');
  const [editVisualDesc, setEditVisualDesc] = useState<string>('');
  const [editOverlay, setEditOverlay] = useState<string>('');
  const [editDuration, setEditDuration] = useState<number>(15);

  React.useEffect(() => {
    if (activeContent) {
      setWorkingVideo(JSON.parse(JSON.stringify(activeContent)));
    }
  }, [output.activeView, output.lastModifiedAt]);

  const scenes = workingVideo.scenes || [];
  const currentScene = scenes[activeSceneIdx];

  // Storyboard player auto-advancement simulation
  useEffect(() => {
    if (!isPlayingPreview || !currentScene) return;

    const timer = setTimeout(() => {
      if (activeSceneIdx < scenes.length - 1) {
        setActiveSceneIdx((idx) => idx + 1);
      } else {
        setIsPlayingPreview(false);
        setActiveSceneIdx(0);
      }
    }, Math.max(3000, currentScene.durationSeconds * 1000));

    return () => clearTimeout(timer);
  }, [isPlayingPreview, activeSceneIdx, currentScene?.durationSeconds, scenes.length]);

  if (!activeContent || scenes.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        <Video className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <p className="font-semibold text-slate-700 dark:text-slate-300">No video storyboard generated yet.</p>
        <p className="text-xs text-slate-400 mt-1">Use "Create with AI" to generate a video plan.</p>
      </div>
    );
  }

  const saveVideoChanges = (newScenes: VideoScene[]) => {
    const updated: VideoContent = {
      ...workingVideo,
      scenes: newScenes.map((s, idx) => ({ ...s, order: idx + 1 })),
    };
    setWorkingVideo(updated);
    onSaveTeacherEdits(updated);
  };

  const startEditScene = (sc: VideoScene) => {
    setEditingSceneId(sc.id);
    setEditNarration(sc.narration);
    setEditVisualDesc(sc.visualDescription);
    setEditOverlay(sc.textOverlay);
    setEditDuration(sc.durationSeconds);
  };

  const handleSaveScene = (scId: string) => {
    const next = scenes.map((s) =>
      s.id === scId
        ? {
            ...s,
            narration: editNarration,
            visualDescription: editVisualDesc,
            textOverlay: editOverlay,
            durationSeconds: editDuration,
          }
        : s
    );
    saveVideoChanges(next);
    setEditingSceneId(null);
  };

  const handleAddScene = () => {
    const newSc: VideoScene = {
      id: `scene_${Date.now()}`,
      order: scenes.length + 1,
      durationSeconds: 15,
      narration: 'Teacher narration for this scene.',
      visualDescription: 'Visual illustration or diagram on screen.',
      textOverlay: 'Key takeaway or title',
      transition: 'fade',
      sourceReferences: [],
    };
    const next = [...scenes, newSc];
    saveVideoChanges(next);
    startEditScene(newSc);
    setActiveSceneIdx(next.length - 1);
  };

  const handleDeleteScene = (scId: string) => {
    if (scenes.length <= 1) {
      alert('A video plan must contain at least 1 scene.');
      return;
    }
    const next = scenes.filter((s) => s.id !== scId);
    saveVideoChanges(next);
    setActiveSceneIdx(Math.max(0, activeSceneIdx - 1));
  };

  return (
    <div id="video-viewer" className="flex flex-col h-[780px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {workingVideo.title}
              {isTeacherEdited ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  Teacher Edited
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  Original AI Output
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              {scenes.length} scenes • Ratio: {workingVideo.aspectRatio} • Voice: {workingVideo.voiceStyle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isTeacherEdited && (
            <Button size="sm" variant="outline" onClick={onRestoreAI} icon={<RotateCcw className="w-3.5 h-3.5" />}>
              Restore AI
            </Button>
          )}

          <Button size="sm" variant="primary" onClick={handleAddScene} icon={<Plus className="w-3.5 h-3.5" />}>
            Add Scene
          </Button>
        </div>
      </div>

      {/* Storyboard Simulation Viewport */}
      <div className="p-6 bg-slate-900 text-white flex flex-col items-center justify-center border-b border-slate-800">
        <div className="w-full max-w-2xl aspect-[16/9] bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between p-6 relative overflow-hidden shadow-2xl">
          {/* Top Info Bar in Video */}
          <div className="flex items-center justify-between text-xs text-slate-400 z-10">
            <span className="font-mono font-bold text-rose-400">
              SCENE {activeSceneIdx + 1} OF {scenes.length}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {currentScene?.durationSeconds}s
            </span>
          </div>

          {/* Visual Description in Screen Center */}
          <div className="my-auto text-center space-y-3 z-10 px-6">
            <div className="inline-block p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 max-w-lg mx-auto">
              <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">
                Visual Cue:
              </span>
              {currentScene?.visualDescription}
            </div>

            {currentScene?.textOverlay && (
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase drop-shadow-md">
                "{currentScene.textOverlay}"
              </h3>
            )}
          </div>

          {/* Spoken Narration Subtitle Strip */}
          <div className="p-3 rounded-xl bg-black/70 border border-slate-800 text-center text-xs text-amber-200 z-10">
            🎙️ "{currentScene?.narration}"
          </div>
        </div>

        {/* Video Player Controls */}
        <div className="flex items-center gap-4 mt-4">
          <button
            type="button"
            disabled={activeSceneIdx === 0}
            onClick={() => setActiveSceneIdx((i) => Math.max(0, i - 1))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsPlayingPreview(!isPlayingPreview)}
            icon={isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          >
            {isPlayingPreview ? 'Pause Preview' : 'Play Storyboard'}
          </Button>

          <button
            type="button"
            disabled={activeSceneIdx === scenes.length - 1}
            onClick={() => setActiveSceneIdx((i) => Math.min(scenes.length - 1, i + 1))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scene Timeline & Editing Strip */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Storyboard Scenes Timeline
        </h4>

        {scenes.map((scene, idx) => {
          const isEditing = editingSceneId === scene.id;
          const isActive = activeSceneIdx === idx;

          return (
            <div
              key={scene.id}
              onClick={() => setActiveSceneIdx(idx)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                isActive
                  ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              {isEditing ? (
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold block mb-1">Duration (seconds)</label>
                      <input
                        type="number"
                        value={editDuration}
                        onChange={(e) => setEditDuration(Number(e.target.value))}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold block mb-1">Text Overlay</label>
                      <input
                        type="text"
                        value={editOverlay}
                        onChange={(e) => setEditOverlay(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1">Visual Prompt / Action</label>
                    <textarea
                      rows={2}
                      value={editVisualDesc}
                      onChange={(e) => setEditVisualDesc(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1">Narration / Voiceover</label>
                    <textarea
                      rows={2}
                      value={editNarration}
                      onChange={(e) => setEditNarration(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingSceneId(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => handleSaveScene(scene.id)} icon={<Save className="w-3.5 h-3.5" />}>
                      Save Scene
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {scene.durationSeconds} seconds • Transition: {scene.transition}
                        </span>
                        {scene.textOverlay && (
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md font-semibold">
                            Overlay: "{scene.textOverlay}"
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        <strong>Visual:</strong> {scene.visualDescription}
                      </p>
                      <p className="text-xs text-slate-800 dark:text-slate-200 italic">
                        <strong>Narration:</strong> "{scene.narration}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => startEditScene(scene)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteScene(scene.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
