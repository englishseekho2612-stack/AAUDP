import React, { useState } from 'react';
import { TeacherNoteEntry } from '../../types/teaching';
import {
  BookOpen,
  X,
  Plus,
  Trash2,
  Lock,
  Save,
  Check,
} from 'lucide-react';

interface TeacherNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Record<string, TeacherNoteEntry>;
  activeSlideIndex: number;
  selectedNodeTitle?: string;
  onSaveNote: (note: TeacherNoteEntry) => void;
  onDeleteNote: (targetId: string) => void;
}

export const TeacherNotesDrawer: React.FC<TeacherNotesDrawerProps> = ({
  isOpen,
  onClose,
  notes,
  activeSlideIndex,
  selectedNodeTitle,
  onSaveNote,
  onDeleteNote,
}) => {
  const [activeTab, setActiveTab] = useState<'slide' | 'topic' | 'project'>('slide');
  const [savedBadge, setSavedBadge] = useState(false);

  if (!isOpen) return null;

  const currentSlideKey = `slide_${activeSlideIndex}`;
  const currentTopicKey = selectedNodeTitle ? `topic_${selectedNodeTitle}` : 'topic_root';
  const currentProjectKey = 'project_main';

  const activeKey =
    activeTab === 'slide'
      ? currentSlideKey
      : activeTab === 'topic'
      ? currentTopicKey
      : currentProjectKey;

  const activeTitle =
    activeTab === 'slide'
      ? `Slide ${activeSlideIndex + 1} Private Notes`
      : activeTab === 'topic'
      ? `${selectedNodeTitle || 'Topic'} Private Notes`
      : 'General Lesson Plan & Teacher Notes';

  const currentNote = notes[activeKey] || {
    targetId: activeKey,
    targetType: activeTab === 'slide' ? 'slide' : activeTab === 'topic' ? 'mind_map_node' : 'project',
    title: activeTitle,
    content: '',
    isPrivate: true,
    updatedAt: Date.now(),
  };

  const [textContent, setTextContent] = useState(currentNote.content);

  const handleTabSwitch = (tab: 'slide' | 'topic' | 'project') => {
    setActiveTab(tab);
    const key =
      tab === 'slide'
        ? currentSlideKey
        : tab === 'topic'
        ? currentTopicKey
        : currentProjectKey;
    setTextContent(notes[key]?.content || '');
  };

  const handleSave = () => {
    onSaveNote({
      ...currentNote,
      targetId: activeKey,
      content: textContent,
      updatedAt: Date.now(),
    });
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 1500);
  };

  return (
    <div
      id="teacher-notes-drawer"
      className="absolute bottom-20 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-40 overflow-hidden flex flex-col max-h-[75vh] animate-in fade-in slide-in-from-bottom-5 duration-150 select-none"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-amber-50/60 dark:bg-slate-850 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500 text-white rounded-lg">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>Private Teacher Notes</span>
              <Lock className="w-3 h-3 text-amber-600" />
            </h4>
            <span className="text-[10px] text-slate-500">
              Only visible to you — strictly hidden from students
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scope Tabs */}
      <div className="flex items-center border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 pt-2 gap-1 text-xs">
        <button
          onClick={() => handleTabSwitch('slide')}
          className={`px-3 py-1.5 font-bold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
            activeTab === 'slide'
              ? 'border-amber-600 text-amber-700 dark:text-amber-400 bg-white dark:bg-slate-800'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Current Slide ({activeSlideIndex + 1})
        </button>
        <button
          onClick={() => handleTabSwitch('topic')}
          className={`px-3 py-1.5 font-bold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
            activeTab === 'topic'
              ? 'border-amber-600 text-amber-700 dark:text-amber-400 bg-white dark:bg-slate-800'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Selected Topic
        </button>
        <button
          onClick={() => handleTabSwitch('project')}
          className={`px-3 py-1.5 font-bold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
            activeTab === 'project'
              ? 'border-amber-600 text-amber-700 dark:text-amber-400 bg-white dark:bg-slate-800'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Lesson Overview
        </button>
      </div>

      {/* Notes Textarea */}
      <div className="p-4 flex-1 flex flex-col space-y-3">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          <span>{activeTitle}</span>
          {savedBadge && (
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>

        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Write your private teaching notes, pacing reminders, student questions, or formulas here..."
          rows={10}
          className="flex-1 w-full p-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
        />

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => {
              onDeleteNote(activeKey);
              setTextContent('');
            }}
            title="Clear note for this section"
            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Private Note</span>
          </button>
        </div>
      </div>
    </div>
  );
};
