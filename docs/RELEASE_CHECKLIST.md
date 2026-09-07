# Production Release Checklist

Before tagging or deploying a production release of **ARPIT ACADEMY UDAIPURA**, complete this verification checklist.

---

## 1. Code Quality & Compilation
- [x] Run `npm run lint` and verify zero errors or warnings.
- [x] Run `npm run build` and verify production client and server bundles build without warnings.
- [x] Verify no console errors or uncaught promise rejections on initial load.

---

## 2. Branding & Metadata
- [x] Verify application name is "ARPIT ACADEMY UDAIPURA".
- [x] Verify tagline "Learn • Teach • Understand. With Arpit Sir" appears in headers, meta tags, and documentation.
- [x] Verify `metadata.json` matches `<title>` and `<meta name="description">` in `index.html`.
- [x] Verify `manifest.webmanifest` is valid and linked in `index.html`.

---

## 3. Navigation & Responsive Ergonomics
- [x] Desktop Sidebar functions cleanly across all 3 functional groups.
- [x] Mobile Bottom Navigation displays 5 touch-friendly destinations with minimum 48px touch targets.
- [x] Top AppBar displays active breadcrumb, back buttons when inside projects/views, and quick theme toggle.
- [x] All modal sheets, slide-outs, and full-screen views (Student Classroom, Video Editor) dismiss reliably.

---

## 4. Feature Workflows
- [x] **Project Creation**: Create a new project, verify auto-generation of mind map, slides, and flashcards.
- [x] **Teaching Studio**: Open studio, toggle camera/mic controls, test whiteboard canvas, teleprompter speed, and voice command indicators.
- [x] **Classroom Hub**: Create a live session code, join as a student via separate tab or window, test sync and doubt raising.
- [x] **Curriculum Hub**: Browse courses, review question bank, schedule a lesson, and export gradebook CSV.
- [x] **Student Portal**: Take a formative quiz, submit an assignment, check instant feedback.
- [x] **Storage & QA**: Run System Diagnostic checks; all green status confirmed.

---

## 5. Security & Deployment
- [x] No secrets in `.env.example` or git history.
- [x] `.gitignore` covers `.env*`, `dist/`, `build/`, `*.apk`, and `node_modules/`.
- [x] CI/CD configuration `codemagic.yaml` is validated.
- [x] `CHANGELOG.md` reflects current version and changes.
