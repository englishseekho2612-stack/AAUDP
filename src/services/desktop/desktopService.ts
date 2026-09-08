import { ElectronAppInfo, ElectronAppPaths, ElectronFileInfo, ElectronOpenDialogOptions } from '../../types/electron';

/**
 * Desktop Integration Service
 * Seamlessly abstracts Electron native capabilities with graceful Web/Capacitor fallbacks.
 */

export class DesktopService {
  /**
   * Check whether the application is running inside Electron desktop shell
   */
  public static isElectron(): boolean {
    return typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron);
  }

  /**
   * Check whether running on Windows OS
   */
  public static isWindows(): boolean {
    if (this.isElectron()) {
      return window.electronAPI?.platform === 'win32';
    }
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent.includes('Windows');
    }
    return false;
  }

  /**
   * Request native Windows file picker dialog
   */
  public static async pickFiles(options?: ElectronOpenDialogOptions): Promise<ElectronFileInfo[] | null> {
    if (this.isElectron() && window.electronAPI?.openFileDialog) {
      return await window.electronAPI.openFileDialog(options);
    }
    return null;
  }

  /**
   * Prompt user to save a file natively
   */
  public static async promptSaveFile(options?: {
    title?: string;
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }): Promise<string | null> {
    if (this.isElectron() && window.electronAPI?.saveFileDialog) {
      return await window.electronAPI.saveFileDialog(options);
    }
    return null;
  }

  /**
   * Save an export file directly into the application's Exports folder
   */
  public static async saveExportFile(
    filename: string,
    data: string,
    encoding: 'utf8' | 'base64' = 'utf8',
    targetFolder: 'exports' | 'recordings' | 'backups' | 'projects' = 'exports'
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    if (this.isElectron() && window.electronAPI?.saveExportFile) {
      return await window.electronAPI.saveExportFile({
        filename,
        data,
        encoding,
        targetFolder,
      });
    }

    // Web fallback: download as Blob
    try {
      const mimeType = encoding === 'base64' ? 'application/octet-stream' : 'application/json';
      let blob: Blob;
      if (encoding === 'base64') {
        const byteCharacters = atob(data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
      } else {
        blob = new Blob([data], { type: mimeType });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Download failed' };
    }
  }

  /**
   * Open user data or specific storage folder in Windows File Explorer
   */
  public static async openDataFolder(folder: 'userData' | 'projects' | 'recordings' | 'exports' | 'backups' = 'userData'): Promise<boolean> {
    if (this.isElectron() && window.electronAPI?.openDataFolder) {
      return await window.electronAPI.openDataFolder(folder);
    }
    return false;
  }

  /**
   * Safely open external link in system default browser
   */
  public static openExternal(url: string): void {
    if (this.isElectron() && window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Retrieve storage paths
   */
  public static async getAppPaths(): Promise<ElectronAppPaths | null> {
    if (this.isElectron() && window.electronAPI?.getAppPaths) {
      return await window.electronAPI.getAppPaths();
    }
    return null;
  }

  /**
   * Retrieve application metadata
   */
  public static async getAppInfo(): Promise<ElectronAppInfo | null> {
    if (this.isElectron() && window.electronAPI?.getAppInfo) {
      return await window.electronAPI.getAppInfo();
    }
    return null;
  }

  // Window Controls
  public static minimizeWindow(): void {
    if (this.isElectron()) window.electronAPI?.minimizeWindow();
  }

  public static maximizeWindow(): void {
    if (this.isElectron()) window.electronAPI?.maximizeWindow();
  }

  public static closeWindow(): void {
    if (this.isElectron()) window.electronAPI?.closeWindow();
  }

  public static async toggleFullscreen(): Promise<boolean> {
    if (this.isElectron() && window.electronAPI?.toggleFullscreen) {
      return await window.electronAPI.toggleFullscreen();
    }
    return false;
  }
}
