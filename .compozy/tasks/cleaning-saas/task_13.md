---
status: pending
title: "Frontend MVP Part A: Auth, Shell, Client Management, Settings & Kanban"
type: feature
complexity: high
dependencies: [task_12]
---

# Task 13: Frontend MVP Part A — Auth, Shell, Client Management, Settings & Kanban

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

## Design System Reference

MUST read and follow `.compozy/tasks/cleaning-saas/_design_system.md` before writing any frontend code.
All UI MUST conform strictly to the design system defined there — colors, typography, spacing, components, responsiveness, and screen patterns.

## Overview

Implements the authenticated application shell and all Part A screens: login, client management, settings, and kanban board. The frontend scaffold already exists from T01 — implement the application from the existing scaffold. No backend changes in this task.

<critical>
- ALWAYS READ the design system reference before starting
- ALL screens MUST be mobile-first following the responsiveness rules defined in the design system
- NEVER invent colors, spacing, or components outside the design system
- TESTS REQUIRED — every deliverable MUST include tests
</critical>

<requirements>

### Auth
- MUST implement the login screen: call POST /api/v1/auth/login, store access token and refresh token securely (memory + httpOnly cookie or equivalent secure strategy)
- MUST implement automatic token refresh: intercept 401 responses, call POST /api/v1/auth/refresh, retry the original request — if refresh fails, redirect to login and clear stored tokens
- Login screen MUST follow the Auth Screen pattern defined in the design system (centered card layout, minimal, focused)

### Application Shell
- MUST implement the application shell with React Router: protected routes that redirect unauthenticated users to login
- MUST implement role-based route protection: routes inaccessible to the authenticated user's role MUST redirect to an appropriate fallback
- Shell MUST include sidebar navigation (desktop) and bottom navigation (mobile) with maximum 5 primary actions
- All screens MUST respect the authenticated user's permissions for UI element visibility

### Client Management
- MUST implement Client list screen: paginated table consuming GET /api/v1/clients — use the Data Listing Screen pattern (search, filters, badges for status, pagination, row actions)
- MUST implement Client create screen: form consuming POST /api/v1/clients — use the Form Screen pattern (grouped fields, inline validation, submit + cancel)
- MUST implement Client edit screen: form consuming PUT /api/v1/clients/:id — pre-populated with existing data
- MUST implement Address create and edit forms as part of the Client screens

### Settings
- MUST implement a Settings screen with sidebar or tabs for the following configuration categories:
  - Company profile: name, email, timezone, currency
  - Business hours: configurable open/close times per day of week
  - Services & pricing: list of services with base rates (read-only display, linking to the services module)
  - Payment integration: Stripe connection section — structure and UI MUST be implemented but the actual Stripe integration is NOT active in the MVP (display a "Coming soon" or "Connect Stripe" placeholder state)
- Settings MUST use the Settings Screen pattern defined in the design system (sidebar/tabs, grouped forms, save actions with feedback)
- Settings MUST consume GET /api/v1/tenants/me for company profile and PUT /api/v1/tenants/me to save — requires tenant_admin role

### Kanban Board
- MUST implement a Kanban board screen for managing leads and bookings by status
- Columns: New Lead, Contacted, Quote Sent, Booking Confirmed, Completed, Cancelled
- Each card MUST display: client name, service, scheduled date (if applicable), and current status badge
- Cards MUST be draggable between columns — updating the underlying booking or quote status via the appropriate API endpoint
- MUST follow the Kanban Board pattern defined in the design system (clear column separation, card-based, smooth drag interactions)
- Kanban data MUST be sourced from GET /api/v1/quotes and GET /api/v1/bookings, mapped to the appropriate columns by status

</requirements>

## Subtasks

- [ ] 13.1 Implement login screen with auth flow, token storage, and automatic refresh
- [ ] 13.2 Implement application shell with React Router, protected routes, and role-based access
- [ ] 13.3 Implement Client list, create, and edit screens with Address forms
- [ ] 13.4 Implement Settings screen with company profile, business hours, services display, and Stripe placeholder
- [ ] 13.5 Implement Kanban board with draggable cards mapped to quote/booking statuses

## Deliverables

- Login screen following auth screen pattern
- Application shell with sidebar (desktop) and bottom nav (mobile)
- Client list, create, and edit screens with pagination and inline validation
- Address create and edit forms
- Settings screen with all four category sections
- Kanban board with draggable cards and status columns
- All screens mobile-first and design-system compliant
- Unit and component tests for all screens and interactions (REQUIRED)

## Tests

- Unit / component tests:
  - [ ] Login form submits credentials and stores tokens on success
  - [ ] Failed login displays error message and does not store tokens
  - [ ] 401 response triggers automatic token refresh and retries the original request
  - [ ] Failed token refresh redirects to login and clears stored tokens
  - [ ] Protected routes redirect unauthenticated users to login
  - [ ] Role-based route protection: staff cannot access supervisor-only routes
  - [ ] Client list renders paginated results and navigates between pages
  - [ ] Client create form validates required fields before submitting
  - [ ] Client edit form pre-populates with existing data
  - [ ] Settings company profile form loads tenant data and saves changes
  - [ ] Stripe section renders placeholder state without throwing errors
  - [ ] Kanban board renders columns with correct cards mapped by status
  - [ ] Dragging a card between columns triggers the correct API update

## Success Criteria

- All tests passing
- Login, shell, clients, settings, and kanban screens functional end-to-end
- All screens follow the design system strictly (colors, spacing, components, responsiveness)
- No backend changes were made
- No design system tokens were invented or overridden
