/**
 * AI Presentation Designer Plan Viewer
 * Section 20: Displays pedagogical presentation lesson plan, slide phases,
 * and seamlessly embeds or links to the Presentation slide deck.
 */

import React from 'react';
import { Palette, Presentation, Clock, Users, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { PresentationContent } from '../../types/ai';
import { ProjectAIOutput, SupportedLanguage } from '../../types/project';
import { Button } from '../common/UIControls';
import { PresentationViewer } from './PresentationViewer';

export interface PresentationDesignerPlanViewerProps {
  output: ProjectAIOutput<PresentationContent>;
  language: SupportedLanguage;
  onSaveTeacherEdits: (editedContent: PresentationContent) => void;
  onRestoreAI: () => void;
  onSwitchView: (view: 'ai' | 'teacher' | 'split') => void;
}

export const PresentationDesignerPlanViewer: React.FC<PresentationDesignerPlanViewerProps> = ({
  output,
  language,
  onSaveTeacherEdits,
  onRestoreAI,
  onSwitchView,
}) => {
  return (
    <div className="space-y-6">
      {/* Lesson Design Architecture Overview Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-900 via-blue-900 to-indigo-950 text-white shadow-md">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              AI Lesson & Slide Architecture
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-400/30 font-semibold">
                Pedagogical Designer Plan
              </span>
            </h3>
            <p className="text-xs text-cyan-200/80">
              Structured instructional sequence designed to maximize classroom engagement and student retention.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-cyan-800/60 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Duration: {output.rawAiContent?.estimatedDurationMinutes || 30} mins</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Target: {output.rawAiContent?.targetAudience || 'Students'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Presentation className="w-4 h-4 text-cyan-400" />
            <span>Slides: {output.rawAiContent?.slides?.length || 0} instructional slides</span>
          </div>
        </div>
      </div>

      {/* Embedded Presentation Viewer */}
      <PresentationViewer
        output={output}
        language={language}
        onSaveTeacherEdits={onSaveTeacherEdits}
        onRestoreAI={onRestoreAI}
        onSwitchView={onSwitchView}
      />
    </div>
  );
};
