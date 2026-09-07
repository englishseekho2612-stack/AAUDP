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
      name: 'Teaching Studio',
      part: 'Part 04',
      badge: 'Ready to Launch',
      description:
        'Dual teaching canvas: Mind map & slides navigation, camera integration, digital pen, laser pointer, and responsive whiteboard.',
      icon: <Video className="w-5 h-5 text-indigo-500" />,
      features: ['Teacher Camera ON/OFF', 'Digital Whiteboard + Pen', 'Screen Teaching'],
      isLive: true,
    },
    {
      id: 'recording',
      name: 'Audio & Recording Engine',
      part: 'Part 04',
      badge: 'Ready to Launch',
      description:
        'Studio audio processing with hardware mic selection, noise cancellation, voice clarity boost, and lossless studio recording.',
      icon: <Mic className="w-5 h-5 text-emerald-500" />,
      features: ['Noise Removal', 'Echo Reduction', 'Lossless Recording'],
      isLive: true,
    },
    {
      id: 'classroom',
      name: 'Live Student Classroom',
      part: 'Part 05',
      badge: 'Part 05 Module',
      description:
        'Interactive student space featuring teacher-only private chat, live polls, instant MCQs, and hand-raise queue.',
      icon: <Users className="w-5 h-5 text-blue-500" />,
      features: ['Private Teacher Chat', 'Live Polls & Quizzes', 'Student Roster'],
      isLive: false,
    },
    {
      id: 'youtube_live',
      name: 'YouTube Live Broadcast',
      part: 'Part 05',
      badge: 'Part 05 Module',
      description:
        'Direct stream connection to YouTube Live with real-time stream status, title/tag configuration, and teaching overlay.',
      icon: <Radio className="w-5 h-5 text-red-500" />,
      features: ['Direct RTMP/API Setup', 'Teaching Workspace Stream', 'Chat Moderation'],
      isLive: false,
    },
  ];

  return (
    <div id="teaching-modules-section" className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Teaching & Delivery Modes
          </h2>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            Roadmap · Parts 04 & 05
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Foundation architectures are scaffolded and ready for real hardware & streaming integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((m) => (
          <div
            key={m.id}
            id={`card-teaching-module-${m.id}`}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                  {m.icon}
                </div>
                <Badge variant="neutral">{m.badge}</Badge>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3.5">
                {m.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {m.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {m.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 dark:bg-slate-800/80 rounded text-[10px] font-medium text-slate-600 dark:text-slate-300"
                  >
                    <ShieldCheck className="w-3 h-3 text-indigo-500" />
                    {feat}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                {m.isLive ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Available Now
                  </span>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    Coming in {m.part}
                  </>
                )}
              </span>

              {m.isLive ? (
                <button
                  id={`btn-launch-module-${m.id}`}
                  onClick={() => onLaunchStudio?.()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Launch Studio</span>
                </button>
              ) : (
                <button
                  id={`btn-preview-module-${m.id}`}
                  onClick={() => onSelectModule(m.name)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer min-h-[36px]"
                >
                  <span>Architecture Specs</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
