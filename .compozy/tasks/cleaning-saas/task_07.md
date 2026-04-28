---
status: completed
title: "Quote Flow"
type: backend
complexity: high
dependencies:
  - task_06
---

# Task 07: Quote Flow

---
You are a senior software engineer executing a predefined task in an existing codebase.
Your objective is to implement the task EXACTLY as specified.
<context>
- The project follows a strict sequential task system
- All dependencies listed in the task are already implemented
- You MUST trust the task specification as the single source of truth
</context>
<execution_rules>
1. DO NOT modify, reinterpret, or optimize the task requirements
2. DO NOT skip steps or make assumptions
3. DO NOT add features not explicitly requested
4. DO NOT refactor unrelated parts of the codebase
5. DO NOT create alternative approaches
6. You MUST follow all MUST / MUST NOT rules strictly
7. You MUST implement exactly what is described — no more, no less
8. You MUST respect architecture decisions already established
9. You MUST reuse existing modules, guards, and utilities when referenced
10. You MUST NOT duplicate logic that already exists
</execution_rules>
<technical_constraints>
* Follow the current project stack and patterns strictly
* Maintain consistency with existing modules and naming conventions
* Ensure proper integration with previously implemented tasks
* Respect authentication, RBAC, and multi-tenancy rules
</technical_constraints>
<validation>
* Ensure all requirements are fully implemented
* Ensure no security rules are violated
* Ensure tenant isolation is preserved
* Ensure correct error handling (401, 403, 400, 500)
</validation>
<output_format>
* Provide only the necessary code changes
* Do not include explanations unless strictly necessary
* Keep output minimal, technical, and implementation-focused
</output_format>
Now execute the task below exactly as specified:
---

## Overview

Implements the `Quote` entity with its state machine (`draft → sent → accepted / expired / rejected`), calculates `estimated_total_cents` via the pricing service from task_06, implements lazy expiration on read, wraps multi-step operations in database transactions, and emits domain events and audit log entries for every state transition. The `quotes.send` permission gate is enforced on `POST /api/v1/quotes/:id/send`.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `Quote` entity and migration with all fields defined in the SPEC including `deleted_at`
- MUST implement the Quote state machine: `draft → sent → accepted / expired / rejected` — invalid transitions MUST return HTTP 400
- On `POST /api/v1/quotes`, MUST calculate `estimated_total_cents` using the pricing calculation service from task_06
- `CreateQuoteDto` MUST include `area_sqm` (required when service unit is `sqm`) and `duration_hours` (required when service unit is `hour`)
- MUST implement lazy expiration: on `GET /api/v1/quotes` and `GET /api/v1/quotes/:id`, if `valid_until < now()` and status is `sent`, MUST update status to `expired` before returning
- MUST expose: `POST /api/v1/quotes`, `GET /api/v1/quotes`, `GET /api/v1/quotes/:id`, `PUT /api/v1/quotes/:id`, `POST /api/v1/quotes/:id/send`
- All endpoints MUST be protected by `JwtAuthGuard` and `RolesGuard` with minimum role `supervisor`
- `POST /api/v1/quotes/:id/send` MUST require the `quotes.send` permission
- All list endpoints MUST support pagination with correct `meta`
- All multi-step operations (send quote → update status → emit event) MUST be wrapped in a database transaction
- MUST emit domain events: `quote.created`, `quote.sent`, `quote.accepted`, `quote.expired`
- MUST emit audit log entry for every state transition
- Output MUST NEVER expose `deleted_at` — map to response DTO
</requirements>

## Subtasks

- [x] 7.1 Create `Quote` entity, migration, and tenant-scoped repository
- [x] 7.2 Implement the Quote state machine with invalid-transition 400 enforcement
- [x] 7.3 Implement `POST /api/v1/quotes` calculating `estimated_total_cents` via `PricingService.calculate()` from task_06
- [x] 7.4 Implement lazy expiration logic on `GET /api/v1/quotes` and `GET /api/v1/quotes/:id`
- [x] 7.5 Implement `POST /api/v1/quotes/:id/send` with `quotes.send` permission check, transaction wrapper, and event emission
- [x] 7.6 Implement remaining endpoints (`GET`, `PUT`) with pagination and response DTOs
- [x] 7.7 Emit domain events (`quote.created`, `quote.sent`, `quote.accepted`, `quote.expired`) and audit log entries for all transitions

## Implementation Details

Reference the TechSpec 'Quote Flow' section for entity fields, state machine transitions, and event payload shapes. Domain event emission at this stage can be direct calls; task_09 will wire them through the event bus without adding new logic.

The `quotes.send` permission must be read from the `AuthUser` permissions array injected by the task_03 middleware.

Lazy expiration: the status update to `expired` on read must be persisted in a database transaction before the response is returned, not merely returned as a virtual field.

### Relevant Files

- `packages/backend/src/modules/quotes/domain/quote.entity.ts` — Quote entity
- `packages/backend/src/modules/quotes/application/quote.service.ts` — state machine, pricing, lazy expiration
- `packages/backend/src/modules/quotes/interfaces/quotes.controller.ts` — endpoints
- `packages/backend/src/modules/quotes/validation/create-quote.dto.ts` — CreateQuoteDto
- `packages/backend/src/modules/services/application/pricing.service.ts` — imported from task_06
- `packages/backend/src/migrations/` — quote migration

### Dependent Files

- task_08 (Booking & Scheduling) transitions a quote to `accepted` as part of booking creation
- task_09 wires existing event emissions through the domain event bus

### Related ADRs

- [ADR-002: Monolithic Modular Architecture with Logical Multi-Tenant Isolation and JWT RBAC](../adrs/adr-002-monolith-jwt-rbac.md) — confirms RBAC and permission checks on endpoints

## Deliverables

- `Quote` entity with migration
- Quote state machine with invalid-transition rejection
- `estimated_total_cents` computed at creation via `PricingService`
- Lazy expiration implemented and persisted on read
- Five endpoints with guards, pagination, and DTO mapping
- Domain event emissions for all four quote events
- Audit log entries for all state transitions
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for state machine, pricing, lazy expiration, and cross-tenant isolation **(REQUIRED)**

## Tests

- Unit tests:
  - [x] `QuoteService.create()` correctly delegates to `PricingService.calculate()` and stores the returned cents value
  - [x] State machine: `draft → sent` transition is valid
  - [x] State machine: `sent → accepted` transition is valid
  - [x] State machine: `accepted → sent` transition is invalid and returns HTTP 400
  - [x] Lazy expiration: a `sent` quote with `valid_until` in the past returns with status `expired` after the GET call
  - [x] Draft quotes with `valid_until` in the past are NOT changed to `expired` by lazy expiration
  - [x] Accepted and rejected quotes do NOT change status regardless of `valid_until`
- Integration tests:
  - [x] `POST /api/v1/quotes` stores correct `estimated_total_cents` matching the pricing formula
  - [x] `POST /api/v1/quotes/:id/send` returns HTTP 403 when the user lacks the `quotes.send` permission
  - [x] Domain events `quote.created`, `quote.sent`, `quote.accepted` are emitted on the corresponding transitions
  - [x] Quotes from a different tenant are not accessible
  - [x] `GET /api/v1/quotes` pagination meta is accurate
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- State machine enforces valid transitions and rejects invalid ones with HTTP 400
- Lazy expiration is persisted, not just virtual
- `estimated_total_cents` always matches `PricingService.calculate()` output
- Quotes are strictly tenant-isolated
