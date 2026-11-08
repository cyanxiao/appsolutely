# Development

## Run locally

Requires macOS, Raycast, and Node.js **24 or newer** with npm.

```sh
npm ci
npm run dev
```

With development running, open Raycast and select **Open Appsolutely**.

## Development and validation

```sh
npm test                 # Node's built-in runner; no test dependencies
npm run typecheck
npm run lint             # Official Raycast manifest, icon, and ESLint validation
npm run build            # Official Raycast production build
npm run benchmark        # Synthetic assignment and icon-store benchmarks
npm run format
node scripts/generate-icon.mjs  # Regenerate the 512×512 extension icon
```

Tests cover hierarchy operations, deep nesting, cycle prevention, application discovery and identity, search, serialization, schema migration, recovery backups, future-version protection, save failures, and concurrent actions.

The performance workflow compares pull requests with their base revision and pushes to `main` with the preceding commit. It reports median assignment lookup time and simulated icon-store work in the GitHub Actions summary. The comparison fails on large lookup regressions or increased icon work; it does not measure Raycast UI or native icon extraction. To compare locally, run `npm run benchmark -- /path/to/baseline-checkout` with Node 24 or newer.

Source layout:

```text
src/launcher.tsx              Command entry
src/components/              Native grid, items, folder forms, destination picker, actions
src/hooks/                   Shared catalog and layout subscriptions
src/models/                  Application, folder, and storage types
src/services/                Discovery, application identity, storage codec, save queue
src/utils/                   Folder operations and sorting
src/__tests__/               Pure-logic and persistence tests
assets/extension-icon.png    Original 512×512 icon
```
