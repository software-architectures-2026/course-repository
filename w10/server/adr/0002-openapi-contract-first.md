# ADR-0002: API Contract-First (OpenAPI as canonical)

- **Status**: Accepted
- **Date**: 2026-04-26

## Context

An OpenAPI specification exists at `server/openapi.yaml`. The server exposes routes under `server/src/routes` and route-level validation currently uses Joi in `server/src/middlewares/validate.middleware.js`. The client is an Angular SPA that depends on a stable API contract. Team constraints (small course team) and the need for predictable client-server integration favor an explicit, well-documented API contract.

Technical constraints and forces:
- Client/server integration: the Angular SPA (client/EventHub) expects stable endpoints.
- Tooling: the project currently lacks CI enforcement for the spec but includes an `openapi.yaml` maintained in the repo.
- Quality attributes: interoperability, backward-compatibility, testability, and developer productivity when integrating clients.

Evidence in repository:
- [server/openapi.yaml](server/openapi.yaml)
- [server/src/docs/openapi.md](server/src/docs/openapi.md)
- [server/src/middlewares/validate.middleware.js](server/src/middlewares/validate.middleware.js)
- route files (e.g. [server/src/routes/events.routes.js](server/src/routes/events.routes.js))

## Decision

We will treat `server/openapi.yaml` as the canonical API contract for public endpoints. Public API changes must be proposed in the OpenAPI document and follow a PR workflow that includes linting and contract tests. Where practical, CI will validate the OpenAPI document and optionally run contract tests; runtime validation is recommended for requests (and responses when feasible).

Internal or experimental endpoints may remain code-first until they are stabilized and promoted to the public contract.

## Alternatives Considered

1. Code-first (generate OpenAPI from route/Joi definitions)
  - Why considered: faster iteration for small features; reduces duplication between code and spec.
  - Why not chosen: generation can drift or produce incomplete YAML; we prefer explicit, reviewed contracts for public endpoints.

2. Spec-as-documentation-only
  - Why considered: minimal process overhead; spec exists just for docs.
  - Why not chosen: documentation-only specs tend to drift and provide weak guarantees to clients.

3. Hybrid (spec-first for public endpoints, code-first for internal)
  - Why considered: reduces friction while retaining strong public contracts.
  - Why not chosen outright: we adopt the hybrid approach operationally (see Decision) but require that promoted endpoints update the canonical spec.

## Consequences

Positive:
- Clear, reviewable contract for client-server integration and client SDK generation.
- Easier to detect breaking changes and to run contract tests in CI.

Negative:
- Developer friction: spec-first workflows add steps and can slow small-feature iteration.
- Duplicate validation: maintaining Joi schemas and OpenAPI schemas requires tooling or discipline; mapping between schemas is non-trivial for complex types.

Neutral:
- Tooling choices (Spectral, express-openapi-validator, openapi-backend, contract-test frameworks) will need to be selected and integrated; this is an implementation detail.

## Implementation Notes / Suggested Workflow

1. Update `server/openapi.yaml` for any public API change.
2. Lint the spec locally (suggested: `spectral lint server/openapi.yaml`).
3. Update server routes / validators to match the spec; add/adjust contract tests that exercise examples.
4. CI: run OpenAPI lint, run contract tests, and fail PRs that introduce breaking changes without a versioning justification.

Runtime options:
- Use `express-openapi-validator` (or similar) to validate incoming requests; consider response validation for high-value endpoints or run contract tests instead.

## Related
- [server/openapi.yaml](server/openapi.yaml)
- [server/src/middlewares/validate.middleware.js](server/src/middlewares/validate.middleware.js)

---

## Review notes (patch: 2026-04-26)

- Fabricated / implicit claims to call out:
  - The ADR recommends enforcing the spec at CI/runtime. The repository currently contains the spec but no CI rules or runtime enforcement; the enforcement recommendation is a proposed change, not an existing capability.

- Strawman alternatives:
  - The ADR previously dismissed "spec-as-doc-only" quickly. A more balanced alternatives section should include:
    - **Code-first with generated spec**: keep Joi/route validation as the source of truth and generate OpenAPI from code (reduces duplication but can encourage ad-hoc route-driven contracts).
    - **Hybrid workflow**: maintain the spec for public endpoints while allowing rapid, internal-only endpoints to be code-first; bridge with automated generation where sensible.
  - These alternatives are valid and have trade-offs; the ADR should list them explicitly so teams preferring those flows feel their choice was considered.

- Missing negative consequences:
  - Spec-first adds developer friction and may slow small-feature iteration if the team keeps the spec strictly mandatory for every change.
  - Duplicate validation: maintaining both Joi schemas and OpenAPI is work; mapping between them (types, formats, custom validators) is non-trivial.

- Technical accuracy notes:
  - Runtime response validation is harder than request validation; many OpenAPI validators focus on requests and require additional wiring or tests for response validation.
  - Mapping OpenAPI schemas to Joi (or vice versa) is lossy in some cases (custom formats, discriminators, complex polymorphism); tool support varies and manual adjustments are often necessary.

- Standalone clarity improvements:
  - Proposed PR workflow (add to repo CONTRIBUTING or docs):
    1. Update `server/openapi.yaml` for any public API change.
    2. Run `spectral lint server/openapi.yaml` (or equivalent linter) locally and fix issues.
    3. Update route implementations and/or generated validators to match the spec.
    4. Add/adjust tests that assert the endpoint conforms to the spec (contract tests).
    5. Include a changelog entry and bump API version if the change is breaking.
  - CI suggestion: add an OpenAPI lint stage and a contract test step that validates example responses.

