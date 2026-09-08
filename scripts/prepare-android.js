#!/usr/bin/env node

/**
 * scripts/prepare-android.js
 *
 * Ensures the native Android platform is present, configured with required
 * permissions and signing configurations, and synchronized with the latest
 * web bundle.
 *
 * Works in both scenarios:
 * 1. android/ is committed in git.
 * 2. android/ is absent (fresh CI clone) — automatically scaffolds via Capacitor.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();
const androidDir = path.join(rootDir, 'android');
const gradlewPath = path.join(androidDir, 'gradlew');
const manifestPath = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
const buildGradlePath = path.join(androidDir, 'app', 'build.gradle');

console.log('--- Preparing Android Native Platform ---');

// 1. Ensure android directory and gradlew exist
if (!fs.existsSync(androidDir) || !fs.existsSync(gradlewPath)) {
  console.log('[prepare-android] android directory or gradlew missing. Running "npx cap add android"...');
  execSync('npx cap add android', { stdio: 'inherit' });
} else {
  console.log('[prepare-android] Native android directory and gradlew verified.');
}

// 2. Ensure gradlew is executable
if (fs.existsSync(gradlewPath)) {
  try {
    fs.chmodSync(gradlewPath, 0o755);
    console.log('[prepare-android] chmod +x applied to android/gradlew');
  } catch (err) {
    console.warn('[prepare-android] Could not set executable bit on gradlew:', err.message);
  }
}

// 3. Ensure AndroidManifest.xml contains necessary hardware and media permissions
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  let modified = false;

  const permissions = [
    '    <uses-permission android:name="android.permission.INTERNET" />',
    '    <uses-permission android:name="android.permission.CAMERA" />',
    '    <uses-permission android:name="android.permission.RECORD_AUDIO" />',
    '    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />',
    '    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />',
    '    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />',
    '    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />',
    '    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
    '    <uses-feature android:name="android.hardware.camera" android:required="false" />',
    '    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />',
    '    <uses-feature android:name="android.hardware.microphone" android:required="false" />'
  ];

  if (!manifest.includes('android.permission.CAMERA')) {
    console.log('[prepare-android] Injecting camera and media permissions into AndroidManifest.xml...');
    const insertPoint = manifest.lastIndexOf('</manifest>');
    if (insertPoint !== -1) {
      manifest = manifest.slice(0, insertPoint) + '\n    <!-- Injected Permissions -->\n' + permissions.join('\n') + '\n' + manifest.slice(insertPoint);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(manifestPath, manifest, 'utf8');
    console.log('[prepare-android] AndroidManifest.xml updated.');
  }
}

// 4. Ensure android/app/build.gradle contains conditional release signing config
if (fs.existsSync(buildGradlePath)) {
  let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
  if (!buildGradle.includes('RELEASE_STORE_FILE')) {
    console.log('[prepare-android] Configuring conditional release signing in android/app/build.gradle...');
    
    // Inject signingConfigs
    const signingBlock = `    signingConfigs {
        release {
            if (project.hasProperty('RELEASE_STORE_FILE') && file(RELEASE_STORE_FILE).exists()) {
                storeFile file(RELEASE_STORE_FILE)
                storePassword project.findProperty('RELEASE_STORE_PASSWORD') ?: ''
                keyAlias project.findProperty('RELEASE_KEY_ALIAS') ?: ''
                keyPassword project.findProperty('RELEASE_KEY_PASSWORD') ?: ''
            }
        }
    }`;

    if (buildGradle.includes('buildTypes {')) {
      buildGradle = buildGradle.replace('buildTypes {', `${signingBlock}\n    buildTypes {`);
      
      // Inject signingConfig into release buildType if not present
      if (!buildGradle.includes('signingConfig signingConfigs.release')) {
        buildGradle = buildGradle.replace(
          /release\s*\{([\s\S]*?)minifyEnabled/,
          (match, p1) => `release {${p1}if (project.hasProperty('RELEASE_STORE_FILE') && file(RELEASE_STORE_FILE).exists()) {\n                signingConfig signingConfigs.release\n            }\n            minifyEnabled`
        );
      }
      fs.writeFileSync(buildGradlePath, buildGradle, 'utf8');
      console.log('[prepare-android] android/app/build.gradle updated with signing config.');
    }
  }
}

// 5. Run Capacitor sync
console.log('[prepare-android] Running "npx cap sync android"...');
execSync('npx cap sync android', { stdio: 'inherit' });
console.log('--- Android Native Platform Ready ---');
