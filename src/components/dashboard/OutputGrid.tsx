import React from 'react';
import { ProjectAIOutput, AIOutputType } from '../../types/project';
import { Badge } from '../common/UIControls';
import {
  Network,
  Presentation,
  BookOpen,
  Headphones,
  Video,
  CheckSquare,
  Sparkles,
  Layers,
  ArrowRight,
  Palette,
  Lightbulb,
  Eye,
  PlusCircle,
} from 'lucide-react';

interface OutputGridProps {
  outputs: Record<AIOutputType, ProjectAIOutput>;
  onTriggerOutput: (type: AIOutputType) => void;
  onOpenCreateWithAI?: (preselectedType?: AIOutputType) => void;
}

interface OutputConfig {
  type: AIOutputType;
  title: string;
  description: string;
  icon: React.ReactNode;
  badgeLabel: string;
}

export const OutputGrid: React.FC<OutputGridProps> = ({
  outputs,
  onTriggerOutput,
  onOpenCreateWithAI,
}) => {
  const outputConfigs: OutputConfig[] = [
    {
      type: 'mind_map',
      title: 'Interactive Mind Map',
      description: 'Hierarchical conceptual nodes with clickable detail panels, node additions, and radial views.',
      icon: <Network className="w-5 h-5 text-indigo-500" />,
      badgeLabel: 'Core Engine',
    },
    {
      type: 'slides',
      title: 'Presentation Slides',
      description: 'Slide deck complete with speaker notes, visual suggestions, bullet points, and grid view.',
      icon: <Presentation className="w-5 h-5 text-purple-500" />,
      badgeLabel: 'Core Engine',
    },
    {
      type: 'presentation_designer',
      title: 'AI Presentation Designer',
      description: 'Pedagogical lesson sequencing (Hook, Core, Deep Dive, Practice, Recap) + custom slide deck.',
      icon: <Palette className="w-5 h-5 text-cyan-500" />,
      badgeLabel: 'Pedagogy Plan',
    },
    {
      type: 'notes',
      title: 'Study Notes & Summary',
      description: 'Structured comprehensive notes, chapter summaries, important terms, and exam Q&A.',
      icon: <BookOpen className="w-5 h-5 text-blue-500" />,
      badgeLabel: 'Core Engine',
    },
    {
      type: 'topic_explanation',
      title: 'Topic Deep Dive',
      description: 'Pedagogical breakdown with real-world analogies, misconception corrections, and takeaways.',
      icon: <Lightbulb className="w-5 h-5 text-teal-500" />,
      badgeLabel: 'Explanation Engine',
    },
    {
      type: 'audio',
      title: 'Audio Lesson',
      description: 'Spoken lecture or podcast script with real-time SpeechSynthesis playback and segment seeking.',
      icon: <Headphones className="w-5 h-5 text-emerald-500" />,
      badgeLabel: 'Audio Player',
    },
    {
      type: 'video',
      title: 'Instructional Video Plan',
      description: 'Scene-by-scene storyboard with durations, text overlays, visual descriptions, and timed preview.',
      icon: <Video className="w-5 h-5 text-rose-500" />,
      badgeLabel: 'Storyboard Player',
    },
    {
      type: 'quiz',
      title: 'Quiz & Assessment',
      description: 'Curriculum-aligned MCQs, grounded explanations, interactive practice mode, and student test papers.',
      icon: <CheckSquare className="w-5 h-5 text-amber-500" />,
      badgeLabel: 'Assessment Engine',
    },
  ];

  const getStatusBadge = (status: ProjectAIOutput['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'edited':
        return <Badge variant="purple">Teacher Edited</Badge>;
      case 'generating':
        return <Badge variant="warning">Generating...</Badge>;
      default:
        return <Badge variant="neutral">Not Started</Badge>;
    }
  };

  return (
    <div id="ai-outputs-section" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              AI Generation Tasks
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Teacher Selected
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            AI will never generate outputs automatically. Select a task below to create grounded materials from your sources.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCreateWithAI && (
            <button
              id="btn-create-with-ai-header"
              type="button"
              onClick={() => onOpenCreateWithAI()}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create with AI</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>3-Layer Non-Destructive Storage</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {outputConfigs.map((cfg) => {
          const item = outputs[cfg.type] || {
            type: cfg.type,
            title: cfg.title,
            status: 'not_started',
            rawAiContent: null,
            teacherEditedContent: null,
            activeView: 'ai',
            lastModifiedAt: Date.now(),
          };

          const hasContent = Boolean(item.rawAiContent || item.teacherEditedContent);

          return (
            <div
              key={cfg.type}
              id={`card-output-${cfg.type}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                    {cfg.icon}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3.5">
                  {cfg.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  {cfg.description}
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span className="font-medium text-slate-500 dark:text-slate-400">
                    {cfg.badgeLabel}
                  </span>
                  {hasContent ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Ready to view
                    </span>
                  ) : (
                    <span className="italic">Ready for generation</span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-2">
                {hasContent ? (
                  <button
                    id={`btn-view-${cfg.type}`}
                    type="button"
                    onClick={() => onTriggerOutput(cfg.type)}
                    className="w-full py-2 px-3 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-indigo-200 dark:border-indigo-800 min-h-[40px] cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Open Viewer & Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    id={`btn-trigger-${cfg.type}`}
                    type="button"
                    onClick={() => {
                      if (onOpenCreateWithAI) {
                        onOpenCreateWithAI(cfg.type);
                      } else {
                        onTriggerOutput(cfg.type);
                      }
                    }}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700/60 min-h-[40px] cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Generate with AI</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
