import React, { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import { ProjectCard } from '../components/common/ProjectCard';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { RenameModal } from '../components/common/RenameModal';
import { Button } from '../components/common/UIControls';
import { EmptyState } from '../components/common/EmptyState';
import {
  FolderKanban,
  Search,
  PlusCircle,
} from 'lucide-react';

interface ProjectsViewProps {
  onOpenProject: (id: string) => void;
  onCreateNew: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onOpenProject,
  onCreateNew,
}) => {
  const {
    projects,
    duplicateProject,
    deleteProject,
    renameProject,
  } = useProject();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated');

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

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

  return (
    <div id="projects-view-container" className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Teaching Projects
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your offline-ready teaching spaces ({projects.length} Total)
          </p>
        </div>

        <Button
          id="btn-projects-create-new"
          variant="primary"
          onClick={onCreateNew}
          icon={<PlusCircle className="w-4 h-4" />}
        >
          New Project
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-projects"
            type="text"
            placeholder="Search by title, subject, or grade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[40px]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Language filter */}
          <select
            id="select-filter-language"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[40px] cursor-pointer"
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
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[40px] cursor-pointer"
          >
            <option value="updated">Recently Modified</option>
            <option value="created">Recently Created</option>
            <option value="name">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          id="empty-projects-state"
          icon={<FolderKanban className="w-8 h-8" />}
          title={searchQuery ? 'No matching projects found' : 'No teaching projects created yet'}
          description={
            searchQuery
              ? 'Try changing your search terms or filters.'
              : 'Create your first project to start attaching learning sources and planning lessons.'
          }
          actionLabel={searchQuery ? 'Clear Filters' : '+ New Project'}
          onAction={searchQuery ? () => { setSearchQuery(''); setSelectedLanguage('all'); } : onCreateNew}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={onOpenProject}
              onRename={(id, name) => setRenameTarget({ id, name })}
              onDuplicate={(id) => duplicateProject(id)}
              onDelete={(id, name) => setDeleteTarget({ id, name })}
            />
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Delete this project permanently?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All project settings and offline metadata will be lost.`}
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
