/**
 * Audio Generation & Speech Synthesis Service
 * Section 26, 27, 28: Audio types, playback engine, seeking, and voice styles.
 */

import { AudioContent, AudioScriptSegment } from '../../types/ai';

export interface VoiceOption {
  id: string;
  name: string;
  lang: string;
  gender?: 'male' | 'female' | 'neutral';
}

class AudioService {
  private utterance: SpeechSynthesisUtterance | null = null;
  private currentAudioContent: AudioContent | null = null;
  private isPlayingState = false;
  private isPausedState = false;
  private currentSegmentIdx = 0;
  private onSegmentChangeListeners: ((idx: number) => void)[] = [];
  private onStateChangeListeners: ((isPlaying: boolean, isPaused: boolean) => void)[] = [];

  public getAvailableVoices(): VoiceOption[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return [];
    }
    const voices = window.speechSynthesis.getVoices();
    return voices.map((v) => ({
      id: v.voiceURI,
      name: `${v.name} (${v.lang})`,
      lang: v.lang,
    }));
  }

  public subscribeSegmentChange(callback: (idx: number) => void): () => void {
    this.onSegmentChangeListeners.push(callback);
    return () => {
      this.onSegmentChangeListeners = this.onSegmentChangeListeners.filter((c) => c !== callback);
    };
  }

  public subscribeStateChange(callback: (isPlaying: boolean, isPaused: boolean) => void): () => void {
    this.onStateChangeListeners.push(callback);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter((c) => c !== callback);
    };
  }

  private notifyState() {
    this.onStateChangeListeners.forEach((c) => c(this.isPlayingState, this.isPausedState));
  }

  private notifySegment(idx: number) {
    this.currentSegmentIdx = idx;
    this.onSegmentChangeListeners.forEach((c) => c(idx));
  }

  public playAudioContent(content: AudioContent, startSegmentIndex = 0, voiceName?: string, rate = 1.0) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis is not supported in this browser environment.');
      return;
    }

    this.stop();
    this.currentAudioContent = content;

    const segments = content.segments.length > 0 ? content.segments : [{ speaker: 'Teacher', text: content.script }];
    this.playSegmentChain(segments, startSegmentIndex, voiceName, rate);
  }

  private playSegmentChain(segments: AudioScriptSegment[], idx: number, voiceName?: string, rate = 1.0) {
    if (idx >= segments.length) {
      this.stop();
      return;
    }

    this.notifySegment(idx);
    const seg = segments[idx];

    const utt = new SpeechSynthesisUtterance(seg.text);
    utt.rate = rate;
    utt.pitch = 1.0;

    if (voiceName) {
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.voiceURI === voiceName || v.name === voiceName);
      if (match) utt.voice = match;
    }

    utt.onend = () => {
      if (this.isPlayingState && !this.isPausedState) {
        this.playSegmentChain(segments, idx + 1, voiceName, rate);
      }
    };

    utt.onerror = (e) => {
      console.warn('Speech synthesis utterance error:', e);
      this.stop();
    };

    this.utterance = utt;
    this.isPlayingState = true;
    this.isPausedState = false;
    this.notifyState();
    window.speechSynthesis.speak(utt);
  }

  public pause() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      this.isPausedState = true;
      this.notifyState();
    }
  }

  public resume() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      this.isPausedState = false;
      this.notifyState();
    }
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isPlayingState = false;
    this.isPausedState = false;
    this.utterance = null;
    this.notifyState();
  }

  public seekToSegment(index: number, voiceName?: string, rate = 1.0) {
    if (!this.currentAudioContent) return;
    this.playAudioContent(this.currentAudioContent, index, voiceName, rate);
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }

  public isPaused(): boolean {
    return this.isPausedState;
  }

  public getCurrentSegmentIndex(): number {
    return this.currentSegmentIdx;
  }

  public downloadScript(content: AudioContent) {
    const text = `TITLE: ${content.title}
TYPE: ${content.audioType}
ESTIMATED DURATION: ${Math.round(content.durationEstimateSeconds / 60)} minutes
VOICE STYLE: ${content.voiceStyle}

=======================================
COMPLETE SCRIPT:
=======================================
${content.script}

=======================================
TIMESTAMPS & SEGMENTS:
=======================================
${content.segments.map((s) => `[${s.timestamp || '00:00'}] ${s.speaker || 'Narrator'}: ${s.text}`).join('\n\n')}
`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_script.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const audioService = new AudioService();
