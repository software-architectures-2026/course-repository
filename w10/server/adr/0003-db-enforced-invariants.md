# ADR-0003: Enforce Critical Business Invariants in the Database

- **Status**: Accepted
- **Date**: 2026-04-26

## Context

The project's database schema (`init-db/database_schema.sql`) contains multiple database-level invariants: `CHECK` constraints, partial/unique indexes (for example, `unique_seat_event_active`), and referential actions (`ON DELETE CASCADE` / `SET NULL`). Repository modules interact with Postgres using raw SQL via the `pg` driver. The system has correctness requirements for concurrency-sensitive operations (reservation/seat assignment, payments/refunds) that must hold under concurrent clients and multiple app instances.

Technical constraints and forces:
- Primary datastore: PostgreSQL (local dev via `docker-compose`), `pg` driver in Node.js.
- Team constraints: small course team; correctness is critical for example flows (no double-booking); limited time/resources for complex distributed coordination.
- Quality attributes: correctness under concurrency, data integrity, and operational simplicity for migrations and local testing.

Evidence in repository:
- [init-db/database_schema.sql](init-db/database_schema.sql)
- repository modules (e.g., [server/src/repositories/event.repository.js](server/src/repositories/event.repository.js))

## Decision

We will enforce critical correctness and concurrency-sensitive business invariants at the database level using PostgreSQL constraints, partial unique indexes, and referential actions. Application code will perform early validation and user-friendly checks but must treat the database as the ultimate authority for invariants that require atomicity across concurrent clients.

The application will translate common Postgres constraint errors into domain-level `AppError` subclasses (for example, `ConflictError` for unique violations) so clients receive meaningful responses.

## Alternatives Considered

1. Application-only enforcement (all invariant checks implemented in services)
   - Why considered: avoids DB-specific features, potentially increases portability.
   - Why not chosen: vulnerable to race conditions when multiple app instances or external clients operate concurrently; implementing correct distributed locking or serialization is more complex.

2. Optimistic concurrency control (version columns / conditional updates)
   - Why considered: reduces reliance on DB-specific constraints; detects conflicts at update time.
   - Why not chosen as sole mechanism: useful for some writes but insufficient for constraints that must prevent creation-time conflicts (e.g., unique seat reservation) without additional coordination.

3. Serialized processing / command queue (single consumer) or advisory locks
   - Why considered: can serialize conflicting operations and avoid DB-level uniqueness reliance.
   - Why not chosen: introduces more infra (queue, workers) and operational complexity; considered for future scaling scenarios where DB constraints alone are not sufficient.

## Consequences

Positive:
- Strong correctness guarantees for invariants that must hold under concurrency (e.g., unique seat for active reservations).
- Simpler application code for critical invariants — the DB enforces atomicity and integrity.

Negative:
- Schema evolution cost: adding or relaxing constraints on large tables can be disruptive and require multi-step migrations and maintenance windows.
- Reduced portability: reliance on Postgres-specific features makes moving to other engines harder.
- Backfill/import complexity: constraints such as `CHECK (start_time >= NOW())` can hinder historical data imports and require special migration scripts or temporarily disabling constraints.

Neutral:
- Application code must implement mapping from Postgres error codes to domain errors; this is an operational requirement rather than purely positive or negative.

## Implementation Notes

- Keep invariants in `init-db/database_schema.sql` and evolve via careful, staged migrations.
- Use transactions in repository functions for multi-step updates.
- Translate common Postgres error codes to `AppError` subclasses in a small repository helper. Common codes:
  - `23505` — `unique_violation` → `ConflictError`
  - `23503` — `foreign_key_violation` → `ValidationError` / `NotFoundError` (context-dependent)
  - `23514` — `check_violation` → `ValidationError`

Example repository helper (illustrative):

```js
// server/src/lib/db-run.js (illustrative)
const db = require('../config/db');
const { ConflictError, ValidationError } = require('../errors');

async function runQueryRows(sql, params) {
  try {
    const res = await db.query(sql, params);
    return res.rows;
  } catch (err) {
    if (err && err.code === '23505') throw new ConflictError('Conflict: duplicate resource');
    if (err && err.code === '23503') throw new ValidationError('Missing related resource or foreign key constraint');
    if (err && err.code === '23514') throw new ValidationError('Constraint violated');
    throw err;
  }
}

module.exports = { runQueryRows };
```

Migration guidance:
1. Run a validation script that detects rows violating the intended constraint and fix or export them.
2. Add new constraints in a maintenance window (or use `NOT VALID` then `VALIDATE CONSTRAINT` where appropriate).

## Related
- [init-db/database_schema.sql](init-db/database_schema.sql)
- [server/src/repositories/ticket.repository.js](server/src/repositories/ticket.repository.js)

