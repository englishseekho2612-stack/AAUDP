const { app, BrowserWindow, ipcMain, dialog, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');

/**
 * AI Teaching Studio — Windows Desktop Main Process
 * Professional, secure Electron architecture
 */

let mainWindow = null;
let serverProcess = null;
let currentServerPort = 3000;

// Enforce single application instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ---------------------------------------------------------------------------
// 1. Directory Structure Setup (Windows AppData)
// ---------------------------------------------------------------------------
function getAppDirectories() {
  const userData = app.getPath('userData');
  const dirs = {
    userData,
    projects: path.join(userData, 'Projects'),
    recordings: path.join(userData, 'Recordings'),
    exports: path.join(userData, 'Exports'),
    backups: path.join(userData, 'Backups'),
    temp: path.join(userData, 'Temp'),
  };

  // Ensure all application subdirectories exist
  Object.values(dirs).forEach((dir) => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      console.error(`Error creating directory ${dir}:`, err);
    }
  });

  return dirs;
}

// ---------------------------------------------------------------------------
// 2. Window State Persistence
// ---------------------------------------------------------------------------
function getWindowStateFilePath() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWindowState() {
  const defaultState = {
    width: 1366,
    height: 860,
    x: undefined,
    y: undefined,
    isMaximized: false,
  };

  try {
    const stateFile = getWindowStateFilePath();
    if (fs.existsSync(stateFile)) {
      const data = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      return { ...defaultState, ...data };
    }
  } catch {
    // Ignore corrupt state and fallback to default
  }
  return defaultState;
}

function saveWindowState() {
  if (!mainWindow) return;
  try {
    const isMaximized = mainWindow.isMaximized();
    const bounds = mainWindow.getNormalBounds();
    const state = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized,
    };
    fs.writeFileSync(getWindowStateFilePath(), JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save window state:', err);
  }
}

// ---------------------------------------------------------------------------
// 3. Port & Server Management
// ---------------------------------------------------------------------------
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

function checkPortInUse(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startProductionServer(port) {
  process.env.PORT = String(port);
  process.env.NODE_ENV = 'production';

  const bundledServerPath = path.join(__dirname, '..', 'dist', 'server.cjs');
  if (fs.existsSync(bundledServerPath)) {
    try {
      // Require the bundled production server
      require(bundledServerPath);
      console.log(`Production server booted on port ${port}`);
      return true;
    } catch (err) {
      console.error('Error starting bundled server.cjs:', err);
      return false;
    }
  } else {
    console.warn('dist/server.cjs not found; using fallback static hosting');
    return false;
  }
}

// ---------------------------------------------------------------------------
// 4. Create Main Window
// ---------------------------------------------------------------------------
async function createWindow() {
  getAppDirectories();
  const state = loadWindowState();

  const iconPath = path.join(
    __dirname,
    'assets',
    process.platform === 'win32' ? 'icon.ico' : 'icon.png'
  );

  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 1024,
    minHeight: 700,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    title: 'AI Teaching Studio',
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  if (state.isMaximized) {
    mainWindow.maximize();
  }

  // Graceful show on ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Track window state changes
  const notifyWindowState = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send('window:stateChange', {
      isMaximized: mainWindow.isMaximized(),
      isFullscreen: mainWindow.isFullScreen(),
    });
  };

  mainWindow.on('maximize', () => {
    notifyWindowState();
    saveWindowState();
  });
  mainWindow.on('unmaximize', () => {
    notifyWindowState();
    saveWindowState();
  });
  mainWindow.on('enter-full-screen', notifyWindowState);
  mainWindow.on('leave-full-screen', notifyWindowState);
  mainWindow.on('resize', () => saveWindowState());
  mainWindow.on('move', () => saveWindowState());
  mainWindow.on('close', () => saveWindowState());

  // Intercept new window requests (Open external URLs in system browser)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Prevent navigation to unknown remote URLs inside the Electron window
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isLocal =
      url.startsWith('http://localhost') ||
      url.startsWith('http://127.0.0.1') ||
      url.startsWith('file://');
    if (!isLocal) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // -------------------------------------------------------------------------
  // 5. Load Target Application URL
  // -------------------------------------------------------------------------
  const isDev = process.env.ELECTRON_DEV === 'true' || !app.isPackaged;

  if (isDev) {
    // Check if dev server is already running
    const devServerRunning = await checkPortInUse(3000);
    if (devServerRunning) {
      currentServerPort = 3000;
      await mainWindow.loadURL(`http://localhost:3000`);
    } else {
      // Find port and start bundled production build or dev
      currentServerPort = await findAvailablePort(3000);
      await startProductionServer(currentServerPort);
      await mainWindow.loadURL(`http://127.0.0.1:${currentServerPort}`);
    }
  } else {
    // Packaged production mode
    currentServerPort = await findAvailablePort(3000);
    await startProductionServer(currentServerPort);
    await mainWindow.loadURL(`http://127.0.0.1:${currentServerPort}`);
  }
}

// ---------------------------------------------------------------------------
// 6. Native Media Permissions Handling (Camera & Microphone)
// ---------------------------------------------------------------------------
function setupMediaPermissions() {
  const allowedPermissions = ['media', 'mediaKeySystem', 'notifications', 'fullscreen'];

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    return allowedPermissions.includes(permission);
  });
}

// ---------------------------------------------------------------------------
// 7. Controlled IPC Handlers
// ---------------------------------------------------------------------------
function setupIPCHandlers() {
  // Window controls
  ipcMain.handle('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.handle('window:toggleFullscreen', () => {
    if (!mainWindow) return false;
    const nextState = !mainWindow.isFullScreen();
    mainWindow.setFullScreen(nextState);
    return nextState;
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  ipcMain.handle('window:isFullscreen', () => {
    return mainWindow ? mainWindow.isFullScreen() : false;
  });

  // Native Open File Dialog
  ipcMain.handle('dialog:openFile', async (_event, options = {}) => {
    if (!mainWindow) return null;
    const defaultFilters = [
      {
        name: 'All Supported Educational Media',
        extensions: ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'txt', 'mp4', 'webm', 'mp3', 'wav', 'png', 'jpg', 'jpeg'],
      },
      { name: 'Documents & Presentations', extensions: ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'txt'] },
      { name: 'Video & Audio Recordings', extensions: ['mp4', 'webm', 'mp3', 'wav', 'ogg'] },
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'svg', 'webp'] },
      { name: 'Project Backups (JSON)', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ];

    const result = await dialog.showOpenDialog(mainWindow, {
      title: options.title || 'Select Learning Sources or Project Files',
      properties: options.properties || ['openFile'],
      filters: options.filters || defaultFilters,
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return null;
    }

    // Read metadata and content for selected files
    const fileData = await Promise.all(
      result.filePaths.map(async (filePath) => {
        const stats = await fs.promises.stat(filePath);
        const name = path.basename(filePath);
        const ext = path.extname(filePath).toLowerCase().replace('.', '');
        let buffer;
        try {
          buffer = await fs.promises.readFile(filePath);
        } catch {
          buffer = Buffer.alloc(0);
        }

        return {
          path: filePath,
          name,
          extension: ext,
          sizeBytes: stats.size,
          lastModified: stats.mtimeMs,
          base64: buffer.toString('base64'),
        };
      })
    );

    return fileData;
  });

  // Native Save File Dialog
  ipcMain.handle('dialog:saveFile', async (_event, options = {}) => {
    if (!mainWindow) return null;
    const result = await dialog.showSaveDialog(mainWindow, {
      title: options.title || 'Save File',
      defaultPath: options.defaultPath,
      filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    return result.filePath;
  });

  // Safe file export write
  ipcMain.handle('fs:saveExportFile', async (_event, { filename, data, encoding = 'utf8', targetFolder = 'exports' }) => {
    try {
      const dirs = getAppDirectories();
      const baseDir = dirs[targetFolder] || dirs.exports;
      const safeFilename = (filename || `Export_${Date.now()}`).replace(/[\\/:*?"<>|]/g, '_');
      const targetPath = path.join(baseDir, safeFilename);

      if (encoding === 'base64') {
        const buffer = Buffer.from(data, 'base64');
        await fs.promises.writeFile(targetPath, buffer);
      } else {
        await fs.promises.writeFile(targetPath, data, 'utf8');
      }

      return { success: true, filePath: targetPath };
    } catch (err) {
      console.error('Error in fs:saveExportFile:', err);
      return { success: false, error: err.message };
    }
  });

  // Safe file read
  ipcMain.handle('fs:readImportFile', async (_event, { filePath }) => {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File does not exist' };
      }
      const data = await fs.promises.readFile(filePath, 'utf8');
      return { success: true, content: data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Storage directories query
  ipcMain.handle('storage:getAppPaths', () => {
    return getAppDirectories();
  });

  // Open Data Folder in Windows File Explorer
  ipcMain.handle('shell:openDataFolder', async (_event, folderType = 'userData') => {
    const dirs = getAppDirectories();
    const targetDir = dirs[folderType] || dirs.userData;
    if (fs.existsSync(targetDir)) {
      await shell.openPath(targetDir);
      return true;
    }
    return false;
  });

  // Shell open path
  ipcMain.handle('shell:openPath', async (_event, targetPath) => {
    if (fs.existsSync(targetPath)) {
      return await shell.openPath(targetPath);
    }
    return 'Path not found';
  });

  // Shell open external link
  ipcMain.handle('shell:openExternal', async (_event, url) => {
    if (typeof url === 'string' && (url.startsWith('http:') || url.startsWith('https:'))) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  });

  // App version & system information
  ipcMain.handle('app:getInfo', () => {
    return {
      name: 'AI Teaching Studio',
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      isPackaged: app.isPackaged,
      chromeVersion: process.versions.chrome,
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      serverPort: currentServerPort,
    };
  });
}

// ---------------------------------------------------------------------------
// 8. Application Lifecycle
// ---------------------------------------------------------------------------
app.whenReady().then(async () => {
  setupMediaPermissions();
  setupIPCHandlers();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  saveWindowState();
});
