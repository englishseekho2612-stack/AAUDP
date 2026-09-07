import React, { useState } from 'react';
import { ArpitAcademyLogo } from './ArpitAcademyLogo';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Radio,
  Users,
  Shield,
  X,
} from 'lucide-react';

interface FirstLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCreate: () => void;
}

export const FirstLaunchModal: React.FC<FirstLaunchModalProps> = ({
  isOpen,
  onClose,
  onNavigateToCreate,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  if (!isOpen) return null;

  const handleFinish = () => {
    try {
      localStorage.setItem('studio_onboarding_completed', 'true');
    } catch {
      // ignore
    }
    onClose();
  };

  const handleCreateFirst = () => {
    handleFinish();
    onNavigateToCreate();
  };

  return (
    <div
      id="first-launch-modal"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Step Indicator Header */}
        <div className="p-6 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-white border border-emerald-600/30 p-0.5 shadow-sm shrink-0">
              <ArpitAcademyLogo className="w-full h-full" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm">
                ARPIT ACADEMY UDAIPURA
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">
                Step {step} of 4 · Learn • Teach • Understand
              </span>
            </div>
          </div>
          <button
            onClick={handleFinish}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium cursor-pointer"
          >
            Skip for now
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Welcome to ARPIT ACADEMY UDAIPURA
              </h2>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                With Arpit Sir — Learn • Teach • Understand. Professional education environment for educators and students. Build structured Mind Maps, slide decks, interactive whiteboard broadcasts, and student learning portals.
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Strict Teacher Control: AI assists, teacher decides.</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Complete local offline persistence and zero cloud lock-in.</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Strict classroom privacy separation from YouTube public feeds.</span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                AI Engine & Server Security
              </h2>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                All Gemini generation requests are securely proxied server-side. Your API keys are never exposed in browser inspector tools.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Gemini 2.5 Flash</span>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 px-2 py-0.5 rounded font-bold">DEFAULT</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  High-speed structured extraction for Mind Maps, Slides, and Lesson Notes.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Classroom & YouTube Live Hub
              </h2>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Host live interactive sessions with students using lightweight class codes or broadcast simultaneously to YouTube Live.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900 space-y-1">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">Student Privacy</span>
                  <span className="text-[11px] text-slate-500">Student messages are strictly private to the teacher.</span>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-900 space-y-1">
                  <Radio className="w-4 h-4 text-red-600" />
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">Clean Stream</span>
                  <span className="text-[11px] text-slate-500">YouTube viewers never see private classroom chats or notes.</span>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 text-center py-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                You're Ready to Teach!
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Create your first project, upload course materials, and generate a customized teaching curriculum in seconds.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleCreateFirst}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Create First Project</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
