import React from 'react';
import { useProject } from '../context/ProjectContext';
import { AppView } from '../types/navigation';
import { ProjectCard } from '../components/common/ProjectCard';
import { Button, Badge } from '../components/common/UIControls';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { RenameModal } from '../components/common/RenameModal';
import { ArpitAcademyLogo } from '../components/common/ArpitAcademyLogo';
import {
  Sparkles,
  PlusCircle,
  FolderKanban,
  ArrowRight,
  Settings as SettingsIcon,
  Video,
  Clock,
  GraduationCap,
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: AppView) => void;
  onOpenProject: (id: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenProject,
}) => {
  const {
    projects,
    activeProject,
    duplicateProject,
    deleteProject,
    renameProject,
  } = useProject();

  const [deleteTarget, setDeleteTarget] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [renameTarget, setRenameTarget] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  // Most recent projects (up to 3)
  const recentProjects = [...projects]
    .sort((a, b) => b.updatedTimestamp - a.updatedTimestamp)
    .slice(0, 3);

  const mostRecent = projects.length > 0 ? projects[0] : null;

  return (
    <div id="home-view-container" className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Welcome & Identity Banner */}
      <section
        id="home-hero-banner"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white p-6 sm:p-8 md:p-10 shadow-xl border border-emerald-800/40"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>ARPIT ACADEMY UDAIPURA · Official Hub</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">
              ARPIT ACADEMY <span className="text-orange-400">UDAIPURA</span>
            </h1>

            <p className="text-base sm:text-lg font-semibold text-emerald-200">
              Learn • Teach • Understand <span className="text-orange-300 font-medium">· With Arpit Sir</span>
            </p>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Educational workspace for teachers and students. Build comprehensive curriculum plans, interactive concept mind maps, live interactive whiteboard sessions, and assessment mastery.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                id="btn-home-create-project"
                variant="primary"
                size="lg"
                onClick={() => onNavigate('create')}
                icon={<PlusCircle className="w-5 h-5" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
              >
                New Lesson Project
              </Button>

              <Button
                id="btn-home-view-curriculum"
                variant="outline"
                size="lg"
                onClick={() => onNavigate('curriculum')}
                icon={<GraduationCap className="w-5 h-5" />}
                className="text-white border-emerald-400/40 hover:bg-white/10 dark:text-white"
              >
                Curriculum Hub
              </Button>

              <Button
                id="btn-home-view-projects"
                variant="outline"
                size="lg"
                onClick={() => onNavigate('projects')}
                icon={<FolderKanban className="w-5 h-5" />}
                className="text-white border-white/20 hover:bg-white/10 dark:text-white"
              >
                My Projects ({projects.length})
              </Button>
            </div>
          </div>

          {/* Reference Logo Showcase */}
          <div className="shrink-0 flex items-center justify-center">
            <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-full overflow-hidden bg-white p-2 shadow-2xl border-4 border-emerald-500/40 hover:scale-105 transition-transform">
              <ArpitAcademyLogo className="w-full h-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Continue Working Section (if any project exists) */}
      {mostRecent && (
        <section id="home-continue-working" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Continue Working
              </h2>
            </div>
            <button
              id="btn-continue-all"
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>All Projects</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div
            id="continue-working-card"
            className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-950 rounded-xl shadow-xs hover:border-indigo-400 dark:hover:border-indigo-800 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="purple">Active Local Project</Badge>
                {mostRecent.subject && <Badge variant="neutral">{mostRecent.subject}</Badge>}
                <Badge variant="info" className="uppercase text-[10px]">
                  {mostRecent.language}
                </Badge>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {mostRecent.name}
              </h3>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>{mostRecent.sources.length}/5 Sources attached</span>
                <span>•</span>
                <span>
                  Modified {new Date(mostRecent.updatedTimestamp).toLocaleDateString()}
                </span>
              </div>
            </div>

            <Button
              id="btn-resume-recent-project"
              variant="primary"
              size="md"
              onClick={() => onOpenProject(mostRecent.id)}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Resume Workspace
            </Button>
          </div>
        </section>
      )}

      {/* Recent Projects Grid */}
      <section id="home-recent-projects" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Recent Teaching Projects
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Locally persisted on this device
            </p>
          </div>

          {projects.length > 0 && (
            <button
              id="btn-view-all-projects-link"
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View all ({projects.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentProjects.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
            <FolderKanban className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Create your first teaching project
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Start by naming your lesson, topic, or chapter. You can configure curriculum details and target languages.
            </p>
            <div className="pt-2">
              <Button
                id="btn-empty-create-project"
                variant="primary"
                size="md"
                onClick={() => onNavigate('create')}
                icon={<PlusCircle className="w-4 h-4" />}
              >
                Create Project
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentProjects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onOpen={onOpenProject}
                onRename={(id, name) => setRenameTarget({ id, name })}
                onDuplicate={(id) => duplicateProject(id)}
                onDelete={(id, name) => setDeleteTarget({ id, name })}
              />
            ))}
          </div>
        )}
      </section>

      {/* Quick Access Tiles */}
      <section id="home-quick-tiles" className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div
          id="tile-curriculum-builder"
          onClick={() => onNavigate('curriculum')}
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex items-start gap-4 text-left shadow-xs"
        >
          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              Curriculum & Courses
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Course management, hierarchical syllabus tree, question bank, lesson readiness, and academic calendar.
            </p>
          </div>
        </div>

        <div
          id="tile-teaching-hub"
          onClick={() => onNavigate('teaching')}
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex items-start gap-4 text-left"
        >
          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Teaching Studio & Classroom
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Dual-screen workspace, interactive digital whiteboard, AI noise reduction, live polls, and YouTube broadcast.
            </p>
          </div>
        </div>

        <div
          id="tile-settings"
          onClick={() => onNavigate('settings')}
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex items-start gap-4 text-left"
        >
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Settings & Storage
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Manage light/dark theme preferences, system storage, language defaults, and hardware configurations.
            </p>
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Delete this project permanently?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Your local project configuration will be removed.`}
        confirmText="Delete"
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteProject(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Rename Modal */}
      <RenameModal
        isOpen={!!renameTarget}
        initialName={renameTarget?.name || ''}
        onConfirm={async (newName) => {
          if (renameTarget) {
            await renameProject(renameTarget.id, newName);
            setRenameTarget(null);
          }
        }}
        onCancel={() => setRenameTarget(null)}
      />
    </div>
  );
};
