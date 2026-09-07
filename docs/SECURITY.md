# Security Policy & Audit Guide

This document defines the security architecture, data handling safeguards, and threat modeling for **ARPIT ACADEMY UDAIPURA**.

---

## 1. Zero Client-Side Secrets

- **Strict Server Proxying**: Neither the Gemini API key nor third-party credentials are exposed to the client bundle.
- **Environment Isolation**: `.env` files are ignored by git; only `.env.example` is tracked.
- **Backend Validation**: Server endpoints validate request bodies and enforce payload size limits (e.g., Express JSON body limits).

---

## 2. Student Data Privacy & Local Storage

- **Local-First Architecture**: Sensitive student notes, assignments, attendance logs, and video recordings remain in the user's browser IndexedDB.
- **No Unsolicited Tracking**: The application does not embed third-party tracking beacons, telemetry pixels, or marketing analytics.
- **Export Control**: Teachers have full control to export gradebooks and analytics locally via encrypted or formatted CSV/JSON without third-party vendor lock-in.

---

## 3. Web & Iframe Security

- **Permissions Policy**: Camera, microphone, and audio recording permissions are requested explicitly by the user upon opening the Teaching Studio.
- **Referrer Policy**: External asset tags specify `referrerpolicy="no-referrer"` to prevent leaking URL parameters to external CDNs.
- **Input Sanitization**: User-entered lesson topics, announcements, and quiz answers are sanitized before rendering to mitigate Cross-Site Scripting (XSS).

---

## 4. Security Audit Checklist

- [x] No API keys committed in repository source control.
- [x] `.env` files explicitly added to `.gitignore`.
- [x] Client bundles contain zero mentions of `GEMINI_API_KEY`.
- [x] All external API communication uses HTTPS.
- [x] Robust fallback for IndexedDB exceptions and corrupted local entries.
- [x] Error boundaries prevent sensitive internal stack traces from exposing system internals in production.
