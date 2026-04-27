---
status: pending
title: "Full System Validation (Integration & E2E)"
type: test
complexity: critical
dependencies:
  - task_14
---

# Task 15: Full System Validation (Integration & E2E)

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

Contains NO production code changes. Creates a comprehensive integration and E2E test suite in `tests/e2e/`, `tests/integration/`, and `tests/support/` covering the full system: auth lifecycle, cross-tenant isolation, RBAC enforcement, the complete quote-to-booking-to-invoice flow, idempotency, soft delete, feature flag gating, and browser-level frontend flows. All tests run against the local Docker Compose environment with seed data from task_02.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- This task MUST contain NO production code changes
- All test files MUST be created in `tests/e2e/` and `tests/integration/` — no existing file outside these folders MAY be modified
- The agent MUST choose the most appropriate E2E testing tool for the project stack and context (e.g. Playwright, Cypress, Supertest, or a combination) — the choice MUST be justified in a brief comment at the top of the test suite file
- All tests MUST run against the local environment (`docker compose up` with seed data from task_02)
- If a required fixture, factory, or test helper does not exist, the agent MAY create it inside `tests/support/` — no production code may be created or modified
- MUST cover Authentication & Security: full auth lifecycle (login → access protected endpoint → token expiry → refresh → retry → logout), reuse detection (revoked token revokes all sessions → 401), cross-tenant access (tenant A → tenant B resource → 403), CORS rejection, rate limiting (auth endpoint 429)
- MUST cover Quote-to-Booking E2E flow: create service → create pricing rule → create client → create quote → send quote → accept quote → verify booking created → verify invoice generated → verify notifications enqueued → verify audit log entries written
- MUST cover Billing & Idempotency: submit payment with `idempotency_key` → submit same request again → verify one payment record → verify `payment.received` emitted once
- MUST cover Soft Delete: create entity → soft delete → verify absent from list → verify absent from GET by ID → verify retrievable with `withDeleted` if applicable
- MUST cover RBAC enforcement across all endpoints: `staff` role (allowed vs. 403), `supervisor` role (allowed vs. tenant_admin-only 403), `tenant_admin` (full access)
- MUST cover Feature flags: disable `sms_notifications` → trigger `booking.confirmed` → verify SMS NOT dispatched → verify email IS dispatched
- MUST cover Frontend E2E (browser): login → clients → create client → create quote → send quote → create booking → complete booking → verify dashboard metrics updated; transparent token refresh during long session; role-based UI restrictions in browser
</requirements>

## Subtasks

- [ ] 15.1 Choose and justify the E2E testing tool in a comment at the top of the test suite file; set up test infrastructure in `tests/` with shared fixtures and factories in `tests/support/`
- [ ] 15.2 Write authentication & security integration tests (auth lifecycle, reuse detection, cross-tenant, CORS, rate limiting)
- [ ] 15.3 Write the full quote-to-booking E2E integration test covering all intermediate state verifications
- [ ] 15.4 Write billing & idempotency integration tests
- [ ] 15.5 Write soft-delete integration tests covering list, GET by ID, and `withDeleted` scenarios
- [ ] 15.6 Write RBAC enforcement integration tests for all three roles across all endpoints
- [ ] 15.7 Write feature-flag gating integration test for `sms_notifications`
- [ ] 15.8 Write browser E2E tests using the chosen tool covering the three frontend scenarios

## Implementation Details

Reference the TechSpec for endpoint paths, expected response shapes, and role permission matrix when writing RBAC tests. Seed data from task_02 provides the three known users (`admin@seed.local`, `supervisor@seed.local`, `staff@seed.local`) and the default tenant — tests should use these fixtures for reproducibility.

Test tool justification comment example (at top of main suite file):
```
// E2E tool: Playwright (browser flows) + Supertest (API integration)
// Rationale: Supertest integrates directly with NestJS HTTP adapter for fast API tests;
// Playwright provides cross-browser coverage for frontend flows without a running dev server dependency.
```

### Relevant Files

- `tests/e2e/` — browser E2E test files
- `tests/integration/` — API integration test files
- `tests/support/` — shared fixtures, factories, helpers
- `tests/support/factories/user.factory.ts` — test user factory
- `tests/support/factories/tenant.factory.ts` — test tenant factory
- `docker-compose.yml` — test environment reference

### Dependent Files

- No production files are modified or created in this task

### Related ADRs

- [ADR-002: Monolithic Modular Architecture with Logical Multi-Tenant Isolation and JWT RBAC](../adrs/adr-002-monolith-jwt-rbac.md) — defines the security model that all tests validate

## Deliverables

- E2E tool choice justified in a comment at the top of the test suite file
- Test files in `tests/e2e/`, `tests/integration/`, and `tests/support/` only
- Authentication & security integration tests
- Quote-to-booking full-flow integration test
- Billing & idempotency integration tests
- Soft-delete integration tests
- RBAC enforcement tests for all three roles
- Feature-flag gating test
- Browser E2E tests for three frontend scenarios
- No production code created or modified **(REQUIRED)**

## Tests

- Integration tests:
  - [ ] Full auth lifecycle: login → access protected endpoint → simulate token expiry → refresh → retry original request → logout — all steps succeed
  - [ ] Reuse detection: logout → attempt refresh with revoked token → all sessions revoked → HTTP 401 returned
  - [ ] Cross-tenant: authenticate as tenant A → `GET /api/v1/clients` for tenant B resource → HTTP 403 returned
  - [ ] CORS: request from non-allowlisted origin returns HTTP 4xx rejection
  - [ ] Rate limiting: exceed auth endpoint threshold → HTTP 429 returned before global threshold
  - [ ] Quote-to-booking: `POST /services` → `POST /pricing-rules` → `POST /clients` → `POST /quotes` → `POST /quotes/:id/send` → `PUT /quotes/:id` (accepted) → verify booking exists → verify invoice created → verify notification enqueued → verify audit log has entries for all transitions
  - [ ] Idempotency: `POST /api/v1/payments` with same `idempotency_key` twice → only one `Payment` record in DB → `payment.received` event emitted exactly once
  - [ ] Soft delete: create client → soft-delete client → `GET /api/v1/clients` does not include it → `GET /api/v1/clients/:id` returns 404 → `withDeleted=true` retrieves it
  - [ ] RBAC `staff`: `POST /api/v1/bookings` → HTTP 403; `POST /api/v1/availability` → HTTP 201
  - [ ] RBAC `supervisor`: `GET /api/v1/tenants/me` → HTTP 403; `GET /api/v1/clients` → HTTP 200
  - [ ] RBAC `tenant_admin`: all endpoints return non-403 responses
  - [ ] Feature flag `sms_notifications` disabled → `booking.confirmed` event → SMS notification NOT dispatched → email notification dispatched
- Browser E2E tests:
  - [ ] Login → navigate to clients → create client → create quote for client → send quote → create booking → complete booking → dashboard shows updated confirmed booking count
  - [ ] Token refresh: simulate access token expiry mid-session → page continues to work without login redirect
  - [ ] Role-based UI: authenticate as `staff` → Quote send button not visible → Booking complete button not visible
- Test coverage target: >=80% of test scenarios passing
- All tests must pass against Docker Compose environment with seed data

## Success Criteria

- All tests passing against the local Docker Compose environment with seed data from task_02
- No production code was created or modified
- Test files exist only inside `tests/e2e/`, `tests/integration/`, and `tests/support/`
- The chosen E2E tool is justified in a comment at the top of the suite
- Full quote-to-booking-to-invoice flow verified end-to-end
- RBAC correctly enforced for all three roles across all tested endpoints
