---
status: completed
title: "Full System Validation (Integration & E2E)"
type: validation
complexity: critical
dependencies: [task_15]
---

# Task 16: Full System Validation (Integration & E2E)

> **NOTE FOR AGENT:** This task was previously numbered T15. It has been renumbered to T16 to accommodate the new T15 (Landing Page). If any file in the codebase references this task as T15, rename the reference to T16. Do not modify any production code — only update task references in documentation or test suite comments.

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

Full system validation covering backend integration, end-to-end browser flows, security, and the public landing page. This task contains NO production code changes.

<requirements>
- This task contains NO production code changes
- All test files MUST be created in a dedicated top-level folder: tests/e2e/ and tests/integration/ — no existing file outside these folders may be modified
- The agent MUST choose the most appropriate E2E testing tool for the project stack and context (e.g. Playwright, Cypress, Supertest, or a combination) — the choice MUST be justified in a brief comment at the top of the test suite file
- All tests run against the local environment (Docker Compose up with seed data from T02)
- If a required fixture, factory, or test helper does not exist, the agent MAY create it inside tests/support/ — no production code may be created or modified
</requirements>

## Full System Tests

### Authentication & Security
- Full auth lifecycle: login → access protected endpoint → token expiry → refresh → retry → logout
- Reuse detection: logout → attempt refresh with revoked token → verify all sessions revoked → verify 401
- Cross-tenant access: authenticate as tenant A → attempt to access tenant B resource → verify 403
- CORS: request from unauthorized origin → verify rejection
- Rate limiting: exceed auth endpoint threshold → verify 429

### Quote-to-Booking End-to-End Flow
- Create service → create pricing rule → create client → create quote → send quote → accept quote → verify booking created → verify invoice generated → verify notifications enqueued → verify audit log entries written

### Billing & Idempotency
- Submit payment with idempotency_key → submit same request again → verify only one payment record exists → verify payment.received event emitted once

### Soft Delete
- Create entity → soft delete → verify it does not appear in list → verify it does not appear in GET by ID → verify it can be retrieved with withDeleted query if applicable

### RBAC Enforcement Across All Endpoints
- staff role: verify access to allowed endpoints and 403 on all others
- supervisor role: verify access to allowed endpoints and 403 on tenant_admin-only endpoints
- tenant_admin role: verify full access

### Feature Flags
- Disable sms_notifications flag for tenant → trigger booking.confirmed event → verify SMS notification is NOT dispatched → verify email notification IS dispatched

### Frontend E2E — Authenticated Application (T13 + T14)
- Login → navigate to clients → create client → create quote for client → send quote → create booking → complete booking → verify dashboard metrics updated
- Verify token refresh happens transparently during a long user session
- Verify role-based UI restrictions are enforced in the browser (staff cannot see supervisor-only buttons)
- Verify kanban board renders cards in correct columns based on quote/booking status
- Verify Settings screen loads tenant data and saves company profile changes
- Verify Stripe placeholder section renders without errors

### Frontend E2E — Landing Page (T15)
- Verify landing page renders all 9 sections in the correct order
- Verify authenticated user visiting the landing page is redirected to the dashboard
- Verify pricing section displays BRL prices when browser locale is pt-BR
- Verify currency toggle switches between BRL and USD correctly
- Verify Growth plan card carries "Most Popular" badge and is visually distinct
- Verify Scale plan card carries "Best Value" badge
- Verify primary CTA "Start Free" is present and visible in Hero and Final CTA sections
- Verify Log In link navigates to the login screen
- Verify live simulation section renders and animates without errors

## Definition of Done

- All tests pass against the local Docker Compose environment with seed data
- No production code was created or modified
- Test files exist only inside tests/e2e/, tests/integration/, and tests/support/
- The chosen E2E tool is justified in a comment at the top of the suite
- Any reference to this task as "T15" in comments or documentation has been updated to "T16"
