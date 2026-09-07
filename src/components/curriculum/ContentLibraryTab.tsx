import React, { useState, useMemo } from 'react';
import { Course, ContentTag } from '../../types/curriculum';
import { useProject } from '../../context/ProjectContext';
import {
  Library,
  Search,
  Filter,
  FileText,
  Video,
  Layers,
  HelpCircle,
  Copy,
  ExternalLink,
  Tag,
  Download,
  Share2,
  CheckCircle2,
} from 'lucide-react';

interface ContentLibraryTabProps {
  course: Course;
  onOpenTeachingStudio: (projectId?: string) => void;
}

type ContentCategory = 'all' | 'slides' | 'mindmap' | 'notes' | 'quiz' | 'assignment' | 'video';

interface LibraryItem {
  id: string;
  title: string;
  type: ContentCategory;
  chapterTitle: string;
  lessonTitle: string;
  projectId?: string;
  tags: ContentTag[];
  isSharedReference?: boolean;
}

export const ContentLibraryTab: React.FC<ContentLibraryTabProps> = ({ course, onOpenTeachingStudio }) => {
  const { projects } = useProject();
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Aggregate all lessons and projects into flat library items
  const libraryItems: LibraryItem[] = useMemo(() => {
    const items: LibraryItem[] = [];
    course.subjects?.forEach((subj) => {
      subj.units?.forEach((unit) => {
        unit.chapters?.forEach((chap) => {
          chap.topics?.forEach((topic) => {
            topic.lessons?.forEach((lesson) => {
              if (lesson.hasSlides) {
                items.push({
                  id: `${lesson.id}_slides`,
                  title: `${lesson.title} — Slide Presentation`,
                  type: 'slides',
                  chapterTitle: chap.title,
                  lessonTitle: lesson.title,
                  projectId: lesson.teachingProjectId,
                  tags: lesson.tags || ['Important'],
                });
              }
              if (lesson.hasMindMap) {
                items.push({
                  id: `${lesson.id}_mindmap`,
                  title: `${lesson.title} — Concept Mind Map`,
                  type: 'mindmap',
                  chapterTitle: chap.title,
                  lessonTitle: lesson.title,
                  projectId: lesson.teachingProjectId,
                  tags: lesson.tags || ['Diagram'],
                });
              }
              if (lesson.hasNotes) {
                items.push({
                  id: `${lesson.id}_notes`,
                  title: `${lesson.title} — Comprehensive Study Notes`,
                  type: 'notes',
                  chapterTitle: chap.title,
                  lessonTitle: lesson.title,
                  projectId: lesson.teachingProjectId,
                  tags: lesson.tags || ['Important'],
                });
              }
              if (lesson.hasQuiz) {
                items.push({
                  id: `${lesson.id}_quiz`,
                  title: `${lesson.title} — Diagnostic Practice Quiz`,
                  type: 'quiz',
                  chapterTitle: chap.title,
                  lessonTitle: lesson.title,
                  projectId: lesson.teachingProjectId,
                  tags: ['Practice', 'Exam'],
                });
              }
              if (lesson.hasAssignment) {
                items.push({
                  id: `${lesson.id}_assignment`,
                  title: `${lesson.title} — Homework & Lab Assignment`,
                  type: 'assignment',
                  chapterTitle: chap.title,
                  lessonTitle: lesson.title,
                  projectId: lesson.teachingProjectId,
                  tags: ['Homework'],
                });
              }
              if (lesson.hasRecording || lesson.hasEditedVideo) {
                items.push({
                  id: `${lesson.id}_video`,
                  title: `${lesson.title} — Classroom Video Recording`,
                  type: 'video',
                  chapterTitle: chap.title,
                  lessonTitle: lesson.title,
                  projectId: lesson.teachingProjectId,
                  tags: ['Revision'],
                });
              }
            });
          });
        });
      });
    });

    // Also include artifacts from active studio projects
    projects.forEach((proj) => {
      items.push({
        id: `proj_${proj.id}_mindmap`,
        title: `${proj.name} — Interactive Mind Map Artifact`,
        type: 'mindmap',
        chapterTitle: 'Studio Projects',
        lessonTitle: proj.name,
        projectId: proj.id,
        tags: ['Example'],
        isSharedReference: true,
      });
    });

    return items;
  }, [course, projects]);

  // Filtering
  const filteredItems = useMemo(() => {
    return libraryItems.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.type === selectedCategory;
      const matchTag = selectedTag === 'all' || item.tags.includes(selectedTag as ContentTag);
      const matchQuery =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchTag && matchQuery;
    });
  }, [libraryItems, selectedCategory, selectedTag, searchQuery]);

  const handleCopyReference = (item: LibraryItem) => {
    navigator.clipboard.writeText(`Content Reference: [${item.title}] (ID: ${item.id})`);
    setCopiedNotification(item.id);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  const handleExportPackage = () => {
    const studentPackage = {
      course: course.name,
      subject: course.subject,
      classGrade: course.classGrade,
      exportedAt: new Date().toISOString(),
      materialsCount: filteredItems.length,
      materials: filteredItems.map((item) => ({
        title: item.title,
        type: item.type,
        chapter: item.chapterTitle,
        lesson: item.lessonTitle,
        tags: item.tags,
      })),
    };

    const blob = new Blob([JSON.stringify(studentPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${course.name.replace(/\s+/g, '_')}_student_materials.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Search, Filter & Export Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search presentations, mind maps, notes..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleExportPackage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700"
            >
              <Download className="w-3.5 h-3.5" /> Export Material Package (JSON)
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: 'all', label: 'All Media', icon: Library },
            { id: 'slides', label: 'Presentations', icon: Layers },
            { id: 'mindmap', label: 'Mind Maps', icon: Share2 },
            { id: 'notes', label: 'Notes & Documents', icon: FileText },
            { id: 'quiz', label: 'Quizzes', icon: HelpCircle },
            { id: 'video', label: 'Recordings', icon: Video },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as ContentCategory)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Content Library Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredItems.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
            <Library className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
              No Content Items Found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create slides, mind maps, or notes in the Teaching Studio or attach them to lessons.
            </p>
          </div>
        )}

        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  {item.type}
                </span>
                {item.isSharedReference && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Shared Reference
                  </span>
                )}
              </div>

              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 mb-1">
                {item.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                {item.chapterTitle} • {item.lessonTitle}
              </p>

              <div className="flex flex-wrap gap-1 mb-4">
                {item.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions: Open in Studio, Reuse as Reference, Copy Link */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                onClick={() => onOpenTeachingStudio(item.projectId)}
                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open in Studio
              </button>

              <button
                onClick={() => handleCopyReference(item)}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                title="Copy reference citation"
              >
                {copiedNotification === item.id ? (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Copied
                  </span>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Reuse Ref
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
