const { contextBridge, ipcRenderer } = require('electron');

/**
 * Secure Preload Script for AI Teaching Studio
 * Strictly adheres to Electron Security Standards:
 * - contextIsolation: true
 * - nodeIntegration: false
 * - Exposes only validated, controlled IPC bridges to renderer
 */

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,

  // Window State Controls (Minimize, Maximize/Restore, Close, Fullscreen)
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  isFullscreen: () => ipcRenderer.invoke('window:isFullscreen'),

  // Listen for Window State Events
  onWindowStateChange: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('window:stateChange', listener);
    return () => {
      ipcRenderer.removeListener('window:stateChange', listener);
    };
  },

  // Native File Dialogs (File Picker & Save As)
  openFileDialog: (options) => ipcRenderer.invoke('dialog:openFile', options || {}),
  saveFileDialog: (options) => ipcRenderer.invoke('dialog:saveFile', options || {}),

  // File System Operations (Safe Exports, Imports, and Backups)
  saveExportFile: (params) => ipcRenderer.invoke('fs:saveExportFile', params),
  readImportFile: (filePath) => ipcRenderer.invoke('fs:readImportFile', { filePath }),

  // System Paths & Storage Directories
  getAppPaths: () => ipcRenderer.invoke('storage:getAppPaths'),
  openDataFolder: (folderType) => ipcRenderer.invoke('shell:openDataFolder', folderType),
  openPath: (targetPath) => ipcRenderer.invoke('shell:openPath', targetPath),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),

  // Application Info (Version, Environment, Architecture)
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
});
