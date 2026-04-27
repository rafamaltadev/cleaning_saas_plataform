---
status: pending
title: "Frontend MVP Part B: Quotes, Bookings & Dashboard"
type: frontend
complexity: high
dependencies:
  - task_13
---

# Task 14: Frontend MVP Part B: Quotes, Bookings & Dashboard

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

Extends the task_13 shell with Quote and Booking screens, a Dashboard aggregating metrics from existing API responses, client-side real-time pricing calculation matching the SPEC formula, frontend-generated idempotency keys for booking creation, and feature-flag-gated UI elements. No backend changes are made in this task.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement Quote list screen: paginated table consuming `GET /api/v1/quotes`, displaying status with visual distinction per state
- MUST implement Quote create screen: form consuming `POST /api/v1/quotes` with service selection, pricing rule selection, and real-time estimated total display computed client-side using the same formula defined in the SPEC
- MUST implement Quote send action: button consuming `POST /api/v1/quotes/:id/send` — visible only to users with the `quotes.send` permission
- MUST implement Booking list screen: paginated table consuming `GET /api/v1/bookings`
- MUST implement Booking create screen: form consuming `POST /api/v1/bookings` — generates and sends a unique `idempotency_key` from the frontend
- MUST implement Booking complete action: button consuming `POST /api/v1/bookings/:id/complete` — visible only to `supervisor` and `tenant_admin` roles
- MUST implement Dashboard screen with: total confirmed bookings, total open (draft + sent) quotes, last 5 notifications — all computed via existing API responses (no dedicated analytics endpoint)
- All screens MUST respect the authenticated user's permissions for UI element visibility
- MUST check feature flags from the backend before rendering feature-gated UI elements
- MUST NOT make backend changes in this task
</requirements>

## Subtasks

- [ ] 14.1 Implement Quote list screen with paginated table and per-state visual status badges
- [ ] 14.2 Implement Quote create screen with service/pricing-rule selection and client-side estimated total calculation (SPEC formula)
- [ ] 14.3 Implement Quote send button gated by `quotes.send` permission
- [ ] 14.4 Implement Booking list screen with paginated table
- [ ] 14.5 Implement Booking create screen generating a unique `idempotency_key` (e.g. UUID v4) per submission
- [ ] 14.6 Implement Booking complete button gated by `supervisor` / `tenant_admin` role
- [ ] 14.7 Implement Dashboard screen computing metrics from `GET /api/v1/bookings`, `GET /api/v1/quotes`, `GET /api/v1/notifications`
- [ ] 14.8 Fetch feature flags from backend and conditionally render feature-gated UI elements

## Implementation Details

Reference the TechSpec 'Frontend' section for pricing formula implementation and feature-flag API usage. The client-side pricing calculation must use the identical formula from the SPEC (same order: unit → multiplier → discount_percent → manual_discount_percent → round to cents) so that the displayed estimate matches the server-computed value.

`idempotency_key` for bookings must be a freshly generated UUID v4 on each form submission — not a static value.

Feature flags should be fetched once after login and stored in context; individual screens read from context to decide visibility.

### Relevant Files

- `packages/frontend/src/features/quotes/QuoteListPage.tsx` — quote list with status badges
- `packages/frontend/src/features/quotes/QuoteCreatePage.tsx` — create form with client-side pricing
- `packages/frontend/src/features/quotes/pricing.util.ts` — client-side pricing formula
- `packages/frontend/src/features/bookings/BookingListPage.tsx` — booking list
- `packages/frontend/src/features/bookings/BookingCreatePage.tsx` — booking create with idempotency key
- `packages/frontend/src/features/dashboard/DashboardPage.tsx` — metrics aggregation
- `packages/frontend/src/hooks/useFeatureFlags.ts` — feature flag fetch and context

### Dependent Files

- task_13 shell (`ProtectedRoute`, `auth.store`) used by all screens in this task

### Related ADRs

- [ADR-002: Monolithic Modular Architecture with Logical Multi-Tenant Isolation and JWT RBAC](../adrs/adr-002-monolith-jwt-rbac.md) — RBAC claims used for UI visibility gating

## Deliverables

- Quote list, create screens with send action
- Booking list, create screens with complete action
- Dashboard screen with three metric displays
- Client-side pricing formula matching SPEC
- Frontend-generated idempotency keys on booking creation
- Feature-flag-gated UI element rendering
- Unit/component tests with 80%+ coverage **(REQUIRED)**
- Integration tests for quote creation pricing, booking idempotency key, and dashboard metrics **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] Quote list renders status badges with visual distinction for `draft`, `sent`, `accepted`, `expired`, `rejected` states
  - [ ] Quote create form client-side pricing calculation matches the SPEC formula for `sqm` unit type
  - [ ] Quote create form client-side pricing calculation matches the SPEC formula for `hour` unit type
  - [ ] Quote create form client-side pricing calculation matches the SPEC formula for `flat` unit type
  - [ ] Quote send button is not rendered for a user without the `quotes.send` permission
  - [ ] Booking create form generates a new unique `idempotency_key` (UUID v4 format) on each submission
  - [ ] Booking complete button is not rendered for `staff` role
  - [ ] Dashboard displays the correct total for confirmed bookings given a mock API response
  - [ ] Dashboard renders the last 5 notifications in descending order
  - [ ] Feature-gated UI element is hidden when the corresponding feature flag is `false`
- Integration tests:
  - [ ] Quote list renders paginated results and navigates between pages
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Client-side pricing formula produces values identical to server-side calculation for all unit types
- Each booking create submission generates a fresh unique idempotency key
- `staff` role cannot see the Quote send button or Booking complete button
- Feature-gated elements are hidden when the corresponding flag is disabled for the tenant
