---
status: completed
title: "Stripe Platform Subscriptions (Level A: tenant pays SaaS)"
type: feature
complexity: high
dependencies: [task_21]
---

# Task 22: Stripe Platform Subscriptions (Level A: tenant pays SaaS)

---
You are a senior software engineer executing a predefined task in an existing codebase.
Your objective is to implement the task EXACTLY as specified.
<context>
- The project follows a strict sequential task system
- All dependencies listed in the task are already implemented
- You MUST trust the task specification as the single source of truth
- Phase 1 lessons learned MUST be applied — see "Phase 1 Patterns" section in each task
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
11. You MUST apply all Phase 1 patterns documented in this task
</execution_rules>
<technical_constraints>
* Follow the current project stack and patterns strictly
* Maintain consistency with existing modules and naming conventions
* Ensure proper integration with previously implemented tasks
* Respect authentication, RBAC, and multi-tenancy rules
* Mobile-first responsive design is mandatory for all frontend work
* Security MUST be enforced on every endpoint — explicit tenant isolation, input validation, rate limiting
* Stripe webhook signatures MUST be validated on every webhook endpoint
* Stripe API keys MUST be stored in environment variables, never in code or database
</technical_constraints>
<validation>
* Ensure all requirements are fully implemented
* Ensure no security rules are violated
* Ensure tenant isolation is preserved
* Ensure correct error handling (401, 403, 400, 500)
* Ensure mobile responsiveness on all UI changes (test at 375px width)
* Ensure all Stripe operations are tested with Stripe CLI in test mode
</validation>
<output_format>
* Provide only the necessary code changes
* Do not include explanations unless strictly necessary
* Keep output minimal, technical, and implementation-focused
</output_format>
Now execute the task below exactly as specified:
---

## Overview

Implements Stripe Subscriptions for the platform itself. Tenants subscribe to the SaaS using Stripe to pay the platform owner. Supports monthly, semiannual and annual billing intervals with grandfathered pricing (existing tenants keep their original price even when new prices are introduced). Handles plan upgrades/downgrades with proration, dunning (past due), trial periods, and annual readjustments with 30-day notice that preserve each tenant's relative discount ratio.

## Phase 1 Patterns (MUST follow)

**Backend DTO patterns:**
- For UUID validation, MUST use `@Matches(UUID_REGEX, UUID_MSG)` with constants at top of file:
  ```ts
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const UUID_MSG = { message: '$property must be a valid UUID' };
  ```
  MUST NOT use `@IsUUID()` — it rejects non-v4 UUIDs (including seed data).
- For partial updates (PUT/PATCH), every DTO field MUST be `@IsOptional()` and the service MUST check `if (dto.field !== undefined) entity.field = dto.field`.
- Service `create()` MUST assign every DTO field to the entity — never silently drop fields.
- Service `update()` MUST only trigger recalculations when a field actually changes — compare `dto.field != null && dto.field !== entity.field`.
- All new columns MUST be nullable or have defaults to avoid breaking existing data on migration.
- All `class-validator` decorators MUST permit nullable values where the entity allows null (use `@IsOptional()` plus the type validator).

**Frontend form patterns:**
- For dropdown selections (SearchableSelect), MUST use `useRef` alongside `useState`:
  ```tsx
  const fieldIdRef = useRef('');
  const [fieldId, setFieldId] = useState('');
  onChange={(id) => { fieldIdRef.current = id; setFieldId(id); }}
  const fid = fieldIdRef.current || fieldId;
  ```
- Submit button MUST be `type="button"` with `onClick={handleSubmit}` (not `type="submit"`).
- The `<form>` element MUST NOT have `onSubmit={...}`.
- MUST use `isSubmittingRef = useRef(false)` to prevent double submission.
- Error message MUST be rendered immediately after the `<form>` opening tag.
- Catch blocks MUST extract backend error using dual path:
  ```tsx
  const axiosErr = err as import('axios').AxiosError<{ error?: { message?: string | string[] }; message?: string | string[] }>;
  const raw = axiosErr.response?.data;
  const msg = raw?.error?.message ?? raw?.message;
  const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro genérico. Tente novamente.');
  setError(detail);
  ```

**Mobile-first responsive patterns:**
- All layouts MUST work at 375px viewport width.
- Two-column desktop layouts MUST collapse to single column on mobile.
- Right-side summary panels MUST appear at the bottom on mobile, sticky on desktop (`lg:sticky lg:top-4`).
- Touch targets MUST be at least 44x44px.
- No horizontal scroll allowed.

**Security patterns:**
- Every controller endpoint MUST have explicit RBAC guard (`@Roles(...)`).
- Public endpoints MUST be explicitly marked `@Public()` and MUST enforce tenant isolation by tenantSlug.
- Public endpoints MUST NOT expose internal IDs.
- Webhook endpoints MUST validate signatures before processing — Stripe webhooks via `stripe.webhooks.constructEvent()`.
- All input validation MUST use class-validator decorators on DTOs.
- Rate limiting MUST be applied to public endpoints (60 req/min per IP).
- Stripe secret keys MUST be loaded from environment, NEVER hardcoded or stored in DB.
- Payment amount calculations MUST happen on the backend, NEVER trust client-sent amounts.

---

MUST read and follow `.compozy/tasks/cleaning-saas/_design_system.md` before writing any frontend code.
All UI MUST conform strictly to the design system defined there — colors, typography, spacing, components, responsiveness, and screen patterns.

---

## Requirements

### Environment Setup

- MUST install `stripe` npm package on backend, `@stripe/stripe-js` on frontend
- MUST add environment variables:
  - `STRIPE_PLATFORM_SECRET_KEY` (sk_test_... for dev, sk_live_... for prod)
  - `STRIPE_PLATFORM_PUBLISHABLE_KEY` (pk_test_... / pk_live_...)
  - `STRIPE_PLATFORM_WEBHOOK_SECRET` (whsec_...)
  - `PLATFORM_FEE_PERCENT` (default: 1) — used in T24
  - `STRIPE_FEE_BR_CARD_PERCENT` (default: 3.99) — informational, used in fee display
  - `STRIPE_FEE_BR_PIX_PERCENT` (default: 0.99) — informational
  - `STRIPE_FEE_US_CARD_PERCENT` (default: 2.9) — informational
- MUST create configuration module `src/config/stripe.config.ts` that loads and validates these env vars at startup

### Backend — Database

- MUST create migration `1714000000030-CreateSubscriptionPlans`:
  - Table: `subscription_plans`
  - Fields: `id uuid PK`, `name varchar`, `description text nullable`, `tier varchar` (e.g. 'basic', 'pro', 'enterprise'), `stripe_price_id varchar UNIQUE`, `interval varchar` (values: 'month', 'semiannual', 'year'), `interval_count int` (1, 6, 12), `amount_cents int`, `currency varchar(3)` (BRL, USD), `is_active boolean DEFAULT true`, `valid_from timestamp`, `valid_until timestamp nullable`, `created_at`, `updated_at`, `deleted_at nullable`
  - Index on `(tier, currency, is_active)`
- MUST create migration `1714000000031-CreateTenantSubscriptions`:
  - Table: `tenant_subscriptions`
  - Fields: `id uuid PK`, `tenant_id uuid FK`, `plan_id uuid FK` (references subscription_plans), `stripe_subscription_id varchar UNIQUE`, `stripe_customer_id varchar`, `status varchar` (values: 'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid'), `current_period_start timestamp`, `current_period_end timestamp`, `cancel_at_period_end boolean DEFAULT false`, `canceled_at timestamp nullable`, `trial_ends_at timestamp nullable`, `grandfathered_price_cents int` (the price this tenant pays, preserved on readjustments), `discount_ratio numeric(5,4) nullable` (relative discount preserved on readjustments — e.g. 0.25 means 25% discount vs current public price), `created_at`, `updated_at`
  - Index on `tenant_id`, unique constraint on `stripe_subscription_id`
- MUST create migration `1714000000032-CreateSubscriptionPriceHistory`:
  - Table: `subscription_price_history`
  - Fields: `id uuid PK`, `tenant_subscription_id uuid FK`, `old_price_cents int`, `new_price_cents int`, `discount_ratio_preserved numeric(5,4)`, `effective_date timestamp`, `reason varchar` (e.g. 'annual_readjustment', 'plan_change'), `notified_at timestamp nullable`, `created_at`
- MUST create migration `1714000000033-AlterTenantsAddStripeCustomer`:
  - Adds to `tenants` table: `stripe_customer_id varchar UNIQUE nullable`, `email varchar NOT NULL` (if not already required, set NOT NULL and backfill required)
  - MUST validate that all existing tenants have email before applying NOT NULL constraint

### Backend — Entities & DTOs

- MUST create entities: `SubscriptionPlan`, `TenantSubscription`, `SubscriptionPriceHistory`
- MUST create DTOs:
  - `CreateSubscriptionPlanDto` (admin only — platform owner creates plans)
  - `UpdateSubscriptionPlanDto`
  - `CreateCheckoutSessionDto` (`{ plan_id, success_url, cancel_url }`)
  - `UpdateTenantSubscriptionDto` (`{ plan_id }` for upgrades/downgrades)
  - `CancelSubscriptionDto` (`{ at_period_end: boolean, reason?: string }`)

### Backend — Services

- MUST create `StripePlatformService` in `src/modules/billing/stripe/stripe-platform.service.ts`:
  - Initializes Stripe client with platform secret key
  - Methods:
    - `createCustomer(tenant)` — creates Stripe customer for tenant
    - `createCheckoutSession({ tenantId, planId, successUrl, cancelUrl })` — creates Stripe Checkout Session for subscription, returns `{ checkout_url, session_id }`
    - `cancelSubscription({ subscriptionId, atPeriodEnd })` — cancels via Stripe API
    - `updateSubscription({ subscriptionId, newPriceId, prorationBehavior })` — handles plan change
    - `createPortalSession({ customerId, returnUrl })` — creates Stripe Customer Portal session for tenant to manage subscription
- MUST create `SubscriptionPlanService` in `src/modules/billing/subscriptions/subscription-plan.service.ts`:
  - Methods: `findActivePlans({ currency })`, `createPlan(dto)`, `updatePlan(id, dto)`, `deletePlan(id)`
  - When creating a plan, MUST create the Price in Stripe via API and store the returned `stripe_price_id`
  - MUST NOT delete plans that have active subscriptions — soft delete only, set `is_active=false` and `valid_until=now()`
- MUST create `TenantSubscriptionService` in `src/modules/billing/subscriptions/tenant-subscription.service.ts`:
  - Methods: `getMySubscription(tenantId)`, `createCheckout(tenantId, dto)`, `cancel(tenantId, dto)`, `changePlan(tenantId, newPlanId)`
  - Tracks subscription status, calculates `discount_ratio` when subscription is created (compare paid price vs current public price)

### Backend — Webhook Handler

- MUST create `StripePlatformWebhookController` at `POST /api/v1/webhooks/stripe/platform`:
  - MUST validate signature using `stripe.webhooks.constructEvent()` with `STRIPE_PLATFORM_WEBHOOK_SECRET`
  - MUST handle events:
    - `checkout.session.completed` — creates TenantSubscription record, marks tenant as active
    - `customer.subscription.updated` — updates status, current_period_start/end
    - `customer.subscription.deleted` — marks subscription as canceled
    - `invoice.payment_succeeded` — logs payment, sends email notification
    - `invoice.payment_failed` — updates status to past_due, sends email
    - `customer.subscription.trial_will_end` — sends email 3 days before trial ends
  - MUST be idempotent — store processed `event.id` in a table `stripe_webhook_events` to prevent duplicate processing
  - MUST respond 200 even on internal errors (and queue for retry) to prevent Stripe retry storms — log errors for investigation

### Backend — Plan Readjustment Logic

- MUST create scheduled job `SubscriptionReadjustmentJob` (using existing scheduler infrastructure):
  - Runs daily at 02:00
  - Finds plans with annual readjustments due (configurable rule per plan or platform-wide)
  - For each subscription: calculates new price using preserved `discount_ratio`:
    ```
    new_tenant_price = new_public_price * (1 - discount_ratio)
    ```
  - Creates new Stripe Price object, updates Stripe Subscription to use new Price
  - Inserts `subscription_price_history` record with `notified_at=NULL`
  - Sends email notification to tenant 30 days before effective date
  - Sets `effective_date` to 30 days from now
- MUST create email template `subscription-price-change.html` (pt-BR, EN, ES) with placeholders for old_price, new_price, effective_date

### Backend — Admin Endpoints (platform owner)

- `GET /api/v1/admin/subscription-plans` — list all plans
- `POST /api/v1/admin/subscription-plans` — create plan
- `PUT /api/v1/admin/subscription-plans/:id` — update plan
- `DELETE /api/v1/admin/subscription-plans/:id` — soft delete plan
- `GET /api/v1/admin/subscriptions` — list all tenant subscriptions with filters (status, plan, tenant)
- All require new `'platform_admin'` role (separate from tenant 'admin' role)

### Backend — Tenant Endpoints

- `GET /api/v1/billing/plans` — list active plans available to current tenant (currency based on tenant locale)
- `GET /api/v1/billing/subscription/me` — get current tenant's subscription
- `POST /api/v1/billing/checkout` — initiate Stripe Checkout for subscription
- `POST /api/v1/billing/portal` — open Stripe Customer Portal
- `POST /api/v1/billing/subscription/cancel` — cancel subscription (at period end)
- `POST /api/v1/billing/subscription/change-plan` — change plan with proration
- All require 'admin' role (tenant admin)

### Frontend

- MUST create new admin section in Settings: "Plano e Cobrança" tab
- MUST display:
  - Current plan name, status badge, next billing date, amount
  - "Histórico de pagamentos" link → Stripe Customer Portal
  - "Mudar plano" button → shows available plans grid
  - "Cancelar assinatura" button → confirmation modal explaining "Você manterá acesso até {data}"
  - Available plans grid (only when changing plan or no active subscription):
    - 3 cards per plan tier (monthly, semiannual with badge "10% off", annual with badge "20% off")
    - Each card shows price, features, "Assinar" CTA
- "Assinar" button initiates Stripe Checkout flow:
  - Calls `POST /api/v1/billing/checkout` to get session URL
  - Redirects to Stripe Checkout (hosted)
  - On return: success page or cancel page
- MUST create success page `/settings/billing/success?session_id={id}` that polls subscription status until active
- MUST create cancel page `/settings/billing/cancel` that explains and offers to retry
- MUST follow ALL Phase 1 form patterns
- MUST be mobile-first responsive:
  - Plans grid: 1 col mobile, 3 cols desktop
  - All cards equal height
  - Touch targets 44x44px

### Frontend — Admin Platform Panel

- For platform_admin role, MUST create separate route `/platform-admin/plans`:
  - List all plans with filters
  - Create new plan form (name, tier, interval, amount, currency)
  - Edit and soft-delete plans
- MUST create route `/platform-admin/subscriptions`:
  - List all tenant subscriptions with filters
  - View individual subscription details
  - Manual intervention buttons (refund, cancel) — these create audit log entries

### Security

- Webhook endpoint MUST validate Stripe signature
- Webhook events MUST be idempotent (event.id deduplication)
- platform_admin role MUST be assigned manually via DB seed, NOT via UI
- Tenant CANNOT modify another tenant's subscription
- All Stripe API errors MUST be logged to audit log with full context
- Subscription amounts MUST NEVER be sent from frontend — backend uses plan_id only

## Tests

### Backend
- StripePlatformService creates customer with correct metadata
- StripePlatformService creates checkout session with correct line items
- Webhook handler rejects invalid signature with 400
- Webhook handler processes `checkout.session.completed` and creates TenantSubscription
- Webhook handler is idempotent (same event.id processed twice produces same result)
- Webhook handler handles `customer.subscription.updated` and updates status
- Subscription cancellation sets `cancel_at_period_end=true` when atPeriodEnd=true
- Plan creation in Stripe and DB are atomic (rollback DB if Stripe fails)
- Discount ratio calculated correctly on subscription creation
- Readjustment job preserves discount_ratio when applying new price
- Readjustment job creates price_history record with notified_at=NULL
- Email notification sent 30 days before price change
- platform_admin role required for /admin endpoints
- Tenant cannot access another tenant's subscription

### Frontend
- Plans grid renders correctly on mobile (1 col) and desktop (3 cols)
- "Assinar" button initiates Stripe Checkout redirect
- Success page polls subscription status correctly
- Cancellation confirmation modal shows correct end date
- Plan change form shows proration estimate
- Error message appears at top of form on submit failure

## Implementation Files

### Backend
- `packages/backend/src/database/migrations/1714000000030-CreateSubscriptionPlans.ts` (new)
- `packages/backend/src/database/migrations/1714000000031-CreateTenantSubscriptions.ts` (new)
- `packages/backend/src/database/migrations/1714000000032-CreateSubscriptionPriceHistory.ts` (new)
- `packages/backend/src/database/migrations/1714000000033-AlterTenantsAddStripeCustomer.ts` (new)
- `packages/backend/src/config/stripe.config.ts` (new)
- `packages/backend/src/modules/billing/billing.module.ts` (new)
- `packages/backend/src/modules/billing/stripe/stripe-platform.service.ts` (new)
- `packages/backend/src/modules/billing/subscriptions/subscription-plan.entity.ts` (new)
- `packages/backend/src/modules/billing/subscriptions/tenant-subscription.entity.ts` (new)
- `packages/backend/src/modules/billing/subscriptions/subscription-price-history.entity.ts` (new)
- `packages/backend/src/modules/billing/subscriptions/subscription-plan.service.ts` (new)
- `packages/backend/src/modules/billing/subscriptions/tenant-subscription.service.ts` (new)
- `packages/backend/src/modules/billing/jobs/subscription-readjustment.job.ts` (new)
- `packages/backend/src/modules/billing/webhooks/stripe-platform-webhook.controller.ts` (new)
- `packages/backend/src/modules/billing/interfaces/billing.controller.ts` (new)
- `packages/backend/src/modules/billing/interfaces/admin-subscription.controller.ts` (new)
- `packages/backend/src/modules/billing/validation/*.dto.ts` (new — multiple DTOs)
- `packages/backend/src/modules/tenants/domain/tenant.entity.ts` (modify — add stripe_customer_id, email NOT NULL)

### Frontend
- `packages/frontend/src/pages/settings/sections/BillingSection.tsx` (new)
- `packages/frontend/src/pages/billing/SubscriptionSuccessPage.tsx` (new)
- `packages/frontend/src/pages/billing/SubscriptionCancelPage.tsx` (new)
- `packages/frontend/src/pages/platform-admin/PlansPage.tsx` (new)
- `packages/frontend/src/pages/platform-admin/SubscriptionsPage.tsx` (new)
- `packages/frontend/src/components/billing/PlanCard.tsx` (new)
- `packages/frontend/src/components/billing/SubscriptionStatusBadge.tsx` (new)
- `packages/frontend/src/api/billing.ts` (new)
- `packages/frontend/src/App.tsx` (modify — add routes)

## Definition of Done

- All migrations executed without errors
- All backend tests pass
- All frontend tests pass
- Stripe test mode subscription created and canceled successfully (using stripe-cli)
- Webhook delivery tested via `stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe/platform`
- Readjustment job runs in test environment and produces correct prices
- Email notification renders correctly in pt-BR, EN, ES
- Renders correctly on mobile (375px), tablet (768px), desktop (1280px)
- Existing tenants have email field validated as required
