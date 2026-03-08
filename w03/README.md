# EventHub Backend (PEAN Stack)

## Layered Architecture

This project uses a strict three-layer architecture:

- **Routes (Presentation):** Handles HTTP requests and responses only. No business logic or database access.
- **Services (Business Logic):** Contains all business rules and orchestration. No direct HTTP or database access.
- **Repositories (Data Access):** All database communication happens here. No business logic or HTTP handling.

## Dependency Rule

- Routes may depend on Services
- Services may depend on Repositories
- **No layer may depend on a layer above it**
- **No layer may skip a layer** (e.g., Routes must NOT access Repositories directly)

This rule is enforced to ensure maintainability, testability, and separation of concerns.

## Getting Started

- Entry point: `app.js`
- All features should be implemented following the layer structure above.
