# Android Build Guide — AI Teaching Studio

This guide details how to build, synchronize, and test the **AI Teaching Studio** application as a real Android application powered by Capacitor.

---

## Architecture Overview

```
React 19 + TypeScript + Tailwind CSS
            ↓ (npm run build)
          dist/ (Production Web Output)
            ↓ (npx cap sync android)
android/app/src/main/assets/public/
            ↓ (Gradle build)
Android APK / Android App Bundle (AAB)
```

The application runs inside a secure, hardware-accelerated Android WebView container using Capacitor (`@capacitor/android`, `@capacitor/app`, `@capacitor/status-bar`).

---

## Prerequisites

- **Node.js**: 22.x LTS (required by Capacitor 8 CLI)
- **JDK**: Java Development Kit 17 (recommended: OpenJDK 17)
- **Android SDK**: Android 14 / 15 (compileSdk 36, targetSdk 36, minSdk 24)
- **Android Studio** (optional, for local emulator and visual debugging)

---

## Local Development Workflow

### 1. Install Project Dependencies
```bash
npm install
```

### 2. Compile Web Application
```bash
npm run build
```
This produces the minified web assets in `dist/`.

### 3. Synchronize Web Assets with Android Platform
```bash
npx cap sync android
```
*(Or use the unified shortcut `npm run android:sync`)*

This command copies web bundle assets to `android/app/src/main/assets/public/` and links all native Capacitor plugins.

---

## Building Android Binaries with Gradle

Navigate to the `android/` directory:
```bash
cd android
```

### Build Debug APK (Direct Testing on Device)
```bash
./gradlew assembleDebug
```
* **Output Path**: `android/app/build/outputs/apk/debug/app-debug.apk`
* **Use Case**: Direct sideloading on Android devices via USB or wireless debugging (`adb install`). No release keystore signing required.

### Build Release APK
```bash
./gradlew assembleRelease
```
* **Output Path**: `android/app/build/outputs/apk/release/app-release-unsigned.apk` (or signed if keystore configured).

### Build Release App Bundle (AAB for Google Play Store)
```bash
./gradlew bundleRelease
```
* **Output Path**: `android/app/build/outputs/bundle/release/app-release.aab`
* **Use Case**: Upload to Google Play Console for Play Store distribution.

---

## Native Permissions Configured

In `android/app/src/main/AndroidManifest.xml`:
- `android.permission.INTERNET` — Network connectivity for AI services, classroom SSE events, and cloud resources.
- `android.permission.CAMERA` — Teacher video input in the Teaching Studio.
- `android.permission.RECORD_AUDIO` — Microphone input for lecture recording and live classroom.
- `android.permission.MODIFY_AUDIO_SETTINGS` — Audio routing (speakerphone, neckband, earbuds, Bluetooth headset).
- `android.permission.READ_MEDIA_IMAGES` / `READ_MEDIA_AUDIO` / `READ_MEDIA_VIDEO` — Source importing and media file selection.

---

## Testing on Device via ADB

1. Enable **Developer Options** and **USB Debugging** on your Android phone.
2. Connect your device to your computer via USB.
3. Install the debug APK:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```
4. Launch **AI Teaching Studio** from your app launcher.
