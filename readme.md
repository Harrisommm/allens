# Allens Monorepo Layout

This root hosts the workspaces for the project. The Expo app lives in `apps/allens-expo`.

Common commands (run from repo root):
- `cd apps/allens-expo && pnpm start` — start Expo dev server
- `cd apps/allens-expo && pnpm android|ios|web` — platform-specific launch

Workspace config is defined in `pnpm-workspace.yaml` and dependencies are hoisted to the root `node_modules` by pnpm.
