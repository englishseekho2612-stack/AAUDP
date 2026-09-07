import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { SourceSlotList } from './SourceSlotList';
import { OutputGrid } from './OutputGrid';
import { TeachingModuleList } from './TeachingModuleList';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { RenameModal } from '../common/RenameModal';
import { Badge, Button } from '../common/UIControls';
import { SUPPORTED_LANGUAGES, SupportedLanguage, AIOutputType } from '../../types/project';
import {
  ArrowLeft,
  Copy,
  Trash2,
  Edit3,
  Download,
  Clock,
  Sparkles,
  Info,
  X,
  Layers,
  CheckCircle,
  Film,
} from 'lucide-react';

// AI Viewers & Generation Modal
import { CreateWithAIModal } from '../ai/CreateWithAIModal';
import { MindMapViewer } from '../ai/MindMapViewer';
import { PresentationViewer } from '../ai/PresentationViewer';
import { PresentationDesignerPlanViewer } from '../ai/PresentationDesignerPlanViewer';
import { NotesViewer } from '../ai/NotesViewer';
import { TopicExplanationViewer } from '../ai/TopicExplanationViewer';
import { AudioViewer } from '../ai/AudioViewer';
import { VideoViewer } from '../ai/VideoViewer';
import { QuizViewer } from '../ai/QuizViewer';
import { TeachingStudio } from '../teaching/TeachingStudio';
import { VideoEditorView } from '../../views/VideoEditorView';
import { Video } from 'lucide-react';

interface ProjectDashboardProps {
  onBack: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ onBack }) => {
  const {
    activeProject,
    updateActiveProject,
    renameProject,
    duplicateProject,
    deleteProject,
    showToast,
    addSourceToActiveProject,
    removeSourceFromActiveProject,
    toggleSourcePriorityInActiveProject,
    toggleSourceAISelectionInActiveProject,
    reorderSourcesInActiveProject,
    updateTeacherInstructionsInActiveProject,
    saveProjectOutput,
    updateProjectOutputTeacherEdits,
    restoreProjectOutputToAI,
    switchProjectOutputView,
  } = useProject();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isCreateAIModalOpen, setIsCreateAIModalOpen] = useState(false);
  const [preselectedAITask, setPreselectedAITask] = useState<AIOutputType | undefined>(undefined);
  const [isTeachingStudioActive, setIsTeachingStudioActive] = useState(false);
  const [isVideoEditorActive, setIsVideoEditorActive] = useState(false);

  // Active Output Fullscreen / Modal Studio
  const [activeOutputViewer, setActiveOutputViewer] = useState<AIOutputType | null>(null);

  // Module Roadmap Info Modal
  const [moduleSpecModal, setModuleSpecModal] = useState<{
    open: boolean;
    name: string;
  }>({ open: false, name: '' });

  if (!activeProject) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">No active project selected.</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          Return to Projects
        </Button>
      </div>
    );
  }

  // Active Studio Mode takes over workspace smoothly
  if (isTeachingStudioActive) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900">
        <TeachingStudio
          onExit={() => setIsTeachingStudioActive(false)}
          onOpenVideoEditor={() => {
            setIsTeachingStudioActive(false);
            setIsVideoEditorActive(true);
          }}
        />
      </div>
    );
  }

  // Active AI Video Editor takes over workspace smoothly (Part 06)
  if (isVideoEditorActive) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950">
        <VideoEditorView onExit={() => setIsVideoEditorActive(false)} />
      </div>
    );
  }

  // Handle language change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as SupportedLanguage;
    updateActiveProject((prev) => ({
      ...prev,
      language: newLang,
    }));
    showToast(`Project language updated to ${newLang.toUpperCase()}`, 'info');
  };

  // Handle export project as JSON backup
  const handleExportProjectJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeProject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeProject.name.replace(/[^a-zA-Z0-9]/g, '_')}_backup.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Project configuration exported to JSON.', 'success');
  };

  const handleDuplicate = async () => {
    await duplicateProject(activeProject.id);
  };

  const handleDeleteConfirm = async () => {
    await deleteProject(activeProject.id);
    setIsDeleteModalOpen(false);
    onBack();
  };

  const handleRenameConfirm = async (newName: string) => {
    await renameProject(activeProject.id, newName);
    setIsRenameModalOpen(false);
  };

  const handleOpenCreateWithAI = (taskType?: AIOutputType) => {
    setPreselectedAITask(taskType);
    setIsCreateAIModalOpen(true);
  };

  const handleTriggerOutput = (type: AIOutputType) => {
    const output = activeProject.outputs[type];
    if (output && (output.rawAiContent || output.teacherEditedContent)) {
      setActiveOutputViewer(type);
    } else {
      handleOpenCreateWithAI(type);
    }
  };

  const handleOutputGeneratedSuccess = (type: AIOutputType) => {
    setActiveOutputViewer(type);
  };

  // Render active viewer component
  const renderActiveViewer = () => {
    if (!activeOutputViewer) return null;
    const output = activeProject.outputs[activeOutputViewer];
    if (!output) return null;

    const commonProps = {
      output: output as any,
      language: activeProject.language,
      onSaveTeacherEdits: (edited: any) => updateProjectOutputTeacherEdits(activeOutputViewer, edited),
      onRestoreAI: () => restoreProjectOutputToAI(activeOutputViewer),
      onSwitchView: (view: 'ai' | 'teacher' | 'split') => switchProjectOutputView(activeOutputViewer, view),
    };

    switch (activeOutputViewer) {
      case 'mind_map':
        return <MindMapViewer {...commonProps} />;
      case 'slides':
        return <PresentationViewer {...commonProps} />;
      case 'presentation_designer':
        return <PresentationDesignerPlanViewer {...commonProps} />;
      case 'notes':
        return <NotesViewer {...commonProps} />;
      case 'topic_explanation':
        return <TopicExplanationViewer {...commonProps} />;
      case 'audio':
        return <AudioViewer {...commonProps} />;
      case 'video':
        return <VideoViewer {...commonProps} />;
      case 'quiz':
        return <QuizViewer {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div id="project-dashboard-view" className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Top action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <button
          id="btn-back-to-all-projects"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-1 -ml-1 cursor-pointer min-h-[36px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Projects</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Enter Teaching Studio Action */}
          <Button
            id="btn-toolbar-enter-studio"
            variant="primary"
            size="sm"
            onClick={() => setIsTeachingStudioActive(true)}
            icon={<Video className="w-3.5 h-3.5 text-white" />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
          >
            Enter Teaching Studio
          </Button>

          {/* Primary AI Video Editor Action (Part 06) */}
          <Button
            id="btn-toolbar-video-editor"
            variant="outline"
            size="sm"
            onClick={() => setIsVideoEditorActive(true)}
            icon={<Film className="w-3.5 h-3.5 text-indigo-500" />}
            className="hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20"
          >
            AI Video Editor
          </Button>

          {/* Primary Create with AI Action */}
          <Button
            id="btn-toolbar-create-ai"
            variant="outline"
            size="sm"
            onClick={() => handleOpenCreateWithAI()}
            icon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
          >
            Create with AI
          </Button>

          <Button
            id="btn-toolbar-rename"
            variant="outline"
            size="sm"
            onClick={() => setIsRenameModalOpen(true)}
            icon={<Edit3 className="w-3.5 h-3.5" />}
          >
            Rename
          </Button>

          <Button
            id="btn-toolbar-duplicate"
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            icon={<Copy className="w-3.5 h-3.5" />}
          >
            Duplicate
          </Button>

          <Button
            id="btn-toolbar-export"
            variant="outline"
            size="sm"
            onClick={handleExportProjectJSON}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export Backup
          </Button>

          <Button
            id="btn-toolbar-delete"
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
            className="hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/40"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Project Header Card */}
      <div
        id="project-overview-header"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                PROJECT WORKSPACE
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                ID: {activeProject.id}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {activeProject.name}
              </h1>
              <button
                id="btn-edit-project-title"
                onClick={() => setIsRenameModalOpen(true)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
                title="Edit title"
                aria-label="Edit title"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600 dark:text-slate-300">
              {activeProject.subject && (
                <Badge variant="purple">Subject: {activeProject.subject}</Badge>
              )}
              {activeProject.classGrade && (
                <Badge variant="neutral">Grade: {activeProject.classGrade}</Badge>
              )}
              <div className="flex items-center gap-1.5 ml-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Last modified {new Date(activeProject.updatedTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Settings within Project */}
          <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
            <div className="w-44">
              <label
                htmlFor="select-project-language"
                className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >
                Output Language Target
              </label>
              <select
                id="select-project-language"
                value={activeProject.language}
                onChange={handleLanguageChange}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer min-h-[38px]"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label} ({lang.nativeLabel})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE OUTPUT VIEWER STUDIO (If an output is currently selected for viewing/editing) */}
      {activeOutputViewer && (
        <div id="active-output-studio-panel" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                ACTIVE STUDIO WORKSPACE:
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 capitalize">
                {activeProject.outputs[activeOutputViewer]?.title || activeOutputViewer.replace('_', ' ')}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveOutputViewer(null)}
              icon={<X className="w-3.5 h-3.5" />}
            >
              Close Studio
            </Button>
          </div>

          {renderActiveViewer()}
        </div>
      )}

      {/* SECTION 1: SOURCES (Max 5 sources constraint - Part 02 Source Engine) */}
      <SourceSlotList
        projectId={activeProject.id}
        sources={activeProject.sources}
        teacherInstructions={activeProject.teacherInstructions}
        onAddSource={addSourceToActiveProject}
        onRemoveSource={removeSourceFromActiveProject}
        onTogglePriority={toggleSourcePriorityInActiveProject}
        onToggleAISelection={toggleSourceAISelectionInActiveProject}
        onMoveUp={(id) => reorderSourcesInActiveProject(id, 'up')}
        onMoveDown={(id) => reorderSourcesInActiveProject(id, 'down')}
        onSaveTeacherInstructions={updateTeacherInstructionsInActiveProject}
        onScrollToOutputs={() => {
          const el = document.getElementById('ai-outputs-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* SECTION 2: AI OUTPUTS (Teacher Chosen Tasks, Non-destructive) */}
      <OutputGrid
        outputs={activeProject.outputs}
        onTriggerOutput={handleTriggerOutput}
        onOpenCreateWithAI={handleOpenCreateWithAI}
      />

      {/* SECTION 3: TEACHING (Teaching Studio, Recording, Classroom, YouTube Live) */}
      <TeachingModuleList
        onSelectModule={(name) => setModuleSpecModal({ open: true, name })}
        onLaunchStudio={() => setIsTeachingStudioActive(true)}
      />

      {/* CREATE WITH AI MODAL */}
      <CreateWithAIModal
        isOpen={isCreateAIModalOpen}
        onClose={() => setIsCreateAIModalOpen(false)}
        project={activeProject}
        preselectedTaskType={preselectedAITask}
        onGenerated={handleOutputGeneratedSuccess}
      />

      {/* Confirmation Modal for Delete Project */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete this project permanently?"
        message={`Are you sure you want to delete "${activeProject.name}"? All associated local configuration and source references will be removed. This action cannot be undone.`}
        confirmText="Delete Project"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* Rename Modal */}
      <RenameModal
        isOpen={isRenameModalOpen}
        initialName={activeProject.name}
        onConfirm={handleRenameConfirm}
        onCancel={() => setIsRenameModalOpen(false)}
      />

      {/* Module Spec Modal */}
      {moduleSpecModal.open && (
        <div
          id="module-spec-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setModuleSpecModal({ open: false, name: '' })}
          role="dialog"
        >
          <div
            id="module-spec-modal-container"
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              id="btn-close-module-modal"
              onClick={() => setModuleSpecModal({ open: false, name: '' })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {moduleSpecModal.name}
                </h3>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                  Modular Roadmap Specification
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This module is scheduled for future parts. The application architecture includes all necessary data schemas, permission scaffolding, and audio/video pipeline contracts so that hardware mic selection, noise cancellation, whiteboard canvases, and live classroom sockets plug in cleanly without rewriting the core application.
            </p>

            <div className="flex justify-end pt-2">
              <Button
                id="btn-close-spec-ack"
                variant="primary"
                onClick={() => setModuleSpecModal({ open: false, name: '' })}
              >
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
