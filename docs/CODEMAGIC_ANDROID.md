# Codemagic Android CI/CD Setup Guide

This guide explains how to build and download standalone Android **APK** and **AAB** binaries using Codemagic with the provided `codemagic.yaml`.

---

## 1. Connect the Repository in Codemagic

1. Log in to [Codemagic](https://codemagic.io/).
2. Click **Add application** and select **GitHub**.
3. Select your repository: `englishseekho2612-stack/AAUDP`.
4. Choose **Codemagic configuration file** (it automatically detects `/codemagic.yaml` at the root).

---

## 2. Available Workflows

The repository provides three dedicated workflows:

| Workflow ID | Workflow Name | Target Output | Signing Required |
|---|---|---|---|
| `android-debug` | Android Debug APK (Direct Testing) | `app-debug.apk` | No (Automatic debug signing) |
| `android-release` | Android Release Build (APK & AAB) | `app-release.apk`, `app-release.aab` | Optional (Unsigned if keystore omitted) |
| `web-production` | Web Production Build | `dist/**` | No |

---

## 3. How to Build & Download Debug APK (Fastest Testing)

1. In Codemagic, open the **AAUDP** application.
2. Click **Start new build**.
3. Select the **`android-debug`** workflow.
4. Click **Start build**.
5. Once the build completes (~3 to 5 minutes):
   - Navigate to the **Artifacts** tab on the build page.
   - You will see **`app-debug.apk`** as an individual, direct download link!
   - Download the `.apk` directly to your phone or computer and install it.
   - *Note: It will NOT be bundled inside an `artifacts.zip` archive.*

---

## 4. How to Configure Release Signing (For Google Play Store)

To build a signed APK or AAB for distribution:

1. In Codemagic, go to **Teams** (or **App settings**) > **Code signing identities** > **Android code signing**.
2. Upload your release keystore (`.jks` or `.keystore` file).
3. Fill in:
   - **Keystore password**
   - **Key alias**
   - **Key password**
4. Assign this configuration to the environment group named **`android_signing`** (referenced in `codemagic.yaml`).
5. Run the **`android-release`** workflow.
6. The generated `app-release.apk` and `app-release.aab` will be cryptographically signed with your keystore and ready for Google Play upload.

---

## 5. Security & Secrets Management

- **Keystore files (`.jks` / `.keystore`) must NEVER be committed to Git.** They are properly excluded by `.gitignore`.
- API keys such as `GEMINI_API_KEY` should be set as secure environment variables in Codemagic's **Environment variables** tab, never hard-coded in source files.

---

## 6. Codemagic Artifact Output Mapping

Codemagic artifact patterns in `codemagic.yaml`:
```yaml
# For android-debug:
artifacts:
  - android/app/build/outputs/apk/debug/*.apk

# For android-release:
artifacts:
  - android/app/build/outputs/apk/release/*.apk
  - android/app/build/outputs/bundle/release/*.aab
```

This guarantees individual binary delivery in the Codemagic dashboard.
