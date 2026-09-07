# ARPIT ACADEMY UDAIPURA
> **Learn • Teach • Understand. With Arpit Sir.**

A complete, production-ready AI Teaching Studio, Curriculum Management Suite, Interactive Live Classroom, and Student Portal designed for modern educators and students.

---

## 📖 Overview

**Arpit Academy Udaipura** delivers an all-in-one educational platform engineered for teachers to plan, create, present, and evaluate learning experiences seamlessly.

### Core Modules
1. **Teaching Studio**: Interactive teaching canvas, live camera/mic presentation, synchronized teacher teleprompter, real-time drawing whiteboard, and AI-assisted lesson generation.
2. **Projects & Workspace**: Structured academic project organization with instant AI generation for lesson plans, mind maps, flashcards, quizzes, and slide decks.
3. **Curriculum Hub**: Multi-course, subject, chapter, and topic management with question banks, revision planners, and assessment tracking.
4. **Interactive Classroom Hub**: Live session hosting with unique 6-character room codes, attendee rosters, doubt queues, and synchronized student viewports.
5. **Student Portal & Classroom View**: Clean student interface for attending live classes, submitting assignments, taking formative quizzes, and accessing course revision materials.
6. **AI Video Studio**: Educational video editor with timeline trimming, chapter markers, title overlays, and multi-format export.
7. **Storage & Diagnostics**: Local-first IndexedDB persistence with localStorage fallback, automated backups, and real-time system health checks.

---

## 🏗️ Architecture

```
arpit-academy/
├── public/                  # Static assets (logo.svg, manifest.webmanifest)
├── src/
│   ├── components/          # Reusable UI & specialized modules
│   │   ├── classroom/       # Live classroom broadcasting & whiteboard
│   │   ├── common/          # Navigation (Sidebar, BottomNav, AppBar), ErrorBoundary
│   │   ├── curriculum/      # Course management, assessments & gradebook
│   │   ├── dashboard/       # Project dashboard & AI viewers (MindMap, Slides)
│   │   ├── portal/          # Student portal & practice modules
│   │   └── studio/          # Teacher presentation controls & teleprompter
│   ├── context/             # React contexts (ProjectContext, ThemeContext)
│   ├── services/            # Gemini API, audio, video, classroom & logging services
│   ├── storage/             # IndexedDB & LocalStorage repositories
│   ├── types/               # TypeScript type definitions
│   ├── views/               # Primary screen views
│   ├── App.tsx              # Central view orchestration & ErrorBoundary
│   └── main.tsx             # Application bootstrap
├── docs/                    # Architecture, setup, security & release guides
├── server.ts                # Express backend with Vite middleware & Gemini proxy
├── codemagic.yaml           # CI/CD pipeline for web & Android builds
└── package.json             # Dependencies, scripts, and build configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Gemini API Key**: (Optional, for AI generation features)

### Installation

1. **Clone or open the workspace:**
   ```bash
   cd arpit-academy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key (optional for local offline mode):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

---

## 🛠️ Build & Verification

- **Typecheck & Lint:**
  ```bash
  npm run lint
  ```
- **Production Web Build:**
  ```bash
  npm run build
  ```
- **Production Server Start:**
  ```bash
  npm start
  ```

---

## 📱 Android Build Pipeline

This project is built with standard responsive design, touch-friendly navigation, and PWA compliance, ready for packaging into an Android APK or AAB via Capacitor or Android Studio WebView:

1. **Build Web Assets:**
   ```bash
   npm run build
   ```
2. **Capacitor Synchronization (if configured):**
   ```bash
   npx cap sync android
   ```
3. **Compile Release Artifacts:**
   ```bash
   cd android && ./gradlew assembleRelease bundleRelease
   ```
   Artifacts are located in:
   - APK: `android/app/build/outputs/apk/release/`
   - AAB: `android/app/build/outputs/bundle/release/`

---

## 🔒 Security & Offline Resilience

- **Zero-Secret Client Exposure**: All Gemini AI generation calls are routed strictly via server-side endpoints (`/api/gemini/*`). No API keys are bundled into frontend assets.
- **Local-First Data Persistence**: Projects and curriculum data are stored in browser IndexedDB with automatic localStorage fallback and full JSON import/export backup mechanisms.
- **Fault-Tolerant UI**: Critical views are wrapped in React `ErrorBoundary` handlers to isolate errors without crashing the session.

---

## 📄 License & Ownership
Copyright © 2026 Arpit Academy Udaipura. All rights reserved.
