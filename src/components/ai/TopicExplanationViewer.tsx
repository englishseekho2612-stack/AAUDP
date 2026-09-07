/**
 * Topic Explanation Viewer & Editor
 * Deep pedagogical breakdown with real-world analogies and misconception corrections.
 */

import React, { useState } from 'react';
import {
  Lightbulb,
  BookOpen,
  AlertTriangle,
  RotateCcw,
  Edit3,
  Save,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { TopicExplanationContent } from '../../types/ai';
import { ProjectAIOutput, SupportedLanguage } from '../../types/project';
import { Button } from '../common/UIControls';

export interface TopicExplanationViewerProps {
  output: ProjectAIOutput<TopicExplanationContent>;
  language: SupportedLanguage;
  onSaveTeacherEdits: (editedContent: TopicExplanationContent) => void;
  onRestoreAI: () => void;
  onSwitchView: (view: 'ai' | 'teacher' | 'split') => void;
}

export const TopicExplanationViewer: React.FC<TopicExplanationViewerProps> = ({
  output,
  language,
  onSaveTeacherEdits,
  onRestoreAI,
  onSwitchView,
}) => {
  const isTeacherEdited = Boolean(output.teacherEditedContent);
  const activeContent: TopicExplanationContent =
    output.activeView === 'ai' || !output.teacherEditedContent
      ? (output.rawAiContent as TopicExplanationContent)
      : (output.teacherEditedContent as TopicExplanationContent);

  const [workingExplanation, setWorkingExplanation] = useState<TopicExplanationContent>(
    JSON.parse(JSON.stringify(activeContent || { topic: 'Topic', coreConcept: '', breakdown: [] }))
  );

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [coreConceptDraft, setCoreConceptDraft] = useState<string>(workingExplanation.coreConcept || '');
  const [takeawayDraft, setTakeawayDraft] = useState<string>(workingExplanation.summaryTakeaway || '');

  React.useEffect(() => {
    if (activeContent) {
      setWorkingExplanation(JSON.parse(JSON.stringify(activeContent)));
      setCoreConceptDraft(activeContent.coreConcept || '');
      setTakeawayDraft(activeContent.summaryTakeaway || '');
    }
  }, [output.activeView, output.lastModifiedAt]);

  if (!activeContent) {
    return (
      <div className="p-12 text-center text-slate-500">
        <Lightbulb className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <p className="font-semibold text-slate-700 dark:text-slate-300">No topic explanation generated yet.</p>
        <p className="text-xs text-slate-400 mt-1">Use "Create with AI" to generate a pedagogical breakdown.</p>
      </div>
    );
  }

  const handleSave = () => {
    const updated: TopicExplanationContent = {
      ...workingExplanation,
      coreConcept: coreConceptDraft,
      summaryTakeaway: takeawayDraft,
    };
    setWorkingExplanation(updated);
    onSaveTeacherEdits(updated);
    setIsEditing(false);
  };

  return (
    <div id="topic-explanation-viewer" className="flex flex-col h-[780px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {workingExplanation.topic}
              {isTeacherEdited ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  Teacher Edited
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                  Original AI Output
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Audience: {workingExplanation.targetAudience} • Grounded Pedagogical Analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isTeacherEdited && (
            <Button size="sm" variant="outline" onClick={onRestoreAI} icon={<RotateCcw className="w-3.5 h-3.5" />}>
              Restore AI
            </Button>
          )}

          <Button
            size="sm"
            variant={isEditing ? 'primary' : 'outline'}
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            icon={isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
          >
            {isEditing ? 'Save Edits' : 'Edit Explanation'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
        {/* Core Concept Banner */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Core Concept Definition
          </span>
          {isEditing ? (
            <textarea
              rows={3}
              value={coreConceptDraft}
              onChange={(e) => setCoreConceptDraft(e.target.value)}
              className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          ) : (
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
              {workingExplanation.coreConcept}
            </p>
          )}
        </div>

        {/* Subtopic Breakdowns & Analogies */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Pedagogical Breakdown & Analogies
          </h4>

          {workingExplanation.breakdown?.map((b, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {idx + 1}. {b.subtopic}
              </h5>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {b.explanation}
              </p>

              {b.realWorldAnalogy && (
                <div className="p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/40 text-xs text-teal-900 dark:text-teal-200 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-[11px] text-teal-800 dark:text-teal-300">
                    💡 Relatable Classroom Analogy:
                  </span>
                  <p className="leading-relaxed italic">{b.realWorldAnalogy}</p>
                </div>
              )}

              {b.sourceReferences && b.sourceReferences.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {b.sourceReferences.map((ref, rIdx) => (
                    <span
                      key={rIdx}
                      className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-semibold"
                    >
                      Source: {ref.sourceName} • {ref.location}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Common Misconceptions */}
        {workingExplanation.commonMisconceptions && workingExplanation.commonMisconceptions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Common Student Misconceptions & Clarifications
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workingExplanation.commonMisconceptions.map((m, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-rose-700 dark:text-rose-400 block text-[11px] uppercase">
                      ❌ Common Error:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">{m.misconception}</p>
                  </div>
                  <div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 block text-[11px] uppercase">
                      ✓ Clarification:
                    </span>
                    <p className="text-slate-600 dark:text-slate-400">{m.correction}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 10: Additional Explanation (Marked Clearly if present) */}
        {workingExplanation.additionalExplanation && (
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              ### Additional Explanation (Beyond Provided Sources)
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {workingExplanation.additionalExplanation}
            </p>
          </div>
        )}

        {/* Summary Takeaway */}
        {workingExplanation.summaryTakeaway && (
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200">
            <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-600 dark:text-indigo-400 block mb-1">
              Key Lesson Takeaway
            </span>
            <p className="font-semibold leading-relaxed">{workingExplanation.summaryTakeaway}</p>
          </div>
        )}
      </div>
    </div>
  );
};
