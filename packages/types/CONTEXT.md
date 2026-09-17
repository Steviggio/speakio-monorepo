# Shared Types Context

## Module Purpose
Shared TypeScript library that acts as the single source of truth for domain models, DTOs, and common types used across the entire monorepo.

## Boundaries & Dependencies
- **Internal:** Consumed by `apps/web`, `apps/api`, and other workspace packages.
- **Dependencies:** Completely agnostic and standalone; no external runtime dependencies.

## Exported Surface / Public Seams
- All shared interfaces and types are exported from `src/index.ts`.

## Verification Gates
Run the following scoped commands to verify this module:
- Build (Type Generation): `npm --workspace=@repo/types run build`
- Linting: `npm --workspace=@repo/types run lint`

## Forbidden Patterns
- **No Implementation Logic:** This package must strictly contain TypeScript types and interfaces. No runtime classes, functions, or execution logic.
- **No Environment Specifics:** Do not use Node.js or DOM-specific APIs; keep types universally applicable.
