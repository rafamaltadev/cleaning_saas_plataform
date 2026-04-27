---
status: pending
title: "Security Baseline, Rate Limiting & OpenAPI"
type: backend
complexity: medium
dependencies:
  - task_11
---

# Task 12: Security Baseline, Rate Limiting & OpenAPI

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

Hardens the existing API surface: applies global rate limiting per IP and per authenticated user (env-var configurable), ensures auth endpoints have a stricter limit, enforces CORS without wildcards, audits all DTOs for mass assignment gaps and input sanitization, and installs Swagger/OpenAPI at `/api/v1/docs` covering all endpoints from task_03 through task_11. No new business logic, entities, or endpoints beyond `/api/v1/docs` are introduced.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST apply rate limiting globally: per IP and per authenticated user — limits MUST be configurable via environment variables
- MUST apply stricter rate limiting to `/api/v1/auth/*` endpoints — MUST be consistent with task_03 and env-var configurable
- MUST verify and enforce CORS restriction to the frontend origin defined in environment variables — wildcard (`*`) MUST NOT be allowed
- MUST verify mass assignment prevention is applied consistently across all existing DTOs — fix any gaps found
- MUST verify input sanitization is applied globally — fix any gaps found
- MUST install and configure Swagger/OpenAPI — the spec MUST reflect all endpoints from task_03 to task_11 with correct request/response schemas, authentication requirements, and error responses
- The OpenAPI spec MUST be available at `/api/v1/docs` in development and MUST be the source of truth for all API contracts
- MUST NOT add new business logic, new entities, or new endpoints beyond `/api/v1/docs`
</requirements>

## Subtasks

- [ ] 12.1 Configure global rate limiting (per IP, per authenticated user) with env-var limits; verify auth endpoint stricter limit is consistent
- [ ] 12.2 Verify CORS configuration — enforce env-var frontend origin, ensure wildcard is never allowed
- [ ] 12.3 Audit all existing DTOs for missing `@IsWhitelisted` / `whitelist: true` / `@Exclude` patterns — fix any mass assignment gaps
- [ ] 12.4 Verify global `ValidationPipe` with `forbidNonWhitelisted: true` is applied; fix any input sanitization gaps
- [ ] 12.5 Install Swagger and annotate all controllers and DTOs from task_03 to task_11 — expose spec at `/api/v1/docs`

## Implementation Details

Reference the TechSpec 'Security Baseline' section for rate limit thresholds and CORS configuration. Rate limiting should use `@nestjs/throttler` or equivalent, configured from environment variables for both global and auth-specific thresholds.

Swagger annotations should use `@nestjs/swagger` decorators. At minimum, every endpoint must have authentication requirements documented and response schemas for success and standard error shapes.

### Relevant Files

- `packages/backend/src/main.ts` — Swagger setup, global rate limiter registration
- `packages/backend/src/app.module.ts` — ThrottlerModule configuration
- `packages/backend/src/modules/auth/interfaces/auth.controller.ts` — stricter rate limit decorator
- All controller and DTO files from task_03 to task_11 — Swagger annotations and DTO audits
- `packages/backend/.env.example` — new rate limit and CORS env var declarations

### Dependent Files

- Frontend tasks (task_13, task_14) consume the OpenAPI spec as the API contract reference

### Related ADRs

- [ADR-002: Monolithic Modular Architecture with Logical Multi-Tenant Isolation and JWT RBAC](../adrs/adr-002-monolith-jwt-rbac.md) — confirms CORS and JWT auth requirements

## Deliverables

- Global rate limiting (per IP, per user) with env-var thresholds
- Stricter auth endpoint rate limit consistent with task_03
- CORS enforced to env-var origin, no wildcard
- All DTO mass assignment gaps fixed
- Global input sanitization verified
- Swagger/OpenAPI spec at `/api/v1/docs` covering all endpoints task_03–task_11
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for rate limiting, CORS, and OpenAPI availability **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] Rate limiter configuration reads thresholds from environment variables
  - [ ] Auth endpoint throttle limit is lower (stricter) than the global throttle limit
- Integration tests:
  - [ ] Requests exceeding the configured per-IP rate limit return HTTP 429
  - [ ] Requests exceeding the configured per-authenticated-user rate limit return HTTP 429
  - [ ] Auth endpoint returns HTTP 429 before the global endpoint threshold is reached under equal load
  - [ ] CORS rejects a request from an origin not in the allowed list
  - [ ] `GET /api/v1/docs` returns HTTP 200 with a valid OpenAPI JSON/YAML response
  - [ ] The OpenAPI spec includes at least one endpoint from each of task_03 through task_11
  - [ ] All endpoints in the OpenAPI spec have an authentication (`Bearer`) annotation
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Global and auth-specific rate limits are enforced and configurable without code changes
- CORS never allows wildcard origins
- No DTO in the codebase allows mass assignment
- OpenAPI spec is complete, accessible, and reflects all endpoints task_03–task_11
