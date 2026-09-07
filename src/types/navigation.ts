/**
 * Navigation state types for AI Teaching Studio
 */

export type AppView =
  | 'home'
  | 'projects'
  | 'create'
  | 'curriculum'
  | 'student_portal'
  | 'teaching'
  | 'classroom_hub'
  | 'student_classroom'
  | 'video_editor'
  | 'storage_manager'
  | 'system_qa'
  | 'settings'
  | 'project_dashboard';

export interface NavigationState {
  currentView: AppView;
  activeProjectId: string | null;
  selectedOutputModule?: string | null;
  activeClassCode?: string | null;
  studentParticipantId?: string | null;
}
