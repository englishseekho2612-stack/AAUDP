import React, { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import { ProjectCard } from '../components/common/ProjectCard';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { RenameModal } from '../components/common/RenameModal';
import { Button } from '../components/common/UIControls';
import { EmptyState } from '../components/common/EmptyState';
import { AddSourceModal } from '../components/sources/AddSourceModal';
import { VisualChoiceModal } from '../components/knowledge/VisualChoiceModal';
import { AskArpitSirModal } from '../components/ai/AskArpitSirModal';
import {
  FolderKanban,
  Search,
  Plus,
  BookOpen,
  PlusCircle,
  FilePlus,
  Layers,
  X,
} from 'lucide-react';

interface ProjectsViewProps {
  onOpenProject: (id: string) => void;
  onCreateNew: () => void;
  onStartTeachingStudio?: (projectId?: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onOpenProject,
  onCreateNew,
  onStartTeachingStudio,
}) => {
  const {
    projects,
    activeProject,
    duplicateProject,
    deleteProject,
    renameProject,
    openProject,
    createProject,
    addSourceToActiveProject,
    showToast,
  } = useProject();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated');

  // Modals state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  
  // Unified Add Material Modal State
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [activeLessonForMaterial, setActiveLessonForMaterial] = useState<string | null>(null);
  const [showChooseLessonModal, setShowChooseLessonModal] = useState(false);
  const [newLessonName, setNewLessonName] = useState('');
  const [newLessonSubject, setNewLessonSubject] = useState('');

  // Contextual modals
  const [visualizeTargetId, setVisualizeTargetId] = useState<string | null>(null);
  const [isVisualChoiceOpen, setIsVisualChoiceOpen] = useState(false);
  const [isAskArpitSirOpen, setIsAskArpitSirOpen] = useState(false);

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const matchesQuery =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.subject && p.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.classGrade && p.classGrade.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesLang =
          selectedLanguage === 'all' || p.language === selectedLanguage;

        return matchesQuery && matchesLang;
      })
      .sort((a, b) => {
        if (sortBy === 'updated') return b.updatedTimestamp - a.updatedTimestamp;
        if (sortBy === 'created') return b.createdTimestamp - a.createdTimestamp;
        return a.name.localeCompare(b.name);
      });
  }, [projects, searchQuery, selectedLanguage, sortBy]);

  // Primary "+ Add Material" click handler
  const handlePrimaryAddMaterial = () => {
    if (projects.length === 0) {
      setShowChooseLessonModal(true);
      return;
    }

    if (activeProject) {
      setActiveLessonForMaterial(activeProject.id);
      setIsAddMaterialModalOpen(true);
    } else {
      setShowChooseLessonModal(true);
    }
  };

  // Specific card "+ Add Material" click handler
  const handleCardAddMaterial = async (lessonId: string) => {
    await openProject(lessonId);
    setActiveLessonForMaterial(lessonId);
    setIsAddMaterialModalOpen(true);
  };

  // Create new lesson from modal and immediately open Add Material
  const handleCreateLessonAndAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonName.trim()) return;

    try {
      const newProj = await createProject({
        name: newLessonName.trim(),
        subject: newLessonSubject.trim() || 'General Study',
        classGrade: 'Standard',
        language: 'en',
      });
      setShowChooseLessonModal(false);
      setNewLessonName('');
      setNewLessonSubject('');
      await openProject(newProj.id);
      setActiveLessonForMaterial(newProj.id);
      setIsAddMaterialModalOpen(true);
      showToast(`Created lesson "${newProj.name}". Choose your study material!`, 'success');
    } catch {
      showToast('Could not create lesson. Please try again.', 'error');
    }
  };

  // 🧠 Visualize action on a lesson card
  const handleCardVisualize = async (lessonId: string) => {
    await openProject(lessonId);
    setVisualizeTargetId(lessonId);
    setIsVisualChoiceOpen(true);
  };

  // 🤖 Ask Arpit Sir action on a lesson card
  const handleCardAskArpitSir = async (lessonId: string) => {
    await openProject(lessonId);
    setIsAskArpitSirOpen(true);
  };

  // 🎓 Teach action on a lesson card
  const handleCardTeach = async (lessonId: string) => {
    await openProject(lessonId);
    if (onStartTeachingStudio) {
      onStartTeachingStudio(lessonId);
    } else {
      onOpenProject(lessonId);
    }
  };

  // Active target project for AddSourceModal
  const currentTargetProject = projects.find((p) => p.id === activeLessonForMaterial) || activeProject || projects[0];

  return (
    <div id="learn-view-container" className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              📚 Learn — My Lessons
            </h1>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              {projects.length} {projects.length === 1 ? 'Lesson' : 'Lessons'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            My Learning Material · Review study materials, visual trees, and lesson notes
          </p>
        </div>

        {/* The SINGLE Primary Entry Point for adding learning material */}
        <Button
          id="btn-primary-add-material"
          variant="primary"
          onClick={handlePrimaryAddMaterial}
          icon={<Plus className="w-4 h-4" />}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
        >
          + Add Material
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-lessons"
            type="text"
            placeholder="Search by lesson title, subject, or grade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Language filter */}
          <select
            id="select-filter-language"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px] cursor-pointer"
          >
            <option value="all">All Languages</option>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="hinglish">Hinglish</option>
          </select>

          {/* Sort order */}
          <select
            id="select-sort-order"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px] cursor-pointer"
          >
            <option value="updated">Recently Modified</option>
            <option value="created">Recently Created</option>
            <option value="name">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Existing Learning Material is displayed immediately */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          id="empty-lessons-state"
          icon={<BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
          title={searchQuery ? 'No matching lessons found' : 'No learning material added yet'}
          description={
            searchQuery
              ? 'Try changing your search terms or filters.'
              : 'Add your first study material (PDF, YouTube video, notes, or web article) to get started.'
          }
          actionLabel={searchQuery ? 'Clear Filters' : '+ Add Material'}
          onAction={searchQuery ? () => { setSearchQuery(''); setSelectedLanguage('all'); } : handlePrimaryAddMaterial}
        />
      ) : (
        <div
          id="lessons-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={onOpenProject}
              onRename={(id, name) => setRenameTarget({ id, name })}
              onDuplicate={(id) => duplicateProject(id)}
              onDelete={(id, name) => setDeleteTarget({ id, name })}
              onVisualize={handleCardVisualize}
              onAskArpitSir={handleCardAskArpitSir}
              onTeach={handleCardTeach}
              onAddMaterial={handleCardAddMaterial}
            />
          ))}
        </div>
      )}

      {/* CHOOSE / CREATE LESSON MODAL FOR ADD MATERIAL */}
      {showChooseLessonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Add Learning Material
                </h3>
              </div>
              <button
                onClick={() => setShowChooseLessonModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {projects.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Select Existing Lesson:
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={async () => {
                        await openProject(p.id);
                        setActiveLessonForMaterial(p.id);
                        setShowChooseLessonModal(false);
                        setIsAddMaterialModalOpen(true);
                      }}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="truncate pr-2">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {p.subject || 'General'} · {p.sources.length} materials
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        Choose →
                      </span>
                    </button>
                  ))}
                </div>

                <div className="relative my-3 flex items-center justify-center">
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                  <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
                    or create new lesson
                  </span>
                </div>
              </div>
            )}

            {/* Create new lesson form */}
            <form onSubmit={handleCreateLessonAndAddMaterial} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Lesson Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Class 10 English - His First Flight"
                  value={newLessonName}
                  onChange={(e) => setNewLessonName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Subject / Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g., English, Science, Social Studies"
                  value={newLessonSubject}
                  onChange={(e) => setNewLessonSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChooseLessonModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Create & Add Material →
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UNIFIED ADD SOURCE / MATERIAL MODAL */}
      {isAddMaterialModalOpen && currentTargetProject && (
        <AddSourceModal
          projectId={currentTargetProject.id}
          existingSources={currentTargetProject.sources}
          isOpen={isAddMaterialModalOpen}
          onClose={() => {
            setIsAddMaterialModalOpen(false);
            setActiveLessonForMaterial(null);
          }}
          onSourceAdded={(newSource) => {
            addSourceToActiveProject(newSource);
            setIsAddMaterialModalOpen(false);
            showToast(`Added "${newSource.name}" to ${currentTargetProject.name}`, 'success');
          }}
        />
      )}

      {/* 🧠 VISUAL CHOICE MODAL (Mind Map / Concept Tree) */}
      <VisualChoiceModal
        isOpen={isVisualChoiceOpen}
        onClose={() => {
          setIsVisualChoiceOpen(false);
          setVisualizeTargetId(null);
        }}
        onSelectVisual={(format) => {
          setIsVisualChoiceOpen(false);
          if (visualizeTargetId) {
            onOpenProject(visualizeTargetId);
          }
        }}
      />

      {/* 🤖 ASK ARPIT SIR MODAL */}
      <AskArpitSirModal
        isOpen={isAskArpitSirOpen}
        onClose={() => setIsAskArpitSirOpen(false)}
        onOpenTeachingBoard={() => {
          setIsAskArpitSirOpen(false);
          if (activeProject && onStartTeachingStudio) {
            onStartTeachingStudio(activeProject.id);
          }
        }}
      />

      {/* Confirmation & Rename Modals */}
      {deleteTarget && (
        <ConfirmationModal
          isOpen={true}
          title="Delete Lesson"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
          confirmText="Delete Permanently"
          confirmVariant="danger"
          onConfirm={() => {
            deleteProject(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {renameTarget && (
        <RenameModal
          isOpen={true}
          initialName={renameTarget.name}
          onConfirm={(newName) => {
            renameProject(renameTarget.id, newName);
            setRenameTarget(null);
          }}
          onCancel={() => setRenameTarget(null)}
        />
      )}
    </div>
  );
};
