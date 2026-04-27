Create the tasks below exactly as specified, without inferring additional scope and without suppressing any listed item. If there is ambiguity, prefer the literal text of the SPEC.md. Do not group or subdivide tasks beyond what is described.

The slug for all tasks is: cleaning-saas

Each task must include the execution header below verbatim, before the task scope:

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

===

TASK 01 — Project Foundation: Infrastructure & Setup
Dependencies: none

Scope:
- Initialize the monorepo with NestJS backend and React + TypeScript frontend (Vite) in separate packages
- Configure Docker and Docker Compose for local development (PostgreSQL, backend, frontend)
- Configure TypeScript (tsconfig.json) for both backend and frontend
- Configure ESLint and Prettier with shared rules across both packages
- Configure environment variable loading on the backend using @nestjs/config — validate all required variables at startup and fail fast if any are missing
- Set up the NestJS application with global pipes (ValidationPipe), global filters (exception filter returning the standard error format { error: { code, message } }), and global interceptors (response envelope { data, meta })
- Create the base NestJS module folder structure: modules/<domain>/{domain,application,infrastructure,interfaces,validation}/ — scaffold empty placeholder files for at least one example domain to establish the pattern
- Install and configure the PostgreSQL connection via TypeORM or Prisma — this choice MUST be consistent throughout all subsequent tasks
- Enable uuid-ossp extension on PostgreSQL via the initial migration
- No business logic, no entities, no endpoints in this task

Tests:
- Verify the application starts without errors with all required environment variables present
- Verify the application fails fast at startup if a required environment variable is missing
- Verify the global exception filter returns { error: { code, message } } for unhandled errors
- Verify the global response interceptor wraps successful responses in { data, meta }

===

TASK 02 — Project Foundation: Database Schema, Soft Delete & Seed
Dependencies: TASK 01

Scope:
- Create versioned, reversible migrations for the following tables: tenants, refresh_tokens, audit_logs, tenant_feature_flags
- All migrations MUST include a working down() method
- All tables MUST include deleted_at: timestamp | null except audit_logs and refresh_tokens
- Implement a shared SoftDeleteRepository base class that automatically excludes records where deleted_at IS NOT NULL from all queries — this base MUST be reused by all domain repositories in subsequent tasks
- Implement the Project base domain interface as defined in the SPEC
- Create seed script that generates: one default tenant (fixed UUID for reproducibility), three users (admin@seed.local with role tenant_admin, supervisor@seed.local with role supervisor, staff@seed.local with role staff) — seed password read from SEED_DEFAULT_PASSWORD environment variable
- Implement FeatureFlagService that checks whether a feature is enabled for a given tenant_id at runtime — this service MUST be injectable across all modules
- No endpoints in this task

Tests:
- Verify migrations run and roll back without errors
- Verify SoftDeleteRepository excludes soft-deleted records automatically
- Verify SoftDeleteRepository returns soft-deleted records when explicitly queried with withDeleted: true
- Verify seed script creates exactly the three users with correct roles under the default tenant
- Verify FeatureFlagService returns true for enabled features and false for disabled or absent features

===

TASK 03 — Auth Module
Dependencies: TASK 02

Scope:
- Create the User entity and migration (users table) with fields: id, tenant_id, email, password_hash (bcrypt cost factor 12 minimum), roles: string[], first_name, last_name, created_at, updated_at, deleted_at
- Implement JWT access token generation (15-minute expiry) and refresh token generation (30-day expiry)
- Refresh tokens MUST be stored as bcrypt hashes in the refresh_tokens table (already migrated in T02)
- Implement token rotation: each call to POST /api/v1/auth/refresh invalidates the current token and issues a new one
- Implement reuse detection: if a revoked refresh token is used, revoke ALL active tokens for that user and return 401
- Implement backend middleware that extracts tenant_id, userId, roles, and optional permissions from the JWT and injects AuthUser into the request
- Implement JwtAuthGuard and RolesGuard as reusable guards for all subsequent modules
- Apply stricter rate limiting to all /api/v1/auth/* endpoints
- Endpoints: POST /api/v1/auth/login, POST /api/v1/auth/refresh, POST /api/v1/auth/logout
- All responses MUST follow the standard envelope and error format defined in T01
- Passwords MUST be validated with bcrypt — never compared in plain text
- Input MUST be sanitized — mass assignment MUST be prevented via explicit DTO whitelisting
- CORS MUST be restricted to known frontend origin defined in environment variables

Tests:
- Verify login returns access token and refresh token for valid credentials
- Verify login returns 401 for invalid credentials
- Verify access token expires after 15 minutes
- Verify refresh token rotation: old token is invalidated after refresh
- Verify reuse detection: using a revoked token revokes all sessions and returns 401
- Verify logout invalidates only the provided refresh token
- Verify JwtAuthGuard blocks requests without a valid token
- Verify middleware correctly injects AuthUser (tenant_id, userId, roles) into the request context

===

TASK 04 — Tenant & User Management
Dependencies: TASK 03

Scope:
- Create the Tenant entity and confirm migration from T02 is aligned with the entity definition
- Implement TenantScopedRepository pattern: ALL repositories MUST receive tenantId explicitly and filter by it on every query — reuse SoftDeleteRepository from T02
- Endpoints: GET /api/v1/tenants/me, PUT /api/v1/tenants/me, GET /api/v1/users, POST /api/v1/users, PUT /api/v1/users/:id
- GET /api/v1/tenants/me and all /api/v1/users endpoints MUST require tenant_admin role
- GET /api/v1/users MUST support pagination (page, limit, sort, order) and return meta with total, page, limit, totalPages
- Output MUST NEVER expose password_hash or deleted_at — map to response DTO
- Emit audit log entry for POST /api/v1/users and PUT /api/v1/users/:id actions
- Input MUST be validated via DTO — mass assignment MUST be prevented

Tests:
- Verify GET /api/v1/tenants/me returns the correct tenant for the authenticated user
- Verify GET /api/v1/tenants/me returns 403 for non-tenant_admin roles
- Verify POST /api/v1/users creates a user scoped to the correct tenant_id
- Verify a user from tenant A cannot access or modify data from tenant B
- Verify password_hash is never returned in any response
- Verify pagination meta is correct on GET /api/v1/users
- Verify soft-deleted users do not appear in GET /api/v1/users

===

TASK 05 — Client & Address Management
Dependencies: TASK 04

Scope:
- Create Client and Address entities and migrations with all fields defined in the SPEC including deleted_at
- Both entities MUST extend SoftDeleteRepository from T02
- All queries MUST be scoped by tenant_id
- Endpoints: GET /api/v1/clients, POST /api/v1/clients, PUT /api/v1/clients/:id, POST /api/v1/addresses, PUT /api/v1/addresses/:id
- All endpoints MUST be protected by JwtAuthGuard and RolesGuard (minimum role: supervisor)
- GET /api/v1/clients MUST support pagination (page, limit, sort, order) with correct meta
- Output MUST NEVER expose deleted_at — map to response DTO
- Input MUST be validated via DTO — mass assignment MUST be prevented
- Emit audit log entry for POST and PUT actions on both entities

Tests:
- Verify POST /api/v1/clients creates a client scoped to the correct tenant_id
- Verify GET /api/v1/clients does not return clients from other tenants
- Verify GET /api/v1/clients does not return soft-deleted clients
- Verify PUT /api/v1/clients/:id returns 403 when the client belongs to a different tenant
- Verify pagination meta is correct on GET /api/v1/clients
- Verify staff role cannot access POST /api/v1/clients (returns 403)
- Verify deleted_at is never exposed in any response

===

TASK 06 — Services & Pricing Rules
Dependencies: TASK 05

Scope:
- Create Service and PricingRule entities and migrations with all fields defined in the SPEC including deleted_at
- Both entities MUST extend SoftDeleteRepository from T02
- All queries MUST be scoped by tenant_id
- Implement the pricing calculation logic as defined in the SPEC (base → unit → price_multiplier → discount_percent → manual_discount_percent → round to cents)
- The pricing calculation MUST be implemented as a pure service method with no side effects — reusable by the Quote module in T07
- Endpoints: GET /api/v1/services, POST /api/v1/services, PUT /api/v1/services/:id, GET /api/v1/pricing-rules, POST /api/v1/pricing-rules, PUT /api/v1/pricing-rules/:id
- All endpoints MUST be protected by JwtAuthGuard and RolesGuard (minimum role: supervisor)
- All list endpoints MUST support pagination with correct meta
- Output MUST NEVER expose deleted_at — map to response DTO
- Input MUST be validated via DTO — mass assignment MUST be prevented

Tests:
- Verify pricing calculation: unit sqm applies base_rate_cents × area_sqm
- Verify pricing calculation: unit hour applies base_rate_cents × duration_hours
- Verify pricing calculation: unit flat returns base_rate_cents regardless of area or duration
- Verify pricing calculation: price_multiplier is applied before discount_percent
- Verify pricing calculation: manual_discount_percent is applied last
- Verify pricing calculation result is rounded to nearest integer in cents
- Verify GET /api/v1/services does not return services from other tenants
- Verify soft-deleted services do not appear in list endpoints

===

TASK 07 — Quote Flow
Dependencies: TASK 06

Scope:
- Create Quote entity and migration with all fields defined in the SPEC including deleted_at
- Implement the Quote state machine: draft → sent → accepted / expired / rejected — invalid transitions MUST return 400
- On POST /api/v1/quotes, calculate estimated_total_cents using the pricing calculation service from T06
- The CreateQuoteDto MUST include area_sqm (required when service unit is sqm) and duration_hours (required when service unit is hour)
- Implement lazy expiration: on GET /api/v1/quotes and GET /api/v1/quotes/:id, if valid_until < now() and status is sent, update status to expired before returning
- Endpoints: POST /api/v1/quotes, GET /api/v1/quotes, GET /api/v1/quotes/:id, PUT /api/v1/quotes/:id, POST /api/v1/quotes/:id/send
- All endpoints MUST be protected by JwtAuthGuard and RolesGuard (minimum role: supervisor)
- POST /api/v1/quotes/:id/send requires the quotes.send permission
- All list endpoints MUST support pagination with correct meta
- All multi-step operations (e.g. send quote → update status → emit event) MUST be wrapped in a database transaction
- Emit domain events: quote.created, quote.sent, quote.accepted, quote.expired
- Emit audit log entry for every state transition
- Output MUST NEVER expose deleted_at — map to response DTO

Tests:
- Verify estimated_total_cents is correctly calculated on quote creation using the pricing service
- Verify state machine: draft → sent is valid
- Verify state machine: sent → accepted is valid
- Verify state machine: accepted → sent is invalid and returns 400
- Verify lazy expiration: a sent quote with valid_until in the past is returned with status expired
- Verify draft quotes are not affected by lazy expiration
- Verify accepted and rejected quotes do not change status regardless of valid_until
- Verify domain events are emitted on quote.created, quote.sent, quote.accepted
- Verify quotes from other tenants are not accessible

===

TASK 08 — Booking & Scheduling
Dependencies: TASK 07

Scope:
- Create Booking, Availability, and Assignment entities and migrations with all fields defined in the SPEC including deleted_at
- Booking MUST include idempotency_key field — if a POST /api/v1/bookings request is received with an existing idempotency_key for the same tenant, the original response MUST be returned without re-executing
- Booking creation MUST be wrapped in a database transaction: quote status update to accepted + booking creation + audit log entry + domain event emission must all succeed or all fail
- Implement scheduling conflict detection: creating or updating availability MUST check for overlapping time slots for the same employee on the same date
- Endpoints: POST /api/v1/bookings, GET /api/v1/bookings, GET /api/v1/bookings/:id, PUT /api/v1/bookings/:id, POST /api/v1/bookings/:id/complete, GET /api/v1/availability, POST /api/v1/availability, GET /api/v1/assignments, POST /api/v1/assignments
- POST /api/v1/availability accepts staff role — all other endpoints require minimum supervisor role
- All list endpoints MUST support pagination with correct meta
- Emit domain events: booking.confirmed, booking.completed
- Emit audit log entry for every status transition
- Output MUST NEVER expose deleted_at — map to response DTO

Tests:
- Verify booking creation with an existing idempotency_key returns the original response without duplicate creation
- Verify booking creation fails atomically: if any step in the transaction fails, no partial state is persisted
- Verify scheduling conflict detection: overlapping availability slots for the same employee return 400
- Verify non-overlapping availability slots are created successfully
- Verify POST /api/v1/bookings/:id/complete emits booking.completed domain event
- Verify bookings from other tenants are not accessible
- Verify staff role can POST /api/v1/availability but cannot POST /api/v1/bookings
- Verify soft-deleted bookings do not appear in list endpoints

===

TASK 09 — Domain Events & Audit Log Infrastructure
Dependencies: TASK 08

Scope:
- Implement the internal domain event bus: a lightweight in-process event emitter that allows modules to emit and subscribe to domain events without direct service-to-service coupling
- The event bus MUST support the following events as defined in the SPEC: quote.created, quote.sent, quote.accepted, quote.expired, booking.confirmed, booking.completed, payment.received
- All previously emitted events in T07 and T08 MUST be wired through this event bus — refactor emission calls in T07 and T08 to use the new bus (do not add new business logic, only wire existing emissions)
- Implement the AuditLogService that subscribes to all domain events and writes entries to the audit_logs table — this service MUST NOT be called directly from controllers or application services; it MUST listen via the event bus only
- The audit log entry MUST include: tenant_id, user_id, action, entity, entity_id, payload (state snapshot), created_at
- No new endpoints in this task

Tests:
- Verify emitting quote.created writes a correct audit log entry
- Verify emitting booking.completed writes a correct audit log entry
- Verify AuditLogService is never called directly — only receives events via the bus
- Verify that a domain event emitted in T07 (quote.sent) is correctly received and logged after the refactor
- Verify that a domain event emitted in T08 (booking.confirmed) is correctly received and logged after the refactor
- Verify audit log entries include all required fields: tenant_id, user_id, action, entity, entity_id, payload, created_at

===

TASK 10 — Notifications
Dependencies: TASK 09

Scope:
- Create Notification entity and migration with all fields defined in the SPEC including deleted_at
- Implement an internal sequential notification queue: notifications are enqueued and processed one by one — no external queue dependency
- Implement email adapter and SMS adapter — both MAY be stubbed in development (e.g. log to console) but MUST be injectable and replaceable without changing business logic
- Subscribe to the following domain events via the event bus (from T09) and enqueue the corresponding notifications:
  - quote.sent → enqueue notification with template quote.sent
  - quote.accepted → enqueue notification with template quote.accepted
  - quote.expired → enqueue notification with template quote.expired
  - booking.confirmed → enqueue notification with templates booking.confirmed (email + sms)
  - booking.completed → enqueue notification with template booking.completed
  - assignment.created → enqueue notification with template assignment.created
- The payload field MUST contain exactly the variables defined in the SPEC for each template
- Adapters MUST interpolate variables using the {{variable}} pattern
- Endpoints: GET /api/v1/notifications, POST /api/v1/notifications/send
- GET /api/v1/notifications MUST support pagination with correct meta and be scoped by tenant_id
- All endpoints MUST be protected by JwtAuthGuard (minimum role: supervisor)
- Check FeatureFlagService before dispatching sms type notifications — if sms_notifications flag is disabled for the tenant, skip SMS dispatch silently

Tests:
- Verify quote.sent event enqueues a notification with the correct template and payload
- Verify booking.confirmed event enqueues both email and sms notifications
- Verify SMS notification is skipped when sms_notifications feature flag is disabled for the tenant
- Verify notification status transitions: pending → sent on successful dispatch
- Verify notification status transitions: pending → failed on adapter error
- Verify GET /api/v1/notifications does not return notifications from other tenants
- Verify soft-deleted notifications do not appear in list endpoints
- Verify adapters are replaceable without changing notification business logic

===

TASK 11 — Billing
Dependencies: TASK 10

Scope:
- Create Payment and Invoice entities and migrations with all fields defined in the SPEC including deleted_at
- Payment MUST include idempotency_key field — if a POST /api/v1/payments request is received with an existing idempotency_key for the same tenant, the original response MUST be returned without re-executing
- Subscribe to the booking.completed domain event (from T09): automatically generate an Invoice when a booking is completed — this MUST be wrapped in a database transaction (invoice creation + payment record linkage + audit log)
- Implement invoice number generation: sequential, tenant-scoped, human-readable (e.g. INV-0001)
- Endpoints: GET /api/v1/invoices, POST /api/v1/invoices, POST /api/v1/payments
- All endpoints MUST be protected by JwtAuthGuard and RolesGuard (minimum role: supervisor)
- All list endpoints MUST support pagination with correct meta and be scoped by tenant_id
- Emit domain event: payment.received when a payment status is updated to completed
- Emit audit log entry for invoice creation and payment recording
- Output MUST NEVER expose deleted_at — map to response DTO

Tests:
- Verify booking.completed event automatically generates an invoice for the correct tenant
- Verify invoice generation is atomic: if any step fails, no partial state is persisted
- Verify invoice numbers are sequential and scoped per tenant (tenant A and tenant B have independent sequences)
- Verify POST /api/v1/payments with an existing idempotency_key returns the original response without duplicate payment
- Verify payment.received domain event is emitted when payment status is updated to completed
- Verify invoices from other tenants are not accessible
- Verify soft-deleted invoices do not appear in list endpoints

===

TASK 12 — Security Baseline, Rate Limiting & OpenAPI
Dependencies: TASK 11

Scope:
- Apply rate limiting globally: per IP and per authenticated user — configure limits via environment variables
- Apply stricter rate limiting to /api/v1/auth/* endpoints (already partially done in T03 — ensure consistency and env-var configurability)
- Verify and enforce CORS restriction to the frontend origin defined in environment variables — wildcard (*) MUST NOT be allowed
- Verify mass assignment prevention is applied consistently across all existing DTOs — fix any gaps found
- Verify input sanitization is applied globally — fix any gaps found
- Install and configure Swagger/OpenAPI — the spec MUST reflect all endpoints from T03 to T11, with correct request/response schemas, authentication requirements, and error responses
- The OpenAPI spec MUST be available at /api/v1/docs in development and MUST be the source of truth for all API contracts
- No new business logic, no new entities, no new endpoints beyond /api/v1/docs

Tests:
- Verify rate limiting blocks requests exceeding the configured threshold per IP
- Verify rate limiting blocks requests exceeding the configured threshold per authenticated user
- Verify auth endpoints are blocked sooner than standard endpoints under load
- Verify CORS rejects requests from origins not in the allowed list
- Verify the OpenAPI spec is accessible at /api/v1/docs
- Verify the OpenAPI spec includes all endpoints from T03 to T11
- Verify all endpoints in the OpenAPI spec have correct authentication annotations

===

TASK 13 — Frontend MVP Part A: Auth, Shell & Client Management
Dependencies: TASK 12

Scope:
- Initialize the React + TypeScript frontend (already scaffolded in T01 — implement the application from the existing scaffold)
- Implement the login screen: call POST /api/v1/auth/login, store access token and refresh token securely (memory + httpOnly cookie or equivalent secure strategy)
- Implement automatic token refresh: intercept 401 responses, call POST /api/v1/auth/refresh, retry the original request — if refresh fails, redirect to login
- Implement the application shell with React Router: protected routes that redirect unauthenticated users to login
- Implement role-based route protection: routes inaccessible to the authenticated user's role MUST redirect to an appropriate fallback
- Implement Client list screen: paginated table consuming GET /api/v1/clients with support for page navigation
- Implement Client create screen: form consuming POST /api/v1/clients with validation feedback
- Implement Client edit screen: form consuming PUT /api/v1/clients/:id with validation feedback
- Implement Address create and edit forms as part of the Client screens
- All screens MUST respect the authenticated user's permissions for UI element visibility (e.g. hide create button if role is staff)
- No backend changes in this task

Tests:
- Verify login form submits credentials and stores tokens on success
- Verify failed login displays an error message and does not store tokens
- Verify 401 response triggers automatic token refresh and retries the original request
- Verify failed token refresh redirects to login and clears stored tokens
- Verify protected routes redirect unauthenticated users to login
- Verify role-based route protection: staff cannot access supervisor-only routes
- Verify Client list renders paginated results and navigates between pages
- Verify Client create form validates required fields before submitting
- Verify Client edit form pre-populates with existing data

===

TASK 14 — Frontend MVP Part B: Quotes, Bookings & Dashboard
Dependencies: TASK 13

Scope:
- Implement Quote list screen: paginated table consuming GET /api/v1/quotes, displaying status with visual distinction per state
- Implement Quote create screen: form consuming POST /api/v1/quotes with service selection, pricing rule selection, and real-time estimated total display (computed client-side using the same formula defined in the SPEC)
- Implement Quote send action: button consuming POST /api/v1/quotes/:id/send — visible only to users with the quotes.send permission
- Implement Booking list screen: paginated table consuming GET /api/v1/bookings
- Implement Booking create screen: form consuming POST /api/v1/bookings — generates and sends idempotency_key from the frontend
- Implement Booking complete action: button consuming POST /api/v1/bookings/:id/complete — visible only to supervisor and tenant_admin roles
- Implement Dashboard screen with the following metrics computed via existing API responses (no dedicated analytics endpoint):
  - Total confirmed bookings
  - Total open (draft + sent) quotes
  - Last 5 notifications
- All screens MUST respect the authenticated user's permissions for UI element visibility
- Check feature flags from the backend before rendering feature-gated UI elements
- No backend changes in this task

Tests:
- Verify Quote list renders paginated results with correct status labels
- Verify Quote create form computes estimated total client-side correctly (matching SPEC formula)
- Verify Quote send button is hidden for staff role
- Verify Booking create form generates and sends a unique idempotency_key
- Verify Booking complete button is hidden for staff role
- Verify Dashboard displays correct counts for confirmed bookings and open quotes
- Verify Dashboard renders last 5 notifications in correct order
- Verify feature-gated UI elements are hidden when the corresponding flag is disabled for the tenant

===

TASK 15 — Full System Validation (Integration & E2E)
Dependencies: TASK 14

Scope:
- This task contains NO production code changes
- All test files MUST be created in a dedicated top-level folder: tests/e2e/ and tests/integration/ — no existing file outside these folders may be modified
- The agent MUST choose the most appropriate E2E testing tool for the project stack and context (e.g. Playwright, Cypress, Supertest, or a combination) — the choice MUST be justified in a brief comment at the top of the test suite file
- All tests run against the local environment (Docker Compose up with seed data from T02)
- If a required fixture, factory, or test helper does not exist, the agent MAY create it inside tests/support/ — no production code may be created or modified

Full system tests MUST cover the following scenarios:

Authentication & Security:
- Full auth lifecycle: login → access protected endpoint → token expiry → refresh → retry → logout
- Reuse detection: logout → attempt refresh with revoked token → verify all sessions revoked → verify 401
- Cross-tenant access: authenticate as tenant A → attempt to access tenant B resource → verify 403
- CORS: request from unauthorized origin → verify rejection
- Rate limiting: exceed auth endpoint threshold → verify 429

Quote-to-Booking end-to-end flow:
- Create service → create pricing rule → create client → create quote → send quote → accept quote → verify booking created → verify invoice generated → verify notifications enqueued → verify audit log entries written

Billing & Idempotency:
- Submit payment with idempotency_key → submit same request again → verify only one payment record exists → verify payment.received event emitted once

Soft Delete:
- Create entity → soft delete → verify it does not appear in list → verify it does not appear in GET by ID → verify it can be retrieved with withDeleted query if applicable

RBAC enforcement across all endpoints:
- staff role: verify access to allowed endpoints and 403 on all others
- supervisor role: verify access to allowed endpoints and 403 on tenant_admin-only endpoints
- tenant_admin role: verify full access

Feature flags:
- Disable sms_notifications flag for tenant → trigger booking.confirmed event → verify SMS notification is NOT dispatched → verify email notification IS dispatched

Frontend E2E (full flows in browser):
- Login → navigate to clients → create client → create quote for client → send quote → create booking → complete booking → verify dashboard metrics updated
- Verify token refresh happens transparently during a long user session
- Verify role-based UI restrictions are enforced in the browser (staff cannot see supervisor-only buttons)

Definition of Done for TASK 15:
- All tests pass against the local Docker Compose environment with seed data
- No production code was created or modified
- Test files exist only inside tests/e2e/, tests/integration/, and tests/support/
- The chosen E2E tool is justified in a comment at the top of the suite