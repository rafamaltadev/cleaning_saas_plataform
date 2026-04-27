---
status: completed
title: "Project Foundation: Database Schema, Soft Delete & Seed"
type: backend
complexity: high
dependencies:
  - task_01
---

# Task 02: Project Foundation: Database Schema, Soft Delete & Seed

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

Creates the core shared database tables (`tenants`, `refresh_tokens`, `audit_logs`, `tenant_feature_flags`) with versioned reversible migrations, establishes the `SoftDeleteRepository` base class that all domain repositories will extend, implements the project base domain interface, seeds the database with a fixed default tenant and three role-specific users, and provides the `FeatureFlagService` injectable across all modules. No endpoints are introduced in this task.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create versioned, reversible migrations for: `tenants`, `refresh_tokens`, `audit_logs`, `tenant_feature_flags`
- All migrations MUST include a working `down()` method
- `tenants` and `tenant_feature_flags` MUST include `deleted_at: timestamp | null`; `audit_logs` and `refresh_tokens` MUST NOT include `deleted_at`
- MUST implement a shared `SoftDeleteRepository` base class that automatically excludes records where `deleted_at IS NOT NULL` from all queries
- `SoftDeleteRepository` MUST support an explicit `withDeleted: true` option to include soft-deleted records
- MUST implement the project base domain interface as defined in the SPEC
- MUST create a seed script that generates: one default tenant (fixed UUID for reproducibility), `admin@seed.local` with role `tenant_admin`, `supervisor@seed.local` with role `supervisor`, `staff@seed.local` with role `staff` — seed password read from `SEED_DEFAULT_PASSWORD` env var
- MUST implement `FeatureFlagService` that checks whether a feature is enabled for a given `tenant_id` at runtime — it MUST be injectable across all modules
- MUST NOT expose any endpoints in this task
</requirements>

## Subtasks

- [x] 2.1 Write reversible migrations for `tenants`, `refresh_tokens`, `audit_logs`, `tenant_feature_flags` (verify `deleted_at` presence per table rule)
- [x] 2.2 Implement `SoftDeleteRepository` base class with automatic `deleted_at IS NULL` filtering and `withDeleted` option
- [x] 2.3 Implement the project base domain interface as defined in the SPEC
- [x] 2.4 Implement `FeatureFlagService` that queries `tenant_feature_flags` and is exported for injection across all modules
- [x] 2.5 Write the seed script reading `SEED_DEFAULT_PASSWORD` and creating the default tenant and three seed users

## Implementation Details

Reference the TechSpec 'Data Models' section for exact field definitions per table. The `SoftDeleteRepository` will be the base for every domain repository introduced in subsequent tasks — its interface must be stable after this task.

`FeatureFlagService` should be provided in a shared module (e.g., `SharedModule`) that is globally importable by other modules without re-importing.

The seed script is a standalone NestJS CLI command or script — it must be idempotent (re-running it must not create duplicate records).

### Relevant Files

- `packages/backend/src/common/repositories/soft-delete.repository.ts` — SoftDeleteRepository base class
- `packages/backend/src/common/interfaces/base-domain.interface.ts` — project base domain interface
- `packages/backend/src/migrations/` — new migration files for this task
- `packages/backend/src/modules/shared/feature-flag.service.ts` — FeatureFlagService
- `packages/backend/src/modules/shared/shared.module.ts` — shared module exporting FeatureFlagService
- `packages/backend/src/database/seed.ts` — seed script

### Dependent Files

- All domain repositories in subsequent tasks (task_03 through task_11) extend `SoftDeleteRepository`
- `FeatureFlagService` is injected in task_10 (Notifications) for SMS gating

### Related ADRs

- [ADR-002: Monolithic Modular Architecture with Logical Multi-Tenant Isolation and JWT RBAC](../adrs/adr-002-monolith-jwt-rbac.md) — confirms shared PostgreSQL schema with `tenant_id` scoping

## Deliverables

- Migrations for `tenants`, `refresh_tokens`, `audit_logs`, `tenant_feature_flags` with working `up()` and `down()`
- `SoftDeleteRepository` base class
- Project base domain interface
- `FeatureFlagService` registered in a globally importable shared module
- Seed script creating default tenant and three seed users
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for migrations, SoftDeleteRepository, seed, and FeatureFlagService **(REQUIRED)**

## Tests

- Unit tests:
  - [x] `SoftDeleteRepository` query excludes records where `deleted_at IS NOT NULL`
  - [x] `SoftDeleteRepository` query includes soft-deleted records when `withDeleted: true` is passed
  - [x] `FeatureFlagService.isEnabled()` returns `true` for a flag record with `enabled = true` for the given `tenant_id`
  - [x] `FeatureFlagService.isEnabled()` returns `false` for a flag record with `enabled = false`
  - [x] `FeatureFlagService.isEnabled()` returns `false` when no record exists for the given `tenant_id` and feature name
- Integration tests:
  - [x] All four migrations run (`up()`) against a real PostgreSQL instance without errors
  - [x] All four migrations roll back (`down()`) without errors and leave no residual tables
  - [x] Seed script creates exactly one default tenant with the fixed UUID
  - [x] Seed script creates exactly three users: `admin@seed.local` (tenant_admin), `supervisor@seed.local` (supervisor), `staff@seed.local` (staff) all under the default tenant
  - [x] Re-running the seed script does not create duplicate records
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Migrations run and roll back cleanly against the Docker PostgreSQL instance
- `SoftDeleteRepository` correctly gates soft-deleted records
- Seed script produces deterministic, idempotent output
- `FeatureFlagService` is injectable in any module without circular dependency errors
