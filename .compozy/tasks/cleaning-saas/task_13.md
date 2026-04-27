---
status: pending
title: "Frontend MVP Part A: Auth, Shell & Client Management"
type: frontend
complexity: high
dependencies:
  - task_12
---

# Task 13: Frontend MVP Part A: Auth, Shell & Client Management

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

Implements the React application from the task_01 scaffold: login screen with secure token storage, automatic 401-triggered token refresh with request retry, application shell with React Router protected routes, role-based route guards, and the full Client and Address CRUD screens with paginated lists and validation feedback. No backend changes are made in this task.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement the login screen: call `POST /api/v1/auth/login`, store access token in memory and refresh token via httpOnly cookie or equivalent secure strategy
- MUST implement automatic token refresh: intercept 401 responses, call `POST /api/v1/auth/refresh`, retry the original request — if refresh fails, redirect to login and clear stored tokens
- MUST implement the application shell with React Router: protected routes that redirect unauthenticated users to login
- MUST implement role-based route protection: routes inaccessible to the authenticated user's role MUST redirect to an appropriate fallback
- MUST implement Client list screen: paginated table consuming `GET /api/v1/clients` with page navigation
- MUST implement Client create screen: form consuming `POST /api/v1/clients` with validation feedback
- MUST implement Client edit screen: form consuming `PUT /api/v1/clients/:id` with validation feedback and pre-populated data
- MUST implement Address create and edit forms as part of the Client screens
- All screens MUST respect the authenticated user's permissions for UI element visibility (e.g. hide create button if role is `staff`)
- MUST NOT make backend changes in this task
</requirements>

## Subtasks

- [ ] 13.1 Implement login screen with API call, secure token storage (memory for access token, httpOnly cookie or equivalent for refresh)
- [ ] 13.2 Implement axios/fetch interceptor for automatic 401 refresh and original request retry
- [ ] 13.3 Implement application shell with React Router, protected route component, and redirect-to-login for unauthenticated access
- [ ] 13.4 Implement role-based route protection with redirect to fallback for unauthorized roles
- [ ] 13.5 Implement Client list screen with paginated table and page navigation controls
- [ ] 13.6 Implement Client create and edit screens with form validation feedback
- [ ] 13.7 Implement Address create and edit forms integrated within the Client screens
- [ ] 13.8 Apply role-based UI element visibility (hide/show create and edit buttons by role)

## Implementation Details

Reference the TechSpec 'Frontend Architecture' section for routing structure, auth state management, and HTTP client interceptor patterns. Access token must never be stored in `localStorage` or `sessionStorage` — memory storage (React context or state) is the required pattern.

The HTTP interceptor must queue concurrent requests during a refresh to avoid multiple simultaneous refresh calls.

### Relevant Files

- `packages/frontend/src/main.tsx` — app entry point
- `packages/frontend/src/router/index.tsx` — React Router routes
- `packages/frontend/src/router/ProtectedRoute.tsx` — auth + role guard component
- `packages/frontend/src/features/auth/LoginPage.tsx` — login screen
- `packages/frontend/src/features/auth/auth.store.ts` — token storage state
- `packages/frontend/src/api/http-client.ts` — axios/fetch instance with interceptors
- `packages/frontend/src/features/clients/ClientListPage.tsx` — paginated list
- `packages/frontend/src/features/clients/ClientCreatePage.tsx` — create form
- `packages/frontend/src/features/clients/ClientEditPage.tsx` — edit form
- `packages/frontend/src/features/clients/AddressForm.tsx` — address sub-form

### Dependent Files

- task_14 adds Quote, Booking, and Dashboard screens to the same shell established here

### Related ADRs

- [ADR-002: Monolithic Modular Architecture with Logical Multi-Tenant Isolation and JWT RBAC](../adrs/adr-002-monolith-jwt-rbac.md) — confirms JWT-based SPA auth pattern

## Deliverables

- Login screen with secure token storage
- 401 interceptor with refresh retry logic
- Protected routing shell with role-based guards
- Client list, create, and edit screens
- Address create and edit forms
- Role-based UI visibility applied to all screens
- Unit/component tests with 80%+ coverage **(REQUIRED)**
- Integration tests for auth flow and client CRUD screens **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] Login form submits credentials to `POST /api/v1/auth/login` and stores tokens on HTTP 200
  - [ ] Failed login (HTTP 401 from API) displays an error message and does not store any tokens
  - [ ] HTTP 401 response triggers the refresh interceptor, calls `POST /api/v1/auth/refresh`, and retries the original request
  - [ ] Failed token refresh redirects to the login page and clears all stored tokens
  - [ ] Protected route redirects an unauthenticated user to the login page
  - [ ] Role-based route protection: `staff` role is redirected away from `supervisor`-only routes
  - [ ] Client create form shows a validation error when a required field is empty and does not submit
  - [ ] Client edit form is pre-populated with the existing client data on mount
- Integration tests:
  - [ ] Client list renders paginated rows and clicking next-page loads the next page of results
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Access token is never stored in `localStorage` or `sessionStorage`
- 401 refresh cycle works transparently without the user seeing an error
- `staff` users cannot access or see supervisor-only UI elements
- Client list, create, and edit flows work end-to-end against the backend API
