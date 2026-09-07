# Environment Setup & Development Guide

This guide details how to set up the local environment, install dependencies, configure API keys, and run **ARPIT ACADEMY UDAIPURA** for development and production testing.

---

## 1. System Requirements
- **Node.js**: v18.0.0 or later (v20 LTS recommended)
- **Package Manager**: npm v9+ (or yarn / pnpm)
- **Modern Web Browser**: Chrome, Edge, Firefox, or Safari (supporting IndexedDB and WebRTC MediaDevices)

---

## 2. Step-by-Step Setup

### Step 1: Clone or Open Project Directory
```bash
git clone <repository-url>
cd arpit-academy
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a local `.env` file from the example:
```bash
cp .env.example .env
```
Fill in the following variables:
```env
# Server-side Gemini API Key (keep secret, never prefix with VITE_)
GEMINI_API_KEY=your_gemini_api_key_here

# Port configuration (Standard container port 3000)
PORT=3000
```

### Step 4: Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 3. Available NPM Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Boots Express backend with live Vite middleware on port 3000 |
| `npm run build` | Compiles client assets (`vite build`) and bundles server (`esbuild`) |
| `npm start` | Runs the compiled production server (`node dist/server.cjs`) |
| `npm run lint` | Runs ESLint typechecking and syntax validation |

---

## 4. Verification & Health Checks
After starting the development server:
1. Navigate to `http://localhost:3000/api/health` to confirm the backend responds with `{ "status": "ok" }`.
2. Visit the in-app **System Diagnostic** view (via sidebar) to run automated checks for:
   - IndexedDB Read/Write availability
   - MediaDevices (Camera/Microphone permissions)
   - AudioContext initialization
   - Server connectivity
