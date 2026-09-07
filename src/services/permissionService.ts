/**
 * Permission Architecture (Section 23)
 * 
 * Safely manages hardware and browser permissions:
 * - Microphone (for Audio lesson & voice command in Part 04)
 * - Camera (for Teaching Studio teacher cam in Part 04)
 * - Screen Capture (for screen share teaching in Part 04)
 * 
 * Critical rule: Does NOT prompt the user on startup; only checks or requests
 * on explicit user interaction.
 */

export type PermissionKind = 'microphone' | 'camera' | 'screen';

export interface PermissionStatusResult {
  kind: PermissionKind;
  state: 'granted' | 'denied' | 'prompt' | 'unsupported';
  error?: string;
}

export class PermissionService {
  async checkPermission(kind: PermissionKind): Promise<PermissionStatusResult> {
    if (typeof navigator === 'undefined') {
      return { kind, state: 'unsupported' };
    }

    if (kind === 'screen') {
      const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
      return { kind, state: supported ? 'prompt' : 'unsupported' };
    }

    if (!navigator.permissions || !navigator.permissions.query) {
      // Fallback: assume prompt if mediaDevices exists
      const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      return { kind, state: supported ? 'prompt' : 'unsupported' };
    }

    try {
      const permissionName = kind as unknown as PermissionName;
      const result = await navigator.permissions.query({ name: permissionName });
      return { kind, state: result.state };
    } catch {
      return { kind, state: 'prompt' };
    }
  }

  async requestPermission(kind: PermissionKind): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      return false;
    }

    try {
      if (kind === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately release tracks
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } else if (kind === 'camera') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } else if (kind === 'screen') {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const permissionService = new PermissionService();
