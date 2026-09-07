# Changelog
All notable changes to **ARPIT ACADEMY UDAIPURA** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-07

### Added
- **Information Architecture & Unified Navigation**: Streamlined sidebar into distinct functional tiers (Studio & Teaching, Academy Management, System & Diagnostics).
- **Mobile-Adaptive Bottom Navigation**: Optimized 5-destination bottom navigation bar for mobile and Android devices with 48px touch targets.
- **Graceful Error Isolation**: Added `ErrorBoundary` component to isolate module failures and provide recovery actions without interrupting the user session.
- **Gradebook & Analytics CSV Export**: Added one-click export for student assignment submissions, quiz attempt performance, and AI analysis reports.
- **Web App Manifest**: Added `manifest.webmanifest` and mobile meta tags in `index.html` for standalone Progressive Web App (PWA) installation.
- **CI/CD Pipeline Configuration**: Created `codemagic.yaml` with automated workflows for web production and Android release builds.
- **Comprehensive Documentation**: Added architecture guides, development instructions, and security best practices across `README.md` and `docs/`.

### Changed
- **Unified Brand Identity**: Standardized application branding across `index.html`, `metadata.json`, and header bars to "ARPIT ACADEMY UDAIPURA - Learn • Teach • Understand. With Arpit Sir".
- **Refined View Routing**: Cleaned view orchestration in `App.tsx`, resolving unreachable full-screen modal branches.
- **Enhanced Data Resilience**: Verified IndexedDB engines with automatic localStorage fallback for projects, curriculum records, and media blob storage.

### Fixed
- **Navigation Duplication**: Fixed repetitive navigation triggers across views and eliminated cluttered horizontal overflows on small screens.
- **Mobile Touch Density**: Fixed button spacing and touch target sizing across the bottom navigation bar.

### Security
- **Server-Side API Proxying**: Verified zero client exposure for secret API keys; all external intelligence calls are handled via backend routes.
- **Production Ignored Files**: Hardened `.gitignore` to prevent leaking secrets, credentials, IDE settings, and build artifacts.
