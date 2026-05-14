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

## Phase 2 — Public Tenant Product

### New Modules (Phase 2A)
- `PublicModule` — unauthenticated public endpoints for tenant landing. All endpoints prefixed `/api/v1/public/:tenantSlug/`. Tenant isolation enforced by tenantSlug resolution, never by JWT.
- `BrandingModule` — resolves and caches tenant branding by tenantSlug. 60-second in-memory cache (no Redis).
- `StorageModule` — file storage abstraction. `StorageAdapter` interface with `LocalStorageAdapter` implementation. Configurable via `STORAGE_ADAPTER` env var.

### New Public Routes (Frontend)
- `/t/:tenantSlug` — public tenant landing page

### New Environment Variables (add to .env.example)
- `STORAGE_ADAPTER` (local — only supported value in Phase 2)
- `UPLOAD_DIR` (local storage path, default: uploads/)

### Phase 1 Patterns (MANDATORY for all Phase 2 tasks)
All Phase 2 implementations MUST follow the patterns documented in each task file under "Phase 1 Patterns". These patterns address bugs encountered during Phase 1:
- UUID validation via `@Matches(UUID_REGEX, UUID_MSG)`, NEVER `@IsUUID()`
- DTO fields fully assigned in service create/update — no silent drops
- Frontend form double-submit prevention via `isSubmittingRef`
- SearchableSelect with paired `useRef` + `useState`
- Error message at top of form
- Mobile-first responsive design at 375px minimum width

### Critical Rules (Phase 2 additions)
- ALL public endpoints MUST enforce tenant isolation by tenantSlug resolution
- Public endpoints MUST NOT expose internal IDs (tenant_id, user_id, created_by, etc.)
- File uploads MUST validate MIME type and size (image/png, image/jpeg; max 2MB) before processing
- Public endpoints MUST be rate-limited (60 req/min per IP minimum)
- The frontend `--color-primary-override` CSS variable MUST scope only to the public landing page, NEVER globally

#### New Modules (Phase 2B)
- `PublicQuotesModule` — handles public quote estimation (in-memory, no persistence) and public quote submission (persisted with `origin='public'`, `approval_required=true`).
- `PublicBookingsModule` — handles availability calculation and public booking creation with atomic slot locking.
- `AvailabilityService` — computes available time slots based on tenant operating hours, excluding existing confirmed/rescheduled/pending_approval bookings.
- `PublicAuthModule` — exposes public-scoped authentication endpoints (register, login, OAuth callbacks) that scope users and clients to the resolved tenant.

#### New Integrations (Phase 2B)
- **Google OAuth**: `passport-google-oauth20` strategy. Environment variables: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_CALLBACK_URL`.
- **Facebook OAuth**: `passport-facebook` strategy. Environment variables: `FACEBOOK_OAUTH_APP_ID`, `FACEBOOK_OAUTH_APP_SECRET`, `FACEBOOK_OAUTH_CALLBACK_URL`.
- OAuth state parameter MUST include tenantSlug for tenant scoping and CSRF protection.

#### New Public Routes (Frontend — Phase 2B)
- `/t/:tenantSlug/orcamento` — public quote request form (anonymous)
- `/t/:tenantSlug/orcamento/cadastro` — account creation / login for quote submission
- `/t/:tenantSlug/orcamento/agendar` — scheduling (authenticated client only)
- `/t/:tenantSlug/orcamento/confirmacao` — booking confirmation page

#### New Environment Variables (add to .env.example)
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_CALLBACK_URL`
- `FACEBOOK_OAUTH_APP_ID`
- `FACEBOOK_OAUTH_APP_SECRET`
- `FACEBOOK_OAUTH_CALLBACK_URL`

#### New User Role
- `'client'` — created via public registration. Scoped to a single tenant. Can access only own quotes, bookings, profile. Cannot access admin or staff endpoints.

#### New Domain Events (Phase 2B)
- `QuotePublicCreated` — emitted when a public-origin quote is submitted. Triggers admin/staff notification.
- `BookingPublicCreated` — emitted when a public-origin booking is created. Triggers admin/staff notification for approval.

#### Approval Workflow (Phase 2B)
- Public-origin quotes default to `status='draft'`, `approval_required=true`. Admin/staff must approve via existing quote endpoints to transition to `'sent'` or `'accepted'`.
- Public-origin bookings default to `status='pending_approval'`. Admin/staff must approve via existing booking endpoints to transition to `'confirmed'`.
- Both flows trigger notifications (email/in-app) to admin/staff users of the tenant.
- The first booking from any client (bookings_count === 0) shows a modal warning that confirmation depends on tenant approval.

#### Critical Rules (Phase 2B additions)
- ALL public booking creation MUST use database transaction with row-level lock on overlapping bookings to prevent double-booking race conditions
- Public clients MUST only access their own quotes and bookings (cross-resource injection prevented at controller level)
- Availability calculation MUST account for both internal and public-origin bookings (single source of truth)
- The new `'client'` role MUST have an explicit allowlist of endpoints — NEVER granted access by default to any new endpoint
- OAuth callbacks MUST validate state parameter; mismatched state returns 400
- Public registration MUST be rate-limited (10 req/min per IP) to prevent abuse
- Audit log entries MUST be created for every public quote/booking event with origin, ip, user_agent

#### Stripe Integration Architecture (Phase 2C)

The platform uses Stripe at two levels with separate API keys and webhooks:

**Level A — Platform Subscriptions:**
- Stripe customer = tenant; Stripe is the platform's own account
- Tenants subscribe to SaaS plans (monthly, semiannual, annual)
- Grandfathering: existing subscribers preserve their price on plan readjustments via `discount_ratio` (relative discount preserved on annual readjustments)
- 30-day notice for price changes via automated email
- Webhook: `/api/v1/webhooks/stripe/platform` with `STRIPE_PLATFORM_WEBHOOK_SECRET`

**Level B — Stripe Connect Express:**
- Each tenant has their own Express account (when opted in)
- Tenant onboarding via Stripe-hosted Express forms (KYC, bank info)
- End clients pay tenants directly with platform taking 1% `application_fee_amount`
- Webhook: `/api/v1/webhooks/stripe/connect` with `STRIPE_CONNECT_WEBHOOK_SECRET`

#### New Modules (Phase 2C)
- `BillingModule` — root billing module
- `SubscriptionsModule` — platform subscriptions, plan management, readjustments
- `StripeConnectModule` — Connect onboarding, terms management, payment configuration
- `PaymentsModule` — payment intents, refunds, payment workflow
- `StripeWebhooksModule` — webhook signature validation, idempotency, event routing

#### Payment Methods by Region
- **Brazil (BR):** card credit, card debit, PIX
- **United States (US):** card credit, card debit, ACH, Apple Pay, Google Pay
- **Other regions:** Phase 3+ (not supported in Phase 2)

#### Payment Modes
- **Manual** (default for new tenants): no Stripe integration, system records "Pagamento Manual" only, no confirmation flow
- **Stripe**: requires Connect Express active, supports prepaid and postpaid timing

#### Payment Timing (Stripe mode only)
- **Prepaid** (DEFAULT): client pays before booking is confirmed (booking transitions: pending_approval → pending_payment → confirmed)
- **Postpaid**: client pays after service execution (payment link auto-sent after admin marks booking as completed)
- Toggle requires confirmation modal; disabled when payment_mode='manual'

#### Terms & Consent System
- Versioned terms documents per country/language (BR: pt-BR; US: EN, ES)
- Tenant MUST accept current terms version before enabling Stripe integration
- Consent record stores: terms_version, accepted_at, accepted_ip, accepted_user_agent, accepted_by_user_id
- Information page available at any time at `/settings/payments/info-br` or `/settings/payments/info-us`
- Highlighted card at top of Company Configuration requires acknowledgment before Stripe Connect can be enabled

#### Fees
- **Platform fee:** 1% per Connect transaction (configurable via `PLATFORM_FEE_PERCENT` env var, default 1)
- **Stripe BR fees:** 3.99% + R$0,39 (card), 0.99% (PIX)
- **Stripe US fees:** 2.9% + $0.30 (card), 0.8% capped $5 (ACH)
- Fees displayed transparently in information page and during checkout

#### New Environment Variables (add to .env.example)
- `STRIPE_PLATFORM_SECRET_KEY`
- `STRIPE_PLATFORM_PUBLISHABLE_KEY`
- `STRIPE_PLATFORM_WEBHOOK_SECRET`
- `STRIPE_CONNECT_CLIENT_ID`
- `STRIPE_CONNECT_WEBHOOK_SECRET`
- `STRIPE_CONNECT_RETURN_URL`
- `STRIPE_CONNECT_REFRESH_URL`
- `PLATFORM_FEE_PERCENT` (default: 1)
- `STRIPE_FEE_BR_CARD_PERCENT` (default: 3.99)
- `STRIPE_FEE_BR_PIX_PERCENT` (default: 0.99)
- `STRIPE_FEE_US_CARD_PERCENT` (default: 2.9)
- `STRIPE_FEE_US_ACH_PERCENT` (default: 0.8)

#### New Roles
- `'platform_admin'` — platform owner; manages subscription plans, views all tenant subscriptions; assigned via DB seed only, never via UI

#### New Routes (Frontend — Phase 2C)
- `/settings/billing` — subscription management
- `/settings/billing/success` — return from Stripe Checkout
- `/settings/billing/cancel` — Stripe Checkout cancel return
- `/settings/payments/info-br` — Brazil information page (pt-BR only)
- `/settings/payments/info-us` — US information page (EN/ES toggle)
- `/settings/payments/connected` — Stripe Connect return handler
- `/platform-admin/plans` — platform admin plan management
- `/platform-admin/subscriptions` — platform admin subscription list
- `/payments` — admin payments list
- `/t/:tenantSlug/pagamento` — public client payment page
- `/t/:tenantSlug/pagamento/sucesso` — public payment success page

#### Critical Rules (Phase 2C additions)
- Stripe webhook signatures MUST be validated on every webhook endpoint — different secrets for platform vs Connect
- Stripe API keys MUST be loaded from environment, NEVER hardcoded or stored in DB
- Payment amounts MUST NEVER be sent from frontend — backend always calculates from booking/quote
- Webhook events MUST be idempotent via `stripe_webhook_events` table (event.id deduplication)
- Application fee MUST be set via `application_fee_amount` parameter on Connect PaymentIntents
- Manual payment mode MUST NOT create Payment records — purely informational status
- Tenant email MUST be required (NOT NULL) — used for billing and notifications
- Client email MUST be required for clients created via public flow — used for payment notifications
- Payment links sent via email MUST expire after 7 days
- Refunds MUST require admin role AND create audit log entry with full context
- Grandfathering: `discount_ratio` preserved on every readjustment to maintain relative pricing fairness
- Annual readjustments MUST notify tenants 30 days in advance via email
- Payment timing changes MUST require confirmation modal; default value MUST be 'prepaid'
- Switching from manual to Stripe mode requires Connect status='active'
- Terms acceptance is IRREVERSIBLE per version; new terms version requires new acceptance

#### Granular Permissions System (Phase 2D)

The platform uses a permission system designed to support per-module access in Phase 2 with the schema ready for per-action granularity in future phases without refactoring.

**Schema:**
- `permissions` table: `(module, action)` — Phase 2 actions are `'read'` and `'write'`. Future actions (`'create'`, `'update'`, `'delete'`) can be added without schema changes.
- `roles` table: tenant-scoped or system roles
- `role_permissions` table: many-to-many between roles and permissions
- `user_permission_overrides` table: per-user grants/revokes beyond role defaults

**System Roles (seeded):**
- `platform_admin` — platform owner, all permissions
- `admin` — tenant admin, all module:read AND module:write
- `staff` — generic staff, no permissions by default (granted per user)
- `client` — public end client, no module permissions (different access path)

**Guard:**
- `@RequirePermission(module, action)` decorator replaces `@Roles()` on protected endpoints
- `PermissionGuard` evaluates effective permissions = role permissions + overrides
- Admin role bypasses permission checks (always allowed)

**Migration Note:** Existing `users.role: string` is migrated to `users.role_id: uuid` referencing the `roles` table. Existing role names ('admin', 'staff') are mapped to corresponding role_ids during migration.

#### Internationalization (Phase 2D)

The platform supports three languages: pt-BR (default), EN (US English), and ES (Latin American Spanish). Language is auto-detected from browser/locale settings with NO manual user override (intentional design decision to ensure region-appropriate content).

**Backend:**
- `nestjs-i18n` package, JSON-based translations in `src/i18n/{lang}/`
- `AcceptLanguageResolver` reads from request headers
- Fallback: pt-BR
- All exception messages, validation messages, and email templates translated

**Frontend:**
- `react-i18next` + `i18next-browser-languagedetector`
- NO localStorage caching, NO manual toggle UI
- Detection order: authenticated user.locale → navigator.language → fallback pt-BR
- `<html lang="">` updated dynamically
- All UI strings extracted to translation files in `src/i18n/locales/{lang}/{namespace}.json`

**Email Templates:**
- All templates have `{name}.pt-BR.hbs`, `{name}.en.hbs`, `{name}.es.hbs` versions
- Template selection: `user.locale ?? tenant.locale ?? 'pt-BR'`

**Locale-Aware Formatting:**
- Use `Intl.DateTimeFormat`, `Intl.NumberFormat` consistently
- pt-BR: 14/05/2026, R$ 1.234,56
- en: 05/14/2026, $1,234.56
- es: 14/05/2026, $ 1.234,56

#### Password Recovery (Phase 2D)

- Token-based, 24-hour expiration, single-use
- Token stored as SHA-256 hash (never plain)
- Rate limit: 3 attempts per email per hour, 10 requests per IP per minute
- Successful reset invalidates all refresh tokens for the user (force re-login on all devices)
- Cleanup job deletes expired tokens after 7 days
- Generic responses regardless of email existence (prevent enumeration)

#### Email Verification (Phase 2D)

- Required for admin and staff users to access configuration endpoints
- NOT required for public clients (OAuth users are auto-verified; email/password public clients can use app without verification)
- Token-based, 24-hour expiration, single-use
- Admin can log in without verification but settings/configuration endpoints are blocked
- Staff CANNOT log in without verification
- `EmailVerifiedGuard` enforces on all settings/configuration controllers
- Verification banner shown on UI for unverified admins (not dismissible)

#### New Roles (Phase 2D additions)
- (no new roles — refactor of existing role system into permission-based)

#### New Frontend Routes (Phase 2D)
- `/forgot-password` — password recovery request
- `/reset-password?token=X` — password reset form
- `/verify-email?token=X` — email verification handler
- `/resend-verification` — resend verification email
- `/staff` — staff user management (admin only)
- `/staff/new` — create staff user
- `/staff/:id/edit` — edit staff user permissions

#### Critical Rules (Phase 2D additions)
- Permission checks MUST happen on backend — frontend hiding is UX only
- Tenant CANNOT remove the last admin user (prevent lockout)
- Tokens (password reset, email verification) MUST be cryptographically random AND SHA-256 hashed before storage
- Tokens MUST be single-use (marked used_at on success)
- Password reset MUST invalidate all refresh tokens for the user
- NO language toggle UI — locale is auto-detected and immutable per session
- Locale validation MUST be server-side (don't trust client-supplied headers blindly)
- Email verification gate applies to admin/staff settings ONLY — does NOT block public clients
- Existing seed user (admin@seed.local) MUST be marked email_verified=true during migration
- `@RequirePermission(module, action)` MUST replace `@Roles()` on all migrated endpoints; auth and public endpoints retain `@Public()` or `@Roles()` as appropriate
- Audit log entries required for: permission changes, password resets, email verification

#### Analytics Architecture (Phase 2E)

**Data layer:**
- `analytics_snapshots` table — daily aggregated metrics per tenant, populated by scheduled job at 01:00
- Database views/materialized views for real-time aggregation: `mv_quotes_funnel`, `mv_bookings_status`, `mv_revenue_by_method`, `mv_service_popularity`
- Snapshot strategy: historical data from snapshots (fast), recent 24h from live queries (accurate)

**Service layer:**
- `AnalyticsService` exposes scoped metrics per tenant
- All queries tenant_id-scoped at SQL level
- Date range validation: max 365 days, no future `to`
- Period comparison auto-calculates equivalent previous period

**Endpoints:**
- `GET /api/v1/analytics/operational` — quote funnel, bookings status, approval times, service popularity, active clients
- `GET /api/v1/analytics/financial` — revenue, fees, ticket size, revenue by method, MRR
- `GET /api/v1/analytics/export.csv` — CSV export
- `GET /api/v1/analytics/export.pdf` — PDF export via server-side rendering
- All require `reports:read` permission and rate-limited (30 req/min)

**Frontend:**
- Single route `/analytics` with two tabs: Operacional / Financeiro
- Charts via `recharts` library
- Date range picker with presets
- Period comparison toggle
- Export menu (CSV / PDF)
- Mobile-first responsive

#### Onboarding System (Phase 2E)

**State:**
- `tenant_onboarding_progress` table — one record per tenant tracking 6 boolean flags + `welcome_modal_dismissed` + `completed_at`
- Existing tenants pre-completed on migration

**Auto-completion via domain events:**
- `EmailVerifiedEvent` → email_verified
- `BrandingUpdatedEvent` → branding_configured
- `ServiceCreatedEvent` → first_service_created
- `ClientCreatedEvent` → first_client_created
- `PaymentConfigUpdatedEvent` → payment_configured
- `QuoteCreatedEvent` → first_quote_created

**UI components:**
- `WelcomeModal` — first-session only, dismissible (one-time)
- `OnboardingChecklist` — sidebar widget (desktop), bottom sheet via floating icon (mobile)
- Visibility: admin role only; staff and public clients do NOT see onboarding UI
- Disappears 24h after `completed_at` is set

**Endpoints:**
- `GET /api/v1/onboarding/progress`
- `POST /api/v1/onboarding/welcome-dismiss` (admin)
- `POST /api/v1/onboarding/skip` (admin, one-way action)

#### E2E Testing Strategy (Phase 2E)

**Framework:**
- Playwright with TypeScript
- 10 test suites covering critical flows
- Mobile viewport tests on iPhone 13 (390x844)
- Cross-browser smoke tests (chromium primary, firefox/webkit smoke)

**Test suites:**
1. Tenant Onboarding Flow
2. Public Tenant Product Flow
3. Stripe Connect & Payment Flow
4. Subscription Flow (Platform Level)
5. Permissions & Staff Management
6. Password Recovery & Email Verification
7. i18n & Locale Detection
8. Analytics Dashboard
9. Mobile-First Responsiveness
10. Cross-Tenant Isolation (security validation)

**Infrastructure:**
- Test database seeded deterministically before each suite
- Stripe-mock fixture for Stripe API simulation
- Email-mock fixture captures sent emails for assertion
- GitHub Actions CI runs full suite on every PR
- HTML reports + screenshots + videos on failure

**Manual test suite:**
- Visual regression
- Animations and transitions
- Accessibility (keyboard, screen reader)
- Print stylesheets

#### New Frontend Routes (Phase 2E)
- `/analytics` — analytics dashboard

#### Critical Rules (Phase 2E additions)
- Analytics queries MUST be tenant_id-scoped at SQL level — NEVER trust user-supplied tenant ID
- Numeric aggregations MUST happen server-side; client only renders
- Date range validation MUST cap at 365 days
- Export files (CSV/PDF) MUST be generated server-side
- Snapshot job MUST be idempotent (UPSERT pattern)
- Onboarding state changes MUST flow through domain events — never direct UI flag manipulation
- Onboarding UI MUST be hidden for staff and public clients (admin-only experience)
- E2E tests MUST cover cross-tenant isolation explicitly (security test suite)
- E2E tests MUST run in CI on every PR; failures block merge
- No flaky tests tolerated — retries pass MUST not mask flakiness (fix or quarantine)
