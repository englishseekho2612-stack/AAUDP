/**
 * Project Repository Layer
 * 
 * Provides an abstract repository contract (IProjectRepository).
 * Decouples storage details from UI and feature logic, allowing
 * cloud sync or remote backup to be added in future versions without
 * altering client or domain logic.
 */

import {
  TeachingProject,
  SupportedLanguage,
  ProjectAIOutput,
  AIOutputType,
  TeachingPreferences,
} from '../types/project';
import { projectDatabase } from './db';
import { blobStorage } from './blobStorage';

export interface CreateProjectDTO {
  name: string;
  subject?: string;
  classGrade?: string;
  language: SupportedLanguage;
}

export interface IProjectRepository {
  getAll(): Promise<TeachingProject[]>;
  getById(id: string): Promise<TeachingProject | null>;
  create(dto: CreateProjectDTO): Promise<TeachingProject>;
  update(project: TeachingProject): Promise<TeachingProject>;
  rename(id: string, newName: string): Promise<TeachingProject>;
  duplicate(id: string): Promise<TeachingProject>;
  delete(id: string): Promise<boolean>;
  getStorageUsage(): Promise<{ projectCount: number; dataSizeBytes: number; mediaSizeBytes: number }>;
}

export const DEFAULT_TEACHING_PREFERENCES: TeachingPreferences = {
  cameraEnabledDefault: false,
  echoCancellation: true,
  noiseSuppression: true,
  voiceClarityBoost: true,
  defaultWhiteboardTheme: 'dark',
  studentChatMode: 'teacher_only',
};

function createInitialOutput(type: AIOutputType, title: string, lang: SupportedLanguage): ProjectAIOutput {
  return {
    id: `out_${type}_${Date.now()}`,
    type,
    title,
    status: 'not_started',
    targetLanguage: lang,
    rawAiContent: null,
    teacherEditedContent: null,
    activeView: 'ai',
    versionHistory: [],
  };
}

export function buildNewProjectTemplate(dto: CreateProjectDTO): TeachingProject {
  const now = Date.now();
  const id = `proj_${now}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id,
    name: dto.name.trim(),
    subject: dto.subject?.trim() || undefined,
    classGrade: dto.classGrade?.trim() || undefined,
    language: dto.language,
    createdTimestamp: now,
    updatedTimestamp: now,
    lastOpenedTimestamp: now,
    sources: [], // 0/5 sources initially
    outputs: {
      mind_map: createInitialOutput('mind_map', 'Interactive Mind Map', dto.language),
      slides: createInitialOutput('slides', 'Presentation Slides', dto.language),
      notes: createInitialOutput('notes', 'Study Notes & Summary', dto.language),
      audio: createInitialOutput('audio', 'Audio Lesson', dto.language),
      video: createInitialOutput('video', 'Instructional Video', dto.language),
      quiz: createInitialOutput('quiz', 'Quiz & Assessment', dto.language),
      presentation_designer: createInitialOutput('presentation_designer', 'AI Presentation Designer Plan', dto.language),
      topic_explanation: createInitialOutput('topic_explanation', 'Topic Deep Explanation', dto.language),
    },
    teachingPreferences: { ...DEFAULT_TEACHING_PREFERENCES },
    schemaVersion: 1,
  };
}

class LocalProjectRepository implements IProjectRepository {
  async getAll(): Promise<TeachingProject[]> {
    return projectDatabase.getAllProjects();
  }

  async getById(id: string): Promise<TeachingProject | null> {
    return projectDatabase.getProjectById(id);
  }

  async create(dto: CreateProjectDTO): Promise<TeachingProject> {
    const newProj = buildNewProjectTemplate(dto);
    await projectDatabase.saveProject(newProj);
    return newProj;
  }

  async update(project: TeachingProject): Promise<TeachingProject> {
    const updated = {
      ...project,
      updatedTimestamp: Date.now(),
    };
    await projectDatabase.saveProject(updated);
    return updated;
  }

  async rename(id: string, newName: string): Promise<TeachingProject> {
    const project = await projectDatabase.getProjectById(id);
    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }

    const updated: TeachingProject = {
      ...project,
      name: newName.trim(),
      updatedTimestamp: Date.now(),
    };
    await projectDatabase.saveProject(updated);
    return updated;
  }

  async duplicate(id: string): Promise<TeachingProject> {
    const original = await projectDatabase.getProjectById(id);
    if (!original) {
      throw new Error(`Project with ID ${id} not found`);
    }

    const now = Date.now();
    const newId = `proj_${now}_${Math.random().toString(36).substring(2, 7)}`;

    // Create a fresh clone with new IDs
    const duplicateProject: TeachingProject = {
      ...original,
      id: newId,
      name: `${original.name} (Copy)`,
      createdTimestamp: now,
      updatedTimestamp: now,
      lastOpenedTimestamp: now,
      // Deep clone sources (metadata references)
      sources: original.sources.map((s) => ({
        ...s,
        id: `src_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        projectId: newId,
        createdTimestamp: now,
        updatedTimestamp: now,
      })),
      // Clone outputs
      outputs: {
        mind_map: { ...original.outputs.mind_map, id: `out_mm_${now}` },
        slides: { ...original.outputs.slides, id: `out_sl_${now}` },
        notes: { ...original.outputs.notes, id: `out_nt_${now}` },
        audio: { ...original.outputs.audio, id: `out_au_${now}` },
        video: { ...original.outputs.video, id: `out_vi_${now}` },
        quiz: { ...original.outputs.quiz, id: `out_qz_${now}` },
      },
    };

    await projectDatabase.saveProject(duplicateProject);
    return duplicateProject;
  }

  async delete(id: string): Promise<boolean> {
    // Delete any associated binary blobs first
    await blobStorage.deleteBlobsForProject(id);
    // Delete the structured project document
    return projectDatabase.deleteProject(id);
  }

  async getStorageUsage(): Promise<{ projectCount: number; dataSizeBytes: number; mediaSizeBytes: number }> {
    const dbStats = await projectDatabase.getStorageStats();
    const mediaBytes = await blobStorage.getTotalStorageUsageBytes();
    return {
      projectCount: dbStats.projectCount,
      dataSizeBytes: dbStats.estimatedSizeBytes,
      mediaSizeBytes: mediaBytes,
    };
  }
}

export const projectRepository: IProjectRepository = new LocalProjectRepository();
