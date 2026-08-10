# 🥫 allens — Smart Allergy Scanner for Food Labels

## Overview
**allens** is a mobile app that helps people quickly detect allergens in food products.  
Snap a photo of the ingredient label, run on-device OCR, and instantly see risky ingredients highlighted against your personal allergy list.  
Detected text is automatically translated into the user's language for clear understanding.  
Results are saved for later review.

> “Scan before you eat — safety in one glance.”

---

## Core Features (MVP)
- 🔑 **Social login**: Google, Apple, Kakao, Naver (see Tech notes)
- 👤 **Allergy setup**: pick from presets or add custom allergens
- 📸 **Label scan**: camera capture or gallery import
- 🧠 **On-device OCR**: extract ingredient text
- 🌐 **Automatic translation**: detected text is translated into the user's language for clearer understanding
- 🚫 **Allergy match & highlight**: risky terms in red; caution phrases in orange
- 💾 **Scan history**: store and revisit past scans

> Note: **shareable image export** is planned for later releases (see Future Ideas).

---

## Tech Stack
- **App framework:** Expo (Managed) + React Native
- **Camera:** `react-native-vision-camera`
- **OCR:** Google **ML Kit Text Recognition** (on-device)
- **Translation:** Google Cloud Translation API
- **Auth & DB:** **Firebase Authentication + Cloud Firestore**
- **State:** Zustand (or Redux Toolkit)
- **Crash/Analytics:** Firebase Crashlytics / Analytics
- **CI/CD:** Expo EAS → TestFlight / Play Console

---

## Project Structure
- `src/app/_layout.tsx`: Expo Router stack host + SafeAreaProvider configuration.
- `src/app/index.tsx`: current MVP storyboard describing the end-to-end scan flow.
- `src/components/*`: shareable UI primitives (CTA button, section heading, feature cards).
- `src/lib/features.ts`: single source of truth for the onboarding/scan/user stories rendered in the UI.

With `expo-router/entry` as the app entry point and `app.json` pointing `extra.router.appRoot` to `src/app`, new screens can be added simply by creating new files/folders under that directory (e.g., `src/app/(auth)/login.tsx`, `src/app/(tabs)/camera.tsx`, etc.).

---

## UX / UI
- Single-pass flow: **Scan → Translate → Review → Save**
- “Food Info Card” layout per scan:
  - Top: risk badge (Safe / Caution / Danger)
  - Middle: ingredient text with highlighted matches
  - Bottom: date + quick notes
- Colors: Red (confirmed allergen), Orange (caution), Gray (safe)

---

## Privacy & Safety
- OCR and translation run on-device or via secure cloud APIs.
- Original images remain local by default; only text data syncs if the user opts in.
- No location or personally identifiable information (PII) is stored.
- Users can delete all synced data at any time.

---

## Roadmap
| Phase | Goal | Deliverable |
|--------|------|-------------|
| **Week 1** | Auth + allergy setup + camera skeleton | Working login & capture flow |
| **Week 2** | OCR + translation + highlighting | End-to-end label parsing |
| **Week 3** | Cloud sync for scan history | Firestore integration |
| **Week 4** | QA + analytics + internal distribution | TestFlight / Play Console |

---

## Future Ideas (post-MVP)
- 🖼️ Shareable image card (with privacy scrubbing)
- 📊 Nutrition database enrichment
- 🤝 Community “safe product” notes
- 📦 Offline OCR & translation caching

---

## Development Setup

Setup instructions for contributors and developers.

### Requirements
- Node.js ≥ 20  
- pnpm ≥ 9  
- Expo CLI (managed with pnpm)  
- Android Studio / Xcode (for emulators)  
- Firebase project (Authentication + Firestore enabled)

### Install & Run
```bash
# Install dependencies
pnpm install

# Start Expo dev server
pnpm run start
# or
pnpm run ios
pnpm run android
```

### App Icon
The icon is generated, not hand-drawn. `python3 assets/make-icons.py assets` redraws
`icon.png`, `adaptive-icon.png`, `splash-icon.png`, `favicon.png` and the iOS `AppIcon`
slot from one model — stdlib only, no ImageMagick or PIL needed. `ios/` is gitignored,
so a fresh `expo prebuild` also regenerates the native slot from `assets/icon.png`.

### Environment Variables
1. Copy `.env.example` to `.env` and fill in your keys (Expo token, Firebase config, Google APIs, OAuth client IDs).
2. Prefix any values that must be accessible in the client bundle with `EXPO_PUBLIC_`.
3. For CI/EAS builds, mirror the same secrets via `eas secret:create --scope project --name <NAME> --value <VALUE>`.

### Continuous Integration
- GitHub Actions workflow (`.github/workflows/ci.yml`) runs pnpm install + TypeScript checks on every push/PR.
- When `EXPO_TOKEN`, `EXPO_USERNAME`, `EXPO_PASSWORD` secrets are configured in the repo, the `eas-preview` job triggers `eas build --platform android --profile preview --non-interactive` to ship an APK artifact.
- Extend the workflow with lint/tests (e.g., `pnpm run lint`, Jest) once those scripts exist. 
