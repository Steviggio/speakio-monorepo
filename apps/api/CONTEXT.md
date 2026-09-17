# Backend API Context

## Module Purpose
NestJS backend application that serves as the primary API, handling business logic, authentication, and data persistence for the platform.

## Boundaries & Dependencies
- **Downstream:** Consumed by the `apps/web` client via HTTP.
- **Data:** Connects to MongoDB via Mongoose.
- **Internal:** Depends on `@repo/types` for shared domain models.

## Exported Surface / Public Seams
- REST API Controllers (endpoints for the frontend).
- Core Modules & Pipelines (e.g., `AuthService`, `ResourceCurationPipeline`, `RoadmapsModule`).
- Roadmaps Domain Aggregate & Adapters (e.g., `RoadmapsService`, `AnkiCsvExportAdapter`).
- Authentication mechanisms (Passport strategies, JWT).

## Verification Gates
Run the following scoped commands to verify this module:
- Unit Testing: `npm --workspace=apps/api run test`
- E2E Testing: `npm --workspace=apps/api run test:e2e`
- Linting: `npm --workspace=apps/api run lint`
- Build: `npm --workspace=apps/api run build`

## Forbidden Patterns
- **No UI Code:** Do not include any UI or DOM-specific libraries/types.
- **No Direct Frontend Coupling:** The API must remain agnostic of the specific frontend client; return structured JSON and standard HTTP status codes.
- **Avoid Circular Dependencies:** NestJS modules should be strictly unidirectional.
