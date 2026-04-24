# Agent Notes

## Commands
- Use `npm`, not `pnpm` or `yarn`; the repo is locked with `package-lock.json`.
- App entry commands: `npm start`, `npm run android`, `npm run ios`, `npm run web`.
- The only verification script is `npm run typecheck`.
- If `typecheck` fails on missing `generated/5etools/*` JSON imports, run `npm run generate:5etools` first, then rerun `npm run typecheck`.
- There is no repo test, lint, formatter, or CI workflow config to run.

## Architecture
- This is a single Expo Router app. `app/` is mostly thin route wrappers; real screens, services, repositories, and shared code live under `src/`.
- App startup flows through `app/_layout.tsx` -> `AppProviders` -> `AppBootstrapGate`.
- Bootstrap order matters: `useAppBootstrap()` initializes SQLite first, then seeds bundled content.

## Native vs Web
- Native behavior lives in `.native.ts` files. `src/shared/db/sqlite.native.ts` opens the real Expo SQLite DB, applies `schema.ts`, then runs `migrations.ts`.
- The non-native fallbacks are stubs: `src/shared/db/sqlite.ts` is in-memory and `src/shared/content/bootstrap.ts` does not seed bundled content. Do not assume `npm run web` exercises the native persistence path.

## Schema Changes
- Fresh installs use `src/shared/db/schema.ts`; existing installs upgrade through `src/shared/db/migrations.ts`.
- If you change local DB structure, update `schema.ts`, add a migration in `migrations.ts`, and bump `LATEST_LOCAL_SCHEMA_VERSION` in `schema-version.ts`.

## Generated Content
- Bundled compendium data is checked in under `generated/5etools/`; the typed import registry is `src/shared/content/generated/5etoolsRegistry.ts`.
- `npm run generate:5etools` fetches from `5etools-mirror-3/5etools-src` on GitHub and rewrites the whole generated tree.
- The generator stamps `generatedAt`, so rerunning it creates a large diff even when source content is effectively unchanged. Do not run it casually.

## Runtime Config
- Required public env vars are documented in `.env.example`: `EXPO_PUBLIC_APP_ENV`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `src/shared/config/env.ts` validates these at import time, so missing values break app startup early.
- `app.json` does not provide fallback Supabase credentials; use `.env.local`/environment variables.

## Conventions
- Follow the existing feature split: route wrapper in `app/`, feature code in `src/features/<feature>`, shared infra in `src/shared`.
- Data access is organized as repository -> service -> hook/screen. Prefer extending that flow instead of wiring screens directly to storage or Supabase.
