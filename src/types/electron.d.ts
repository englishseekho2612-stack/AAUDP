export interface ElectronFileInfo {
  path: string;
  name: string;
  extension: string;
  sizeBytes: number;
  lastModified: number;
  base64?: string;
}

export interface ElectronAppPaths {
  userData: string;
  projects: string;
  recordings: string;
  exports: string;
  backups: string;
  temp: string;
}

export interface ElectronAppInfo {
  name: string;
  version: string;
  platform: string;
  arch: string;
  isPackaged: boolean;
  chromeVersion: string;
  electronVersion: string;
  nodeVersion: string;
  serverPort: number;
}

export interface ElectronOpenDialogOptions {
  title?: string;
  defaultPath?: string;
  properties?: ('openFile' | 'openDirectory' | 'multiSelections')[];
  filters?: { name: string; extensions: string[] }[];
}

export interface ElectronSaveDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
}

export interface ElectronAPI {
  isElectron: boolean;
  platform: string;

  // Window Controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  toggleFullscreen: () => Promise<boolean>;
  isMaximized: () => Promise<boolean>;
  isFullscreen: () => Promise<boolean>;
  onWindowStateChange: (callback: (state: { isMaximized: boolean; isFullscreen: boolean }) => void) => () => void;

  // Dialogs
  openFileDialog: (options?: ElectronOpenDialogOptions) => Promise<ElectronFileInfo[] | null>;
  saveFileDialog: (options?: ElectronSaveDialogOptions) => Promise<string | null>;

  // File system
  saveExportFile: (params: {
    filename: string;
    data: string;
    encoding?: 'utf8' | 'base64';
    targetFolder?: 'projects' | 'recordings' | 'exports' | 'backups' | 'temp';
  }) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  readImportFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;

  // Paths & Shell
  getAppPaths: () => Promise<ElectronAppPaths>;
  openDataFolder: (folderType?: 'userData' | 'projects' | 'recordings' | 'exports' | 'backups') => Promise<boolean>;
  openPath: (targetPath: string) => Promise<string>;
  openExternal: (url: string) => Promise<boolean>;

  // App Info
  getAppInfo: () => Promise<ElectronAppInfo>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
