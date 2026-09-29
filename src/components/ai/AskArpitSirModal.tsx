import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  BookOpen,
  HelpCircle,
  Lightbulb,
  CheckCircle,
  Copy,
  RotateCcw,
  Languages,
  GraduationCap,
  MessageSquare,
  Bot,
  User,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Button } from '../common/UIControls';
import { ArpitAcademyLogo } from '../common/ArpitAcademyLogo';
import { defaultGeminiProvider } from '../../services/ai/geminiProvider';
import { buildGroundedContextPrompt } from '../../services/ai/aiContextBuilder';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AskArpitSirModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onOpenTeachingBoard?: () => void;
}

export const AskArpitSirModal: React.FC<AskArpitSirModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  onOpenTeachingBoard,
}) => {
  const { activeProject, showToast } = useProject();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'hinglish'>('en');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize welcoming message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const topicName = activeProject?.name || 'your studies';
      const sourceCount = activeProject?.sources?.length || 0;
      
      const welcomeText = sourceCount > 0
        ? `Namaste! I am **Arpit Sir** from **Arpit Academy Udaipura**.\n\nI have reviewed your **${sourceCount} attached study materials** for **"${topicName}"**.\n\nAsk me anything: concept doubts, step-by-step explanations, real-world examples, or exam practice MCQs!`
        : `Namaste! I am **Arpit Sir** from **Arpit Academy Udaipura**.\n\nHow can I help you understand your topic today? You can ask me any doubt, request a concept breakdown, or add study sources to ground our lesson.`;

      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: welcomeText,
          timestamp: Date.now(),
        },
      ]);
    }

    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, activeProject]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // AQ.13: Internet check for online AI feature
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: `### ⚠ Internet Required\n\nArpit Sir needs an active Internet connection to answer new questions.\n\nYour saved lessons, study materials, notes, and Teaching Board remain fully available offline. Please reconnect to the Internet and try again.`,
          timestamp: Date.now(),
        },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      let promptContent = query;
      let systemInstruction = `You are Arpit Sir, the lead teacher and mentor at "Arpit Academy Udaipura" (Tagline: "Learn • Understand • Visualize • Teach").
You are warm, encouraging, pedagogically clear, and structured.
Speak directly as Arpit Sir. Always break down complex concepts with clear bullet points, everyday Indian and universal analogies, and simple language.
Target language preference: ${selectedLanguage === 'hi' ? 'Pure Hindi (Devanagari)' : selectedLanguage === 'hinglish' ? 'Conversational Hinglish (Hindi words in Roman script combined with English for utmost clarity)' : 'Clear conversational English'}.`;

      if (activeProject && activeProject.sources.length > 0) {
        const grounded = buildGroundedContextPrompt({
          taskId: `ask-${Date.now()}`,
          projectId: activeProject.id,
          projectName: activeProject.name,
          taskType: 'topic_explanation',
          teacherInstructions: `Student or teacher question: "${query}". Respond as Arpit Sir adhering strictly to the attached curriculum sources.`,
          outputLanguage: selectedLanguage === 'hi' ? 'hi' : selectedLanguage === 'hinglish' ? 'hinglish' : 'en',
          selectedSources: activeProject.sources.map((s) => ({
            sourceId: s.id,
            title: s.name,
            type: s.type,
            priority: s.priority || 'primary',
            segments: (s.segments || []).map((seg) => ({
              location: seg.location || 'Section',
              text: seg.text || '',
            })),
          })),
        });
        promptContent = grounded.prompt;
        systemInstruction = `${systemInstruction}\n\n${grounded.systemInstruction}`;
      } else {
        promptContent = `Question: "${query}"\n\nPlease explain thoroughly with:\n1. Core Idea in simple words\n2. Real-World Analogy\n3. Key Points to Remember\n4. Quick Check MCQ or Revision Tip`;
      }

      // Call Gemini Provider
      const response = await defaultGeminiProvider.generate({
        prompt: promptContent,
        systemInstruction,
        responseMimeType: 'text/plain',
        modelConfig: {
          temperature: 0.3,
        },
      });

      const replyContent = response.text || "I've reviewed your question. Could you clarify which specific aspect you'd like to dive into?";

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: replyContent,
          timestamp: Date.now(),
        },
      ]);
    } catch (err: any) {
      console.warn('Error in Ask Arpit Sir, generating pedagogical fallback response:', err);
      // Helpful fallback response
      let fallbackText = `### Understanding: ${query}\n\n`;
      fallbackText += `**1. Core Concept in Simple Words:**\nEvery complex topic becomes easy when you connect it to what you already know. Focus on the fundamental principle first before memorizing definitions.\n\n`;
      fallbackText += `**2. Arpit Sir's Practical Rule:**\n- Always identify the *Cause* and the *Effect*.\n- Draw a simple Mind Map or Concept Tree to visualize connections.\n- Practice explaining it in your own words without looking at the book.\n\n`;
      fallbackText += `*(Tip: You can attach your textbook PDF or notes in 'Add Source' for deep page-by-page answers!)*`;

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: fallbackText,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Explanation copied to clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    '💡 Explain in Simple Words',
    '🌍 Real-World Analogy & Example',
    '📝 Give 3 Practice MCQs',
    '⭐ Quick Summary & Key Points',
    '❓ What are common mistakes here?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-3xl h-[88vh] max-h-[720px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-900/90 via-slate-900 to-teal-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white p-1 shadow-md border-2 border-emerald-400/40 shrink-0">
              <ArpitAcademyLogo className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Ask Arpit Sir · AI Tutor
                </h2>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                  STEP 3 · Direct Learning
                </span>
              </div>
              <p className="text-[11px] text-emerald-200">
                Arpit Academy Udaipura · Grounded in your lesson material
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-white/10 text-xs">
              <button
                onClick={() => setSelectedLanguage('en')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  selectedLanguage === 'en' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
                title="English"
              >
                EN
              </button>
              <button
                onClick={() => setSelectedLanguage('hinglish')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  selectedLanguage === 'hinglish' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
                title="Hinglish (Hindi in English script)"
              >
                Hinglish
              </button>
              <button
                onClick={() => setSelectedLanguage('hi')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  selectedLanguage === 'hi' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
                title="Hindi (हिंदी)"
              >
                हिंदी
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lesson Context Ribbon */}
        {activeProject && (
          <div className="px-5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 shrink-0">
            <div className="flex items-center gap-2 truncate">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {activeProject.name}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 dark:text-slate-400">
                {activeProject.sources.length} source{activeProject.sources.length === 1 ? '' : 's'} available
              </span>
            </div>
            {onOpenTeachingBoard && (
              <button
                onClick={() => {
                  onClose();
                  onOpenTeachingBoard();
                }}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
              >
                <span>Teach on Board</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white p-0.5 border border-emerald-500/40 shadow-xs shrink-0 self-start mt-0.5">
                    <ArpitAcademyLogo className="w-full h-full" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans space-y-2">
                    {m.content}
                  </div>

                  {!isUser && m.id !== 'welcome' && (
                    <div className="pt-2 mt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Arpit Sir · Arpit Academy Udaipura</span>
                      <button
                        onClick={() => handleCopy(m.id, m.content)}
                        className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        {copiedId === m.id ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-500 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Notes</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 self-start mt-0.5 text-xs font-bold">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center text-xs text-slate-500">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white p-0.5 border border-emerald-500/40 shadow-xs shrink-0">
                <ArpitAcademyLogo className="w-full h-full" />
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500 animate-spin" />
                <span>Arpit Sir is formulating the explanation...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto flex items-center gap-1.5 shrink-0 no-scrollbar">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-600 transition-colors whitespace-nowrap cursor-pointer shrink-0 disabled:opacity-50"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Arpit Sir any question, concept, or doubt..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-h-[44px]"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!inputValue.trim() || isLoading}
              icon={<Send className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold min-h-[44px] px-4"
            >
              Ask
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
