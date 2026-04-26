# Architecture Decision Records (ADRs)

This folder contains ADRs documenting important architectural decisions for the EventHub server.

ADRs created in this commit:

- [server/adr/0001-layered-monolith.md](server/adr/0001-layered-monolith.md)
- [server/adr/0002-openapi-contract-first.md](server/adr/0002-openapi-contract-first.md)
- [server/adr/0003-db-enforced-invariants.md](server/adr/0003-db-enforced-invariants.md)

If you want additional ADRs (for JWT strategy, payment ownership, containerization, etc.), tell me which topics to document next.

Patch notes: the ADRs were updated on 2026-04-26 to add review feedback, clarify implicit assumptions, list balanced alternatives, and include practical implementation appendices (error-code mapping, PR workflow suggestions, and example repository patterns).
 
New ADRs are now written using Michael Nygard's template and stored as:

- [server/adr/0001-layered-monolith.md](server/adr/0001-layered-monolith.md)
- [server/adr/0002-openapi-contract-first.md](server/adr/0002-openapi-contract-first.md)
- [server/adr/0003-db-enforced-invariants.md](server/adr/0003-db-enforced-invariants.md)
