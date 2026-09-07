import React, { useState } from 'react';
import { Badge, Button } from '../components/common/UIControls';
import { useProject } from '../context/ProjectContext';
import { TeachingStudio } from '../components/teaching/TeachingStudio';
import { permissionService } from '../services/permissionService';
import {
  Video,
  Mic,
  Users,
  Radio,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Play,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface TeachingViewProps {
  initialStudioOpen?: boolean;
  classCode?: string;
  onOpenLiveStudentView?: (code: string) => void;
  onOpenClassroomHub?: () => void;
  onOpenVideoEditor?: (recording?: any) => void;
}

export const TeachingView: React.FC<TeachingViewProps> = ({
  initialStudioOpen = false,
  classCode = 'STUDIO1',
  onOpenLiveStudentView,
  onOpenClassroomHub,
  onOpenVideoEditor,
}) => {
  const { activeProject, projects, openProject, createProject } = useProject();
  const [isStudioOpen, setIsStudioOpen] = useState(initialStudioOpen);
  const [permissionFeedback, setPermissionFeedback] = useState<string | null>(null);

  const handleLaunchStudio = () => {
    setIsStudioOpen(true);
  };

  const handleCreateSampleAndLaunch = async () => {
    const newProj = await createProject({
      name: 'Photosynthesis & Plant Biology',
      subject: 'Biology',
      language: 'en',
    });
    if (newProj) {
      await openProject(newProj.id);
      setIsStudioOpen(true);
    }
  };

  if (isStudioOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900">
        <TeachingStudio
          onExit={() => setIsStudioOpen(false)}
          classCode={classCode}
          onOpenLiveStudentView={() => onOpenLiveStudentView?.(classCode)}
          onOpenVideoEditor={(recording) => {
            setIsStudioOpen(false);
            onOpenVideoEditor?.(recording);
          }}
        />
      </div>
    );
  }

  const handleTestMicPermission = async () => {
    const status = await permissionService.checkPermission('microphone');
    setPermissionFeedback(`Microphone status: ${status.state}. Requesting test stream...`);
    const granted = await permissionService.requestPermission('microphone');
    setPermissionFeedback(
      granted
        ? 'Microphone permission test successful. Ready for teaching audio engine.'
        : 'Microphone permission was not granted or dismissed.'
    );
  };

  const handleTestCameraPermission = async () => {
    const status = await permissionService.checkPermission('camera');
    setPermissionFeedback(`Camera status: ${status.state}. Requesting test stream...`);
    const granted = await permissionService.requestPermission('camera');
    setPermissionFeedback(
      granted
        ? 'Camera permission test successful. Ready for teacher cam overlay.'
        : 'Camera permission was not granted or dismissed.'
    );
  };

  const modules = [
    {
      id: 'studio',
      title: 'Teaching Studio Workspace',
      badge: 'Active & Ready',
      badgeVariant: 'success' as const,
      description:
        'Dual teaching canvas uniting interactive mind maps, presentation slides, active detail panels, teacher camera overlay, and a high-precision digital whiteboard.',
      icon: <Video className="w-6 h-6 text-indigo-500" />,
      features: [
        'Interactive Mind Map + Clickable Node Panel',
        'Teacher Camera Feed (Bubble, PiP, Split)',
        'Digital Pen + Shape Whiteboard Tools',
        'Presentation / Slides Screen Share',
      ],
      actionLabel: 'Launch Teaching Studio',
      action: handleLaunchStudio,
    },
    {
      id: 'audio_engine',
      title: 'Hardware Audio & Noise Reduction',
      badge: 'Operational',
      badgeVariant: 'success' as const,
      description:
        'Professional sound processor supporting phone microphones, Bluetooth earbuds, wired lapels, and USB podcast mics with AI-driven echo reduction and volume normalization.',
      icon: <Mic className="w-6 h-6 text-emerald-500" />,
      features: [
        'Hardware Mic Selector (Phone/Earbuds/External)',
        'Dynamic Noise Suppression & Voice Gate',
        'Acoustic Echo Reduction & Web Audio DSP',
        'Lossless Session Audio & Video Recording',
      ],
      actionLabel: 'Test Microphone & Audio',
      action: handleTestMicPermission,
    },
    {
      id: 'classroom',
      title: 'Interactive Student Classroom',
      badge: 'Live Operational',
      badgeVariant: 'success' as const,
      description:
        'Real-time student participation engine. Enables teachers to conduct live pulse polls, launch curriculum MCQs, review student questions in a private teacher chat, and moderate hands.',
      icon: <Users className="w-6 h-6 text-blue-500" />,
      features: [
        'Teacher-Only Private Chat (Privacy First)',
        'Instant Polls & Assessment MCQs',
        'Real-time Hand Raise Queue',
        'Student Roster & Attendance Tracking',
      ],
      actionLabel: 'Open Classroom Hub',
      action: () => onOpenClassroomHub?.(),
    },
    {
      id: 'youtube_live',
      title: 'YouTube Live Broadcast Hub',
      badge: 'Configured',
      badgeVariant: 'info' as const,
      description:
        'Broadcast directly from the teaching studio to YouTube Live. Streamline live stream title setup, tags, thumbnail, whiteboard overlay, and live chat supervision.',
      icon: <Radio className="w-6 h-6 text-red-500" />,
      features: [
        'YouTube Broadcast Clean Feed Setup',
        'Broadcast Title & Stream Configuration',
        'Live Workspace Stream Encoder Isolation',
        'Teacher Chat Supervision & Moderation',
      ],
      actionLabel: 'Launch Studio for Broadcast',
      action: handleLaunchStudio,
    },
  ];

  return (
    <div id="teaching-view-container" className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="success">Studio Suite Active</Badge>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Professional Teaching Studio & Audio DSP
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          Teaching Studio & Interaction Hub
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Deliver engaging lessons with interactive mind maps, presentation slides, camera layouts, Web Audio DSP voice enhancement, and digital whiteboard annotations.
        </p>
      </div>

      {/* TEACHING STUDIO PRIMARY LAUNCH CARD */}
      <div
        id="teaching-studio-launch-card"
        className="p-6 bg-gradient-to-br from-indigo-900 to-slate-900 text-white border border-indigo-700/50 rounded-2xl shadow-xl space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Ready to Teach
              </span>
              {activeProject && (
                <span className="text-xs text-indigo-200">
                  Project: <strong className="text-white">{activeProject.name}</strong>
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold">
              Enter Teaching Studio Workspace
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Launch dual-canvas teaching workspace with hardware camera overlay, AI voice commands, digital whiteboard pen, and multi-track studio recording.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeProject ? (
              <div className="flex items-center gap-2">
                {onOpenClassroomHub && (
                  <Button
                    variant="secondary"
                    onClick={onOpenClassroomHub}
                    icon={<Users className="w-4 h-4 text-white" />}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl border border-white/20"
                  >
                    Classroom Hub
                  </Button>
                )}
                <Button
                  id="btn-launch-active-project-studio"
                  variant="primary"
                  onClick={handleLaunchStudio}
                  icon={<Video className="w-4 h-4 text-white" />}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg"
                >
                  Launch Studio ({activeProject.name})
                </Button>
              </div>
            ) : projects.length > 0 ? (
              <div className="flex items-center gap-2">
                {onOpenClassroomHub && (
                  <Button
                    variant="secondary"
                    onClick={onOpenClassroomHub}
                    icon={<Users className="w-4 h-4 text-white" />}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl border border-white/20"
                  >
                    Classroom Hub
                  </Button>
                )}
                <Button
                  id="btn-launch-first-project-studio"
                  variant="primary"
                  onClick={async () => {
                    await openProject(projects[0].id);
                    handleLaunchStudio();
                  }}
                  icon={<Video className="w-4 h-4 text-white" />}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg"
                >
                  Teach: {projects[0].name}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {onOpenClassroomHub && (
                  <Button
                    variant="secondary"
                    onClick={onOpenClassroomHub}
                    icon={<Users className="w-4 h-4 text-white" />}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl border border-white/20"
                  >
                    Classroom Hub
                  </Button>
                )}
                <Button
                  id="btn-create-sample-and-launch"
                  variant="primary"
                  onClick={handleCreateSampleAndLaunch}
                  icon={<Sparkles className="w-4 h-4 text-white" />}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg"
                >
                  Create Sample Lesson & Launch
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Quick features pills */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap gap-2 text-[11px] text-indigo-200">
          <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Web Audio DSP Noise Removal
          </span>
          <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Teacher Camera (Bubble/PiP/Split)
          </span>
          <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            AI Voice Command Engine
          </span>
          <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Lossless Multi-Track Recording
          </span>
        </div>
      </div>

      {/* Permission Verification Test Box */}
      <div
        id="permissions-readiness-box"
        className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Hardware Permission Readiness Test
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Explicit trigger only (Never automatic)
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Verify that your device environment allows audio and video capture for future Teaching Studio modules without premature permission prompts.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            id="btn-test-mic-permission"
            variant="outline"
            size="sm"
            onClick={handleTestMicPermission}
            icon={<Mic className="w-3.5 h-3.5 text-emerald-500" />}
          >
            Test Mic Permission
          </Button>

          <Button
            id="btn-test-camera-permission"
            variant="outline"
            size="sm"
            onClick={handleTestCameraPermission}
            icon={<Video className="w-3.5 h-3.5 text-indigo-500" />}
          >
            Test Camera Permission
          </Button>

          {permissionFeedback && (
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              {permissionFeedback}
            </span>
          )}
        </div>
      </div>

      {/* Modules Roadmap Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {modules.map((m) => (
          <div
            key={m.id}
            id={`teaching-spec-${m.id}`}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  {m.icon}
                </div>
                <Badge variant={m.badgeVariant}>{m.badge}</Badge>
              </div>

              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {m.title}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {m.description}
              </p>

              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Core Capabilities
                </span>
                <ul className="space-y-1.5">
                  {m.features.map((feat, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Module
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={m.action}
                className="text-xs font-bold hover:border-indigo-500"
              >
                {m.actionLabel}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
