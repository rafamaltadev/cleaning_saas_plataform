---
status: pending
title: "Notifications"
type: backend
complexity: high
dependencies:
  - task_09
---

# Task 10: Notifications

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

Implements the `Notification` entity with migration, an internal sequential notification queue, injectable email and SMS adapters (stubbed for development), domain event subscriptions that enqueue the correct notifications with SPEC-defined payloads, `{{variable}}` interpolation in adapters, and the two notification endpoints. SMS dispatch is gated by `FeatureFlagService` from task_02.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `Notification` entity and migration with all fields defined in the SPEC including `deleted_at`
- MUST implement an internal sequential notification queue — no external queue dependency
- MUST implement email adapter and SMS adapter — both MAY be stubbed in development (e.g. log to console) but MUST be injectable and replaceable without changing business logic
- MUST subscribe to the following domain events via the event bus from task_09 and enqueue notifications:
  - `quote.sent` → enqueue notification with template `quote.sent`
  - `quote.accepted` → enqueue notification with template `quote.accepted`
  - `quote.expired` → enqueue notification with template `quote.expired`
  - `booking.confirmed` → enqueue notification with templates `booking.confirmed` (email + sms)
  - `booking.completed` → enqueue notification with template `booking.completed`
  - `assignment.created` → enqueue notification with template `assignment.created`
- The `payload` field MUST contain exactly the variables defined in the SPEC for each template
- Adapters MUST interpolate variables using the `{{variable}}` pattern
- MUST expose: `GET /api/v1/notifications`, `POST /api/v1/notifications/send`
- `GET /api/v1/notifications` MUST support pagination with correct `meta` and be scoped by `tenant_id`
- All endpoints MUST be protected by `JwtAuthGuard` with minimum role `supervisor`
- MUST check `FeatureFlagService` before dispatching SMS notifications — if the `sms_notifications` flag is disabled for the tenant, MUST skip SMS dispatch silently
</requirements>

## Subtasks

- [ ] 10.1 Create `Notification` entity and migration
- [ ] 10.2 Implement the internal sequential notification queue
- [ ] 10.3 Implement injectable email and SMS adapters with `{{variable}}` interpolation (stubbed for development)
- [ ] 10.4 Subscribe to the six domain events and enqueue notifications with SPEC-defined payloads and templates
- [ ] 10.5 Gate SMS dispatch with `FeatureFlagService.isEnabled('sms_notifications', tenantId)`
- [ ] 10.6 Implement `GET /api/v1/notifications` (paginated, tenant-scoped) and `POST /api/v1/notifications/send` with role guard

## Implementation Details

Reference the TechSpec 'Notifications' section for entity fields, template names, and exact payload variable lists per template. The adapter interface must be the sole point of variation — swapping email or SMS provider must require only a new adapter class, not changes to the queue or subscriber logic.

`FeatureFlagService` is already injectable from task_02's shared module; import it without re-declaring.

### Relevant Files

- `packages/backend/src/modules/notifications/domain/notification.entity.ts` — Notification entity
- `packages/backend/src/modules/notifications/application/notification-queue.service.ts` — sequential queue
- `packages/backend/src/modules/notifications/application/notification.service.ts` — enqueue + dispatch logic
- `packages/backend/src/modules/notifications/infrastructure/email.adapter.ts` — email adapter
- `packages/backend/src/modules/notifications/infrastructure/sms.adapter.ts` — SMS adapter
- `packages/backend/src/modules/notifications/interfaces/notifications.controller.ts` — endpoints
- `packages/backend/src/migrations/` — notification migration
- `packages/backend/src/modules/shared/feature-flag.service.ts` — imported from task_02

### Dependent Files

- task_15 (E2E) verifies feature-flag-gated SMS suppression

### Related ADRs

- [ADR-001: Full-Featured Launch Approach](../adrs/adr-001-full-featured-launch.md) — notification system is part of the communication automation requirement

## Deliverables

- `Notification` entity with migration
- Sequential notification queue
- Injectable email and SMS adapters with `{{variable}}` interpolation
- Six event-to-notification subscriptions with correct templates and payloads
- `sms_notifications` feature flag gate on SMS dispatch
- Two endpoints with role guard and pagination
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for event-to-notification flow, flag gating, and status transitions **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] `quote.sent` event subscription enqueues a notification with template `quote.sent` and the payload variables defined in the SPEC
  - [ ] `booking.confirmed` event subscription enqueues both an email and an SMS notification
  - [ ] SMS notification is NOT enqueued when `FeatureFlagService.isEnabled('sms_notifications', tenantId)` returns `false`
  - [ ] Notification status transitions from `pending` to `sent` on successful adapter dispatch
  - [ ] Notification status transitions from `pending` to `failed` when the adapter throws
  - [ ] Replacing the email adapter with a test double does not require changing the queue or subscriber logic
- Integration tests:
  - [ ] `GET /api/v1/notifications` does not return notifications belonging to a different tenant
  - [ ] Soft-deleted notifications do not appear in `GET /api/v1/notifications`
  - [ ] `GET /api/v1/notifications` pagination meta is accurate
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- All six domain events correctly map to their specified notification templates and payloads
- SMS dispatch is silently skipped when `sms_notifications` flag is off
- Adapters are replaceable without any changes to notification business logic
- Notifications are strictly scoped to the requesting tenant
