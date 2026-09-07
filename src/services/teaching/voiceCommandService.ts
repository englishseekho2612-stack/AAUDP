/**
 * AI Voice Command & Speech-to-Text Engine
 * 
 * Supports:
 * - Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 * - Safe Command Mode / Push-to-Talk trigger (Section 32)
 * - Command parsing with fuzzy matching
 * - Destructive action confirmation checks (Section 33)
 * - Live Captions streaming (Section 35)
 */

import { RecognizedVoiceCommand, VoiceCommandIntent } from '../../types/teaching';

export type VoiceCommandHandler = (command: RecognizedVoiceCommand) => void;
export type LiveCaptionHandler = (transcript: string, isFinal: boolean) => void;

interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export class VoiceCommandService {
  private recognition: any = null;
  private isListening = false;
  private pushToTalkActive = false;
  private commandHandlers: VoiceCommandHandler[] = [];
  private captionHandlers: LiveCaptionHandler[] = [];
  private isAvailable = false;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const win = window as IWindowWithSpeech;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      this.isAvailable = false;
      return;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.isAvailable = true;

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const activeText = (finalTranscript || interimTranscript).trim();

        // Broadcast to live captions handlers
        if (activeText) {
          for (const cb of this.captionHandlers) {
            cb(activeText, !!finalTranscript);
          }
        }

        // Only parse commands if push-to-talk is active or command mode is triggered
        if (finalTranscript && this.pushToTalkActive) {
          const parsed = this.parseCommand(finalTranscript);
          if (parsed.intent !== 'unknown') {
            for (const cb of this.commandHandlers) {
              cb(parsed);
            }
          }
        }
      };

      this.recognition.onerror = (e: any) => {
        console.warn('Voice command recognition notice:', e.error);
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          // Restart to keep live captions running
          try {
            this.recognition.start();
          } catch {
            // Ignore restart error
          }
        }
      };
    } catch (e) {
      console.warn('SpeechRecognition failed to initialize:', e);
      this.isAvailable = false;
    }
  }

  public isSupported(): boolean {
    return this.isAvailable;
  }

  public onCommand(handler: VoiceCommandHandler) {
    this.commandHandlers.push(handler);
    return () => {
      this.commandHandlers = this.commandHandlers.filter((h) => h !== handler);
    };
  }

  public onCaption(handler: LiveCaptionHandler) {
    this.captionHandlers.push(handler);
    return () => {
      this.captionHandlers = this.captionHandlers.filter((h) => h !== handler);
    };
  }

  public startListening() {
    if (!this.recognition || this.isListening) return;
    try {
      this.isListening = true;
      this.recognition.start();
    } catch (e) {
      console.warn('Could not start recognition:', e);
    }
  }

  public stopListening() {
    if (!this.recognition || !this.isListening) return;
    this.isListening = false;
    try {
      this.recognition.stop();
    } catch (e) {
      // Ignore
    }
  }

  public setPushToTalk(active: boolean) {
    this.pushToTalkActive = active;
    if (active && !this.isListening) {
      this.startListening();
    }
  }

  public getPushToTalkActive(): boolean {
    return this.pushToTalkActive;
  }

  /**
   * Safe Command Parser
   */
  public parseCommand(rawText: string): RecognizedVoiceCommand {
    const text = rawText.toLowerCase().trim();

    // Next slide
    if (/(next slide|forward slide|next page)/i.test(text)) {
      return {
        rawTranscript: rawText,
        intent: 'next_slide',
        confidence: 0.95,
        timestamp: Date.now(),
        isDestructive: false,
      };
    }

    // Previous slide
    if (/(previous slide|prev slide|back slide|previous page)/i.test(text)) {
      return {
        rawTranscript: rawText,
        intent: 'prev_slide',
        confidence: 0.95,
        timestamp: Date.now(),
        isDestructive: false,
      };
    }

    // Jump to slide N (e.g. "open slide 5" or "go to slide 3")
    const slideMatch = text.match(/(?:open|go to|show)?\s*slide\s*(\d+)/i);
    if (slideMatch && slideMatch[1]) {
      return {
        rawTranscript: rawText,
        intent: 'jump_slide',
        parameter: parseInt(slideMatch[1], 10),
        confidence: 0.9,
        timestamp: Date.now(),
        isDestructive: false,
      };
    }

    // Open mind map
    if (/(open mind map|show mind map|mind map mode|open concept map)/i.test(text)) {
      return {
        rawTranscript: rawText,
        intent: 'open_mind_map',
        confidence: 0.92,
        timestamp: Date.now(),
        isDestructive: false,
      };
    }

    // Open visual tree
    if (/(open visual tree|show visual tree|visual tree mode|open tree mode|show knowledge tree)/i.test(text)) {
      return {
        rawTranscript: rawText,
        intent: 'open_visual_tree',
        confidence: 0.94,
        timestamp: Date.now(),
        isDestructive: false,
      };
    }

    // Expand / collapse branch
    if (/(expand this branch|expand branch|open branch|expand node)/i.test(text)) {
      return {
        rawTranscript: rawText,
        intent: 'expand_branch',
        confidence: 0.9,
        timestamp: Date.now(),
        isDestructive: false,
      };
    }

    if (/(collapse this branch|collapse branch|close branch|collapse node)/i.test(text)) {
      return {
        rawTranscript: rawText,
        intent: 'collapse_branch',
        confidence: 0.9,
        timestamp: Date.now(),
        isDestructive: false,
      };
    }

    // Show source
    if (/(show source|open source|view source|show reference|cite source)/i.test(text)) {
      return {
        rawTranscript: rawText,
        intent: 'show_source',
        confidence: 0.9,
        timestamp: Date.now(),
        isDestructive: false,
      };
    }

    // Show example
    if (/(show example|give example|explain example|more examples)/i.test(text)) {
      return {
        rawTranscript: rawText,
        intent: 'show_example',
        confidence: 0.9,
        timestamp: Date.now(),
        isDestructive: false,
      };
    }

    // Go back
    if (/(go back|previous view|return back|close panel)/i.test(text)) {
      return {
        rawTranscript: rawText,
        intent: 'go_back',
        confidence: 0.9,
        timestamp: Date.now(),
        isDestructive: false,
      };
    }

    // Show topic [name]
    const topicMatch = text.match(/(?:show|open|focus|select)\s+(?:topic|concept|node)\s+(.+)/i);
    if (topicMatch && topicMatch[1]) {
      return {
        rawTranscript: rawText,
        intent: 'show_topic',
        parameter: topicMatch[1].trim(),
        confidence: 0.88,
        timestamp: Date.now(),
        isDestructive: false,
      };
    }

    // Open whiteboard
    if (/(open whiteboard|show whiteboard|whiteboard mode|draw canvas)/i.test(text)) {
      return {
        rawTranscript: rawText,
        intent: 'open_whiteboard',
        confidence: 0.92,
        timestamp: Date.now(),
        isDestructive: false,
      };
    }

    // Explain this topic
    if (/(explain this topic|explain topic|ai explanation|teach this)/i.test(text)) {
      return {
        rawTranscript: rawText,
        intent: 'explain_topic',
        confidence: 0.9,
        timestamp: Date.now(),
        isDestructive: false,
      };
    }

    // Show notes
    if (/(show notes|open notes|teacher notes|my notes)/i.test(text)) {
      return {
        rawTranscript: rawText,
        intent: 'show_notes',
        confidence: 0.88,
        timestamp: Date.now(),
        isDestructive: false,
      };
    }

    // Start recording
    if (/(start recording|begin record|record session)/i.test(text)) {
      return {
        rawTranscript: rawText,
        intent: 'start_recording',
        confidence: 0.95,
        timestamp: Date.now(),
        isDestructive: false,
      };
    }

    // Stop recording
    if (/(stop recording|end recording|finish record)/i.test(text)) {
      return {
        rawTranscript: rawText,
        intent: 'stop_recording',
        confidence: 0.95,
        timestamp: Date.now(),
        isDestructive: false,
      };
    }

    // Clear annotations (DESTRUCTIVE -> requires confirmation, Section 33)
    if (/(clear all annotations|clear whiteboard|erase all drawings|clear drawings)/i.test(text)) {
      return {
        rawTranscript: rawText,
        intent: 'clear_annotations',
        confidence: 0.95,
        timestamp: Date.now(),
        isDestructive: true,
      };
    }

    // Go fullscreen
    if (/(go fullscreen|enter fullscreen|full screen mode)/i.test(text)) {
      return {
        rawTranscript: rawText,
        intent: 'go_fullscreen',
        confidence: 0.9,
        timestamp: Date.now(),
        isDestructive: false,
      };
    }

    // Show topic (e.g. "show young seagull" or "show calvin cycle")
    const fallbackTopicMatch = text.match(/(?:show|open|find topic)\s+([a-zA-Z0-9\s]{3,30})/i);
    if (fallbackTopicMatch && fallbackTopicMatch[1]) {
      return {
        rawTranscript: rawText,
        intent: 'show_topic',
        parameter: fallbackTopicMatch[1].trim(),
        confidence: 0.85,
        timestamp: Date.now(),
        isDestructive: false,
      };
    }

    return {
      rawTranscript: rawText,
      intent: 'unknown',
      confidence: 0.2,
      timestamp: Date.now(),
      isDestructive: false,
    };
  }

  /**
   * Manual dispatch for UI trigger / Simulator fallback
   */
  public triggerManualCommand(commandText: string) {
    const parsed = this.parseCommand(commandText);
    for (const cb of this.commandHandlers) {
      cb(parsed);
    }
    return parsed;
  }
}

export const voiceCommandService = new VoiceCommandService();
