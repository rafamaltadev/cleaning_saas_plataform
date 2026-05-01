---
status: completed
title: "Frontend MVP Part B: Quotes, Bookings & Dashboard"
type: feature
complexity: high
dependencies: [task_13]
---

# Task 14: Frontend MVP Part B — Quotes, Bookings & Dashboard

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

## Design System Reference

MUST read and follow `.compozy/tasks/cleaning-saas/_design_system.md` before writing any frontend code.
All UI MUST conform strictly to the design system defined there — colors, typography, spacing, components, responsiveness, and screen patterns.

## Overview

Implements all Part B screens: quotes, bookings, and dashboard. Builds on top of the shell and components established in T13. No backend changes in this task.

<critical>
- ALWAYS READ the design system reference before starting
- ALL screens MUST be mobile-first following the responsiveness rules defined in the design system
- NEVER invent colors, spacing, or components outside the design system
- REUSE all components created in T13 — do not duplicate
- TESTS REQUIRED — every deliverable MUST include tests
</critical>

<requirements>

### Quotes
- MUST implement Quote list screen: paginated table consuming GET /api/v1/quotes — use the Data Listing Screen pattern — display status with visual distinction per state using badges (draft, sent, accepted, expired, rejected)
- MUST implement Quote create screen: form consuming POST /api/v1/quotes — includes service selection, pricing rule selection, and real-time estimated total display (computed client-side using the exact pricing formula defined in the SPEC)
- MUST implement Quote detail screen: display all quote fields — use the Detail View Screen pattern
- MUST implement Quote send action: button consuming POST /api/v1/quotes/:id/send — visible only to users with the quotes.send permission

### Bookings
- MUST implement Booking list screen: paginated table consuming GET /api/v1/bookings — use the Data Listing Screen pattern — display status with badges
- MUST implement Booking create screen: form consuming POST /api/v1/bookings — generates and sends a unique idempotency_key from the frontend
- MUST implement Booking detail screen: display all booking fields — use the Detail View Screen pattern
- MUST implement Booking complete action: button consuming POST /api/v1/bookings/:id/complete — visible only to supervisor and tenant_admin roles

### Dashboard
- MUST implement Dashboard screen as the default landing screen after login
- MUST follow the Dashboard Screen pattern defined in the design system (stats cards at top, recent activity list, sidebar navigation)
- Dashboard MUST display the following metrics computed via existing API responses (no dedicated analytics endpoint):
  - Total confirmed bookings (from GET /api/v1/bookings filtered by status=confirmed)
  - Total open quotes (draft + sent, from GET /api/v1/quotes)
  - Last 5 notifications (from GET /api/v1/notifications)
- Feature flags MUST be checked before rendering feature-gated UI elements
- All screens MUST respect the authenticated user's permissions for UI element visibility

</requirements>

## Subtasks

- [x] 14.1 Implement Quote list, create, detail screens and send action
- [x] 14.2 Implement Booking list, create, detail screens and complete action
- [x] 14.3 Implement Dashboard screen with KPI cards and recent activity

## Deliverables

- Quote list, create, and detail screens with status badges and real-time pricing
- Booking list, create, and detail screens with idempotency key generation
- Dashboard with KPI cards and last 5 notifications
- All screens mobile-first and design-system compliant
- Unit and component tests for all screens and interactions (REQUIRED)

## Tests

- Unit / component tests:
  - [x] Quote list renders paginated results with correct status badges per state
  - [x] Quote create form computes estimated total client-side correctly (matching SPEC formula)
  - [x] Quote send button is hidden for staff role
  - [x] Booking list renders paginated results with correct status badges
  - [x] Booking create form generates and sends a unique idempotency_key
  - [x] Booking complete button is hidden for staff role
  - [x] Dashboard displays correct count for confirmed bookings
  - [x] Dashboard displays correct count for open quotes (draft + sent)
  - [x] Dashboard renders last 5 notifications in correct order
  - [x] Feature-gated UI elements are hidden when the corresponding flag is disabled for the tenant

## Success Criteria

- All tests passing
- Quotes, bookings, and dashboard screens functional end-to-end
- All screens follow the design system strictly (colors, spacing, components, responsiveness)
- Real-time pricing calculation matches the SPEC formula exactly
- No backend changes were made
- No design system tokens were invented or overridden
