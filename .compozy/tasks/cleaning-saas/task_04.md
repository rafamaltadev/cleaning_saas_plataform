---
status: completed
title: "Tenant & User Management"
type: backend
complexity: high
dependencies:
  - task_03
---

# Task 04: Tenant & User Management

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

Implements the `Tenant` entity aligned with the task_02 migration, establishes the `TenantScopedRepository` pattern that all subsequent domain repositories must follow, and delivers the tenant and user management endpoints. All endpoints require `tenant_admin` role, responses are DTO-mapped to never expose `password_hash` or `deleted_at`, and all write operations emit audit log entries.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create the `Tenant` entity and confirm the task_02 migration is aligned with its field definitions
- MUST implement the `TenantScopedRepository` pattern: ALL repositories MUST receive `tenantId` explicitly and filter by it on every query — MUST reuse `SoftDeleteRepository` from task_02
- MUST expose: `GET /api/v1/tenants/me`, `PUT /api/v1/tenants/me`, `GET /api/v1/users`, `POST /api/v1/users`, `PUT /api/v1/users/:id`
- `GET /api/v1/tenants/me` and ALL `/api/v1/users` endpoints MUST require the `tenant_admin` role
- `GET /api/v1/users` MUST support pagination (`page`, `limit`, `sort`, `order`) and return `meta` with `total`, `page`, `limit`, `totalPages`
- Output MUST NEVER expose `password_hash` or `deleted_at` — responses MUST be mapped to response DTOs
- MUST emit an audit log entry for `POST /api/v1/users` and `PUT /api/v1/users/:id`
- Input MUST be validated via DTO — mass assignment MUST be prevented
</requirements>

## Subtasks

- [x] 4.1 Create `Tenant` entity and verify alignment with the task_02 `tenants` migration
- [x] 4.2 Implement `TenantScopedRepository` extending `SoftDeleteRepository`, requiring explicit `tenantId` on all queries
- [x] 4.3 Implement tenant endpoints (`GET /api/v1/tenants/me`, `PUT /api/v1/tenants/me`) with `tenant_admin` guard
- [x] 4.4 Implement user management endpoints (`GET /api/v1/users`, `POST /api/v1/users`, `PUT /api/v1/users/:id`) with pagination and `tenant_admin` guard
- [x] 4.5 Map all responses through DTOs ensuring `password_hash` and `deleted_at` are never returned
- [x] 4.6 Emit audit log entries for user create and update operations

## Implementation Details

Reference the TechSpec 'Tenant & User Management' section for entity field lists and pagination shape. `TenantScopedRepository` is the pattern all domain repositories from task_05 onward will follow — its interface must be stable after this task.

Audit log emission should call the audit log infrastructure (as defined in task_09); at this stage a direct service call is acceptable since the event bus is not yet available — task_09 will wire existing emissions through the bus.

### Relevant Files

- `packages/backend/src/modules/tenant/domain/tenant.entity.ts` — Tenant entity
- `packages/backend/src/modules/tenant/interfaces/tenant.controller.ts` — tenant endpoints
- `packages/backend/src/modules/users/domain/user-response.dto.ts` — user response DTO
- `packages/backend/src/modules/users/interfaces/users.controller.ts` — user endpoints
- `packages/backend/src/common/repositories/tenant-scoped.repository.ts` — TenantScopedRepository
- `packages/backend/src/common/dto/pagination.dto.ts` — shared pagination query DTO

### Dependent Files

- All domain modules from task_05 onward extend `TenantScopedRepository`
- `SoftDeleteRepository` (task_02) is extended by `TenantScopedRepository`

### Related ADRs

- [ADR-002: Monolithic Modular Architecture with Logical Multi-Tenant Isolation and JWT RBAC](../adrs/adr-002-monolith-jwt-rbac.md) — confirms tenant_id filter on every query and RBAC enforcement

## Deliverables

- `Tenant` entity aligned with task_02 migration
- `TenantScopedRepository` base extending `SoftDeleteRepository`
- Five endpoints as specified with `tenant_admin` role enforcement
- Response DTOs that exclude `password_hash` and `deleted_at`
- Pagination support on `GET /api/v1/users`
- Audit log entries for user writes
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for all five endpoints including cross-tenant isolation **(REQUIRED)**

## Tests

- Unit tests:
  - [x] `TenantScopedRepository` includes `tenant_id` filter in all generated queries
  - [x] User response DTO does not include `password_hash` or `deleted_at` fields
  - [x] Pagination helper computes `totalPages` correctly for given `total` and `limit`
- Integration tests:
  - [x] `GET /api/v1/tenants/me` returns the correct tenant data for the authenticated `tenant_admin` user
  - [x] `GET /api/v1/tenants/me` returns HTTP 403 for a user with `supervisor` or `staff` role
  - [x] `POST /api/v1/users` creates a user scoped to the requesting user's `tenant_id`
  - [x] A user authenticated as tenant A cannot read or modify users belonging to tenant B (returns HTTP 403 or empty result)
  - [x] `GET /api/v1/users` pagination meta contains correct `total`, `page`, `limit`, and `totalPages` values
  - [x] Soft-deleted users do not appear in `GET /api/v1/users` response
  - [x] `POST /api/v1/users` response body does not contain `password_hash` or `deleted_at`
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Cross-tenant data isolation verified: no data leakage between tenants
- `password_hash` never present in any API response
- Pagination meta is accurate across varying dataset sizes
- `TenantScopedRepository` is ready for reuse by all downstream domain modules
