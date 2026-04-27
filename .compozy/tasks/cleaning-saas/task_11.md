---
status: pending
title: "Billing"
type: backend
complexity: high
dependencies:
  - task_10
---

# Task 11: Billing

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

Implements the `Payment` and `Invoice` entities with migrations, idempotency-key enforcement on payment creation, automatic invoice generation on `booking.completed` events (atomic transaction), sequential tenant-scoped invoice number generation (e.g. `INV-0001`), and the three billing endpoints. Emits the `payment.received` domain event when a payment reaches `completed` status.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `Payment` and `Invoice` entities and migrations with all fields defined in the SPEC including `deleted_at`
- `Payment` MUST include an `idempotency_key` field — if a `POST /api/v1/payments` request arrives with an existing `idempotency_key` for the same tenant, the original response MUST be returned without re-executing
- MUST subscribe to the `booking.completed` domain event (from task_09): automatically generate an `Invoice` when a booking is completed — MUST be wrapped in a database transaction (invoice creation + payment record linkage + audit log)
- MUST implement invoice number generation: sequential, tenant-scoped, human-readable (e.g. `INV-0001`)
- MUST expose: `GET /api/v1/invoices`, `POST /api/v1/invoices`, `POST /api/v1/payments`
- All endpoints MUST be protected by `JwtAuthGuard` and `RolesGuard` with minimum role `supervisor`
- All list endpoints MUST support pagination with correct `meta` and be scoped by `tenant_id`
- MUST emit domain event `payment.received` when a payment status is updated to `completed`
- MUST emit audit log entry for invoice creation and payment recording
- Output MUST NEVER expose `deleted_at` — map to response DTO
</requirements>

## Subtasks

- [ ] 11.1 Create `Payment` and `Invoice` entities and migrations
- [ ] 11.2 Implement idempotency-key check on `POST /api/v1/payments`
- [ ] 11.3 Subscribe to `booking.completed` event and generate an invoice atomically (invoice + payment linkage + audit log in one transaction)
- [ ] 11.4 Implement sequential tenant-scoped invoice number generation (`INV-0001`, `INV-0002`, ...)
- [ ] 11.5 Implement billing endpoints with role guards, pagination, DTO mapping, and `payment.received` event emission

## Implementation Details

Reference the TechSpec 'Billing' section for entity field definitions, invoice number format, and idempotency strategy. Invoice number sequences must be strictly per-tenant — tenant A's `INV-0001` and tenant B's `INV-0001` can coexist. Use a database-level lock or sequence to avoid gaps or duplicates under concurrent requests.

The `booking.completed` subscription must use the event bus from task_09; it must NOT call `BookingService` directly.

### Relevant Files

- `packages/backend/src/modules/billing/domain/invoice.entity.ts` — Invoice entity
- `packages/backend/src/modules/billing/domain/payment.entity.ts` — Payment entity
- `packages/backend/src/modules/billing/application/billing.service.ts` — invoice generation, idempotency, event subscription
- `packages/backend/src/modules/billing/application/invoice-number.service.ts` — sequential number generator
- `packages/backend/src/modules/billing/interfaces/invoices.controller.ts` — invoice endpoints
- `packages/backend/src/modules/billing/interfaces/payments.controller.ts` — payment endpoint
- `packages/backend/src/migrations/` — invoice and payment migration files

### Dependent Files

- task_09 domain event bus provides the `booking.completed` subscription mechanism
- task_15 (E2E) verifies idempotency and invoice generation in the full flow

### Related ADRs

- [ADR-001: Full-Featured Launch Approach](../adrs/adr-001-full-featured-launch.md) — billing is part of the required feature set for full-featured launch

## Deliverables

- `Payment` and `Invoice` entities with migrations
- Idempotency-key enforcement on payment creation
- Automatic invoice generation on `booking.completed` with atomic transaction
- Sequential tenant-scoped invoice number generator
- Three endpoints with role guards, pagination, and DTO mapping
- `payment.received` domain event emitted
- Audit log entries for invoice creation and payment recording
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for idempotency, atomicity, and invoice sequence isolation **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] `InvoiceNumberService` generates `INV-0001` for the first invoice, `INV-0002` for the second, per tenant
  - [ ] `BillingService` with an existing `idempotency_key` for the same tenant returns the original payment response without inserting a new record
  - [ ] `payment.received` event is emitted when a payment status is set to `completed`
- Integration tests:
  - [ ] `booking.completed` event automatically generates an invoice for the correct tenant
  - [ ] Invoice generation transaction rolls back completely if any step fails — no partial invoice or payment record persists
  - [ ] Invoice number sequences are independent per tenant: tenant A and tenant B each start at `INV-0001`
  - [ ] `POST /api/v1/payments` with an existing `idempotency_key` returns the original response without creating a duplicate payment
  - [ ] Invoices from a different tenant are not accessible via `GET /api/v1/invoices`
  - [ ] Soft-deleted invoices do not appear in `GET /api/v1/invoices`
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Invoice generation on `booking.completed` is fully atomic
- Invoice number sequences are tenant-scoped and never produce duplicates
- Payment idempotency correctly prevents double-charging on replay
- `payment.received` domain event emitted and wired through the bus
