# allens

Expo/React Native app that scans food labels, OCRs the ingredients, translates them, and highlights allergens from the user's list. Product spec lives in `apps/docs/readme.md`.

## Layout

All app code is in `apps/allens-expo` — **run every command from there**, not the repo root.

- `src/app/` — Expo Router routes (`expo-router/entry` is the entry point; `app.json` sets `extra.router.appRoot` to `src/app`). Add a screen by adding a file.
- `src/components/` — UI primitives + `firebase-auth/google-auth.tsx` (also exports `signOutEverywhere`).
- `src/services/` — `ocr.ts` (ML Kit), `translation.ts` (Google Translate REST), `allergy-matcher.ts` (pure, self-checked).
- `src/store/` — Zustand stores: `auth` (mirrors Firebase), `allergies` and `scan-history` (both persisted to AsyncStorage).

## Commands

```bash
pnpm install
pnpm start          # expo start
pnpm ios | pnpm android
pnpm typecheck      # tsc --noEmit
pnpm check          # allergen matcher self-check (node --experimental-strip-types, needs Node ≥22.6)
pnpm exec expo export --platform android --dev   # bundle smoke test, same as CI
```

pnpm only (lockfile + `packageManager` field). No lint or unit-test framework — CI (`.github/workflows/ci.yml`) runs typecheck, the matcher self-check, and an Expo export.

## How a scan flows

`camera.tsx` → `detectIngredientsAsync` (ML Kit, on-device) → `translateTextAsync` (no-op without an API key) → `findAllergenMatches` against **both** the original and translated text → saved to `scan-history` → pushes `/history/[id]`, which recomputes match positions to paint them red.

Auth is one-directional: Firebase is the source of truth, `_layout.tsx` subscribes with `onAuthStateChanged` and mirrors it into the `auth` store, and route guards read the store. Never set `isSignedIn` by hand.

## Gotchas

- **Won't run in Expo Go.** Native Firebase + ML Kit require a dev build (`eas build --profile development`).
- Native Firebase config (`GoogleService-Info.plist`, `google-services.json`) is gitignored and must be present before any native build.
- `activeAllergens()` returns a fresh array — never use it directly as a zustand selector (infinite re-render). Select `selected`/`custom` and derive with `useMemo`, as `history/[id].tsx` does.
- Copy `.env.example` to `.env`; client-readable vars need the `EXPO_PUBLIC_` prefix, and CI/EAS mirrors them via `eas secret:create`.
- `allergy-matcher.ts` matches substrings on purpose (`밀` inside `밀가루`). A false positive is safe; a miss is not. Test any change with `pnpm check`.
- Some comments are in Korean; match the surrounding file.
- Still spec, not code: Kakao/Naver login, Firestore sync, Apple sign-in, gallery import, shareable cards.
