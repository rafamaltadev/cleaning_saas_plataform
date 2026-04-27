---
status: pending
title: "Domain Events & Audit Log Infrastructure"
type: backend
complexity: high
dependencies:
  - task_08
---

# Task 09: Domain Events & Audit Log Infrastructure

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

Implements the in-process domain event bus, wires all existing event emissions from task_07 and task_08 through it, and implements `AuditLogService` as a bus subscriber that writes audit entries. No new business logic is added — this task only introduces infrastructure and refactors existing direct emission calls to use the bus. No new endpoints are introduced.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement the internal domain event bus: a lightweight in-process event emitter allowing modules to emit and subscribe to events without direct service-to-service coupling
- The event bus MUST support all events defined in the SPEC: `quote.created`, `quote.sent`, `quote.accepted`, `quote.expired`, `booking.confirmed`, `booking.completed`, `payment.received`
- All previously emitted events in task_07 and task_08 MUST be wired through this event bus — refactor existing emission calls to use the new bus; DO NOT add new business logic
- MUST implement `AuditLogService` that subscribes to all domain events and writes entries to the `audit_logs` table
- `AuditLogService` MUST NOT be called directly from controllers or application services — it MUST only receive events via the bus
- Audit log entries MUST include: `tenant_id`, `user_id`, `action`, `entity`, `entity_id`, `payload` (state snapshot), `created_at`
- MUST NOT introduce new endpoints in this task
</requirements>

## Subtasks

- [ ] 9.1 Implement the domain event bus module with a typed in-process emitter supporting the seven specified event names
- [ ] 9.2 Refactor event emission calls in task_07 (QuoteService) to use the new bus — no logic changes, only replace direct calls
- [ ] 9.3 Refactor event emission calls in task_08 (BookingService) to use the new bus — no logic changes, only replace direct calls
- [ ] 9.4 Implement `AuditLogService` subscribing to all seven domain events and writing to the `audit_logs` table with all required fields
- [ ] 9.5 Verify `AuditLogService` is never injected into or called directly from any controller or application service

## Implementation Details

Reference the TechSpec 'Domain Events & Audit Log' section for event payload shapes and audit log field definitions. The event bus can be built on Node.js `EventEmitter` or NestJS's built-in `EventEmitter2` — whichever fits the project's module system.

The refactoring of task_07 and task_08 emission calls must be a pure substitution: the same event names and payloads, now routed through the bus instead of direct calls.

### Relevant Files

- `packages/backend/src/common/events/domain-event-bus.ts` — event bus implementation
- `packages/backend/src/common/events/domain-events.types.ts` — typed event definitions
- `packages/backend/src/modules/audit/application/audit-log.service.ts` — AuditLogService
- `packages/backend/src/modules/quotes/application/quote.service.ts` — refactored to emit via bus (task_07)
- `packages/backend/src/modules/bookings/application/booking.service.ts` — refactored to emit via bus (task_08)

### Dependent Files

- task_10 (Notifications) subscribes to the event bus to enqueue notifications
- task_11 (Billing) subscribes to `booking.completed` via the bus

### Related ADRs

- [ADR-002: Monolithic Modular Architecture with Logical Multi-Tenant Isolation and JWT RBAC](../adrs/adr-002-monolith-jwt-rbac.md) — confirms monolith approach, in-process events are consistent with this decision

## Deliverables

- Domain event bus module supporting all seven event types
- Refactored `QuoteService` and `BookingService` emitting through the bus
- `AuditLogService` subscribing to all events and writing complete audit entries
- No new endpoints or business logic
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests verifying bus-to-audit-log flow for all event types **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] Emitting `quote.created` on the bus triggers the `AuditLogService` subscriber
  - [ ] Emitting `booking.completed` on the bus triggers the `AuditLogService` subscriber
  - [ ] `AuditLogService` is not exported as injectable for direct calling from controllers or services
- Integration tests:
  - [ ] Emitting `quote.created` writes an audit log entry with all required fields: `tenant_id`, `user_id`, `action`, `entity`, `entity_id`, `payload`, `created_at`
  - [ ] Emitting `booking.completed` writes an audit log entry with all required fields
  - [ ] `quote.sent` event emitted from `QuoteService` (refactored from task_07) is received by `AuditLogService` and produces a correct log entry
  - [ ] `booking.confirmed` event emitted from `BookingService` (refactored from task_08) is received by `AuditLogService` and produces a correct log entry
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- All seven event types are routed through the bus
- `AuditLogService` never called directly from application code
- Audit entries contain all required fields for every event type
- No business logic changed in task_07 or task_08 modules — only emission routing changed
