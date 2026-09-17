# Web Client Context

## Module Purpose
Next.js frontend application providing the user interface and client-side functionality for the platform.

## Boundaries & Dependencies
- **Upstream:** Consumes the backend API (`apps/api`) via HTTP (Axios/React Query).
- **Internal:** Depends on `@repo/types`, `@repo/eslint-config`, and `@repo/typescript-config`.
- **External:** Utilizes Next.js, React, TailwindCSS, and shadcn/ui components.

## Exported Surface / Public Seams
- Next.js Pages & Layouts (UI routes).
- Shared React components (UI building blocks).
- Custom hooks (e.g., React Query hooks for data fetching).

## Verification Gates
Run the following scoped commands to verify this module:
- Type checking: `npm --workspace=apps/web run check-types`
- Testing: `npm --workspace=apps/web run test`
- Linting: `npm --workspace=apps/web run lint`

## Forbidden Patterns
- **No Direct DB Access:** Never import or use backend database drivers (Mongoose, etc.) or ORMs here.
- **No Backend Imports:** Do not cross-import modules directly from `apps/api`.
- **API Communication:** All data fetching must go through standardized HTTP clients; no direct arbitrary fetch calls scattered across components.
