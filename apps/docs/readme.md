# 🥫 allens — Smart Allergy Scanner for Food Labels

## Overview
**allens** is a mobile app that helps people quickly detect allergens in food products.  
Snap a photo of the ingredient label, run on-device OCR, and instantly see risky ingredients highlighted against your personal allergy list.  
Detected text is automatically translated into the user's language for clear understanding.  
Results are saved for later review.

> “Scan before you eat — safety in one glance.”

---

## Core Features

### Shipping today
- 🔑 **Google login** via Firebase Authentication
- 👤 **Allergy setup**: pick from presets or add custom allergens
- 📸 **Label scan**: camera capture
- 🧠 **On-device OCR**: Korean *and* Japanese ML Kit models run in parallel, longer read wins
- ✂️ **Ingredient trimming**: the ingredient block is isolated from the rest of the package, keeping "contains milk"-style advisories that sit outside it
- 🌐 **Automatic translation**: detected text is translated into the app's language
- 🚫 **Allergy match & highlight**: matches painted red, against both the original and the translated text
- 💾 **Scan history**: stored on-device, revisitable

### Still spec, not code
- Apple / Kakao / Naver login
- Gallery import
- Firestore sync for history
- A caution (orange) tier — today a scan is Danger or Safe
- Shareable image export (see Future Ideas)

---

## Tech Stack
- **App framework:** Expo + React Native, Expo Router
- **Camera:** `expo-camera`
- **OCR:** `@react-native-ml-kit/text-recognition` — Google **ML Kit**, on-device
- **Translation:** Google Cloud Translation REST API; target language from `expo-localization`
- **Auth:** **Firebase Authentication** (native `@react-native-firebase`) + Google Sign-In
- **Storage:** Zustand, persisted to AsyncStorage. Firestore is planned, not wired up.
- **Crash reporting:** Firebase Crashlytics
- **CI/CD:** Expo EAS → TestFlight / Play Console

> ⚠️ Native Firebase and ML Kit mean the app **will not run in Expo Go** — it needs a
> dev build (`eas build --profile development`).

---

## Project Structure
All app code lives in `apps/allens-expo` — run every command from there, not the repo root.

- `src/app/` — Expo Router routes: `_layout.tsx` (stack host, SafeAreaProvider, and the
  `onAuthStateChanged` subscription), `index.tsx`, `camera.tsx`, `history/`,
  `(auth)/login.tsx`, `(setup)/allergies.tsx`.
- `src/components/` — UI primitives, plus `firebase-auth/google-auth.tsx`.
- `src/services/` — `ocr.ts`, `translation.ts`, `label-text.ts` (ingredient-block trimming),
  `allergy-matcher.ts` (pure; also owns the `PRESET_ALLERGENS` alias table). The two
  `*.check.ts` files are runnable self-checks, not a test framework.
- `src/store/` — Zustand: `auth` (mirrors Firebase), `allergies` and `scan-history`
  (both persisted to AsyncStorage).

With `expo-router/entry` as the app entry point and `app.json` pointing `extra.router.appRoot` to `src/app`, new screens can be added simply by creating new files/folders under that directory.

### How a scan flows
`camera.tsx` → OCR → ingredient-block trim → translate → match against **both** the raw
and translated text → save to history → open `history/[id]`, which recomputes match
positions to paint them red.

The alias table is the offline fail-safe: it carries en/ko/ja spellings and is matched
against the *raw* OCR text, so a missing API key or dead network can never turn a risky
label green. The danger flag must never depend on translation succeeding.

---

## UX / UI
- Single-pass flow: **Scan → Translate → Review → Save**
- “Food Info Card” layout per scan:
  - Top: risk badge — **Danger** (with the matched allergens named) or **Safe**
  - Middle: ingredient text with highlighted matches
  - Bottom: date + quick notes
- Colors: Red (confirmed allergen), Green (safe). Orange/caution is a future tier.

---

## Privacy & Safety
- OCR runs entirely on-device. Only the extracted text leaves the device, and only to
  the translation API.
- Today **nothing syncs** — images stay local and history lives in AsyncStorage. Opt-in
  cloud sync arrives with Firestore.
- No location or personally identifiable information (PII) is stored.

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
- Node.js ≥ 22.6 (the self-checks run under `node --experimental-strip-types`)
- pnpm (lockfile + `packageManager` field — pnpm only)
- Android Studio / Xcode
- A Firebase project with Authentication enabled. `GoogleService-Info.plist` and
  `google-services.json` are gitignored and must be present before any native build.

### Install & Run
Run everything from `apps/allens-expo`.

```bash
pnpm install

pnpm start          # expo start (needs a dev build, not Expo Go)
pnpm ios | pnpm android

pnpm typecheck      # tsc --noEmit
pnpm check          # allergen matcher + label-text self-checks
pnpm exec expo export --platform android --dev   # bundle smoke test, same as CI
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
`.github/workflows/ci.yml` runs on every PR and on pushes to `main`, in one `bundle` job:
typecheck → the self-checks → `expo export --platform android --dev`. It requires the
`EXPO_TOKEN` secret and fails fast without it; a failed export uploads its output as an
artifact for debugging.

There is no lint or unit-test framework — the `*.check.ts` self-checks stand in for one.
