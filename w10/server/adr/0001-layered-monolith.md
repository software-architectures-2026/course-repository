# ADR-0001: Layered Monolith (routes → services → repositories)

- **Status**: Accepted
- **Date**: 2026-04-26

## Context

The EventHub server is a Node.js/Express application organized into `routes/`, `services/`, and `repositories/`. The app is started from `server/src/index.js` and `docker-compose.yml` declares a single `app` service. The codebase includes route files, service modules that contain business logic, and repository modules that execute SQL via the `pg` driver.

Technical constraints and forces:
- Language/platform: Node.js (Express) and `pg` for PostgreSQL.
- Data store: PostgreSQL initialized via `init-db/database_schema.sql`.
- Team/project constraints: course project with a small team; fast local onboarding and reproducible developer environment are high priority.
- Quality attributes: maintainability and testability (unit-tested services), reasonable operational simplicity for course deployment, correctness for concurrency-sensitive operations (reservations/tickets).

Evidence in repository:
- [server/README.md](server/README.md)
- [server/src/index.js](server/src/index.js)
- [server/src/routes/events.routes.js](server/src/routes/events.routes.js)
- [server/src/services/event.service.js](server/src/services/event.service.js)
- [server/src/repositories/event.repository.js](server/src/repositories/event.repository.js)
- [docker-compose.yml](docker-compose.yml)

## Decision

We will adopt a layered monolith architecture: a single Node.js process implementing three logical layers — `routes/` (HTTP / presentation), `services/` (business logic, authorization, orchestration), and `repositories/` (data access, SQL/transactions). Cross-cutting concerns (authentication, validation, errors) will live in `src/middlewares` and be applied at entry points.

We will operate and deploy the application as a single service (the `app` container) for development and initial production-like environments. However, code will be organized and modularized so extraction of bounded contexts in future is feasible.

## Alternatives Considered

1. Microservices by bounded context (events, payments, reservations)
  - Why considered: clean separation of deployable services, independent scaling and deployment, language/runtime freedom per service.
  - Why not chosen: high operational and organizational cost (service discovery, independent CI/CD, distributed transactions or sagas, observability). Not justified for a small course team and early-stage project.

2. Modular monolith with strict package/module encapsulation
  - Why considered: combines single-process simplicity with strong module boundaries, easing later extraction.
  - Why not chosen as the primary label: we adopt the layered monolith but explicitly recommend modularization practices (this alternative influenced our implementation notes and will be used as a migration path).

3. Serverless / Function-per-endpoint
  - Why considered: automatic scaling per function and pay-per-use.
  - Why not chosen: cold-starts, DB connection pooling complexity with Postgres, and increased operational complexity for this project.

## Consequences

Positive:
- Simple local developer experience (single process, reproducible `docker-compose` environment).
- Easier debugging and reasoning about transactions and state compared to distributed services.
- Matches existing tests and team skill set (Jest unit tests, mocking repositories).

Negative:
- Single deploy unit increases blast radius; a bug in one area may require full-application rollback.
- Scaling limits: vertical scaling or replica-based scaling is required; independent scaling of subdomains is harder.
- As the codebase grows, CI/test cycles may slow and developer velocity can degrade without strict modularization.

Neutral:
- The OpenAPI spec remains the public contract; whether monolith or services, the spec can be used to extract/replace endpoints later.

## Implementation Notes
- Keep route handlers thin: parse and validate HTTP, call a single service function.
- Services should implement transaction boundaries for multi-step writes and orchestrate repository calls.
- Repositories should be small, single-responsibility SQL functions; centralize DB connection usage in `server/src/config/db.js`.
- Enforce module boundaries (folder-level and naming conventions) to prevent dependency creep and ease future extraction.

## Related
- [server/README.md](server/README.md)
- [server/openapi.yaml](server/openapi.yaml)

---

## Review notes (patch: 2026-04-26)

- Fabricated / implicit claims to call out:
  - The ADR mentions "running replicas behind a load balancer" as a scaling option. The repository does not include any load-balancer or orchestration manifests for that setup; this is an operational suggestion, not a present artifact.

- Strawman alternatives:
  - The ADR previously contrasted the layered monolith with a full microservices breakup only. To be fair to other approaches, include the middle-ground option: a modular (or "modular monolith") approach where the codebase is partitioned into clear bounded contexts with explicit module boundaries and package-level encapsulation, enabling later extraction without running multiple services immediately.

- Missing negative consequences (additional):
  - As the codebase grows, tests and CI for a monolith can become slower, increasing feedback loops and lowering developer velocity.
  - Release blast radius: a single deploy contains all features, so a bug in one area can require an application-wide rollback.
  - Module leakage risks: without strict boundaries, business logic tends to leak across layers producing tangled dependencies.

- Technical accuracy notes:
  - Splitting a monolith into services involves more than CI/CD and monitoring: it requires defining data ownership, handling cross-service transactions (sagas/compensations), and adding distributed tracing and observability.
  - The ADR now calls out these specifics to avoid understating the effort of migration.

- Standalone clarity improvements:
  - Example mapping (for new developers):
    - `routes/`: parse HTTP, authorize via middleware, and call a single service function (e.g., `reservationService.createReservation(req.body, req.user)`).
    - `services/`: implement domain workflows, validate business rules, orchestrate repository calls and transactions (e.g., reserve seats, compute amounts).
    - `repositories/`: small functions that execute single SQL queries or transaction blocks and return domain-shaped objects.
  - Example transaction boundary: `services/reservation.service.js` should open/commit DB transactions when performing multi-step writes across `ticket_reservations`, `tickets`, and `payments` entities.

