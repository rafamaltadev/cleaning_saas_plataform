---
status: pending
title: "Auth Module"
type: backend
complexity: high
dependencies:
  - task_02
---

# Task 03: Auth Module

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

Implements the complete authentication system: User entity and migration, JWT access token (15 min) and refresh token (30 days) generation, bcrypt-hashed refresh token storage with rotation and reuse detection, the `AuthUser` middleware injecting identity into requests, reusable `JwtAuthGuard` and `RolesGuard`, stricter rate limiting on `/api/v1/auth/*`, and the three auth endpoints. This establishes the security foundation reused by all subsequent modules.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create the `users` table migration with fields: `id`, `tenant_id`, `email`, `password_hash`, `roles: string[]`, `first_name`, `last_name`, `created_at`, `updated_at`, `deleted_at`
- `password_hash` MUST use bcrypt with a cost factor of at least 12
- MUST implement JWT access token with 15-minute expiry and refresh token with 30-day expiry
- Refresh tokens MUST be stored as bcrypt hashes in the `refresh_tokens` table (migrated in task_02)
- MUST implement token rotation: each call to `POST /api/v1/auth/refresh` invalidates the current token and issues a new one
- MUST implement reuse detection: if a revoked refresh token is used, ALL active tokens for that user MUST be revoked and 401 returned
- MUST implement backend middleware that extracts `tenant_id`, `userId`, `roles`, and optional `permissions` from the JWT and injects `AuthUser` into the request
- MUST implement `JwtAuthGuard` and `RolesGuard` as reusable guards for all subsequent modules
- MUST apply stricter rate limiting to all `/api/v1/auth/*` endpoints
- MUST expose: `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`
- All responses MUST follow the standard envelope `{ data, meta }` and error format `{ error: { code, message } }` from task_01
- Passwords MUST be validated with bcrypt — NEVER compared in plain text
- Input MUST be sanitized — mass assignment MUST be prevented via explicit DTO whitelisting
- CORS MUST be restricted to the frontend origin defined in environment variables
</requirements>

## Subtasks

- [ ] 3.1 Create `User` entity and `users` table migration with all specified fields
- [ ] 3.2 Implement JWT access + refresh token generation and the bcrypt-hashed refresh token storage
- [ ] 3.3 Implement token rotation logic and reuse detection in `POST /api/v1/auth/refresh`
- [ ] 3.4 Implement the `AuthUser` middleware extracting claims from the JWT and injecting into the request context
- [ ] 3.5 Implement `JwtAuthGuard` and `RolesGuard` as standalone reusable guards
- [ ] 3.6 Wire up auth endpoints (`login`, `refresh`, `logout`) with DTOs, guards, and stricter rate limiting
- [ ] 3.7 Configure CORS restriction to the environment-defined frontend origin

## Implementation Details

Reference the TechSpec 'Auth Module' section for token payload shape and guard interface. `JwtAuthGuard` and `RolesGuard` must be exported from `AuthModule` so they can be imported and applied by all downstream modules without re-implementing.

The `AuthUser` middleware should run globally and attach to every request so that guards can read from `req.user` without additional setup.

### Relevant Files

- `packages/backend/src/modules/auth/` — auth module domain folder
- `packages/backend/src/modules/auth/domain/user.entity.ts` — User entity
- `packages/backend/src/modules/auth/application/auth.service.ts` — token logic
- `packages/backend/src/modules/auth/interfaces/auth.controller.ts` — endpoints
- `packages/backend/src/modules/auth/validation/login.dto.ts` — login DTO
- `packages/backend/src/common/guards/jwt-auth.guard.ts` — JwtAuthGuard
- `packages/backend/src/common/guards/roles.guard.ts` — RolesGuard
- `packages/backend/src/common/middleware/auth-user.middleware.ts` — AuthUser injection
- `packages/backend/src/migrations/` — users table migration

### Dependent Files

- `packages/backend/src/app.module.ts` — CORS config, middleware registration
- All subsequent modules apply `JwtAuthGuard` and `RolesGuard` from this task

### Related ADRs

- [ADR-002: Monolithic Modular Architecture with Logical Multi-Tenant Isolation and JWT RBAC](../adrs/adr-002-monolith-jwt-rbac.md) — confirms JWT with 15 min access + 30 day refresh, rotating tokens

## Deliverables

- `users` table migration
- `User` entity
- `AuthService` with login, refresh (rotation + reuse detection), and logout logic
- `JwtAuthGuard` and `RolesGuard` exported from `AuthModule`
- `AuthUser` middleware registered globally
- Three auth endpoints with DTO whitelisting and rate limiting
- CORS configured to env-defined frontend origin
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for all auth endpoints and guards **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] `AuthService.login()` returns access token and refresh token for a valid email/password combination
  - [ ] `AuthService.login()` returns 401 when the password does not match the stored bcrypt hash
  - [ ] `AuthService.refresh()` invalidates the old refresh token and issues a new token pair
  - [ ] `AuthService.refresh()` with a revoked token revokes all active tokens for that user and returns 401
  - [ ] `AuthService.logout()` invalidates only the provided refresh token, leaving other sessions active
  - [ ] JWT access token payload contains `tenant_id`, `userId`, and `roles`
  - [ ] Access token has a 15-minute expiry claim
- Integration tests:
  - [ ] `POST /api/v1/auth/login` with valid credentials returns `{ data: { accessToken, refreshToken }, meta: {} }`
  - [ ] `POST /api/v1/auth/login` with invalid credentials returns `{ error: { code, message } }` with HTTP 401
  - [ ] `POST /api/v1/auth/refresh` with a valid token returns a new token pair and invalidates the old refresh token
  - [ ] `POST /api/v1/auth/refresh` with a revoked token returns HTTP 401 and revokes all sessions
  - [ ] `POST /api/v1/auth/logout` invalidates only the supplied refresh token
  - [ ] `JwtAuthGuard` blocks a request with no `Authorization` header and returns HTTP 401
  - [ ] `AuthUser` middleware correctly populates `req.user` with `tenant_id`, `userId`, and `roles` from the JWT
  - [ ] Auth endpoints return HTTP 429 after exceeding the stricter rate limit threshold
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Login, refresh, and logout endpoints behave as documented
- Reuse detection correctly revokes all sessions on detected token replay
- `JwtAuthGuard` and `RolesGuard` are importable by all subsequent modules
- CORS rejects requests from origins not matching the configured frontend URL
