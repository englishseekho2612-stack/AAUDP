/**
 * LOCAL PROJECT BACKUP & RESTORE SERVICE (Section 22)
 * Creates comprehensive portable JSON backup archives containing:
 * - Project metadata
 * - Learning sources & extracted texts
 * - AI Output versions (Mind Map, Slides, Notes, Quiz, Audio/Video)
 * - Multi-track timeline edits & decision history
 * - Captions & chapter markers
 * - Whiteboard annotations
 * 
 * Strict local-first operation: No automatic cloud upload.
 */

import { TeachingProject } from '../../types/project';
import { TimelineProjectState } from '../../types/editor';
import { projectRepository } from '../../storage/projectRepository';

export interface ProjectBackupPackage {
  manifestVersion: '1.0';
  exportedAt: number;
  appVersion: 'AI Teaching Studio 6.0';
  project: TeachingProject;
  timeline?: TimelineProjectState;
  checksum: string;
}

export class BackupService {
  /**
   * Export complete project backup package as a downloadable JSON file
   */
  exportProjectBackup(project: TeachingProject, timeline?: TimelineProjectState): void {
    const backupData: ProjectBackupPackage = {
      manifestVersion: '1.0',
      exportedAt: Date.now(),
      appVersion: 'AI Teaching Studio 6.0',
      project,
      timeline,
      checksum: this.generateSimpleChecksum(project.id + project.updatedTimestamp),
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const safeTitle = (project.name || 'Lesson_Project').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${safeTitle}_Backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Parse and validate an uploaded backup file
   */
  async parseBackupFile(file: File): Promise<ProjectBackupPackage> {
    const text = await file.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Invalid JSON file format.');
    }

    if (!data.manifestVersion || !data.project || !data.project.id || !data.project.name) {
      throw new Error('Unrecognized project backup format. Required manifest fields are missing.');
    }

    return data as ProjectBackupPackage;
  }

  /**
   * Restore a project from a backup package
   */
  async restoreProject(pkg: ProjectBackupPackage): Promise<TeachingProject> {
    const restoredProject: TeachingProject = {
      ...pkg.project,
      id: `proj_restored_${Date.now()}`,
      name: `${pkg.project.name} (Restored)`,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      lastOpenedTimestamp: Date.now(),
    };

    await projectRepository.update(restoredProject);
    return restoredProject;
  }

  private generateSimpleChecksum(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

export const backupService = new BackupService();
