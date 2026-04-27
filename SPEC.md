# Cleaning SaaS Platform Technical Specification

## Executive Summary

This technical specification defines the implementation for the Cleaning SaaS Platform using a modular NestJS backend and a React + TypeScript frontend SPA. The system uses a shared PostgreSQL database with logical multi-tenant isolation by `tenant_id`, and authentication is handled via JWT access tokens and refresh tokens with RBAC.

The system MUST enforce:
- Tenant isolation on every query
- RBAC authorization on every endpoint
- Modular architecture with strict domain boundaries
- Clean separation between controllers, services, and repositories

## Non-Goals (MVP Scope Protection)

The following are explicitly out of scope for the MVP and must not be implemented:
- Microservices architecture
- WebSockets or real-time features
- Dedicated analytics module
- External currency exchange API integration
- Real-time event streaming

## System Architecture

### Component Overview

- **Frontend SPA**: React + TypeScript. Provides tenant administration, quotes, bookings, CRM, staff scheduling, and branding.
- **Backend API**: NestJS modular monolith organized into domain modules. Provides REST endpoints, authorization, and business orchestration.
- **Database**: PostgreSQL shared schema with `tenant_id` on all scoped tables.
- **Auth Service**: JWT-based auth with short-lived access tokens, refresh tokens, and RBAC guards.
- **Notification Service**: Internal module for email/SMS delivery and tracking.
- **Billing Module**: Handles payment records, invoice generation metadata, and billing workflows.
- **Analytics Module**: Out of scope for the MVP. The Frontend MVP dashboard (Task 10B) will display basic metrics computed directly via queries on existing modules (Bookings, Quotes, Notifications), without a dedicated module. A dedicated Analytics Module will be specified in a future version.

### Data Flow Between Components

1. User logs in through the frontend, receives JWT access and refresh tokens.
2. Frontend sends requests with Bearer access token.
3. Backend middleware validates token, extracts `tenant_id`, roles, and user identity.
4. Business modules query PostgreSQL with tenant-scoped filters.
5. Notification module sends outbound notifications and stores audit events.
6. Billing module records invoices and payments.

## Critical Rules (NON-NEGOTIABLE)

Violation of any of these rules is considered a critical bug:

- ALL queries MUST include `tenant_id` as an explicit filter
- NO cross-tenant data access is allowed under any circumstance
- ALL endpoints MUST enforce RBAC before executing business logic
- Controllers MUST NOT contain business logic — they delegate to services only
- Database access MUST occur only via repositories — never directly from services or controllers
- Soft-deleted records (`deleted_at IS NOT NULL`) MUST NOT be returned in any query

## Naming & Conventions

| Layer | Convention |
|---|---|
| Database columns and table names | `snake_case` |
| Backend (NestJS) variables, methods, classes | `camelCase` / `PascalCase` |
| Frontend (React/TS) variables, components | `camelCase` / `PascalCase` |

Mapping between database `snake_case` and backend `camelCase` MUST be explicit — never rely on implicit ORM transformation.

## Module Architecture (MANDATORY)

Every domain module MUST follow this folder structure:

```
modules/<domain>/
  domain/         → entities and domain interfaces
  application/    → services and use cases
  infrastructure/ → repositories and external adapters
  interfaces/     → controllers and DTOs
  validation/     → input validation schemas
```

Rules:
- `domain/` contains only entities and interfaces — no framework dependencies
- `application/` contains only services — no HTTP or database concerns
- `infrastructure/` contains only repositories and adapters — no business logic
- `interfaces/` contains only controllers — delegates immediately to application layer
- `validation/` contains only DTO classes and validation schemas

## Implementation Design

### Core Interfaces

```ts
export interface AuthUser {
  userId: string;
  tenantId: string;
  roles: string[];
  permissions?: string[];
}

export interface TenantScopedRepository<T> {
  findById(id: string, tenantId: string): Promise<T | null>;
  findAll(tenantId: string, filters?: any): Promise<T[]>;
  save(entity: T): Promise<T>;
}
```

```ts
export interface QuoteService {
  createQuote(input: CreateQuoteDto, authUser: AuthUser): Promise<Quote>;
  sendQuote(quoteId: string, authUser: AuthUser): Promise<void>;
  acceptQuote(quoteId: string, authUser: AuthUser): Promise<Booking>;
}
```

### Base Domain Abstraction

`Project` is a base domain abstraction that provides a stable structural contract for core domain entities. It is not a business entity — it is a technical foundation designed to allow the domain model to evolve (e.g. toward a `Post`-style abstraction) without requiring cross-domain refactoring.

```ts
export interface Project {
  id: string;                  // UUID v4
  tenantId: string;
  name: string;                // DOMAIN_RENAME → content in future versions
  description: string | null;  // DOMAIN_RENAME → metadata/content in future versions
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

Rules:
- This abstraction MUST NOT be tightly coupled to any specific domain module
- Domain entities that map to this contract MUST do so via interface implementation, not inheritance
- The field names `name` and `description` are intentionally generic — domain modules may expose them under domain-specific aliases without changing the underlying contract
- `deletedAt` is always present — all entities implementing this interface support soft delete by definition

### Data Models

#### Global Rules

- ALL IDs MUST be UUID v4
- ALL tables MUST include `tenant_id` (except global tables such as `refresh_tokens` and `audit_logs`, where `tenant_id` is stored for reference but not used as an isolation filter)
- ALL tables MUST include `deleted_at: timestamp | null` to support soft delete
- Soft-deleted records MUST be excluded from all queries automatically via repository-layer filtering

#### Tenant
- `id: UUID`
- `name: string`
- `currency: 'BRL' | 'USD'`
- `timezone: string`
- `exchange_rate_cents: integer` (manual BRL rate per 1 USD, e.g. 570 = R$5.70)
- `created_at`, `updated_at`, `deleted_at`

#### User
- `id: UUID`
- `tenant_id: UUID`
- `email: string`
- `password_hash: string` (bcrypt)
- `roles: string[]`
- `first_name`, `last_name`
- `created_at`, `updated_at`, `deleted_at`

#### Client
- `id: UUID`
- `tenant_id: UUID`
- `name: string`
- `email: string`
- `phone: string`
- `address_id: UUID`
- `preferred_language: 'pt-BR' | 'en' | 'es'`
- `created_at`, `updated_at`, `deleted_at`

#### Address
- `id: UUID`
- `tenant_id: UUID`
- `street`, `city`, `state`, `postal_code`, `country`
- `latitude`, `longitude`
- `created_at`, `updated_at`, `deleted_at`

#### Service
- `id: UUID`
- `tenant_id: UUID`
- `name: string`
- `description: string`
- `base_rate_cents: integer`
- `unit: 'sqm' | 'hour' | 'flat'`
- `created_at`, `updated_at`, `deleted_at`

#### PricingRule
- `id: UUID`
- `tenant_id: UUID`
- `service_id: UUID`
- `min_area`, `max_area`
- `frequency: 'one_time' | 'weekly' | 'monthly'`
- `discount_percent: integer`
- `price_multiplier: decimal`
- `created_at`, `updated_at`, `deleted_at`

#### Pricing Calculation Rules

The `estimated_total_cents` of a Quote is calculated in the following order:

1. **Base:** `base_rate_cents` from the Service.
2. **Unit application:**
   - `sqm`: `base_rate_cents × area_sqm` (`area_sqm` provided in `CreateQuoteDto`)
   - `hour`: `base_rate_cents × duration_hours` (`duration_hours` provided in `CreateQuoteDto`)
   - `flat`: `base_rate_cents` (fixed value, ignores area and duration)
3. **PricingRule application** (if `pricing_rule_id` is not null):
   - Apply `price_multiplier` first: `subtotal × price_multiplier`
   - Apply `discount_percent` after: `subtotal × (1 - discount_percent / 100)`
   - When both are set (multiplier > 1 and discount > 0), both apply in this order.
4. **Manual discount** (if `manual_discount_percent` > 0):
   - Applied last: `subtotal × (1 - manual_discount_percent / 100)`
5. **Result:** round to the nearest integer in cents.

The fields `area_sqm` and `duration_hours` must be added to `CreateQuoteDto` as optional fields (required only when the Service `unit` is `sqm` or `hour`, respectively).

#### Quote
- `id: UUID`
- `tenant_id: UUID`
- `client_id: UUID`
- `service_id: UUID`
- `pricing_rule_id: UUID | null`
- `status: 'draft' | 'sent' | 'accepted' | 'expired' | 'rejected'`
- `estimated_total_cents: integer`
- `currency: string`
- `valid_until: timestamp`
- `manual_discount_percent: integer`
- `created_by: UUID`
- `created_at`, `updated_at`, `deleted_at`

#### Quote Expiration Rules

- Expiration is verified **lazily**: on every `GET /api/v1/quotes/:id` and `GET /api/v1/quotes`, the backend compares `valid_until` against the current timestamp.
- If `valid_until < now()` and the status is still `sent`, the status is automatically updated to `expired` before returning the response.
- Quotes with status `draft` do not expire automatically — `valid_until` is only relevant after the quote is sent.
- Quotes with status `accepted` or `rejected` do not change status regardless of `valid_until`.
- No background job for expiration in the MVP. This decision must be revisited in future versions.

#### Booking
- `id: UUID`
- `tenant_id: UUID`
- `quote_id: UUID`
- `client_id: UUID`
- `service_id: UUID`
- `idempotency_key: string` (required on creation to prevent duplicate bookings)
- `scheduled_start`, `scheduled_end`
- `status: 'confirmed' | 'rescheduled' | 'cancelled' | 'completed'`
- `assigned_team: string | null`
- `created_at`, `updated_at`, `deleted_at`

#### Employee / Staff
- `id: UUID`
- `tenant_id: UUID`
- `user_id: UUID`
- `first_name`, `last_name`
- `phone: string`
- `role: 'staff' | 'supervisor'`
- `skills: string[]`
- `created_at`, `updated_at`, `deleted_at`

#### Availability
- `id: UUID`
- `tenant_id: UUID`
- `employee_id: UUID`
- `available_date: date`
- `start_time`, `end_time`
- `created_at`, `updated_at`, `deleted_at`

#### Assignment
- `id: UUID`
- `tenant_id: UUID`
- `booking_id: UUID`
- `employee_id: UUID`
- `status: 'assigned' | 'accepted' | 'declined' | 'completed'`
- `assigned_at: timestamp`
- `completed_at: timestamp | null`
- `deleted_at: timestamp | null`

#### Payment
- `id: UUID`
- `tenant_id: UUID`
- `booking_id: UUID | null`
- `quote_id: UUID | null`
- `idempotency_key: string` (required on creation to prevent duplicate charges)
- `amount_cents: integer`
- `currency: string`
- `status: 'pending' | 'completed' | 'failed'`
- `payment_method: string`
- `external_reference: string | null`
- `created_at`, `updated_at`, `deleted_at`

#### Invoice
- `id: UUID`
- `tenant_id: UUID`
- `booking_id: UUID`
- `client_id: UUID`
- `total_cents: integer`
- `currency: string`
- `invoice_number: string`
- `issued_at: timestamp`
- `due_date: timestamp`
- `status: 'draft' | 'issued' | 'paid'`
- `created_at`, `updated_at`, `deleted_at`

#### Notification
- `id: UUID`
- `tenant_id: UUID`
- `client_id: UUID | null`
- `booking_id: UUID | null`
- `quote_id: UUID | null`
- `type: 'email' | 'sms'`
- `template: string`
- `status: 'pending' | 'sent' | 'failed'`
- `sent_at: timestamp | null`
- `payload: jsonb`
- `created_at`, `updated_at`, `deleted_at`

#### Notification Templates

The `template` field of the Notification entity accepts the following defined values:

| Template | Triggering event | Channel | Payload variables |
|---|---|---|---|
| `quote.sent` | Quote sent to client | email | `client_name`, `quote_id`, `total`, `currency`, `valid_until` |
| `quote.accepted` | Client accepted the quote | email | `client_name`, `quote_id`, `booking_id` |
| `quote.expired` | Quote expired without response | email | `client_name`, `quote_id` |
| `booking.confirmed` | Booking successfully created | email + sms | `client_name`, `booking_id`, `scheduled_start`, `address` |
| `booking.reminder` | 24h before the scheduled appointment | sms | `client_name`, `scheduled_start` |
| `booking.completed` | Booking marked as completed | email | `client_name`, `booking_id`, `invoice_id` |
| `assignment.created` | Staff allocated to a booking | sms | `employee_name`, `booking_id`, `scheduled_start` |

The `payload: jsonb` field must contain exactly the variables listed for the corresponding template. Email and SMS adapters must interpolate variables in the message body using the `{{variable}}` pattern.

#### Audit Log

All state-changing operations must emit an audit log entry. The `audit_logs` table is global (no tenant isolation filter — `tenant_id` is stored for reference only):

- `id: UUID`
- `tenant_id: UUID`
- `user_id: UUID`
- `action: string` (e.g. `quote.sent`, `booking.completed`, `payment.received`)
- `entity: string` (e.g. `Quote`, `Booking`)
- `entity_id: UUID`
- `payload: jsonb` (snapshot of relevant state at the time of the action)
- `created_at: timestamp`

#### Feature Flags

The `tenant_feature_flags` table allows features to be toggled per tenant without code changes:

- `id: UUID`
- `tenant_id: UUID`
- `feature: string` (e.g. `sms_notifications`, `booking_reminder`, `multi_currency`)
- `enabled: boolean`
- `created_at`, `updated_at`

All feature-gated logic MUST check the flag at runtime before executing. The frontend MUST also respect feature flags for UI rendering.

#### Interaction / Activity
- `id: UUID`
- `tenant_id: UUID`
- `client_id: UUID`
- `user_id: UUID | null`
- `type: 'note' | 'call' | 'email' | 'sms' | 'booking_update'`
- `subject: string`
- `body: string`
- `created_at`, `updated_at`, `deleted_at`

### API Standards

#### Versioning

ALL endpoints MUST be prefixed with `/api/v1/`. No unversioned endpoints are allowed.

#### Response Format

All successful responses MUST follow this envelope:

```json
{
  "data": {},
  "meta": {}
}
```

#### Error Format

All error responses MUST follow this structure:

```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

#### Pagination

ALL list endpoints (`GET` returning arrays) MUST support the following query parameters:

| Parameter | Type | Default | Max |
|---|---|---|---|
| `page` | integer | 1 | — |
| `limit` | integer | 20 | 100 |
| `sort` | string | `created_at` | — |
| `order` | `asc` \| `desc` | `desc` | — |

The `meta` field in the response MUST include: `total`, `page`, `limit`, `totalPages`.

#### DTO & Validation Rules

- All input MUST be validated via DTO classes before reaching the service layer
- Output MUST NEVER expose internal fields (e.g. `password_hash`, `token_hash`, `deleted_at`)
- Raw entities MUST NEVER be returned directly from controllers — always map to a response DTO

### API Endpoints

#### Auth
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

#### Tenant
- `GET /api/v1/tenants/me`
- `PUT /api/v1/tenants/me`

#### Users
- `GET /api/v1/users`
- `POST /api/v1/users`
- `PUT /api/v1/users/:id`

#### Clients
- `GET /api/v1/clients`
- `POST /api/v1/clients`
- `PUT /api/v1/clients/:id`

#### Addresses
- `POST /api/v1/addresses`
- `PUT /api/v1/addresses/:id`

#### Services and Pricing Rules
- `GET /api/v1/services`
- `POST /api/v1/services`
- `PUT /api/v1/services/:id`
- `GET /api/v1/pricing-rules`
- `POST /api/v1/pricing-rules`
- `PUT /api/v1/pricing-rules/:id`

#### Quotes
- `POST /api/v1/quotes`
- `GET /api/v1/quotes`
- `GET /api/v1/quotes/:id`
- `PUT /api/v1/quotes/:id`
- `POST /api/v1/quotes/:id/send`

#### Bookings
- `POST /api/v1/bookings`
- `GET /api/v1/bookings`
- `GET /api/v1/bookings/:id`
- `PUT /api/v1/bookings/:id`
- `POST /api/v1/bookings/:id/complete`

#### Scheduling
- `GET /api/v1/availability`
- `POST /api/v1/availability`
- `GET /api/v1/assignments`
- `POST /api/v1/assignments`

#### Billing
- `GET /api/v1/invoices`
- `POST /api/v1/invoices`
- `POST /api/v1/payments`

#### Notifications
- `GET /api/v1/notifications`
- `POST /api/v1/notifications/send`

## Integration Points

- **Email/SMS gateway**: Sends outbound communications. Adapters may be stubbed in development but MUST be injectable and replaceable without changing business logic.
- **Currency exchange API**: Out of scope for the MVP. The USD/BRL exchange rate is configured manually per tenant via the `exchange_rate_cents` field on the Tenant model. Integration with a real-time external exchange rate API will be specified in a future version. The `currency` field on Quote, Payment, and Invoice entities must always be respected — conversions occur only at the frontend display layer.
- **Refresh token store**: Persisted storage for token revocation and rotation, with the following rules:
  - The refresh token is rotated on every use — each call to `POST /api/v1/auth/refresh` invalidates the current token and issues a new one.
  - Logout (`POST /api/v1/auth/logout`) invalidates only the refresh token present in the request body. Other active sessions for the same user are not affected.
  - Refresh tokens expire in 30 days. Access tokens expire in 15 minutes.
  - Refresh tokens are stored as hashes (bcrypt) in the `refresh_tokens` table with fields: `id`, `user_id`, `tenant_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`.
  - Attempts to reuse an already-revoked token must return 401 and revoke all active tokens for that user (reuse detection).

## Security Baseline

- Passwords MUST be hashed with bcrypt (minimum cost factor 12)
- All input MUST be sanitized before processing
- CORS MUST be restricted to known frontend origins — wildcard (`*`) is not allowed
- Mass assignment MUST be prevented — DTOs must explicitly whitelist accepted fields
- Rate limiting MUST be applied per IP and per authenticated user
- Auth endpoints (`/api/v1/auth/*`) MUST have stricter rate limits than standard endpoints

## Transactions

Multi-step write operations MUST be wrapped in a database transaction. Partial writes are forbidden. Operations requiring transactions include (non-exhaustive):

- Quote acceptance → Booking creation
- Booking completion → Invoice generation → Notification dispatch
- Payment recording → Invoice status update

## Idempotency

The following operations MUST support idempotent execution via an `idempotency_key` field:

- `POST /api/v1/bookings` — prevents duplicate bookings from retried requests
- `POST /api/v1/payments` — prevents duplicate charges

If a request is received with an `idempotency_key` that already exists for the same tenant, the original response MUST be returned without re-executing the operation.

## Domain Events

The following events MUST be emitted internally after the corresponding operations complete. They serve as the integration contract between modules (Billing, Notifications, Audit Log) and MUST NOT be consumed via direct service calls across domain boundaries:

| Event | Emitted after |
|---|---|
| `quote.created` | Quote successfully persisted |
| `quote.sent` | Quote status updated to `sent` |
| `quote.accepted` | Quote status updated to `accepted` |
| `quote.expired` | Quote status lazily updated to `expired` |
| `booking.confirmed` | Booking successfully created |
| `booking.completed` | Booking status updated to `completed` |
| `payment.received` | Payment status updated to `completed` |

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|-------------|----------------------|-----------------|
| Backend API | modified | Add multi-tenant middleware, auth guards, quote/booking flows | Implement tenant enforcement and RBAC |
| Database | new/modified | Add tenant-scoped tables and indexes | Create schema and migrations |
| Frontend | modified | Add auth and tenant-aware UX | Build login, refresh, and role-based routing |
| Notifications | new | Email/SMS delivery and audit history | Implement queue and adapters |
| Billing | new | Invoice and payment lifecycle | Build billing entities and endpoints |

## Testing Policy

- All business logic MUST have unit tests — a feature is not complete without them
- All core flows MUST have integration tests
- Tests MUST cover: tenant isolation, RBAC enforcement, pricing calculation, state machine transitions, conflict detection

### Unit Tests
- Auth and token refresh logic
- Quote pricing calculation and expiration behavior
- Booking conflict resolution and availability
- Tenant isolation filters
- Idempotency key handling

### Integration Tests
- Auth lifecycle with refresh and reuse detection
- Quote-to-booking acceptance path
- Notification event delivery
- Billing record creation after booking completion
- Domain event emission and consumption

## Definition of Done

A task is considered complete only when ALL of the following are true:

- Code is complete and merged
- All unit and integration tests are passing
- RBAC is enforced on every new endpoint
- Tenant isolation is validated (no cross-tenant data leakage)
- OpenAPI/Swagger spec is updated to reflect all new endpoints
- No `TODO` or `FIXME` comments remain in delivered code
- Response and error formats follow the API Standards defined in this spec

## Development Sequencing

1. Backend core and auth module.
2. Tenant and user management.
3. Client and address management.
4. Services and pricing rules.
5. Quote creation and send flow.
6. Booking and scheduling.
7. Assignment and staff availability.
8. Notifications.
9. Billing.
10. Frontend MVP.

## Seed Data

The following seed data MUST be created as part of the initial migration for local development and staging environments:

- One default tenant (`id` fixed for reproducibility)
- Three users under the default tenant:
  - `admin@seed.local` with role `tenant_admin`
  - `supervisor@seed.local` with role `supervisor`
  - `staff@seed.local` with role `staff`
- Default password for all seed users: defined via `SEED_DEFAULT_PASSWORD` environment variable

## Monitoring and Observability

- Structured logs (JSON format) on all requests, errors, and domain events
- Request tracing with correlation ID propagated through all layers
- Error tracking with stack trace capture on 5xx responses
- Track request latency — alert if P95 exceeds 300ms
- Monitor notification queue depth — alert on backlog
- Alert on database connection issues and token validation failures
- Log all auth failures and unauthorized access attempts

## Operational Constraints

| Constraint | Limit |
|---|---|
| Max API response time (P95) | 300ms |
| Max items per list response | 100 |
| Max request payload size | 1MB |

## Technical Considerations

- Use NestJS for modular backend structure following the module architecture defined in this spec.
- Use PostgreSQL with `tenant_id` logical isolation.
- Use JWT access and refresh tokens.
- Use environment variables for all configuration — validate all required variables at application startup and fail fast if any are missing.
- Use versioned, reversible database migrations — never modify existing migrations after they have been applied.
- Maintain an OpenAPI/Swagger specification as the source of truth for all API contracts — update it as part of every task that introduces or modifies endpoints.
- Use RBAC guards with the following defined roles and permissions:

### Roles

| Role | Description |
|---|---|
| `tenant_admin` | Full access to all tenant endpoints |
| `supervisor` | Bookings, assignments, availability, clients, quotes |
| `staff` | Own availability and assignments assigned to them only |

### Granular Permissions

| Permission | Description |
|---|---|
| `quotes.send` | Send a quote to a client |
| `quotes.read` | Read quotes |
| `bookings.update` | Update booking status |
| `projects.create` | Create domain entities |
| `projects.read` | Read domain entities |

Roles define base access. Permissions enforce specific actions within that access. The backend MUST enforce permissions at the service layer. The frontend MUST use permissions to control UI element visibility.

### Enforcement Rules

- All write endpoints (`POST`, `PUT`) require at minimum the `supervisor` role, except `POST /api/v1/availability` which accepts `staff`.
- Read endpoints (`GET`) accept any authenticated role within the tenant.
- `/api/v1/tenants/me` and `/api/v1/users` endpoints require `tenant_admin`.
- The guard simultaneously validates: valid token + sufficient role + permission present + `tenant_id` from token == `tenant_id` of the resource.

## Architecture Decision Records

- [ADR-001: Full-Featured Launch Approach](.compozy/tasks/cleaning-saas/adrs/adr-001-full-featured-launch.md)
- [ADR-002: Monolithic Modular Architecture with Logical Multi-Tenant Isolation and JWT RBAC](.compozy/tasks/cleaning-saas/adrs/adr-002-monolith-jwt-rbac.md)
