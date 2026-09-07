# System Architecture

**ARPIT ACADEMY UDAIPURA** is engineered as a hybrid local-first web application backed by an Express API proxy layer, optimized for both desktop browsers and Android tablet/mobile form factors.

---

## 1. High-Level Architecture Diagram

```
+-------------------------------------------------------------------------+
|                              CLIENT (SPA)                               |
|                                                                         |
|  +-----------------------+  +-------------------+  +-----------------+  |
|  |     Teaching Studio   |  |   Classroom Hub   |  | Student Portal  |  |
|  |  (Canvas, Cam, Promp) |  |   (Rooms, Sync)   |  | (Quizzes, View) |  |
|  +-----------+-----------+  +---------+---------+  +--------+--------+  |
|              |                        |                     |           |
|              +-------------------+----+---------------------+           |
|                                  |                                      |
|               +------------------v------------------+                   |
|               |         React Context Layer         |                   |
|               |  (ProjectContext, ThemeContext)     |                   |
|               +------------------+------------------+                   |
|                                  |                                      |
|         +------------------------+------------------------+             |
|         |                                                 |             |
|  +------v-----------------------+                 +-------v----------+  |
|  |     Storage Services         |                 |  Client Services |  |
|  | - projectRepository (IDB)    |                 | - Audio recorder |  |
|  | - curriculumDatabase (IDB)   |                 | - Teleprompter   |  |
|  | - blobStorage (MediaBlobs)   |                 | - Video renderer |  |
|  | - studentPortalDB (IDB)      |                 +-------+----------+  |
|  +------------------------------+                         |             |
+-----------------------------------------------------------|-------------+
                                                            |
                                        HTTP/JSON (/api/*)  |
                                                            v
+-------------------------------------------------------------------------+
|                           SERVER (Node/Express)                         |
|                                                                         |
|   +-------------------+  +-------------------+  +-------------------+   |
|   |  Vite Middleware  |  |   Gemini Proxy    |  |  YouTube Handler  |   |
|   |   (Development)   |  |  (Server API Key) |  |  (Stream metadata)|   |
|   +-------------------+  +---------+---------+  +-------------------+   |
+------------------------------------|------------------------------------+
                                     |
                                     v
                        +-------------------------+
                        |  Google Gemini API      |
                        +-------------------------+
```

---

## 2. Core Architectural Pillars

### Local-First Persistence
- **Primary Engine**: Browser IndexedDB (`ai_teaching_studio_db`, `ai_teaching_studio_curriculum_db`, `ai_teaching_studio_blobs`).
- **Resilience Strategy**: Automatic in-memory and `localStorage` caching fallback ensures the app operates even in private browsing or constrained iframe sandboxes.
- **Media Separation**: High-resolution recordings and media assets are stored in a dedicated binary object store, preventing bloating of project metadata trees.

### Centralized Routing
- View state is managed via `AppView` in `src/App.tsx`, providing deterministic transitions without the overhead of heavy routing libraries.
- Deep links and direct student joins are handled via class code state (`studentClassCode`).

### Component Hierarchy
- **`Sidebar.tsx`**: Desktop primary navigation with grouped functional destinations.
- **`BottomNav.tsx`**: Mobile-adaptive bottom bar with 5 primary destinations and 48px touch targets.
- **`ErrorBoundary.tsx`**: Component-level fault isolation preventing cascading layout crashes.

### API Security & Secret Segregation
- The client application never receives or stores the `GEMINI_API_KEY`.
- All requests for lesson planning, question generation, and grading analysis route through `POST /api/gemini/*` on the Express server.
