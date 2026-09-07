/**
 * Study Notes & Summary Viewer & Editor
 * Section 21, 22: Summary, Detailed analysis, Glossary terms, Exam Q&A, and in-place editing.
 */

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Save,
  BookOpen,
  Download,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Bookmark,
} from 'lucide-react';
import { NotesContent, NoteSection } from '../../types/ai';
import { ProjectAIOutput, SupportedLanguage } from '../../types/project';
import { Button, Badge } from '../common/UIControls';

export interface NotesViewerProps {
  output: ProjectAIOutput<NotesContent>;
  language: SupportedLanguage;
  onSaveTeacherEdits: (editedContent: NotesContent) => void;
  onRestoreAI: () => void;
  onSwitchView: (view: 'ai' | 'teacher' | 'split') => void;
}

export const NotesViewer: React.FC<NotesViewerProps> = ({
  output,
  language,
  onSaveTeacherEdits,
  onRestoreAI,
  onSwitchView,
}) => {
  const isTeacherEdited = Boolean(output.teacherEditedContent);
  const activeContent: NotesContent =
    output.activeView === 'ai' || !output.teacherEditedContent
      ? (output.rawAiContent as NotesContent)
      : (output.teacherEditedContent as NotesContent);

  const [workingNotes, setWorkingNotes] = useState<NotesContent>(
    JSON.parse(JSON.stringify(activeContent || { title: 'Study Notes', sections: [] }))
  );

  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editHeading, setEditHeading] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');

  React.useEffect(() => {
    if (activeContent) {
      setWorkingNotes(JSON.parse(JSON.stringify(activeContent)));
    }
  }, [output.activeView, output.lastModifiedAt]);

  const sections = workingNotes.sections || [];

  if (!activeContent || sections.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        <FileText className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <p className="font-semibold text-slate-700 dark:text-slate-300">No notes generated yet.</p>
        <p className="text-xs text-slate-400 mt-1">Use "Create with AI" to generate study notes.</p>
      </div>
    );
  }

  const saveNotesChanges = (newSections: NoteSection[]) => {
    const updated: NotesContent = {
      ...workingNotes,
      sections: newSections,
    };
    setWorkingNotes(updated);
    onSaveTeacherEdits(updated);
  };

  const startEditSection = (sec: NoteSection) => {
    setEditingSectionId(sec.id);
    setEditHeading(sec.heading);
    setEditContent(sec.content);
  };

  const handleSaveSection = (secId: string) => {
    const next = sections.map((s) =>
      s.id === secId
        ? {
            ...s,
            heading: editHeading.trim() || s.heading,
            content: editContent,
          }
        : s
    );
    saveNotesChanges(next);
    setEditingSectionId(null);
  };

  const handleAddSection = () => {
    const newSec: NoteSection = {
      id: `sec_${Date.now()}`,
      heading: 'New Section',
      type: 'detailed',
      content: 'Write your notes or explanations here.',
      sourceReferences: [],
    };
    const next = [...sections, newSec];
    saveNotesChanges(next);
    startEditSection(newSec);
  };

  const handleDeleteSection = (secId: string) => {
    if (sections.length <= 1) {
      alert('Notes must have at least 1 section.');
      return;
    }
    const next = sections.filter((s) => s.id !== secId);
    saveNotesChanges(next);
  };

  const handleExportMarkdown = () => {
    let md = `# ${workingNotes.title}\n\n`;
    if (workingNotes.grade) md += `**Grade:** ${workingNotes.grade}\n\n`;
    sections.forEach((sec) => {
      md += `## ${sec.heading}\n\n`;
      if (sec.content) md += `${sec.content}\n\n`;
      if (sec.bullets && sec.bullets.length > 0) {
        sec.bullets.forEach((b) => {
          md += `* ${b}\n`;
        });
        md += '\n';
      }
      if (sec.terms && sec.terms.length > 0) {
        md += `### Important Terms\n\n`;
        sec.terms.forEach((t) => {
          md += `* **${t.term}**: ${t.definition}\n`;
        });
        md += '\n';
      }
      if (sec.qaList && sec.qaList.length > 0) {
        md += `### Exam Questions & Answers\n\n`;
        sec.qaList.forEach((qa, idx) => {
          md += `**Q${idx + 1}: ${qa.question}**\n\n*Answer:* ${qa.answer}\n\n`;
          if (qa.examTip) md += `*Exam Tip:* ${qa.examTip}\n\n`;
        });
      }
      if (sec.sourceReferences && sec.sourceReferences.length > 0) {
        md += `*Sources: ${sec.sourceReferences.map((r) => `${r.sourceName} (${r.location})`).join(', ')}*\n\n`;
      }
      md += '---\n\n';
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workingNotes.title.replace(/\s+/g, '_')}_notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="notes-viewer" className="flex flex-col h-[780px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {workingNotes.title}
              {isTeacherEdited ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  Teacher Edited
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Original AI Output
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              {sections.length} sections • Format: {workingNotes.format}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isTeacherEdited && (
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs mr-2">
              <button
                type="button"
                onClick={() => onSwitchView('ai')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  output.activeView === 'ai'
                    ? 'bg-white dark:bg-slate-900 shadow-xs font-bold text-emerald-600'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Original AI
              </button>
              <button
                type="button"
                onClick={() => onSwitchView('teacher')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  output.activeView === 'teacher'
                    ? 'bg-white dark:bg-slate-900 shadow-xs font-bold text-amber-600'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Teacher Edits
              </button>
            </div>
          )}

          {isTeacherEdited && (
            <Button size="sm" variant="outline" onClick={onRestoreAI} icon={<RotateCcw className="w-3.5 h-3.5" />}>
              Restore AI
            </Button>
          )}

          <Button size="sm" variant="outline" onClick={handleExportMarkdown} icon={<Download className="w-3.5 h-3.5" />}>
            Export Markdown
          </Button>

          <Button size="sm" variant="primary" onClick={handleAddSection} icon={<Plus className="w-3.5 h-3.5" />}>
            Add Section
          </Button>
        </div>
      </div>

      {/* Main Document Content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
        {sections.map((sec, idx) => {
          const isEditing = editingSectionId === sec.id;

          return (
            <div
              key={sec.id}
              id={`notes-sec-${sec.id}`}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    § {idx + 1} • {sec.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {!isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => startEditSection(sec)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Edit Section"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(sec.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Delete Section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Editing Mode */}
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Section Heading
                    </label>
                    <input
                      type="text"
                      value={editHeading}
                      onChange={(e) => setEditHeading(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Content / Explanation
                    </label>
                    <textarea
                      rows={5}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingSectionId(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => handleSaveSection(sec.id)} icon={<Save className="w-3.5 h-3.5" />}>
                      Save Section
                    </Button>
                  </div>
                </div>
              ) : (
                /* Read View Mode */
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {sec.heading}
                  </h3>

                  {sec.content && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {sec.content}
                    </p>
                  )}

                  {/* Bullet Points */}
                  {sec.bullets && sec.bullets.length > 0 && (
                    <ul className="space-y-1.5 pl-2">
                      {sec.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Important Terms Glossary */}
                  {sec.terms && sec.terms.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-emerald-500" />
                        Key Terminology & Definitions
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sec.terms.map((t, tIdx) => (
                          <div
                            key={tIdx}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1"
                          >
                            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                              {t.term}
                            </span>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                              {t.definition}
                            </p>
                            {t.example && (
                              <p className="text-[10px] text-slate-400 italic">
                                Example: {t.example}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exam Questions & Answers */}
                  {sec.qaList && sec.qaList.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                        Exam-Oriented Questions & Model Answers
                      </span>
                      <div className="space-y-2.5">
                        {sec.qaList.map((qa, qIdx) => (
                          <div
                            key={qIdx}
                            className="p-3.5 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-1.5"
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                Q{qIdx + 1}:
                              </span>
                              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {qa.question}
                              </h5>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 pl-5 leading-relaxed">
                              {qa.answer}
                            </p>
                            {qa.examTip && (
                              <div className="ml-5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                🎯 <strong>Exam Tip:</strong> {qa.examTip}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grounded Citations */}
                  {sec.sourceReferences && sec.sourceReferences.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {sec.sourceReferences.map((ref, rIdx) => (
                        <span
                          key={rIdx}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md"
                        >
                          <BookOpen className="w-3 h-3 text-emerald-500" />
                          {ref.sourceName} • {ref.location}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
