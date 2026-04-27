---
status: pending
title: "Client & Address Management"
type: backend
complexity: medium
dependencies:
  - task_04
---

# Task 05: Client & Address Management

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

Implements the `Client` and `Address` entities with their migrations, following the established `SoftDeleteRepository` and `TenantScopedRepository` patterns, and exposes the five client/address management endpoints. All endpoints are protected by `JwtAuthGuard` and `RolesGuard` (minimum `supervisor`), responses never expose `deleted_at`, and all write operations emit audit log entries.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `Client` and `Address` entities and migrations with all fields defined in the SPEC including `deleted_at`
- Both entity repositories MUST extend `SoftDeleteRepository` from task_02
- All queries MUST be scoped by `tenant_id`
- MUST expose: `GET /api/v1/clients`, `POST /api/v1/clients`, `PUT /api/v1/clients/:id`, `POST /api/v1/addresses`, `PUT /api/v1/addresses/:id`
- All endpoints MUST be protected by `JwtAuthGuard` and `RolesGuard` with minimum role `supervisor`
- `GET /api/v1/clients` MUST support pagination (`page`, `limit`, `sort`, `order`) with correct `meta`
- Output MUST NEVER expose `deleted_at` — map to response DTO
- Input MUST be validated via DTO — mass assignment MUST be prevented
- MUST emit audit log entry for `POST` and `PUT` actions on both entities
</requirements>

## Subtasks

- [ ] 5.1 Create `Client` entity, migration, and repository extending `SoftDeleteRepository`
- [ ] 5.2 Create `Address` entity, migration, and repository extending `SoftDeleteRepository`
- [ ] 5.3 Implement client endpoints with pagination, `supervisor` role guard, and response DTOs
- [ ] 5.4 Implement address endpoints with `supervisor` role guard and response DTOs
- [ ] 5.5 Emit audit log entries for all POST and PUT operations on Client and Address

## Implementation Details

Reference the TechSpec 'Client & Address' section for entity field definitions. Repositories must use `TenantScopedRepository` from task_04 or at minimum follow the same explicit `tenantId` pattern on all queries.

Pagination shape for `GET /api/v1/clients` must match the shared `meta` format established in task_04 (`total`, `page`, `limit`, `totalPages`).

### Relevant Files

- `packages/backend/src/modules/clients/domain/client.entity.ts` — Client entity
- `packages/backend/src/modules/clients/domain/address.entity.ts` — Address entity
- `packages/backend/src/modules/clients/infrastructure/client.repository.ts` — client repository
- `packages/backend/src/modules/clients/infrastructure/address.repository.ts` — address repository
- `packages/backend/src/modules/clients/interfaces/clients.controller.ts` — client endpoints
- `packages/backend/src/modules/clients/interfaces/addresses.controller.ts` — address endpoints
- `packages/backend/src/migrations/` — client and address migration files

### Dependent Files

- task_07 (Quote Flow) references `Client` entity to link quotes to clients
- `SoftDeleteRepository` (task_02) is extended by both repositories
- `JwtAuthGuard`, `RolesGuard` (task_03) applied to all endpoints

### Related ADRs

- [ADR-002: Monolithic Modular Architecture with Logical Multi-Tenant Isolation and JWT RBAC](../adrs/adr-002-monolith-jwt-rbac.md) — confirms tenant_id scoping on all domain tables

## Deliverables

- `Client` and `Address` entities with migrations
- Client and Address repositories extending `SoftDeleteRepository`
- Five endpoints with role guards, DTO validation, and response mapping
- Pagination support on `GET /api/v1/clients`
- Audit log entries for all write operations
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for all five endpoints including cross-tenant and soft-delete behavior **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] `ClientRepository` query excludes soft-deleted records by default
  - [ ] Client response DTO does not include `deleted_at`
  - [ ] Address response DTO does not include `deleted_at`
- Integration tests:
  - [ ] `POST /api/v1/clients` creates a client scoped to the requesting user's `tenant_id`
  - [ ] `GET /api/v1/clients` does not return clients belonging to a different tenant
  - [ ] `GET /api/v1/clients` does not return soft-deleted clients
  - [ ] `PUT /api/v1/clients/:id` returns HTTP 403 when the client belongs to a different tenant
  - [ ] `GET /api/v1/clients` pagination meta (`total`, `page`, `limit`, `totalPages`) is accurate
  - [ ] `POST /api/v1/clients` with `staff` role returns HTTP 403
  - [ ] `deleted_at` is never present in any client or address response body
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Clients and addresses are strictly isolated per tenant
- Soft-deleted records are invisible in all list and detail endpoints
- `staff` role cannot create or modify clients or addresses
- `deleted_at` never leaks into any API response
