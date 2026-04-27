---
status: completed
title: "Project Foundation: Infrastructure & Setup"
type: infra
complexity: high
dependencies: []
---

# Task 01: Project Foundation: Infrastructure & Setup

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

Establishes the full monorepo foundation: NestJS backend, React + TypeScript (Vite) frontend, Docker Compose for local development, shared tooling (ESLint, Prettier, TypeScript configs), environment variable validation, global NestJS pipes/filters/interceptors, the base domain module folder structure, and a PostgreSQL connection via TypeORM or Prisma with the uuid-ossp extension enabled. This task creates zero business logic — it exists purely to provide a stable, correctly wired scaffold for all subsequent tasks.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST initialize a monorepo with NestJS backend (`packages/backend`) and React + TypeScript Vite frontend (`packages/frontend`) in separate packages
- MUST configure Docker and Docker Compose for local development covering PostgreSQL, backend, and frontend services
- MUST configure `tsconfig.json` for both backend and frontend
- MUST configure ESLint and Prettier with shared rules across both packages
- MUST configure environment variable loading via `@nestjs/config` on the backend — all required variables MUST be validated at startup and the app MUST fail fast if any are missing
- MUST set up global `ValidationPipe`, global exception filter returning `{ error: { code, message } }`, and global response interceptor returning `{ data, meta }`
- MUST create the base NestJS module folder structure: `modules/<domain>/{domain,application,infrastructure,interfaces,validation}/` with scaffold placeholder files for at least one example domain
- MUST install and configure the PostgreSQL connection via TypeORM or Prisma — this ORM choice MUST remain consistent across all subsequent tasks
- MUST enable the `uuid-ossp` extension on PostgreSQL via the initial migration
- MUST create a `.gitignore` at the monorepo root covering: `node_modules/`, `dist/`, `build/`, `.env`, `.env.*.local`, `coverage/`, `test-results/`, `playwright-report/`, `cypress/videos/`, `cypress/screenshots/`, `.DS_Store`, `.vscode/`, `.idea/`, `.compozy/cache/`, `.compozy/tmp/`, `.compozy/logs/`, `.adal/`, `.agents/`, `.claude/`, `.mcpjam/` — `.compozy/tasks/` MUST NOT be ignored
- MUST create a `.env.example` at `packages/backend/` declaring all required environment variable keys with placeholder values and inline comments — no real secrets may be committed
- MUST NOT implement business logic, entities, or endpoints in this task
</requirements>

## Subtasks

- [x] 1.1 Scaffold monorepo root with `packages/backend` (NestJS) and `packages/frontend` (React + Vite + TypeScript)
- [x] 1.2 Write `docker-compose.yml` with `postgres`, `backend`, and `frontend` services and correct inter-service networking
- [x] 1.3 Configure `tsconfig.json` for both packages and shared ESLint + Prettier rules
- [x] 1.4 Configure `@nestjs/config` with a validation schema (Joi or class-validator) that fails fast on missing variables
- [x] 1.5 Register global `ValidationPipe`, exception filter (`{ error: { code, message } }`), and response interceptor (`{ data, meta }`)
- [x] 1.6 Create the domain module folder structure under `packages/backend/src/modules/` with placeholder files for one example domain
- [x] 1.7 Wire up the ORM (TypeORM or Prisma) PostgreSQL connection and write the initial migration enabling `uuid-ossp`
- [x] 1.8 Create `.gitignore` at monorepo root with all required ignore rules — ensuring `.compozy/tasks/` is NOT ignored
- [x] 1.9 Create `packages/backend/.env.example` declaring all required environment variable keys with placeholder values and inline comments

## Implementation Details

Reference the TechSpec 'System Architecture' and 'Critical Rules' sections for stack decisions and module boundaries.

The backend entry point wires global pipes, filters, and interceptors in `main.ts`. The config module uses a validation schema loaded at bootstrap time — any missing required variable must throw before the app starts listening.

The ORM choice made here (TypeORM or Prisma) is locked in for all subsequent tasks. The `uuid-ossp` migration must be the first versioned migration in the project.

### Relevant Files

- `packages/backend/src/main.ts` — NestJS bootstrap, global pipes/filters/interceptors
- `packages/backend/src/app.module.ts` — root module, config and ORM imports
- `packages/backend/src/common/filters/http-exception.filter.ts` — global exception filter
- `packages/backend/src/common/interceptors/response.interceptor.ts` — global response envelope
- `packages/backend/src/modules/example/` — placeholder domain structure
- `packages/backend/src/migrations/` — initial migration enabling uuid-ossp
- `packages/backend/.env.example` — all required environment variable keys with placeholder values and inline comments — no real secrets
- `.gitignore` — monorepo root ignore rules covering node_modules, build outputs, env files, test artifacts, OS/editor files, Compozy cache, and local tooling folders (`.adal/`, `.agents/`, `.claude/`, `.mcpjam/`) — `.compozy/tasks/` MUST NOT be ignored
- `docker-compose.yml` — local dev services
- `packages/frontend/vite.config.ts` — frontend build config

### Dependent Files

- All subsequent task files depend on the ORM setup, config validation, and folder structure established here

### Related ADRs

- [ADR-002: Monolithic Modular Architecture with Logical Multi-Tenant Isolation and JWT RBAC](../adrs/adr-002-monolith-jwt-rbac.md) — confirms NestJS monolith, PostgreSQL, and JWT as the stack

## Deliverables

- Monorepo root with `packages/backend` and `packages/frontend` fully scaffolded
- `docker-compose.yml` covering all three services
- Shared ESLint + Prettier configuration
- `@nestjs/config` module with startup validation
- Global exception filter, response interceptor, and `ValidationPipe` registered
- Base domain module folder structure with placeholder files
- ORM configured and connected to PostgreSQL
- Initial migration enabling `uuid-ossp`
- `.gitignore` at monorepo root with all required ignore rules
- `packages/backend/.env.example` with all required environment variable keys, placeholder values, and inline comments
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for global filter and interceptor behavior **(REQUIRED)**

## Tests

- Unit tests:
  - [x] Application bootstrap succeeds when all required environment variables are present
  - [x] Application throws and exits at startup when a required environment variable is missing
  - [x] Global exception filter returns `{ error: { code, message } }` for an unhandled thrown exception
  - [x] Global response interceptor wraps a successful controller response in `{ data, meta }`
- Integration tests:
  - [x] NestJS app starts and connects to PostgreSQL with no errors given valid config
  - [x] Hitting an unknown route returns the standard `{ error: { code, message } }` envelope via the global filter
  - [x] `.gitignore` excludes `node_modules/`, `.env`, `dist/`, `coverage/`, `.compozy/cache/`, `.compozy/tmp/`, `.adal/`, `.agents/`, `.claude/`, `.mcpjam/`
  - [x] `.gitignore` does NOT ignore `.compozy/tasks/`
  - [x] `.env.example` exists and declares all variable keys required by the `@nestjs/config` validation schema — no key is missing, no real value is present
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- `docker compose up` starts all three services without errors
- Application refuses to start when any required env var is absent
- Global filter and interceptor produce the documented response shapes
- ORM connects to PostgreSQL and the `uuid-ossp` migration runs without errors
- `.gitignore` is present at monorepo root and correctly excludes all listed paths without ignoring `.compozy/tasks/`
- `packages/backend/.env.example` is present, complete, and contains no real secret values
