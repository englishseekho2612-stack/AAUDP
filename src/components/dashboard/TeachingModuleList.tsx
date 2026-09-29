import React from 'react';
import { Badge } from '../common/UIControls';
import {
  Video,
  Mic,
  Users,
  Radio,
  Clock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface TeachingModuleListProps {
  onSelectModule: (moduleName: string) => void;
  onLaunchStudio?: () => void;
}

export const TeachingModuleList: React.FC<TeachingModuleListProps> = ({
  onSelectModule,
  onLaunchStudio,
}) => {
  const modules = [
    {
      id: 'studio',
      name: 'Teaching Board & Whiteboard',
      badge: 'Active & Ready',
      description:
        'Dual teaching canvas: Mind map & slides navigation, camera integration, digital pen, laser pointer, and responsive whiteboard.',
      icon: <Video className="w-5 h-5 text-emerald-500" />,
      features: ['Teacher Camera ON/OFF', 'Digital Whiteboard + Pen', 'Screen Teaching'],
      isLive: true,
      buttonLabel: 'Launch Teaching Board',
    },
    {
      id: 'recording',
      name: 'Audio & Recording Engine',
      badge: 'Active & Ready',
      description:
        'Studio audio processing with hardware mic selection, noise cancellation, voice clarity boost, and lossless studio recording.',
      icon: <Mic className="w-5 h-5 text-teal-500" />,
      features: ['Noise Removal', 'Voice Boost', 'Lossless Recording'],
      isLive: true,
      buttonLabel: 'Open Studio Audio',
    },
    {
      id: 'classroom',
      name: 'Interactive Student Classroom',
      badge: 'Active & Ready',
      description:
        'Real-time student classroom space featuring teacher-student interaction, live polls, instant MCQs, and hand-raise queue.',
      icon: <Users className="w-5 h-5 text-indigo-500" />,
      features: ['Student Interaction', 'Live Polls & Quizzes', 'Student Roster'],
      isLive: true,
      buttonLabel: 'Open Classroom Session',
    },
    {
      id: 'youtube_live',
      name: 'YouTube Live Masterclass',
      badge: 'Active & Ready',
      description:
        'Direct stream connection to YouTube Live with real-time stream status, title/tag configuration, and teaching overlay.',
      icon: <Radio className="w-5 h-5 text-rose-500" />,
      features: ['One-Click Broadcast', 'Teaching Workspace Stream', 'Live YouTube Chat'],
      isLive: true,
      buttonLabel: 'Start YouTube Live',
    },
  ];

  return (
    <div id="teaching-modules-section" className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Teaching & Delivery Modes
          </h2>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            Step 4 & 5 Delivery
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Step into your digital classroom, deliver interactive whiteboard sessions, and stream live to YouTube.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((m) => (
          <div
            key={m.id}
            id={`card-teaching-module-${m.id}`}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:border-emerald-500 dark:hover:border-emerald-500 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                  {m.icon}
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                  {m.badge}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3.5">
                {m.name}
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {m.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {m.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 dark:bg-slate-800/80 rounded text-[10px] font-medium text-slate-600 dark:text-slate-300"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {feat}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Available Now
              </span>

              <button
                id={`btn-launch-module-${m.id}`}
                onClick={() => onLaunchStudio?.()}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                <span>{m.buttonLabel}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
