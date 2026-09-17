# Speakio Monorepo Context Map

## Module Purpose
The root of the Speakio Monorepo. This workspace orchestrates the frontend (`apps/web`), backend (`apps/api`), and shared libraries (`packages/*`) using Turborepo.

## Boundaries & Dependencies
- **Tooling:** Uses Turborepo for build orchestration and caching.
- **Structure:** `apps/*` for runnable applications, `packages/*` for shared libraries.

## Exported Surface / Public Seams
This repository maps to specific contexts:
- **Web App:** See `apps/web/CONTEXT.md`
- **Backend API:** See `apps/api/CONTEXT.md`
- **Shared Types:** See `packages/types/CONTEXT.md`

## Verification Gates
Run the following commands at the root to verify the entire workspace:
- Type check: `npm run check-types`
- Lint: `npm run lint`
- Test: `npm run test`
- Build: `npm run build`

## Forbidden Patterns
- **No Global Hoisting Hacks:** Packages should explicitly list their dependencies in their own `package.json`.
- **No Cross-App Coupling:** Apps (`web`, `api`) must not directly import each other's code. Share code via `packages/*` instead.
