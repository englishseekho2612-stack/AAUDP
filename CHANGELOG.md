# Changelog
All notable changes to **ARPIT ACADEMY UDAIPURA** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.2] - 2026-09-08

### Fixed
- **JDK 21 Compatibility for Capacitor 8 & Android SDK 36**: Updated Java environment in `codemagic.yaml` from Java 17 to Java 21, resolving compilation failures caused by target compatibility requirement `JavaVersion.VERSION_21`.
- **SDK 36 Licenses & Platform Availability**: Added automated `sdkmanager` verification step accepting Android SDK licenses and ensuring Android Platform 36 and Build-Tools 36 are installed before building.
- **Gradle Heap Allocation**: Increased `org.gradle.jvmargs` in `android/gradle.properties` from 1536MB to 3072MB with parallel garbage collection to prevent memory exhaustion during Dex/D8 compilation on CI VMs.
- **CI Build Output Readability**: Replaced verbose internal Gradle `--stacktrace` with clean `--console=plain` output so exact build diagnostics are directly readable in Codemagic logs.

---

## [1.1.1] - 2026-09-08

### Fixed
- **Codemagic Capacitor Platform Sync**: Resolved `[error] android platform already exists` during CI/CD execution when `android/` existed in the repository without native wrapper binaries.
- **Automated Platform Re-Scaffolding**: Enhanced `scripts/prepare-android.js` to detect incomplete native folders, cleanly re-scaffolding the Capacitor native project via `fs.rmSync` and `npx cap add android` as instructed by Capacitor CLI.
- **Gradle CI Daemon Optimization**: Added `--no-daemon` to Gradle execution steps in `codemagic.yaml` to ensure reliable builds and prevent background process memory exhaustion on CI virtual machines.
- **Web Bundle Build Check**: Added automatic verification in `prepare-android.js` to ensure `dist/index.html` is compiled before synchronizing web assets to native Android storage.

---

## [1.1.0] - 2026-09-08

### Added
- **Capacitor Native Android Platform**: Added `@capacitor/core`, `@capacitor/android`, `@capacitor/app`, and `@capacitor/status-bar` for hardware-accelerated Android WebView execution.
- **Dedicated Android Source Project**: Created and linked `android/` native project with Gradle 8.14, compileSdk 36, and targetSdk 36.
- **Hardware Back Button Handling**: Added native Android back button event listener to dismiss modals, pop nested views, and prevent accidental app closure.
- **Direct Testing APK Workflow**: Added `android-debug` workflow in `codemagic.yaml` producing standalone `app-debug.apk` without requiring release signing.
- **Google Play AAB Workflow**: Added `android-release` workflow producing `app-release.apk` and `app-release.aab` with Codemagic environment-based keystore signing.
- **Native Android Documentation**: Added `docs/ANDROID_BUILD.md` and `docs/CODEMAGIC_ANDROID.md` detailing step-by-step local building and Codemagic CI/CD deployment.

### Changed
- **Codemagic Node.js Version**: Updated runtime environment in `codemagic.yaml` from `node: 20` to `node: 22` to meet the Capacitor 8 CLI requirement (`NodeJS >= 22.0.0`).
- **Codemagic Artifact Routing**: Removed generic `dist/**` globbing from Android workflows to expose standalone `.apk` and `.aab` binaries as individual, one-click downloads.
- **Status Bar Theming**: Integrated native status bar styling with `#0f172a` slate dark theme on Android devices.

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
