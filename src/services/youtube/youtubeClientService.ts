/**
 * AI Teaching Studio — YouTube Live Client Service
 * Handles official Google OAuth flow, channel status, live broadcast creation,
 * pre-live system diagnostics, and live chat sync.
 */

import { YouTubeLiveState } from '../../types/classroom';

export interface PreLiveChecklist {
  camera: boolean;
  microphone: boolean;
  network: boolean;
  contentReady: boolean;
  permissionsGranted: boolean;
  youtubeConnected: boolean;
}

class YouTubeClientService {
  async getStatus(): Promise<{
    success: boolean;
    isConfigured: boolean;
    isConnected: boolean;
    channelTitle?: string;
    channelAvatarUrl?: string;
    channelId?: string;
    isLiveStreamEligible: boolean;
    activeBroadcast?: any;
  }> {
    try {
      const res = await fetch('/api/youtube/status');
      return await res.json();
    } catch {
      return {
        success: false,
        isConfigured: false,
        isConnected: false,
        isLiveStreamEligible: false,
      };
    }
  }

  async getAuthUrl(): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const res = await fetch('/api/youtube/auth-url');
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to generate OAuth URL' };
    }
  }

  async connectAccount(): Promise<{ success: boolean; channelTitle?: string; error?: string }> {
    const authRes = await this.getAuthUrl();
    if (!authRes.success || !authRes.url) {
      throw new Error(authRes.error || 'Could not retrieve YouTube OAuth URL.');
    }

    return new Promise((resolve) => {
      // Per OAuth skill: Open the provider's URL directly in popup
      const authWindow = window.open(
        authRes.url,
        'youtube_oauth_popup',
        'width=600,height=720,status=no,toolbar=no,menubar=no'
      );

      if (!authWindow) {
        resolve({
          success: false,
          error: 'Popup was blocked by your browser. Please allow popups for this site.',
        });
        return;
      }

      const messageHandler = async (event: MessageEvent) => {
        // Validate origin
        const origin = event.origin;
        if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
          return;
        }

        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data.provider === 'youtube') {
          window.removeEventListener('message', messageHandler);
          const status = await this.getStatus();
          resolve({
            success: true,
            channelTitle: status.channelTitle,
          });
        } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
          window.removeEventListener('message', messageHandler);
          resolve({
            success: false,
            error: event.data.error || 'YouTube authorization failed.',
          });
        }
      };

      window.addEventListener('message', messageHandler);
    });
  }

  async mockConnect(): Promise<{ success: boolean; channelTitle?: string }> {
    try {
      const res = await fetch('/api/youtube/mock-connect', { method: 'POST' });
      return await res.json();
    } catch {
      return { success: false };
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      const res = await fetch('/api/youtube/disconnect', { method: 'POST' });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }

  async createBroadcast(
    title: string,
    description: string,
    privacyStatus: 'public' | 'unlisted' | 'private' = 'unlisted'
  ): Promise<{ success: boolean; broadcast?: any; error?: string }> {
    try {
      const res = await fetch('/api/youtube/broadcasts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, privacyStatus }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to create broadcast' };
    }
  }

  async transitionBroadcast(
    status: 'live' | 'ended'
  ): Promise<{ success: boolean; broadcast?: any; error?: string }> {
    try {
      const res = await fetch('/api/youtube/broadcasts/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  async getActiveBroadcast(): Promise<any> {
    try {
      const res = await fetch('/api/youtube/broadcasts/active');
      return await res.json();
    } catch {
      return { success: false, active: false };
    }
  }

  async getChatMessages(): Promise<any[]> {
    try {
      const res = await fetch('/api/youtube/chat');
      const data = await res.json();
      return data.success ? data.messages : [];
    } catch {
      return [];
    }
  }

  async sendChatMessage(message: string, author?: string): Promise<any> {
    try {
      const res = await fetch('/api/youtube/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, author }),
      });
      return await res.json();
    } catch {
      return { success: false };
    }
  }

  // Pre-live system checks (Section 46)
  async runPreLiveChecks(hasCamera: boolean, hasMic: boolean): Promise<PreLiveChecklist> {
    const status = await this.getStatus();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    return {
      camera: hasCamera,
      microphone: hasMic,
      network: isOnline,
      contentReady: true,
      permissionsGranted: hasMic || hasCamera,
      youtubeConnected: status.isConnected,
    };
  }
}

export const youtubeService = new YouTubeClientService();
