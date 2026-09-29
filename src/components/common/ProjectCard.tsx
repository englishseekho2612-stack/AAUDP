import React, { useState } from 'react';
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
  BookOpen,
  Network,
  Bot,
  GraduationCap,
  Plus,
} from 'lucide-react';

interface ProjectCardProps {
  project: TeachingProject;
  onOpen: (id: string) => void;
  onRename: (id: string, currentName: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onVisualize?: (id: string) => void;
  onAskArpitSir?: (id: string) => void;
  onTeach?: (id: string) => void;
  onAddMaterial?: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onVisualize,
  onAskArpitSir,
  onTeach,
  onAddMaterial,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

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

  const materialCount = project.sources.length;

  return (
    <div
      id={`lesson-card-${project.id}`}
      className="group relative flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all text-left"
    >
      <div>
        {/* Header with subject/class & action menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {project.classGrade ? (
              <Badge variant="purple" className="font-bold text-xs">
                {project.classGrade}
              </Badge>
            ) : null}
            {project.subject ? (
              <Badge variant="info" className="font-semibold text-xs">
                {project.subject}
              </Badge>
            ) : (
              <Badge variant="neutral" className="font-semibold text-xs">
                General Study
              </Badge>
            )}
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              {materialCount} {materialCount === 1 ? 'material' : 'materials'}
            </span>
          </div>

          <div className="relative">
            <button
              id={`btn-menu-lesson-${project.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Lesson options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 text-xs">
                  <button
                    id={`btn-action-rename-${project.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onRename(project.id, project.name);
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    Rename Lesson
                  </button>
                  <button
                    id={`btn-action-duplicate-${project.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDuplicate(project.id);
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    Duplicate Lesson
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                  <button
                    id={`btn-action-delete-${project.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDelete(project.id, project.name);
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Lesson
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Lesson Title */}
        <h3
          onClick={() => onOpen(project.id)}
          className="text-base font-bold text-slate-900 dark:text-slate-100 mt-3 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-2"
        >
          {project.name}
        </h3>

        {/* Source format preview badges */}
        {project.sources.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {project.sources.slice(0, 4).map((s) => (
              <span
                key={s.id}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 truncate max-w-[130px]"
                title={s.name}
              >
                {s.name}
              </span>
            ))}
            {project.sources.length > 4 && (
              <span className="text-[10px] text-slate-400 px-1 py-0.5">
                +{project.sources.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Metadata summary */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Updated {formatDate(project.updatedTimestamp)}</span>
          </div>

          {onAddMaterial && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddMaterial(project.id);
              }}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Material</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Toolbar on Card */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
        {/* Open Lesson */}
        <button
          id={`btn-open-lesson-${project.id}`}
          onClick={() => onOpen(project.id)}
          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
        >
          <span>Open Lesson</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {/* 🧠 Visualize */}
        {onVisualize && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onVisualize(project.id);
            }}
            title="Create Visual Mind Map / Concept Tree"
            className="py-2 px-2.5 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors border border-teal-200 dark:border-teal-800 cursor-pointer"
          >
            <Network className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Visualize</span>
          </button>
        )}

        {/* 🤖 Ask Arpit Sir */}
        {onAskArpitSir && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAskArpitSir(project.id);
            }}
            title="Ask Arpit Sir"
            className="py-2 px-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors border border-indigo-200 dark:border-indigo-800 cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Ask Arpit Sir</span>
          </button>
        )}

        {/* 🎓 Teach */}
        {onTeach && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTeach(project.id);
            }}
            title="Open Teaching Board"
            className="py-2 px-2.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors border border-amber-200 dark:border-amber-800 cursor-pointer"
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Teach</span>
          </button>
        )}
      </div>
    </div>
  );
};
