/**
 * Teaching Session Persistence & Crash Recovery Service
 * 
 * Implements:
 * - Session state auto-save (Section 50)
 * - Session recovery on unexpected close (Section 51)
 * - Private Teacher Notes management (Section 7)
 */

import { TeachingSessionRecovery, TeacherNoteEntry } from '../../types/teaching';

const SESSION_RECOVERY_KEY = 'ai_teaching_studio_active_session_recovery';
const TEACHER_NOTES_PREFIX = 'ai_teaching_studio_teacher_notes_';

export class TeachingSessionService {
  /**
   * Auto-save active session state
   */
  saveSession(session: TeachingSessionRecovery): void {
    try {
      localStorage.setItem(SESSION_RECOVERY_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Could not save teaching session recovery state:', e);
    }
  }

  /**
   * Check for an existing unfinished session
   */
  getRecoverableSession(): TeachingSessionRecovery | null {
    try {
      const raw = localStorage.getItem(SESSION_RECOVERY_KEY);
      if (!raw) return null;
      const parsed: TeachingSessionRecovery = JSON.parse(raw);
      // Valid if saved within the last 48 hours
      const now = Date.now();
      if (now - parsed.savedAt < 48 * 60 * 60 * 1000) {
        return parsed;
      }
      this.clearRecoverableSession();
      return null;
    } catch {
      return null;
    }
  }

  clearRecoverableSession(): void {
    try {
      localStorage.removeItem(SESSION_RECOVERY_KEY);
    } catch {
      // Ignore
    }
  }

  // -------------------------------------------------------------------------
  // PRIVATE TEACHER NOTES (Section 7)
  // -------------------------------------------------------------------------
  getTeacherNotesForProject(projectId: string): Record<string, TeacherNoteEntry> {
    try {
      const raw = localStorage.getItem(`${TEACHER_NOTES_PREFIX}${projectId}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  saveTeacherNote(projectId: string, note: TeacherNoteEntry): void {
    try {
      const existing = this.getTeacherNotesForProject(projectId);
      existing[note.targetId] = {
        ...note,
        updatedAt: Date.now(),
      };
      localStorage.setItem(`${TEACHER_NOTES_PREFIX}${projectId}`, JSON.stringify(existing));
    } catch (e) {
      console.warn('Could not save teacher note:', e);
    }
  }

  deleteTeacherNote(projectId: string, targetId: string): void {
    try {
      const existing = this.getTeacherNotesForProject(projectId);
      delete existing[targetId];
      localStorage.setItem(`${TEACHER_NOTES_PREFIX}${projectId}`, JSON.stringify(existing));
    } catch (e) {
      console.warn('Could not delete teacher note:', e);
    }
  }
}

export const teachingSessionService = new TeachingSessionService();
