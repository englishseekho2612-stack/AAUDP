/**
 * Source Engine Integration Contract (Section 9 & Section 35)
 * 
 * Future integration point for PART 02 (Source Engine).
 * Enforces the strict 0 to 5 source ceiling and typed sources:
 * YouTube URL, PDF, DOC/DOCX, PPT/PPTX, Images, Web URL, Text/Notes.
 */

import { LearningSource, SourceType, SourceSegment, AIContextPackage, AIOutputType, TeachingProject } from '../types/project';
import { projectRepository } from '../storage/projectRepository';
import { sourcePipeline } from './sourcePipeline';

export const MAX_SOURCES_PER_PROJECT = 5;

export interface SourceValidationResult {
  valid: boolean;
  error?: string;
}

export interface ISourceEngineContract {
  canAddSource(currentSourcesCount: number): boolean;
  validateSourceInput(type: SourceType, input: string | File): SourceValidationResult;
  getSupportedSourceTypes(): { type: SourceType; label: string; iconName: string; extensions?: string[] }[];
}

export class SourceEngineContract implements ISourceEngineContract {
  canAddSource(currentSourcesCount: number): boolean {
    return currentSourcesCount < MAX_SOURCES_PER_PROJECT;
  }

  validateSourceInput(type: SourceType, input: string | File): SourceValidationResult {
    if (typeof input === 'string' && !input.trim()) {
      return { valid: false, error: 'Source reference or URL cannot be empty.' };
    }

    if (type === 'youtube' && typeof input === 'string') {
      const isYt = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(input.trim());
      if (!isYt) {
        return { valid: false, error: 'Please enter a valid YouTube URL (youtube.com or youtu.be).' };
      }
    }

    if (type === 'web' && typeof input === 'string') {
      try {
        new URL(input.trim());
      } catch {
        return { valid: false, error: 'Please enter a valid Web URL including http:// or https://.' };
      }
    }

    return { valid: true };
  }

  getSupportedSourceTypes() {
    return [
      { type: 'youtube' as SourceType, label: 'YouTube Video', iconName: 'Youtube' },
      { type: 'pdf' as SourceType, label: 'PDF Document', iconName: 'FileText', extensions: ['.pdf'] },
      { type: 'docx' as SourceType, label: 'Word Document', iconName: 'FileSpreadsheet', extensions: ['.doc', '.docx'] },
      { type: 'pptx' as SourceType, label: 'Presentation (PPT)', iconName: 'Presentation', extensions: ['.ppt', '.pptx'] },
      { type: 'image' as SourceType, label: 'Images & Diagrams', iconName: 'Image', extensions: ['.png', '.jpg', '.jpeg', '.webp'] },
      { type: 'web' as SourceType, label: 'Web Article / Link', iconName: 'Globe' },
      { type: 'text' as SourceType, label: 'Text Notes / Transcripts', iconName: 'FileCode' },
    ];
  }
}

export const sourceEngineContract = new SourceEngineContract();

/**
 * Clean interfaces exposed for PART 03 — GEMINI AI ENGINE (Section 50)
 */
export async function getProjectSources(projectId: string): Promise<LearningSource[]> {
  const project = await projectRepository.getById(projectId);
  return project?.sources || [];
}

export async function getSelectedSources(projectId: string, taskId?: AIOutputType): Promise<LearningSource[]> {
  const sources = await getProjectSources(projectId);
  return sources.filter((s) => s.selectedForAI !== false && s.status === 'ready');
}

export async function getNormalizedSourceContext(
  projectId: string,
  taskId?: AIOutputType
): Promise<AIContextPackage | null> {
  const project = await projectRepository.getById(projectId);
  if (!project) return null;
  return sourcePipeline.buildAIContextPackage(project, taskId);
}

export async function getSourceSegments(projectId: string, sourceId: string): Promise<SourceSegment[]> {
  const sources = await getProjectSources(projectId);
  const found = sources.find((s) => s.id === sourceId);
  return found?.segments || [];
}

export async function getSourceReference(
  projectId: string,
  segmentId: string
): Promise<{ source?: LearningSource; segment?: SourceSegment } | null> {
  const sources = await getProjectSources(projectId);
  for (const src of sources) {
    const seg = src.segments?.find((s) => s.segmentId === segmentId);
    if (seg) {
      return { source: src, segment: seg };
    }
  }
  return null;
}

export async function saveTeacherInstruction(projectId: string, instruction: string): Promise<void> {
  const project = await projectRepository.getById(projectId);
  if (!project) return;
  project.teacherInstructions = instruction;
  await projectRepository.update(project);
}

export async function saveSourceSelection(
  projectId: string,
  sourceId: string,
  selected: boolean
): Promise<void> {
  const project = await projectRepository.getById(projectId);
  if (!project) return;
  const target = project.sources.find((s) => s.id === sourceId);
  if (target) {
    target.selectedForAI = selected;
    await projectRepository.update(project);
  }
}
