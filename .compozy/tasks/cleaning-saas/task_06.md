---
status: pending
title: "Services & Pricing Rules"
type: backend
complexity: medium
dependencies:
  - task_05
---

# Task 06: Services & Pricing Rules

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

Implements the `Service` and `PricingRule` entities with their migrations, the tenant-scoped repositories, and the six service/pricing-rule endpoints. Critically, it implements the pricing calculation as a pure, side-effect-free service method that task_07 (Quote Flow) will reuse directly without re-implementing it.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `Service` and `PricingRule` entities and migrations with all fields defined in the SPEC including `deleted_at`
- Both entity repositories MUST extend `SoftDeleteRepository` from task_02
- All queries MUST be scoped by `tenant_id`
- MUST implement the pricing calculation logic as defined in the SPEC: `base → unit → price_multiplier → discount_percent → manual_discount_percent → round to cents`
- The pricing calculation MUST be implemented as a pure service method with no side effects — it MUST be reusable by the Quote module in task_07
- MUST expose: `GET /api/v1/services`, `POST /api/v1/services`, `PUT /api/v1/services/:id`, `GET /api/v1/pricing-rules`, `POST /api/v1/pricing-rules`, `PUT /api/v1/pricing-rules/:id`
- All endpoints MUST be protected by `JwtAuthGuard` and `RolesGuard` with minimum role `supervisor`
- All list endpoints MUST support pagination with correct `meta`
- Output MUST NEVER expose `deleted_at` — map to response DTO
- Input MUST be validated via DTO — mass assignment MUST be prevented
</requirements>

## Subtasks

- [ ] 6.1 Create `Service` entity, migration, and repository extending `SoftDeleteRepository`
- [ ] 6.2 Create `PricingRule` entity, migration, and repository extending `SoftDeleteRepository`
- [ ] 6.3 Implement the pricing calculation as a pure `PricingService.calculate()` method with no side effects, following the SPEC formula
- [ ] 6.4 Implement service endpoints with pagination, `supervisor` role guard, and response DTOs
- [ ] 6.5 Implement pricing-rule endpoints with pagination, `supervisor` role guard, and response DTOs

## Implementation Details

Reference the TechSpec 'Services & Pricing Rules' section for entity field definitions and the exact pricing formula. The `PricingService.calculate()` method signature should accept the service unit type, base rate, optional area/duration, multiplier, and discount fields, and return an integer number of cents.

The method must be exported from `ServicesModule` so `QuoteModule` (task_07) can import and call it without duplicating logic.

Pricing formula order per SPEC:
1. Apply unit: `sqm → base_rate_cents × area_sqm`, `hour → base_rate_cents × duration_hours`, `flat → base_rate_cents`
2. Apply `price_multiplier`
3. Apply `discount_percent`
4. Apply `manual_discount_percent`
5. Round result to nearest integer (cents)

### Relevant Files

- `packages/backend/src/modules/services/domain/service.entity.ts` — Service entity
- `packages/backend/src/modules/services/domain/pricing-rule.entity.ts` — PricingRule entity
- `packages/backend/src/modules/services/application/pricing.service.ts` — pure pricing calculation
- `packages/backend/src/modules/services/infrastructure/service.repository.ts` — service repository
- `packages/backend/src/modules/services/infrastructure/pricing-rule.repository.ts` — pricing rule repository
- `packages/backend/src/modules/services/interfaces/services.controller.ts` — service endpoints
- `packages/backend/src/modules/services/interfaces/pricing-rules.controller.ts` — pricing rule endpoints
- `packages/backend/src/migrations/` — service and pricing-rule migration files

### Dependent Files

- task_07 (Quote Flow) imports `PricingService.calculate()` from this module
- `SoftDeleteRepository` (task_02) extended by both repositories

### Related ADRs

- [ADR-002: Monolithic Modular Architecture with Logical Multi-Tenant Isolation and JWT RBAC](../adrs/adr-002-monolith-jwt-rbac.md) — confirms tenant_id scoping on all domain tables

## Deliverables

- `Service` and `PricingRule` entities with migrations
- Service and PricingRule repositories extending `SoftDeleteRepository`
- `PricingService.calculate()` pure method exported from `ServicesModule`
- Six endpoints with role guards, DTO validation, pagination, and response mapping
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for all six endpoints and pricing calculation correctness **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] `PricingService.calculate()` with unit `sqm`: result equals `base_rate_cents × area_sqm` before discounts
  - [ ] `PricingService.calculate()` with unit `hour`: result equals `base_rate_cents × duration_hours` before discounts
  - [ ] `PricingService.calculate()` with unit `flat`: result equals `base_rate_cents` regardless of area or duration inputs
  - [ ] `PricingService.calculate()` applies `price_multiplier` before `discount_percent`
  - [ ] `PricingService.calculate()` applies `manual_discount_percent` last
  - [ ] `PricingService.calculate()` returns an integer (rounds to nearest cent)
- Integration tests:
  - [ ] `GET /api/v1/services` does not return services belonging to a different tenant
  - [ ] `GET /api/v1/services` does not return soft-deleted services
  - [ ] `POST /api/v1/services` with `staff` role returns HTTP 403
  - [ ] `GET /api/v1/pricing-rules` pagination meta is accurate
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Pricing calculation formula verified correct against all unit types and discount combinations
- Services and pricing rules are strictly isolated per tenant
- `PricingService.calculate()` is importable by task_07 with no duplication
