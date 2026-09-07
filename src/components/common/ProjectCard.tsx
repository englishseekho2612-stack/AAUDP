import React from 'react';
import { TeachingProject } from '../../types/project';
import { Badge } from './UIControls';
import {
  Folder,
  Calendar,
  Layers,
  Copy,
  Trash2,
  Edit2,
  ArrowRight,
  MoreVertical,
} from 'lucide-react';

interface ProjectCardProps {
  project: TeachingProject;
  onOpen: (id: string) => void;
  onRename: (id: string, currentName: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Format relative timestamp
  const formatDate = (ts: number) => {
    const diffMs = Date.now() - ts;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(ts).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const completedOutputsCount = Object.values(project.outputs).filter(
    (out: any) => out.status === 'completed' || out.status === 'edited'
  ).length;

  return (
    <div
      id={`project-card-${project.id}`}
      className="group relative flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left"
    >
      <div>
        {/* Header with subject/class & action menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {project.subject && (
              <Badge variant="purple">{project.subject}</Badge>
            )}
            {project.classGrade && (
              <Badge variant="neutral">{project.classGrade}</Badge>
            )}
            <Badge variant="info" className="uppercase text-[10px]">
              {project.language}
            </Badge>
          </div>

          <div className="relative">
            <button
              id={`btn-menu-project-${project.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              aria-label="Project options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-30 py-1 text-xs">
                  <button
                    id={`btn-action-rename-${project.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onRename(project.id, project.name);
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    Rename
                  </button>
                  <button
                    id={`btn-action-duplicate-${project.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDuplicate(project.id);
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    Duplicate Project
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                  <button
                    id={`btn-action-delete-${project.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDelete(project.id, project.name);
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Permanently
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Project Title */}
        <h3
          onClick={() => onOpen(project.id)}
          className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-2.5 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2"
        >
          {project.name}
        </h3>

        {/* Metadata summary */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>
              <strong className="font-semibold text-slate-700 dark:text-slate-300">
                {project.sources.length}/5
              </strong>{' '}
              Sources
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDate(project.updatedTimestamp)}</span>
          </div>
        </div>
      </div>

      {/* Footer Open Button */}
      <div className="mt-4 pt-2">
        <button
          id={`btn-open-project-${project.id}`}
          onClick={() => onOpen(project.id)}
          className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer min-h-[40px]"
        >
          <span>Open Workspace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
