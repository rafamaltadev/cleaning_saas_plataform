---
status: completed
title: "Booking & Scheduling"
type: backend
complexity: high
dependencies:
  - task_07
---

# Task 08: Booking & Scheduling

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

Implements the `Booking`, `Availability`, and `Assignment` entities with migrations, idempotency-key enforcement on booking creation, atomic booking creation transaction (quote update + booking + audit + event), scheduling conflict detection for availability slots, and all booking/availability/assignment endpoints. The `staff` role is permitted only on `POST /api/v1/availability`; all other endpoints require minimum `supervisor`.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `Booking`, `Availability`, and `Assignment` entities and migrations with all fields defined in the SPEC including `deleted_at`
- `Booking` MUST include an `idempotency_key` field — if a `POST /api/v1/bookings` request arrives with an existing `idempotency_key` for the same tenant, the original response MUST be returned without re-executing
- Booking creation MUST be wrapped in a database transaction: quote status update to `accepted` + booking creation + audit log entry + domain event emission — all succeed or all fail
- MUST implement scheduling conflict detection: creating or updating availability MUST check for overlapping time slots for the same employee on the same date — return HTTP 400 on conflict
- MUST expose: `POST /api/v1/bookings`, `GET /api/v1/bookings`, `GET /api/v1/bookings/:id`, `PUT /api/v1/bookings/:id`, `POST /api/v1/bookings/:id/complete`, `GET /api/v1/availability`, `POST /api/v1/availability`, `GET /api/v1/assignments`, `POST /api/v1/assignments`
- `POST /api/v1/availability` MUST accept `staff` role — all other endpoints require minimum `supervisor` role
- All list endpoints MUST support pagination with correct `meta`
- MUST emit domain events: `booking.confirmed`, `booking.completed`
- MUST emit audit log entry for every status transition
- Output MUST NEVER expose `deleted_at` — map to response DTO
</requirements>

## Subtasks

- [x] 8.1 Create `Booking`, `Availability`, and `Assignment` entities and migrations
- [x] 8.2 Implement idempotency-key check on `POST /api/v1/bookings` — return original response if key already exists for the tenant
- [x] 8.3 Implement atomic booking creation transaction: quote status → accepted, booking record, audit log, domain event
- [x] 8.4 Implement scheduling conflict detection for `POST /api/v1/availability` and `PUT /api/v1/bookings/:id`
- [x] 8.5 Implement booking endpoints with role guards, pagination, and response DTOs
- [x] 8.6 Implement availability and assignment endpoints with appropriate role guards and pagination

## Implementation Details

Reference the TechSpec 'Booking & Scheduling' section for entity fields, idempotency strategy, and conflict-detection logic. The idempotency check must be performed inside the same transaction as booking creation to avoid race conditions.

Domain event emissions (`booking.confirmed`, `booking.completed`) are direct calls at this stage; task_09 will wire them through the event bus without adding new logic.

Conflict detection: an availability slot overlaps if `(new_start < existing_end) AND (new_end > existing_start)` for the same `employee_id` and date.

### Relevant Files

- `packages/backend/src/modules/bookings/domain/booking.entity.ts` — Booking entity
- `packages/backend/src/modules/bookings/domain/availability.entity.ts` — Availability entity
- `packages/backend/src/modules/bookings/domain/assignment.entity.ts` — Assignment entity
- `packages/backend/src/modules/bookings/application/booking.service.ts` — booking logic, transactions
- `packages/backend/src/modules/bookings/application/scheduling.service.ts` — conflict detection
- `packages/backend/src/modules/bookings/interfaces/bookings.controller.ts` — booking endpoints
- `packages/backend/src/modules/bookings/interfaces/availability.controller.ts` — availability endpoints
- `packages/backend/src/modules/bookings/interfaces/assignments.controller.ts` — assignment endpoints
- `packages/backend/src/migrations/` — booking, availability, assignment migration files

### Dependent Files

- task_09 wires `booking.confirmed` and `booking.completed` through the domain event bus
- task_11 (Billing) subscribes to `booking.completed` to generate invoices

### Related ADRs

- [ADR-002: Monolithic Modular Architecture with Logical Multi-Tenant Isolation and JWT RBAC](../adrs/adr-002-monolith-jwt-rbac.md) — confirms RBAC role differentiation and tenant isolation

## Deliverables

- `Booking`, `Availability`, `Assignment` entities with migrations
- Idempotency-key enforcement on booking creation
- Atomic booking creation transaction
- Scheduling conflict detection on availability
- Nine endpoints with role guards, pagination, and DTO mapping
- Domain events `booking.confirmed` and `booking.completed` emitted
- Audit log entries for all status transitions
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for idempotency, atomic transaction, conflict detection, and role isolation **(REQUIRED)**

## Tests

- Unit tests:
  - [x] Booking creation with an existing `idempotency_key` for the same tenant returns the original response without inserting a new record
  - [x] Conflict detection: `availability` slot with overlapping `start_time`/`end_time` for the same `employee_id` and date returns HTTP 400
  - [x] Conflict detection: non-overlapping availability slot for the same employee is accepted
- Integration tests:
  - [x] Booking creation transaction rolls back completely if the quote status update fails — no partial booking record persists
  - [x] `POST /api/v1/bookings/:id/complete` emits the `booking.completed` domain event
  - [x] Bookings from a different tenant are not accessible
  - [x] `staff` role can `POST /api/v1/availability` but receives HTTP 403 on `POST /api/v1/bookings`
  - [x] Soft-deleted bookings do not appear in `GET /api/v1/bookings`
  - [x] `GET /api/v1/bookings` pagination meta is accurate
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Idempotency correctly prevents duplicate bookings on replay
- Atomic transaction leaves no partial state on failure
- Scheduling conflict detection correctly blocks overlapping slots
- Role restrictions enforced: staff limited to availability endpoint only
