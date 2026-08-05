# allens

Expo/React Native app that scans food labels, OCRs the ingredients, translates them, and highlights allergens from the user's list. Product spec lives in `apps/docs/readme.md`.

## Layout

All app code is in `apps/allens-expo` — **run every command from there**, not the repo root.

- `src/app/` — Expo Router routes (`expo-router/entry` is the entry point; `app.json` sets `extra.router.appRoot` to `src/app`). Add a screen by adding a file.
- `src/components/` — UI primitives + `firebase-auth/` sign-in buttons.
- `src/services/` — `ocr.ts`, `translation.ts`, `allergy-matcher.ts`.
- `src/store/` — Zustand stores (`auth`, `scan-history`).

## Commands

```bash
pnpm install
pnpm start        # expo start
pnpm ios | pnpm android
npx tsc --noEmit  # what CI checks
```

pnpm only (lockfile + `packageManager` field). No lint or test scripts exist — CI (`.github/workflows/ci.yml`) runs install + TypeScript only.

## State of the code vs. the spec

The readme describes the target, not what's built. Currently:

- `services/ocr.ts` returns a hardcoded sample string after a 400ms sleep. No ML Kit.
- `services/translation.ts` is a tiny hardcoded dictionary, no Google Cloud Translation.
- `services/allergy-matcher.ts` is a `toLowerCase().includes()` substring filter.
- Camera is `expo-camera`, not `react-native-vision-camera` as the readme says.
- Auth is `@react-native-firebase/auth` with Google + Apple; no Kakao/Naver.

Don't assume a service is real — read it first.

## Notes

- Native Firebase config files (`GoogleService-Info.plist`, `google-services.json`) are referenced by `app.json` and are gitignored.
- Client-readable env vars must be prefixed `EXPO_PUBLIC_`; CI/EAS secrets mirror them via `eas secret:create`.
- Some comments are in Korean; that's fine, match the surrounding file.
