/**
 * Audio Lesson Player & Script Viewer
 * Section 26, 27, 28: Audio playback with SpeechSynthesis, seeking across segments,
 * real-time segment highlighting, script editor, and download.
 */

import React, { useState, useEffect } from 'react';
import {
  Headphones,
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  Edit3,
  Save,
  Volume2,
  FastForward,
  BookOpen,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AudioContent, AudioScriptSegment } from '../../types/ai';
import { ProjectAIOutput, SupportedLanguage } from '../../types/project';
import { audioService } from '../../services/ai/audioService';
import { Button, Badge } from '../common/UIControls';

export interface AudioViewerProps {
  output: ProjectAIOutput<AudioContent>;
  language: SupportedLanguage;
  onSaveTeacherEdits: (editedContent: AudioContent) => void;
  onRestoreAI: () => void;
  onSwitchView: (view: 'ai' | 'teacher' | 'split') => void;
}

export const AudioViewer: React.FC<AudioViewerProps> = ({
  output,
  language,
  onSaveTeacherEdits,
  onRestoreAI,
  onSwitchView,
}) => {
  const isTeacherEdited = Boolean(output.teacherEditedContent);
  const activeContent: AudioContent =
    output.activeView === 'ai' || !output.teacherEditedContent
      ? (output.rawAiContent as AudioContent)
      : (output.teacherEditedContent as AudioContent);

  const [workingAudio, setWorkingAudio] = useState<AudioContent>(
    JSON.parse(JSON.stringify(activeContent || { title: 'Audio Lesson', script: '', segments: [] }))
  );

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeSegmentIdx, setActiveSegmentIdx] = useState<number>(0);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [isEditingScript, setIsEditingScript] = useState<boolean>(false);
  const [scriptDraft, setScriptDraft] = useState<string>('');

  React.useEffect(() => {
    if (activeContent) {
      setWorkingAudio(JSON.parse(JSON.stringify(activeContent)));
      setScriptDraft(activeContent.script);
    }
  }, [output.activeView, output.lastModifiedAt]);

  // Subscribe to audioService playback events
  useEffect(() => {
    const unsubState = audioService.subscribeStateChange((playing, paused) => {
      setIsPlaying(playing);
      setIsPaused(paused);
    });

    const unsubSeg = audioService.subscribeSegmentChange((idx) => {
      setActiveSegmentIdx(idx);
    });

    return () => {
      unsubState();
      unsubSeg();
      audioService.stop();
    };
  }, []);

  if (!activeContent) {
    return (
      <div className="p-12 text-center text-slate-500">
        <Headphones className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <p className="font-semibold text-slate-700 dark:text-slate-300">No audio lesson generated yet.</p>
        <p className="text-xs text-slate-400 mt-1">Use "Create with AI" to generate an audio lesson.</p>
      </div>
    );
  }

  const handlePlayToggle = () => {
    if (isPlaying && !isPaused) {
      audioService.pause();
    } else if (isPaused) {
      audioService.resume();
    } else {
      audioService.playAudioContent(workingAudio, activeSegmentIdx, undefined, speechRate);
    }
  };

  const handleStop = () => {
    audioService.stop();
    setActiveSegmentIdx(0);
  };

  const handleSeekSegment = (idx: number) => {
    setActiveSegmentIdx(idx);
    audioService.seekToSegment(idx, undefined, speechRate);
  };

  const handleSaveScript = () => {
    const updated: AudioContent = {
      ...workingAudio,
      script: scriptDraft,
    };
    setWorkingAudio(updated);
    onSaveTeacherEdits(updated);
    setIsEditingScript(false);
  };

  const segments = workingAudio.segments || [];

  return (
    <div id="audio-viewer" className="flex flex-col h-[780px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {workingAudio.title}
              {isTeacherEdited ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  Teacher Edited
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                  Original AI Output
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Type: {workingAudio.audioType} • Est. Duration: {Math.round(workingAudio.durationEstimateSeconds / 60)} mins • Voice: {workingAudio.voiceStyle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isTeacherEdited && (
            <Button size="sm" variant="outline" onClick={onRestoreAI} icon={<RotateCcw className="w-3.5 h-3.5" />}>
              Restore AI
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => audioService.downloadScript(workingAudio)}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Download Script
          </Button>

          <Button
            size="sm"
            variant={isEditingScript ? 'primary' : 'outline'}
            onClick={() => (isEditingScript ? handleSaveScript() : setIsEditingScript(true))}
            icon={isEditingScript ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
          >
            {isEditingScript ? 'Save Script' : 'Edit Script'}
          </Button>
        </div>
      </div>

      {/* Audio Player Control Bar */}
      <div className="p-4 bg-purple-900 text-white flex flex-wrap items-center justify-between gap-4 shadow-md">
        {/* Play/Pause/Stop */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-play-audio"
            onClick={handlePlayToggle}
            className="w-11 h-11 rounded-full bg-white text-purple-900 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow-md"
          >
            {isPlaying && !isPaused ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button
            type="button"
            id="btn-stop-audio"
            onClick={handleStop}
            className="p-2.5 rounded-full bg-purple-800 hover:bg-purple-700 text-white transition-colors cursor-pointer"
            title="Stop Playback"
          >
            <Square className="w-4 h-4" />
          </button>
          <div className="ml-2">
            <span className="text-xs font-bold block">
              {isPlaying ? (isPaused ? 'Paused' : 'Playing Speech...') : 'Ready to Play'}
            </span>
            <span className="text-[11px] text-purple-300">
              Segment {activeSegmentIdx + 1} of {segments.length || 1}
            </span>
          </div>
        </div>

        {/* Speed rate controls */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-purple-300">Speed:</span>
          {[0.8, 1.0, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => {
                setSpeechRate(rate);
                if (isPlaying) {
                  audioService.playAudioContent(workingAudio, activeSegmentIdx, undefined, rate);
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                speechRate === rate ? 'bg-white text-purple-950 shadow-xs' : 'bg-purple-800 text-purple-200 hover:bg-purple-700'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
        {isEditingScript ? (
          /* SCRIPT EDITING MODE */
          <div className="space-y-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Edit Spoken Dialogue & Script
            </h4>
            <textarea
              rows={16}
              value={scriptDraft}
              onChange={(e) => setScriptDraft(e.target.value)}
              className="w-full text-xs p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-sans leading-relaxed"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsEditingScript(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleSaveScript} icon={<Save className="w-3.5 h-3.5" />}>
                Save Script Changes
              </Button>
            </div>
          </div>
        ) : (
          /* SEGMENT PLAYBACK & TIMELINE */
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Lesson Overview
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                {workingAudio.script.substring(0, 240)}...
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Speech Segments & Timestamps (Click segment to jump)
              </span>

              {segments.map((seg, idx) => {
                const isActive = activeSegmentIdx === idx && isPlaying;

                return (
                  <div
                    key={idx}
                    id={`audio-seg-${idx}`}
                    onClick={() => handleSeekSegment(idx)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                      isActive
                        ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 shadow-sm ring-1 ring-purple-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex flex-col items-center shrink-0 w-12">
                      <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                        {seg.timestamp || `0${idx}:00`}
                      </span>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping mt-2" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                          {seg.speaker || 'Teacher'}
                        </span>
                        {seg.tone && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-md">
                            Tone: {seg.tone}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {seg.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
