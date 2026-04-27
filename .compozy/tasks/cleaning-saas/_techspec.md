# Technical Specification

## Executive Summary

This technical specification defines the implementation plan for the Cleaning SaaS Platform. It targets a modular monolithic backend built with NestJS, a React + TypeScript frontend SPA, and a shared PostgreSQL database with logical multi-tenant isolation by `tenant_id`. Authentication uses JWT with short-lived access tokens, refresh tokens, and RBAC by user role.

## System Architecture

### Component Overview

- **Frontend SPA**: React + TypeScript application. Responsible for tenant administration, quote creation, booking management, client CRM, staff scheduling, and tenant branding.
- **Backend API**: NestJS monolithic application with modular domain structure. Exposes REST API endpoints, enforces multi-tenancy, and orchestrates business logic.
- **Database**: PostgreSQL shared schema using `tenant_id` on tenant-scoped tables. Centralized metadata tables such as `users` and `tenants` also include tenant context.
- **Auth Service**: JWT-based authentication with access and refresh tokens. Includes role-based guards and tenant validation middleware.
- **Notification Service**: Internal backend module for email/SMS notifications and notification history.
- **Billing Module**: Handles payment records, invoices, and invoice generation metadata.
- **Analytics Module**: Computes KPI reports and exposes data for dashboards.
- **External integrations**: Email/SMS gateway, currency exchange rate API, possibly payment processor integration in later phases.

### Data Flow Between Components

1. Frontend authenticates user via `/api/auth/login`.
2. Backend validates credentials and issues access and refresh tokens.
3. Frontend sends authenticated API requests with access token.
4. Backend middleware extracts `tenant_id` and roles from token, enforces RBAC, and attaches tenant context.
5. Business modules (quotes, bookings, CRM) query PostgreSQL with `tenant_id` filters.
6. Notifications module sends outbound email/SMS and stores `Notification` records.
7. Billing module records `Payment` and `Invoice` entities for completed services.

## Implementation Design

### Core Interfaces

```ts
export interface JwtPayload {
  sub: string;
  tenantId: string;
  roles: string[];
  iat: number;
  exp: number;
}

export interface QuoteService {
  createQuote(createDto: CreateQuoteDto, user: AuthUser): Promise<Quote>;
  acceptQuote(quoteId: string, user: AuthUser): Promise<Booking>;
}
```

```ts
export interface TenantScopedRepository<T> {
  findById(id: string, tenantId: string): Promise<T | null>;
  findAll(tenantId: string, filters?: any): Promise<T[]>;
  save(entity: T): Promise<T>;
}
```

### Data Models

#### Tenant
- `id: UUID`
- `name: string`
- `subscription_plan: string`
- `currency: 'BRL' | 'USD'`
- `timezone: string`
- `created_at: timestamp`
- `updated_at: timestamp`

#### User
- `id: UUID`
- `tenant_id: UUID`
- `email: string`
- `password_hash: string`
- `roles: string[]` (e.g. `admin`, `staff`)
- `first_name: string`
- `last_name: string`
- `created_at`, `updated_at`

#### Client
- `id: UUID`
- `tenant_id: UUID`
- `name: string`
- `email: string`
- `phone: string`
- `address_id: UUID`
- `preferred_language: 'pt-BR' | 'en' | 'es'`
- `created_at`, `updated_at`

#### Address
- `id: UUID`
- `tenant_id: UUID`
- `street: string`
- `city: string`
- `state: string`
- `postal_code: string`
- `country: string`
- `latitude: number | null`
- `longitude: number | null`
- `created_at`, `updated_at`

#### Service
- `id: UUID`
- `tenant_id: UUID`
- `name: string`
- `description: string`
- `base_rate_cents: integer`
- `unit: 'sqm' | 'hour' | 'flat'`
- `created_at`, `updated_at`

#### PricingRule
- `id: UUID`
- `tenant_id: UUID`
- `service_id: UUID`
- `min_area: integer | null`
- `max_area: integer | null`
- `frequency: 'one_time' | 'weekly' | 'monthly'`
- `discount_percent: integer`
- `price_multiplier: decimal`
- `created_at`, `updated_at`

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
- `created_at`, `updated_at`

#### Booking
- `id: UUID`
- `tenant_id: UUID`
- `quote_id: UUID`
- `client_id: UUID`
- `service_id: UUID`
- `scheduled_start: timestamp`
- `scheduled_end: timestamp`
- `status: 'confirmed' | 'rescheduled' | 'cancelled' | 'completed'`
- `assigned_team: string | null`
- `created_at`, `updated_at`

#### Employee / Staff
- `id: UUID`
- `tenant_id: UUID`
- `user_id: UUID`
- `first_name: string`
- `last_name: string`
- `phone: string`
- `role: 'staff' | 'supervisor'`
- `skills: string[]`
- `created_at`, `updated_at`

#### Availability
- `id: UUID`
- `tenant_id: UUID`
- `employee_id: UUID`
- `available_date: date`
- `start_time: time`
- `end_time: time`
- `created_at`, `updated_at`

#### Assignment
- `id: UUID`
- `tenant_id: UUID`
- `booking_id: UUID`
- `employee_id: UUID`
- `status: 'assigned' | 'accepted' | 'declined' | 'completed'`
- `assigned_at: timestamp`
- `completed_at: timestamp | null`

#### Payment
- `id: UUID`
- `tenant_id: UUID`
- `booking_id: UUID | null`
- `quote_id: UUID | null`
- `amount_cents: integer`
- `currency: string`
- `status: 'pending' | 'completed' | 'failed'`
- `payment_method: string`
- `external_reference: string | null`
- `created_at`, `updated_at`

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
- `created_at`, `updated_at`

#### Notification
- `id: UUID`
- `tenant_id: UUID`
- `client_id: UUID | null`
- `booking_id: UUID | null`
- `quote_id: UUID | null`
- `type: 'email' | 'sms' | 'webhook'`
- `template: string`
- `status: 'pending' | 'sent' | 'failed'`
- `sent_at: timestamp | null`
- `payload: jsonb`
- `created_at`, `updated_at`

#### Interaction / Activity
- `id: UUID`
- `tenant_id: UUID`
- `client_id: UUID`
- `user_id: UUID | null`
- `type: 'note' | 'call' | 'email' | 'sms' | 'booking_update'`
- `subject: string`
- `body: string`
- `created_at`, `updated_at`

### Relationships

- `Tenant` 1:N `User`, `Client`, `Service`, `Quote`, `Booking`, `Invoice`, `Notification`, `Interaction`
- `Client` 1:N `Quote`, `Booking`, `Invoice`, `Notification`, `Interaction`
- `Quote` 1:1 `Booking` (when accepted)
- `Booking` 1:N `Assignment`
- `Booking` 1:N `Payment`
- `Client` 1:1 `Address`
- `Service` 1:N `PricingRule`

### API Endpoints

#### Auth
- `POST /api/auth/login`
  - Request: `{ email, password }`
  - Response: `{ accessToken, refreshToken, expiresIn, roles, tenantId }`
- `POST /api/auth/refresh`
  - Request: `{ refreshToken }`
  - Response: `{ accessToken, refreshToken }`
- `POST /api/auth/logout`
  - Request: `{ refreshToken }`
  - Response: `204 No Content`

#### Tenants
- `GET /api/tenants/me`
  - Returns tenant profile for current user.
- `PUT /api/tenants/me`
  - Updates tenant settings such as timezone, currency, branding.

#### Users
- `GET /api/users`
  - List tenant users (admin only).
- `POST /api/users`
  - Create new tenant user.
- `PUT /api/users/:id`
  - Update user role and profile.

#### Clients
- `GET /api/clients`
  - Search and list clients.
- `POST /api/clients`
  - Create a client and address.
- `PUT /api/clients/:id`
  - Update client information.

#### Services and Pricing
- `GET /api/services`
- `POST /api/services`
- `PUT /api/services/:id`
- `GET /api/pricing-rules`
- `POST /api/pricing-rules`
- `PUT /api/pricing-rules/:id`

#### Quotes
- `POST /api/quotes`
  - Create a quote from client request.
- `GET /api/quotes`
  - List tenant quotes.
- `GET /api/quotes/:id`
  - Retrieve quote details.
- `PUT /api/quotes/:id`
  - Apply manual discount or update status.
- `POST /api/quotes/:id/send`
  - Send quote to client.

#### Bookings
- `POST /api/bookings`
  - Confirm quote and create booking.
- `GET /api/bookings`
- `GET /api/bookings/:id`
- `PUT /api/bookings/:id`
  - Reschedule or cancel.
- `POST /api/bookings/:id/complete`
  - Mark booking complete.

#### Scheduling
- `GET /api/availability`
  - List staff availability.
- `POST /api/availability`
  - Create availability slots.
- `GET /api/assignments`
  - List assignments.
- `POST /api/assignments`
  - Assign staff to booking.

#### Billing
- `GET /api/invoices`
- `POST /api/invoices`
- `POST /api/payments`

#### Notifications
- `GET /api/notifications`
- `POST /api/notifications/send`

### Flow Between Modules

#### Quote Flow
1. User submits quote request in frontend.
2. Backend validates tenant and client context.
3. `QuoteService` evaluates `PricingRule` and `Service` rates.
4. Backend stores `Quote`, sets `valid_until` to 7 days, and sends notification via `NotificationService`.

#### Booking Flow
1. When quote is accepted, `BookingService` verifies availability.
2. It reserves a slot with a 30-minute buffer and stores `Booking`.
3. `AssignmentService` allocates `Employee` based on availability and skills.
4. Notification is sent to staff and client.

#### Billing Flow
1. After booking confirmation, `BillingService` creates `Invoice`.
2. Payment records are linked to `Booking` or `Quote`.
3. Completed bookings trigger invoice issuance and optional payment reconciliation.

#### Notification Flow
1. Events emit messages to `NotificationService`.
2. The service stores `Notification` entries and pushes external deliveries.
3. Status updates are persisted and surfaced in the tenant UI.

#### Auth Flow
1. User logs in at `/api/auth/login`.
2. Backend verifies credentials, issues access token valid 15 minutes and refresh token valid 30 days.
3. Refresh token stored hashed in the database or Redis with `tenant_id` context.
4. Requests use access token in `Authorization: Bearer` header.
5. Middleware validates token, checks `tenant_id`, and enforces role guards.
6. Token refresh rotates refresh token and invalidates the previous one.

### Strategy for Authentication and Authorization

- Use JWT access tokens with `tenant_id`, `sub` (user id), and `roles` claims.
- Access tokens expire after 15 minutes.
- Issue refresh tokens valid for 30 days.
- Store refresh token metadata in persistent storage for revocation and rotation.
- Enforce RBAC with route guards in NestJS: `admin` for tenant management, `staff` for scheduling and assignments.
- Guard all tenant-scoped endpoints by tenant context derived from the JWT.

### Considerations for Scalability and Performance

- **Database**: PostgreSQL with indexes on `tenant_id` and timestamp fields. Use read replicas as load grows.
- **Queries**: Apply `tenant_id` filter at repository level to avoid cross-tenant leakage.
- **Caching**: Cache reference data such as services and pricing rules in-memory or Redis.
- **Horizontal scaling**: Backend stateless application with token-based auth allows multiple instances behind load balancer.
- **Async work**: Use background queue for email/SMS notifications and invoice generation.
- **Performance targets**: Quote generation under 2 seconds, API response under 500ms for common list endpoints.

### Folder Structure and Code Organization

#### Backend

```
backend/
  src/
    app.module.ts
    main.ts
    config/
      configuration.ts
      env.schema.ts
    common/
      guards/
      interceptors/
      pipes/
      filters/
      decorators/
      dtos/
      entities/
      exceptions/
      middleware/
      utils/
    modules/
      auth/
      tenants/
      users/
      clients/
      addresses/
      services/
      pricing-rules/
      quotes/
      bookings/
      availability/
      assignments/
      notifications/
      billing/
      analytics/
    database/
      migrations/
      repositories/
      seeds/
    integrations/
      email/
      sms/
      exchange-rate/
      payment-gateway/
```

#### Frontend

```
frontend/
  src/
    app/
      App.tsx
      routes.tsx
    pages/
      auth/
      dashboard/
      quotes/
      bookings/
      clients/
      staff/
      settings/
    features/
      auth/
      quotes/
      bookings/
      clients/
      notifications/
      billing/
    components/
      layout/
      forms/
      tables/
      charts/
    services/
      api.ts
      auth.ts
      quotes.ts
      bookings.ts
    store/
      authSlice.ts
      quoteSlice.ts
      bookingSlice.ts
    i18n/
      en.json
      pt-BR.json
      es.json
    utils/
      date.ts
      currency.ts
```

### Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|-------------|----------------------|-----------------|
| Backend API | modified | Add tenant context and RBAC guards across all endpoints | Implement global tenant middleware and auth guards |
| Database | new/modified | Add tenant-scoped tables and indexes | Define schema and migration strategy |
| Frontend | modified | Add auth flows and tenant-aware UX | Implement login, refresh, role-based route guards |
| Notifications | new | Add internal queue and delivery tracking | Build notification module and external adapters |
| Billing | new | Add invoice and payment record models | Build billing endpoints and data stores |

## Testing Approach

### Unit Tests
- Test core service logic for `QuoteService`, `BookingService`, `NotificationService`, and `AuthService`.
- Mock repositories and external adapters.
- Validate tenant isolation and RBAC behavior.
- Cover edge cases: expired quotes, booking conflicts, refresh token rotation.

### Integration Tests
- Test authentication and token refresh flows.
- Test multi-tenant request enforcement for APIs.
- Test quote creation through booking creation with availability and assignment.
- Test notifications and billing record creation after booking completion.
- Use a PostgreSQL test database and mocked external services.

## Development Sequencing

### Build Order
1. **Backend core and auth** - implement NestJS bootstrap, auth module, JWT access/refresh flow, tenant middleware.
2. **Tenant and user modules** - tenant settings, user creation, RBAC roles.
3. **Client and address modules** - client profile and address management.
4. **Service and pricing modules** - service catalog and pricing rule evaluation.
5. **Quote module** - quote creation, validation, send flow, expiration.
6. **Booking and scheduling modules** - booking creation, buffer enforcement, availability checks.
7. **Assignment and staff module** - employee availability and booking assignment.
8. **Notifications module** - outbound email/SMS and notification history.
9. **Billing module** - invoice and payment records.
10. **Frontend MVP** - implement auth, quote CRUD, booking workflow, client management, tenant dashboard.

### Technical Dependencies
- PostgreSQL database availability
- Email/SMS gateway credentials
- Redis or token storage for refresh tokens (optional but recommended)
- Environment configuration for JWT secrets and tenant settings

## Monitoring and Observability

- Track request rates, error rates, and response latency.
- Emit structured logs for auth events, quote creation, booking conflicts, and notification failures.
- Monitor refresh token failures and unauthorized access attempts.
- Alert on database connection failures, queue backlog growth, and token validation errors.

## Technical Considerations

### Key Decisions
- Use NestJS monolith with domain modules for implementation speed and clean separation.
- Use PostgreSQL with logical tenant isolation by `tenant_id`.
- Use JWT access tokens + refresh tokens for SPA auth.
- Store refresh token metadata for rotation and revocation.

### Environment Constraints (Windows + npm Workspaces)

This project runs on Windows with npm workspaces. The `package-lock.json` and `node_modules` are located at the monorepo root (`/`), not inside `packages/backend` or `packages/frontend`. This has the following mandatory implications for all tasks:

- All TypeORM CLI scripts MUST use `npx typeorm-ts-node-commonjs` — never `./node_modules/.bin/typeorm` or direct binary paths
- The `seed` script MUST use `npx ts-node` — never `ts-node` alone without `npx`
- No script may reference `./node_modules/.bin/` paths — these will fail on Windows with workspaces
- When generating new migrations, use: `npx typeorm-ts-node-commonjs migration:generate -d src/database/data-source.ts src/database/migrations/<MigrationName>`
- Environment variables MUST be set using PowerShell syntax: `$env:VAR="value"` — never `VAR=value` (Linux syntax)
- Docker Compose context for backend and frontend MUST point to the monorepo root (`.`), with `dockerfile` referencing the relative path inside each package

### Known Risks
- Tenant data leakage if tenant context is not enforced. Mitigation: global middleware and repository-level tenant filters.
- Refresh token replay or theft. Mitigation: rotate refresh tokens and keep hashed token store.
- Overly broad query filters causing performance issues. Mitigation: add indexes and measure query plans early.

## Architecture Decision Records

- [ADR-001: Full-Featured Launch Approach](adrs/adr-001-full-featured-launch.md) — Decision to develop and launch all features simultaneously for comprehensive value delivery.
- [ADR-002: Monolithic Modular Architecture with Logical Multi-Tenant Isolation and JWT RBAC](adrs/adr-002-monolith-jwt-rbac.md) — Decision to use NestJS monolith, tenant_id logical isolation, and JWT RBAC for SPA scalability.
