# AI Teaching Studio — Windows Desktop Software Guide

This document explains how to build, run, and package the **AI Teaching Studio** as a professional native Windows desktop application.

---

## Architecture Overview

The desktop version runs inside an **Electron shell** with strict security isolation (`nodeIntegration: false`, `contextIsolation: true`) and a high-performance Express server bundled with `esbuild`.

- **Web Frontend**: React 18, Vite 5, Tailwind CSS, Lucide icons, Motion animations.
- **Backend Service**: Express 4 bundled into CommonJS `dist/server.cjs`, providing Gemini API proxying, Server-Sent Events (SSE) for classroom synchronization, and offline capabilities.
- **Desktop Shell**: Electron (`electron/main.cjs`) managing window lifecycle, dynamic server port assignment, native Windows file pickers, and OS integrations.
- **Native Bridge**: Secure `electronAPI` (`electron/preload.cjs`) exposing native open/save dialogs, window controls (Minimize, Maximize, Fullscreen, Close), and Windows File Explorer shortcuts.
- **Data Privacy**: Strictly local data isolation with **Cloud Sync: NO** by default. Projects, audio recordings, exports, and databases reside in `%APPDATA%\AI Teaching Studio\`.

---

## Prerequisites

- **Windows 10 / 11** (64-bit or ARM64)
- **Node.js** v18.x or v20.x LTS
- **npm** v9 or v10

---

## Development Mode

To run the application in Electron with live reload:

```bash
# 1. Install dependencies
npm install

# 2. Start the Vite dev server and launch the Electron desktop window
npm run electron:dev
```

This launches the native desktop window connected to the Vite dev server.

---

## Building the Windows Installer & Executables

To compile the web assets, bundle the backend server, and build the Windows installer:

```bash
# Full Windows packaging (generates NSIS Setup .exe and Portable .exe)
npm run electron:build:win
```

### Output Artifacts

The compiled Windows binaries are generated in the `dist_electron/` directory:

1. **NSIS Installer**: `AI-Teaching-Studio-Setup-1.0.0.exe`
   - Custom installation directory picker
   - Desktop and Start Menu shortcut creation
   - Clean uninstaller registered in Windows Add/Remove Programs
2. **Portable Executable**: `AI-Teaching-Studio-1.0.0-portable.exe`
   - Runs directly without installation or administrator privileges.
   - Ideal for USB drives and school lab computers.

---

## Automated CI/CD (GitHub Actions)

A ready-to-use GitHub Actions workflow is provided at `.github/workflows/build-windows.yml`.

Whenever you push to `main` or push a release tag (e.g. `v1.0.0`), the workflow automatically:
1. Boots a clean `windows-latest` virtual runner.
2. Installs dependencies and runs `npm run build`.
3. Packages the Windows executables with `electron-builder`.
4. Uploads the installers as downloadable GitHub Actions artifacts.

---

## Native Windows Desktop Capabilities

1. **Custom Windows Titlebar**:
   - Modern dark title bar matching Windows 11 aesthetics.
   - Drag region, Minimize, Maximize/Restore, Fullscreen (F11), and Close controls.
2. **Native File Picker**:
   - Uses Windows File Dialog for opening course materials (PDF, Word DOCX, PowerPoint PPTX, Images) with preview thumbnails and quick access bookmarks.
3. **Data Folder Shortcuts**:
   - Open App Data, Projects, Recordings, Exports, and Backups folders directly in Windows File Explorer via the Settings view.
4. **Local Hardware Access**:
   - Microphone, camera, and display capture permissions are granted seamlessly without browser URL prompts.
5. **Multiplatform Integrity**:
   - The same codebase remains 100% compatible with Web browsers and Android (Capacitor).
