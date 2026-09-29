import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { AppView } from '../types/navigation';
import { Button } from '../components/common/UIControls';
import { ArpitAcademyLogo } from '../components/common/ArpitAcademyLogo';
import { VisualChoiceModal } from '../components/knowledge/VisualChoiceModal';
import { AskArpitSirModal } from '../components/ai/AskArpitSirModal';
import {
  Sparkles,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Network,
  Bot,
  Layers,
  Clock,
  Users,
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: AppView) => void;
  onOpenProject: (id: string) => void;
  onStartTeachingStudio?: (code: string, projectId?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenProject,
  onStartTeachingStudio,
}) => {
  const {
    projects,
    activeProject,
  } = useProject();

  // Modals state
  const [isVisualChoiceOpen, setIsVisualChoiceOpen] = useState(false);
  const [isAskArpitSirOpen, setIsAskArpitSirOpen] = useState(false);

  // Active or most recent lesson
  const sortedProjects = [...projects].sort((a, b) => b.updatedTimestamp - a.updatedTimestamp);
  const currentOrRecent = activeProject || (sortedProjects.length > 0 ? sortedProjects[0] : null);

  // 1. LEARN Action Handler
  const handleOpenLearn = () => {
    onNavigate('projects');
  };

  // 2. ASK ARPIT SIR Action Handler
  const handleOpenAskArpitSir = () => {
    setIsAskArpitSirOpen(true);
  };

  // 3. TEACH Action Handler
  const handleStartTeachingClick = () => {
    if (onStartTeachingStudio) {
      onStartTeachingStudio('STUDIO1', currentOrRecent?.id);
    } else {
      onNavigate('teaching');
    }
  };

  // Contextual VISUALIZE Action Handler (active lesson)
  const handleOpenVisualize = () => {
    if (currentOrRecent) {
      if (!activeProject) {
        onOpenProject(currentOrRecent.id);
      }
      setIsVisualChoiceOpen(true);
    } else {
      onNavigate('projects');
    }
  };

  return (
    <div id="home-view-container" className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* 1. Header & Identity: Arpit Academy Udaipura */}
      <section
        id="home-hero-banner"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white p-6 sm:p-8 md:p-10 shadow-xl border border-emerald-800/40"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Arpit Digital Hub · Simple Classroom</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              ARPIT ACADEMY <span className="text-orange-400">UDAIPURA</span>
            </h1>

            <p className="text-base sm:text-lg font-semibold text-emerald-200">
              Learn • Understand • Visualize • Teach
            </p>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Welcome to your digital classroom. Review study material, ask Arpit Sir your questions, create visual mind maps, and teach interactively.
            </p>
          </div>

          {/* Reference Logo Emblem */}
          <div className="shrink-0 flex items-center justify-center">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-white p-2 shadow-2xl border-4 border-emerald-500/40 hover:scale-105 transition-transform">
              <ArpitAcademyLogo className="w-full h-full" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE PRIMARY USER ACTIONS (Simplified Architecture) */}
      <section id="home-primary-actions" className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            What would you like to do?
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select one of the three primary classroom activities:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: 📚 Learn */}
          <div
            id="card-action-learn"
            onClick={handleOpenLearn}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  📚 Learn
                </h3>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Open your lessons and study material
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                  Browse all your subjects, chapters, notes, attached PDFs, videos, and learning materials.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <span>View Lessons ({projects.length})</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: 🤖 Ask Arpit Sir */}
          <div
            id="card-action-ask-arpit-sir"
            onClick={handleOpenAskArpitSir}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  🤖 Ask Arpit Sir
                </h3>
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mt-0.5">
                  Ask questions and learn
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                  Clear your doubts, ask for simple Hindi/English explanations, summary notes, and practice MCQs.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-400">
              <span>Start Dialogue</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: 🎓 Teach */}
          <div
            id="card-action-teach"
            onClick={handleStartTeachingClick}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  🎓 Teach
                </h3>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-0.5">
                  Open the Teaching Board
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                  Interactive whiteboard with drawing pens, slides, camera bubble, and YouTube Live broadcast.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
              <span>Launch Board</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. CONTEXTUAL ACTIVE LESSON (if available) */}
      {currentOrRecent && (
        <section id="home-active-lesson-card" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Continue With Active Lesson
              </h2>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>All Lessons ({projects.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            id="continue-working-card"
            className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span>{currentOrRecent.subject || 'General Study'}</span>
                {currentOrRecent.classGrade && (
                  <>
                    <span>·</span>
                    <span className="text-slate-600 dark:text-slate-300">Grade: {currentOrRecent.classGrade}</span>
                  </>
                )}
                <span>·</span>
                <span className="text-slate-500 dark:text-slate-400">{currentOrRecent.sources.length} materials</span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {currentOrRecent.name}
              </h3>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              {/* Contextual 🧠 Visualize */}
              <Button
                id="btn-contextual-visualize"
                variant="outline"
                size="md"
                onClick={handleOpenVisualize}
                icon={<Network className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
                className="text-xs font-bold border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30"
              >
                🧠 Visualize
              </Button>

              {/* Open Lesson */}
              <Button
                id="btn-resume-recent-lesson"
                variant="primary"
                size="md"
                onClick={() => onOpenProject(currentOrRecent.id)}
                icon={<ArrowRight className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Open Lesson
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* 4. SECONDARY HUBS (Curriculum & Classroom) */}
      <section id="home-secondary-hubs" className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            onClick={() => onNavigate('curriculum')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 transition-all cursor-pointer flex items-center gap-3"
          >
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Curriculum Hub
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Syllabus courses & chapter blueprints
              </p>
            </div>
          </div>

          <div
            onClick={() => onNavigate('classroom_hub')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 transition-all cursor-pointer flex items-center gap-3"
          >
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Classroom Hub
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Interactive student polls & live quizzes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MODALS */}
      {/* 1. Ask Arpit Sir Modal */}
      <AskArpitSirModal
        isOpen={isAskArpitSirOpen}
        onClose={() => setIsAskArpitSirOpen(false)}
        onOpenTeachingBoard={handleStartTeachingClick}
      />

      {/* 2. Visual Choice Modal (Mind Map / Concept Tree) */}
      <VisualChoiceModal
        isOpen={isVisualChoiceOpen}
        onClose={() => setIsVisualChoiceOpen(false)}
        onSelectVisual={(format) => {
          setIsVisualChoiceOpen(false);
          if (currentOrRecent) {
            onOpenProject(currentOrRecent.id);
          }
        }}
      />
    </div>
  );
};
