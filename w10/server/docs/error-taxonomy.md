# EventHub Error Taxonomy

This document defines the standard error categories, codes, HTTP status mappings, example instances from EventHub's domain, the layer responsible for producing them, and how the frontend should react. Commit this file to ensure consistent error handling across services and client code.

## Standard JSON Error Response

All endpoints MUST return errors using this shape (JSON):

```json
{
  "code": "MACHINE_READABLE_CODE",
  "message": "Human readable summary of the error",
  "details": [
    { "field": "optional_field_name", "message": "field-level message" }
  ],
  "traceId": "optional-trace-id-for-debugging"
}
```

- `code` (string): machine-readable error code (e.g., `VALIDATION_ERROR`).
- `message` (string): short human-friendly message suitable for display.
- `details` (array, optional): field-level validation errors or other structured details.
- `traceId` (string, optional): correlation id for logs and tracing. Also include as response header `X-Trace-Id` when present.

Include an appropriate HTTP status code with the response (see categories below). Avoid leaking internal stack traces; use `traceId` to correlate internal logs.

---

## Error Categories

Each category below lists: machine-readable `code`, HTTP status, description, examples, producing layer, and recommended frontend reaction.

- **Validation Error**
  - Code: `VALIDATION_ERROR`
  - HTTP: `400 Bad Request`
  - Description: Input fails syntactic/semantic validation (format, required fields, type constraints).
  - Examples:
    - Registration form: `email` is missing or invalid format.
    - Reservation request: `quantity` is negative or exceeds request schema limits.
    - Payment token field missing from checkout payload.
  - Producer: Route/Controller layer (request parsing & DTO validation). Field-level issues may be attached to `details`.
  - Frontend reaction: Show inline field validation messages; prevent submission until corrected.

- **Authentication Error**
  - Code: `AUTHENTICATION_ERROR`
  - HTTP: `401 Unauthorized`
  - Description: Credentials missing or invalid; user is not authenticated.
  - Examples:
    - Missing or expired JWT token.
    - Invalid login credentials at `/auth/login`.
  - Producer: Route/Middleware layer (auth middleware or controller).
  - Frontend reaction: Redirect to login, optionally show a toast explaining session expired.

- **Authorization Error**
  - Code: `AUTHORIZATION_ERROR`
  - HTTP: `403 Forbidden`
  - Description: Authenticated user lacks permission to perform the requested action.
  - Examples:
    - Customer attempts to modify an event they do not own.
    - Regular user attempts to access organizer-only endpoints.
  - Producer: Service layer (business permission checks) or auth middleware for role checks.
  - Frontend reaction: Show a toast/modal explaining insufficient permissions; hide or disable UI actions that cause this.

- **Resource Not Found**
  - Code: `RESOURCE_NOT_FOUND`
  - HTTP: `404 Not Found`
  - Description: The requested resource does not exist.
  - Examples:
    - Event id not found when viewing event details.
    - Ticket id not found when attempting to refund.
    - User profile not found for given user id.
  - Producer: Data layer (repository) or service layer when an expected entity is missing.
  - Frontend reaction: Show a friendly “not found” page or inline message; for detail pages, redirect to listing or show 404 view.

- **Conflict / Concurrency Error**
  - Code: `CONFLICT_ERROR`
  - HTTP: `409 Conflict`
  - Description: Request could not be completed due to a conflict with current state (including optimistic locking or business-level conflicts like double-booking).
  - Examples:
    - Seat already reserved by another transaction (double-booking attempt).
    - Duplicate registration for the same email when unique constraint exists.
    - Optimistic lock failure when updating a reservation concurrently.
  - Producer: Data layer (unique constraint / locking) or service layer when detecting state conflicts.
  - Frontend reaction: Show inline or toast explaining the conflict and offer retry or alternative (e.g., choose another seat). Consider optimistic UI rollback and refresh.

- **Business Rule Violation**
  - Code: `BUSINESS_RULE_VIOLATION`
  - HTTP: `422 Unprocessable Entity`
  - Description: Request is syntactically valid but violates domain rules.
  - Examples:
    - Attempting to reserve more tickets than allowed per user.
    - Requesting a refund outside the refund window.
    - Trying to reserve tickets for a sold-out event.
  - Producer: Service layer (domain logic and policies).
  - Frontend reaction: Show clear UI message (toast or modal) explaining the rule and next steps; disable the offending action.

- **Payment Failure**
  - Code: `PAYMENT_FAILURE`
  - HTTP: `402 Payment Required` (or `502/503` if upstream payment gateway unavailable)
  - Description: Problems processing payment via payment gateway (declines, verification failures, or gateway errors).
  - Examples:
    - Card declined by issuer.
    - Payment token invalid or expired.
    - Payment gateway timeout returned when charging.
  - Producer: Service layer (payment integration) or External service wrapper.
  - Frontend reaction: Show inline error at checkout, suggest alternative payment, do not finalize order; allow retry.

- **External Service Error**
  - Code: `EXTERNAL_SERVICE_ERROR`
  - HTTP: `502 Bad Gateway` or `503 Service Unavailable`
  - Description: A downstream dependency (payment gateway, email service, seat-map service) failed or is unreachable.
  - Examples:
    - Email delivery service returns 5xx and cannot send confirmation emails.
    - Third-party seat availability API times out.
    - Payment provider responds with 502.
  - Producer: Service layer when calling external APIs; data layer wrapper for external sources.
  - Frontend reaction: Show a transient error toast; allow retry later; if essential for checkout, show blocking modal with retry guidance.

- **Rate Limit / Too Many Requests**
  - Code: `RATE_LIMITED`
  - HTTP: `429 Too Many Requests`
  - Description: Client has sent too many requests in a given time window.
  - Examples:
    - Excessive login attempts from an IP.
    - High-frequency polling of events API.
  - Producer: Route layer or API gateway.
  - Frontend reaction: Back off and retry later; show a toast indicating retry-after; disable aggressive polling.

- **Internal Server Error**
  - Code: `INTERNAL_ERROR`
  - HTTP: `500 Internal Server Error`
  - Description: Unexpected error or unhandled exception; indicates server-side bug or infrastructure issue.
  - Examples:
    - Null pointer or unhandled exception in service logic.
    - Database connection failure while processing request.
    - Serialization/deserialization bug causing crash.
  - Producer: Any layer (data, service, controller) — but treated as internal and logged.
  - Frontend reaction: Show a generic error toast or page; provide ability to retry later and surface `traceId` to support debugging.

---

## Mapping Summary (Quick Reference)

- `VALIDATION_ERROR` — 400 — route/controller — show inline.
- `AUTHENTICATION_ERROR` — 401 — auth middleware/route — redirect to login.
- `AUTHORIZATION_ERROR` — 403 — service/middleware — show toast/disable action.
- `RESOURCE_NOT_FOUND` — 404 — data/service — show 404 view or redirect.
- `CONFLICT_ERROR` — 409 — data/service — show toast and allow retry/alternative.
- `BUSINESS_RULE_VIOLATION` — 422 — service — show explanatory message/modal.
- `PAYMENT_FAILURE` — 402/502/503 — service/external — show checkout error, allow retry.
- `EXTERNAL_SERVICE_ERROR` — 502/503 — service — transient error UI, allow retry.
- `RATE_LIMITED` — 429 — route/gateway — back off, show retry-after.
- `INTERNAL_ERROR` — 500 — any layer — show generic error, log traceId.

## Error Handling Guidelines for Developers

- Always return the `code` and `message` fields. Use `details` for field-level validation only.
- Attach `traceId` to logs and include in the response to help support and debugging.
- Do not include stack traces in responses.
- Use the most specific HTTP status code available; do not return 200 on errors.
- Where possible, include machine-checkable hints in `details` (e.g., `{"field":"seatId","message":"already_reserved"}`) to help frontend automation.

## Example Responses

- Validation error example (400):

```json
{
  "code": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "details": [
    { "field": "email", "message": "invalid format" },
    { "field": "quantity", "message": "must be >= 1" }
  ],
  "traceId": "8a7f3b2e-..."
}
```

- Payment failure example (402):

```json
{
  "code": "PAYMENT_FAILURE",
  "message": "Card declined by issuer",
  "details": [],
  "traceId": "c9e4d2a1-..."
}
```

## Frontend Implementation Notes

- Validation: Prefer client-side validation to reduce round-trips, but always treat server `VALIDATION_ERROR` as the source of truth. Map `details` keys to form fields.
- Authentication: If a `401` is returned, clear local auth state and redirect to login. For token refresh flows, attempt silent refresh once.
- Authorization: If `403`, keep user on the current page and display a clear message; do not automatically navigate away unless the action requires a different view.
- Not Found: Present a user-friendly 404 and links back to main flows (events list).
- Conflicts: Provide immediate UI options (retry, choose other seat). For optimistic updates, revert and refresh from the server.
- Payment & External errors: Use non-blocking toasts for recoverable issues; for blocking issues during checkout, show a modal explaining next steps and preserve cart state so user can retry.
- Rate limit: Respect `Retry-After` header when provided; exponential backoff for automated clients.
- Internal errors: Show a generic message like "Something went wrong — please try again." Offer an action to report the issue (attach `traceId`).

---

## Rollout and Governance

- Add `error-taxonomy` to developer docs and enforce via PR reviews.
- Ensure server-side middleware formats errors to the standard JSON shape.
- Frontend should map codes to user-facing messages centrally (single place to translate `code` → localized message).

---

If you'd like, I can also:

- Add automated tests that validate endpoints return the canonical shape on failures.
- Produce a small middleware implementation template that maps internal exceptions to these codes.

---

File: [server/docs/error-taxonomy.md](server/docs/error-taxonomy.md)
