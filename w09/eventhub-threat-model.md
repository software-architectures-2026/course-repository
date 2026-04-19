# EventHub Threat Model

## System Overview
EventHub is an Angular 19 single-page application (SPA) that runs on localhost:4200 and authenticates clients via JWTs stored in `localStorage`. The SPA communicates with a layered Express.js REST API on localhost:3000 (routes → services → repositories) which persists data in PostgreSQL; authorization decisions are performed in service code and a `user_roles` table exists but is currently unused.

## Trust Boundary Diagram (ASCII)

Browser / User (untrusted)
  |
  | (1) UI events, credentials, form input
  v
Angular SPA (client runtime)
  |
  | (2) HTTP/JSON + `Authorization: Bearer <JWT>`  ← CORS (allowed origin from env)
  v
=== NETWORK (untrusted) ===
  |
  | (3) HTTP/TCP (recommend TLS)
  v
Express API (server process)
  - Global middleware: `authenticateOptional` (attaches `req.user` if token valid)
  - Route handlers → Services → Repositories
  |
  | (4) SQL queries, DB creds
  v
PostgreSQL (data store, trusted by app)

Trust boundaries:
- Boundary A: End user ↔ Browser (untrusted user input, XSS risk)
- Boundary B: Browser runtime ↔ Network (token becomes bearer credential)
- Boundary C: Network ↔ Express API (untrusted network ingress)
- Boundary D: Express services ↔ PostgreSQL (app ↔ DB with credentials)
- Boundary E: Express ↔ External payment providers (third-party trust)

---

## Threat Table

| ID | Threat | STRIDE Category | Affected Component | Severity | Mitigation | Status |
|---:|---|---|---|---:|---|---|
| T1 | organizer_id fallback override | Spoofing | `server/src/routes/events.routes.js` (reads `req.headers['x-user-id'] || req.body.organizer_id`) | High | Always use verified `req.user.user_id` for actor/authorization; ignore client `organizer_id`. | Planned |
| T2 | Payment amount tampering | Tampering | `server/src/services/payment.service.js`, `server/src/routes/payments.routes.js` | Critical | Compute and verify amount server-side from reservation/ticket data; ignore client-sent `amount`. Persist canonical price at reservation creation. | Planned |
| T3 | No audit trail for financial ops | Repudiation | `server/src/services/payment.service.js`, `server/src/services/refund.service.js` | Medium | Record immutable audit fields (actor_id, trace_id, timestamp, idempotency key, gateway transaction id) in payments/refunds. | Planned |
| T4 | Unpublished events accessible via API | Information Disclosure | `server/src/routes/events.routes.js` (GET /api/events/:event_id) | High | Enforce `published`/`public` checks on reads; require auth for unpublished events. | Planned |
| T5 | No rate limiting on reservation creation | Denial of Service | `POST /api/events/:event_id/reservations` route | High | Add `express-rate-limit` and per-user active-hold caps; short hold durations. | Planned |
| T6 | Missing role-based enforcement | Elevation of Privilege | Service-layer authorization; `user_roles` table unused | High | Fetch roles for `req.user` and enforce role checks (organizer vs customer) at service entry points. | Planned |
| T7 | IDOR on payment/refund endpoints | Elevation of Privilege | `server/src/services/payment.service.js`, `server/src/services/refund.service.js` | Critical | Verify ownership chain: payment → reservation → user_id must match `req.user.user_id` before capture/refund. | Planned |
| T8 | Default/weak JWT secret (`change-me`) | Spoofing | `server/src/services/auth.service.js` (`JWT_SECRET` fallback) | Critical | Fail startup if `JWT_SECRET` is unset or equals known default; require env var. | Planned |

---

## Accepted Risks

- Token storage in `localStorage`: Accepted for this course project to avoid the additional server-side session/cookie complexity. To reduce risk we will shorten JWT lifetimes, add a Content Security Policy (CSP), and emphasize careful XSS-safe coding practices in the frontend.

- No external payment-protection services: Accepted due to no-budget constraint. Mitigation includes using client-side payment tokenization (gateway tokens), storing gateway transaction IDs for audits, and server-side amount verification.

---

## Recommendations — Top 3 changes before production

1. Enforce a non-default `JWT_SECRET` at startup and refuse to run with the known default. (Files: `server/src/services/auth.service.js`, `server/src/index.js`) — prevents JWT forgery (T8).

2. Make payments authoritative on the server: compute amounts server-side (persist canonical price on reservation) and add ownership checks for payment and refund operations. (Files: `server/src/services/reservation.service.js`, `server/src/services/payment.service.js`, `server/src/services/refund.service.js`, `server/src/routes/payments.routes.js`, `server/src/routes/refunds.routes.js`) — prevents T2 and T7.

3. Add minimal request validation and basic rate limiting: implement `validate.middleware.js` for critical endpoints and apply `express-rate-limit` to reservation/payment endpoints. (Files: `server/src/middlewares/validate.middleware.js`, `server/src/index.js`, relevant route files) — reduces risk for T1, T5, T6 exploitation.

---

If you’d like, I can now prepare patch files for the top-priority fixes (JWT secret enforcement, server-side price verification + payment/refund ownership checks, or a `validate.middleware.js` scaffold). Tell me which to start with and I will create the changes and run tests locally where possible.
