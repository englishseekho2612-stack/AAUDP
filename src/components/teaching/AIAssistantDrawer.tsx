import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Volume2,
  Bookmark,
  Check,
  Send,
  HelpCircle,
  Clock,
  Lightbulb,
} from 'lucide-react';
import { defaultGeminiProvider } from '../../services/ai/geminiProvider';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentContext: {
    title: string;
    description: string;
  };
  onInsertToNotes: (text: string) => void;
  onInsertToWhiteboard: (text: string) => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  currentContext,
  onInsertToNotes,
  onInsertToWhiteboard,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    { label: 'Explain in simple words', text: 'Explain this in super simple, accessible language suitable for 10th-grade students.' },
    { label: 'Give real-life example', text: 'Provide 2 vivid real-life examples or analogies for this concept.' },
    { label: 'Create 1 classroom MCQ', text: 'Generate 1 high-yield classroom multiple-choice question with 4 options and the correct explanation.' },
    { label: 'Explain in 30 seconds', text: 'Provide an energetic, 30-second rapid summary of this concept.' },
  ];

  const handleAsk = async (customPrompt?: string) => {
    const textToSend = customPrompt || promptInput;
    if (!textToSend.trim()) return;

    setIsLoading(true);
    setResponse('');

    const fullPrompt = `The teacher is currently teaching the topic: "${currentContext.title}".
Context summary: "${currentContext.description}".

Teacher prompt: "${textToSend}".

Respond directly and concisely in an engaging, classroom-tested pedagogical tone.`;

    try {
      const res = await defaultGeminiProvider.generate({
        prompt: fullPrompt,
        systemInstruction:
          'You are a live teaching assistant in an educational studio. Provide clean, crisp answers that teachers can read aloud or display to students immediately.',
      });

      if (res.text) {
        setResponse(res.text);
      } else {
        setResponse(
          `Teaching breakdown for ${currentContext.title}:\n\n` +
            `• Focus on core causality and mechanisms.\n` +
            `• Check student understanding with a quick poll.\n` +
            `• Grounding: ${currentContext.description}`
        );
      }
    } catch {
      setResponse(
        `Teaching Summary for "${currentContext.title}":\n\n${currentContext.description}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleTTS = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !response) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(response);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      id="ai-assistant-drawer"
      className="absolute bottom-20 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-40 overflow-hidden flex flex-col max-h-[75vh] animate-in fade-in slide-in-from-bottom-5 duration-150 select-none"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500 text-white rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              AI Studio Assistant
            </h4>
            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
              Grounded on: {currentContext.title}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompt Chips */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5 bg-slate-50/50 dark:bg-slate-900/50">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(qp.text)}
            className="text-[10px] font-semibold px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full transition-colors cursor-pointer"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Response Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
            <Sparkles className="w-6 h-6 text-indigo-500 animate-spin" />
            <span className="text-slate-500 font-semibold">Generating classroom response...</span>
          </div>
        ) : response ? (
          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200">
              {response}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                onClick={handleTTS}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3 h-3 text-indigo-500" />
                <span>{speaking ? 'Stop' : 'Read Aloud'}</span>
              </button>

              <button
                onClick={() => onInsertToNotes(response)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Bookmark className="w-3 h-3" />
                <span>Save to Notes</span>
              </button>

              <button
                onClick={() => onInsertToWhiteboard(response)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg cursor-pointer"
              >
                + Put on Whiteboard
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 space-y-1">
            <Lightbulb className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-500">Ask anything in real time</p>
            <p className="text-[11px]">Type in English, Hindi or Hinglish below.</p>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center gap-2">
        <input
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="Ask AI teaching assistant..."
          className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={() => handleAsk()}
          disabled={isLoading || !promptInput.trim()}
          className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white rounded-xl cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
