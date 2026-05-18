You are a senior software engineer and technical planner.

Your task is to CREATE TASK FILES ONLY for Phase 2C of the Cleaning SaaS project — do not execute any task, do not write application code, do not modify any source file outside of the Compozy task planning system.

Read the following files before starting:
- `.compozy/tasks/cleaning-saas/_techspec.md`
- `.compozy/tasks/cleaning-saas/_design_system.md`
- `.compozy/tasks/cleaning-saas/_tasks.md`
- `.compozy/tasks/cleaning-saas/task_17.md` (Phase 2A reference)
- `.compozy/tasks/cleaning-saas/task_21.md` (Phase 2B reference for public booking flow)

---

## What you MUST deliver

1. Create 3 new task files in `.compozy/tasks/cleaning-saas/`:
   - `task_22.md` — Stripe Platform Subscriptions (Level A: tenant pays SaaS)
   - `task_23.md` — Stripe Connect Express Onboarding & Information Pages
   - `task_24.md` — Public Payment Flow with Stripe Connect (Level B: client pays tenant)

2. Update `.compozy/tasks/cleaning-saas/_tasks.md` to include T22, T23 and T24 with correct titles, status (pending), complexity, and dependencies.

3. Update `.compozy/tasks/cleaning-saas/_techspec.md` to extend the "Phase 2 — Public Tenant Product" section with the Stripe architecture (two-level: platform subscriptions + Connect Express), payment methods per region, grandfathering strategy, and payment workflow integration with public bookings.

Do NOT modify any other file. Do NOT write any application code.

---

## Execution header (MANDATORY — include verbatim in every task file)

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

---

## Phase 1 Patterns (MANDATORY — include verbatim in every task file as a "## Phase 1 Patterns" section)

Every task MUST include the following section after the Overview, with the EXACT content below:

### Phase 1 Patterns (MUST follow)

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

## Design system reference (include in every frontend task)

MUST read and follow `.compozy/tasks/cleaning-saas/_design_system.md` before writing any frontend code.

---

## Tasks to create

---

### TASK 22 — Stripe Platform Subscriptions (Level A: tenant pays SaaS)

**Frontmatter:**
- status: pending
- type: feature
- complexity: high
- dependencies: [task_21]

**Overview:**
Implements Stripe Subscriptions for the platform itself. Tenants subscribe to the SaaS using Stripe to pay the platform owner. Supports monthly, semiannual and annual billing intervals with grandfathered pricing (existing tenants keep their original price even when new prices are introduced). Handles plan upgrades/downgrades with proration, dunning (past due), trial periods, and annual readjustments with 30-day notice that preserve each tenant's relative discount ratio.

**Requirements:**

Environment setup:
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

Backend — Database:
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

Backend — Entities & DTOs:
- MUST create entities: `SubscriptionPlan`, `TenantSubscription`, `SubscriptionPriceHistory`
- MUST create DTOs:
  - `CreateSubscriptionPlanDto` (admin only — platform owner creates plans)
  - `UpdateSubscriptionPlanDto`
  - `CreateCheckoutSessionDto` (`{ plan_id, success_url, cancel_url }`)
  - `UpdateTenantSubscriptionDto` (`{ plan_id }` for upgrades/downgrades)
  - `CancelSubscriptionDto` (`{ at_period_end: boolean, reason?: string }`)

Backend — Services:
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

Backend — Webhook handler:
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

Backend — Plan readjustment logic:
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

Backend — Admin endpoints (platform owner):
- `GET /api/v1/admin/subscription-plans` — list all plans
- `POST /api/v1/admin/subscription-plans` — create plan
- `PUT /api/v1/admin/subscription-plans/:id` — update plan
- `DELETE /api/v1/admin/subscription-plans/:id` — soft delete plan
- `GET /api/v1/admin/subscriptions` — list all tenant subscriptions with filters (status, plan, tenant)
- All require new `'platform_admin'` role (separate from tenant 'admin' role)

Backend — Tenant endpoints:
- `GET /api/v1/billing/plans` — list active plans available to current tenant (currency based on tenant locale)
- `GET /api/v1/billing/subscription/me` — get current tenant's subscription
- `POST /api/v1/billing/checkout` — initiate Stripe Checkout for subscription
- `POST /api/v1/billing/portal` — open Stripe Customer Portal
- `POST /api/v1/billing/subscription/cancel` — cancel subscription (at period end)
- `POST /api/v1/billing/subscription/change-plan` — change plan with proration
- All require 'admin' role (tenant admin)

Frontend:
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

Frontend — Admin platform panel:
- For platform_admin role, MUST create separate route `/platform-admin/plans`:
  - List all plans with filters
  - Create new plan form (name, tier, interval, amount, currency)
  - Edit and soft-delete plans
- MUST create route `/platform-admin/subscriptions`:
  - List all tenant subscriptions with filters
  - View individual subscription details
  - Manual intervention buttons (refund, cancel) — these create audit log entries

Security:
- Webhook endpoint MUST validate Stripe signature
- Webhook events MUST be idempotent (event.id deduplication)
- platform_admin role MUST be assigned manually via DB seed, NOT via UI
- Tenant CANNOT modify another tenant's subscription
- All Stripe API errors MUST be logged to audit log with full context
- Subscription amounts MUST NEVER be sent from frontend — backend uses plan_id only

**Tests (backend):**
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

**Tests (frontend):**
- Plans grid renders correctly on mobile (1 col) and desktop (3 cols)
- "Assinar" button initiates Stripe Checkout redirect
- Success page polls subscription status correctly
- Cancellation confirmation modal shows correct end date
- Plan change form shows proration estimate
- Error message appears at top of form on submit failure

**Implementation files:**

Backend:
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

Frontend:
- `packages/frontend/src/pages/settings/sections/BillingSection.tsx` (new)
- `packages/frontend/src/pages/billing/SubscriptionSuccessPage.tsx` (new)
- `packages/frontend/src/pages/billing/SubscriptionCancelPage.tsx` (new)
- `packages/frontend/src/pages/platform-admin/PlansPage.tsx` (new)
- `packages/frontend/src/pages/platform-admin/SubscriptionsPage.tsx` (new)
- `packages/frontend/src/components/billing/PlanCard.tsx` (new)
- `packages/frontend/src/components/billing/SubscriptionStatusBadge.tsx` (new)
- `packages/frontend/src/api/billing.ts` (new)
- `packages/frontend/src/App.tsx` (modify — add routes)

**Definition of Done:**
- All migrations executed without errors
- All backend tests pass
- All frontend tests pass
- Stripe test mode subscription created and canceled successfully (using stripe-cli)
- Webhook delivery tested via `stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe/platform`
- Readjustment job runs in test environment and produces correct prices
- Email notification renders correctly in pt-BR, EN, ES
- Renders correctly on mobile (375px), tablet (768px), desktop (1280px)
- Existing tenants have email field validated as required

---

### TASK 23 — Stripe Connect Express Onboarding & Information Pages

**Frontmatter:**
- status: pending
- type: feature
- complexity: high
- dependencies: [task_22]

**Overview:**
Implements Stripe Connect Express onboarding for tenants who want to receive payments directly from their end clients. Includes a comprehensive information page (separate versions for BR and US, with EN/ES toggle for US) detailing fees, required documents, processing times, and supported payment methods. The information page requires explicit consent before enabling Stripe integration. A highlighted card at the top of the company configuration page directs the tenant to read the information page before connecting.

**Requirements:**

Environment setup:
- MUST add environment variables:
  - `STRIPE_CONNECT_CLIENT_ID` (ca_test_... / ca_live_...)
  - `STRIPE_CONNECT_WEBHOOK_SECRET` (whsec_... — separate from platform webhook secret)
  - `STRIPE_CONNECT_RETURN_URL` (e.g. https://app.example.com/settings/payments/connected)
  - `STRIPE_CONNECT_REFRESH_URL` (e.g. https://app.example.com/settings/payments/refresh)

Backend — Database:
- MUST create migration `1714000000034-AlterTenantsAddStripeConnect`:
  - Adds to `tenants` table:
    - `stripe_connect_account_id varchar UNIQUE nullable` (acct_...)
    - `stripe_connect_status varchar nullable` (values: 'pending', 'onboarding', 'active', 'restricted', 'rejected', 'disabled')
    - `stripe_connect_charges_enabled boolean DEFAULT false`
    - `stripe_connect_payouts_enabled boolean DEFAULT false`
    - `stripe_connect_requirements jsonb nullable` (Stripe-returned requirements list)
    - `stripe_connect_country varchar(2) nullable` (BR, US)
    - `payment_mode varchar DEFAULT 'manual'` (values: 'manual', 'stripe')
    - `payment_timing varchar DEFAULT 'prepaid'` (values: 'prepaid', 'postpaid')
    - `stripe_terms_accepted_version varchar nullable`
    - `stripe_terms_accepted_at timestamp nullable`
    - `stripe_terms_accepted_ip varchar nullable`
- MUST create migration `1714000000035-CreateStripeTermsVersions`:
  - Table: `stripe_terms_versions`
  - Fields: `id uuid PK`, `version varchar UNIQUE` (e.g. 'v1.0', 'v1.1'), `country varchar(2)` (BR, US), `language varchar(5)` (pt-BR, en, es), `content text` (full HTML or Markdown of the terms), `platform_fee_percent numeric(5,2)`, `stripe_fee_card_percent numeric(5,2)`, `stripe_fee_pix_percent numeric(5,2) nullable`, `stripe_fee_ach_percent numeric(5,2) nullable`, `effective_from timestamp`, `effective_until timestamp nullable`, `created_at`
- MUST create migration `1714000000036-CreateTenantStripeConsents`:
  - Table: `tenant_stripe_consents`
  - Fields: `id uuid PK`, `tenant_id uuid FK`, `terms_version varchar FK references stripe_terms_versions(version)`, `accepted_at timestamp`, `accepted_ip varchar`, `accepted_user_agent varchar`, `accepted_by_user_id uuid FK references users(id)`
  - Index on `tenant_id`

Backend — Entities & Services:
- MUST create entities: `StripeTermsVersion`, `TenantStripeConsent`
- MUST create `StripeConnectService` in `src/modules/billing/stripe/stripe-connect.service.ts`:
  - `createConnectAccount({ tenantId, country, email })` — creates Stripe Express account
  - `createAccountLink({ accountId, returnUrl, refreshUrl, type })` — generates onboarding link
  - `retrieveAccount(accountId)` — fetches account status and requirements
  - `createLoginLink(accountId)` — generates dashboard login link for tenant
  - `disconnectAccount(accountId)` — destroys connection
- MUST create `StripeTermsService`:
  - `getCurrentTerms({ country, language })` — returns active terms version
  - `recordConsent({ tenantId, termsVersion, ip, userAgent, userId })` — stores acceptance
  - `hasValidConsent(tenantId)` — checks if tenant has consented to current terms version
- MUST seed initial terms version v1.0 for BR (pt-BR) and US (en, es) with:
  - Platform fee: 1%
  - BR card fee: 3.99% + R$0,39
  - BR PIX fee: 0.99%
  - US card fee: 2.9% + $0.30
  - US ACH fee: 0.8% (cap $5)

Backend — Endpoints:
- `GET /api/v1/billing/connect/terms?country=BR&language=pt-BR` — returns current terms (public for the tenant viewing)
- `POST /api/v1/billing/connect/accept-terms` — records consent (requires admin role)
- `POST /api/v1/billing/connect/start-onboarding` — creates Connect account, returns onboarding URL
  - MUST validate `hasValidConsent(tenantId)` before allowing — returns 400 if no consent
- `GET /api/v1/billing/connect/status` — returns current Connect status for tenant
- `POST /api/v1/billing/connect/dashboard-link` — returns Stripe Express dashboard link
- `DELETE /api/v1/billing/connect/disconnect` — disconnects Stripe account
- `PUT /api/v1/billing/payment-config` — updates `payment_mode` (manual/stripe) and `payment_timing` (prepaid/postpaid):
  - Switching from 'manual' to 'stripe' requires `stripe_connect_status='active'`
  - Switching `payment_timing` requires confirmation flag in payload
  - Default value for `payment_timing` is 'prepaid'

Backend — Webhook handler:
- MUST create `StripeConnectWebhookController` at `POST /api/v1/webhooks/stripe/connect`:
  - MUST validate signature using `STRIPE_CONNECT_WEBHOOK_SECRET`
  - MUST handle events:
    - `account.updated` — sync `charges_enabled`, `payouts_enabled`, `requirements`, `status`
    - `account.application.deauthorized` — clears Connect fields on tenant
  - MUST be idempotent

Frontend — Information Pages:
- MUST create route `/settings/payments/info-br` (Portuguese only — Brazil terms)
- MUST create route `/settings/payments/info-us` (English/Spanish toggle — US terms)
- Auto-detection of language and country:
  - Read from tenant locale settings
  - For BR tenants: redirect to /info-br
  - For US tenants: redirect to /info-us with default language matching browser
  - Manual toggle at top of page (BR shows only pt-BR; US toggles EN/ES)
- Page sections (both versions):
  1. "Como funciona" — visual flow diagram (client pays → Stripe processes → tenant receives)
  2. "Documentos necessários" — list per country
  3. "Taxas" — clear breakdown:
     - Stripe fee (cartão BR: 3,99% + R$0,39 / PIX: 0,99% / cartão US: 2,9% + $0,30 / ACH: 0,8%)
     - Platform fee: 1%
     - Example calculation: "Em uma venda de R$ 100 com cartão, você recebe R$ 94,62"
  4. "Prazos" — first payout 30 days, then D+2 for cards, D+1 for PIX, etc.
  5. "Métodos de pagamento suportados" — list per country
  6. "Suporte e disputas" — chargeback handling
  7. "Perguntas frequentes" — FAQ accordion
  8. "Termos de aceite" — full terms text + checkbox "Li e concordo com as taxas e condições"
- Consent checkbox:
  - Disabled until user scrolls to bottom of terms
  - On accept: records consent via API, shows success state
  - After consent recorded, displays accepted version and date
  - MUST be irreversible — once accepted, cannot be undone
  - If terms version changes in future, requires new acceptance

Frontend — Configuration card:
- MUST add a highlighted card at the top of the Company Configuration page (Settings → Empresa):
  - Visual treatment: distinct background color (use design system accent), border, icon
  - Title: "Antes de integrar pagamentos, leia as informações importantes"
  - Body: brief explanation
  - CTA button: "Ler informações sobre pagamentos" → navigates to the info page
  - Card is dismissible only AFTER terms accepted
  - After acceptance, card transforms into success state: "Termos aceitos em {date}. Você pode integrar pagamentos."

Frontend — Connect onboarding:
- MUST create "Pagamentos" tab in Settings with the following sections:
  - "Modo de recebimento" with two options (radio):
    - "Pagamento Manual" (default for new tenants) — selected: shows simple confirmation
    - "Integração com Stripe" — disabled until terms accepted, shows "Aceite os termos primeiro" tooltip
  - When "Integração com Stripe" selected:
    - If `stripe_connect_status` is null: show fee summary modal first ("Resumo das taxas: Stripe X%, Plataforma 1%") + "Estou ciente" checkbox + "Continuar com onboarding" button
    - On confirm: call `POST /billing/connect/start-onboarding`, receive URL, redirect to Stripe-hosted onboarding
    - If `stripe_connect_status='onboarding'`: show "Onboarding incompleto" with "Continuar onboarding" button (creates new account link)
    - If `stripe_connect_status='active'`: show success card with "Pagamentos habilitados", "Abrir dashboard Stripe" button, "Desconectar" danger button
    - If `stripe_connect_status='restricted'`: show warning with requirements list
  - "Momento da cobrança" toggle (visible only when Connect is active):
    - "Pré-pagamento" (DEFAULT) — cliente paga antes do agendamento ser confirmado
    - "Pós-pagamento" — cliente paga após execução do serviço
    - Changing this setting triggers confirmation modal: "Confirma a mudança de modalidade?"
    - Modal lists implications: "Pré-pagamento: agendamento só confirmado após pagamento" / "Pós-pagamento: link de pagamento enviado após conclusão"
    - Toggle is disabled when payment_mode='manual'
- MUST handle return from Stripe onboarding:
  - Route `/settings/payments/connected?account_id=acct_xxx` polls status
  - Once `charges_enabled=true`, shows success state
- MUST handle disconnect:
  - Confirmation modal: "Tem certeza? Você não receberá mais pagamentos via Stripe."
  - Shows warning if there are pending bookings expecting Stripe payment

Security:
- Connect account creation MUST require admin role
- Disconnect MUST require admin role AND confirmation
- Terms acceptance MUST be tied to the user who accepted (audit trail)
- Webhook MUST validate signature with separate Connect webhook secret
- Frontend MUST NEVER store Stripe account ID in localStorage — only sessionStorage or memory
- Information pages MUST be publicly accessible (don't require auth)

**Tests (backend):**
- StripeConnectService creates Express account with correct country
- StripeConnectService creates account link with correct return/refresh URLs
- StripeTermsService returns correct version per country/language
- recordConsent saves IP, user_agent, user_id correctly
- hasValidConsent returns false for outdated terms version
- start-onboarding fails with 400 if no valid consent
- payment-config update from manual to stripe requires active Connect
- payment-config rejects payment_timing change without confirmation flag
- Webhook handler updates tenant fields on account.updated event
- Webhook handler clears Connect fields on account.application.deauthorized
- Tenant cannot access another tenant's Connect status

**Tests (frontend):**
- Info card displays at top of Company Configuration before terms accepted
- Info card transforms to success state after terms accepted
- /settings/payments/info-br renders only pt-BR
- /settings/payments/info-us renders EN by default, toggles to ES
- Auto-detection redirects BR tenant to /info-br
- Accept checkbox disabled until scroll reaches bottom
- Accept submission records consent and updates UI to "Aceito em {date}"
- "Integração com Stripe" radio disabled until terms accepted
- Fee summary modal appears before Connect onboarding starts
- Payment timing toggle disabled when payment_mode='manual'
- Payment timing default is 'prepaid' for new tenants
- Disconnect confirmation modal shows pending bookings warning when applicable
- All pages render correctly at 375px viewport width

**Implementation files:**

Backend:
- `packages/backend/src/database/migrations/1714000000034-AlterTenantsAddStripeConnect.ts` (new)
- `packages/backend/src/database/migrations/1714000000035-CreateStripeTermsVersions.ts` (new)
- `packages/backend/src/database/migrations/1714000000036-CreateTenantStripeConsents.ts` (new)
- `packages/backend/src/database/seeds/stripe-terms.seed.ts` (new — initial v1.0 terms)
- `packages/backend/src/modules/billing/stripe/stripe-connect.service.ts` (new)
- `packages/backend/src/modules/billing/connect/stripe-terms.service.ts` (new)
- `packages/backend/src/modules/billing/connect/tenant-stripe-consent.entity.ts` (new)
- `packages/backend/src/modules/billing/connect/stripe-terms-version.entity.ts` (new)
- `packages/backend/src/modules/billing/interfaces/connect.controller.ts` (new)
- `packages/backend/src/modules/billing/interfaces/payment-config.controller.ts` (new)
- `packages/backend/src/modules/billing/webhooks/stripe-connect-webhook.controller.ts` (new)
- `packages/backend/src/modules/tenants/domain/tenant.entity.ts` (modify)

Frontend:
- `packages/frontend/src/pages/settings/PaymentsInfoBRPage.tsx` (new — pt-BR only)
- `packages/frontend/src/pages/settings/PaymentsInfoUSPage.tsx` (new — EN/ES toggle)
- `packages/frontend/src/components/settings/PaymentsInfoCard.tsx` (new — highlighted card at top)
- `packages/frontend/src/components/settings/TermsAcceptanceBlock.tsx` (new)
- `packages/frontend/src/pages/settings/sections/PaymentsSection.tsx` (new — main payments tab)
- `packages/frontend/src/components/settings/PaymentModeRadio.tsx` (new)
- `packages/frontend/src/components/settings/PaymentTimingToggle.tsx` (new)
- `packages/frontend/src/components/settings/StripeConnectStatusCard.tsx` (new)
- `packages/frontend/src/components/settings/FeeSummaryModal.tsx` (new)
- `packages/frontend/src/pages/settings/StripeConnectedPage.tsx` (new — return handler)
- `packages/frontend/src/api/billingConnect.ts` (new)
- `packages/frontend/src/pages/settings/SettingsPage.tsx` (modify — add Payments tab + info card at top of Company tab)
- `packages/frontend/src/App.tsx` (modify — add routes)

**Definition of Done:**
- All migrations executed without errors
- All backend tests pass
- All frontend tests pass
- BR terms (pt-BR), US terms (EN), US terms (ES) all render correctly
- Connect onboarding tested end-to-end with Stripe CLI in test mode
- Account status syncs correctly via webhook
- Terms acceptance recorded with IP, user_agent, user_id
- Highlighted info card visible at top of company configuration
- Payment timing default is 'prepaid' for new tenants
- All sections render correctly on mobile (375px), tablet, desktop
- Email field on tenant is NOT NULL and required

---

### TASK 24 — Public Payment Flow with Stripe Connect (Level B: client pays tenant)

**Frontmatter:**
- status: pending
- type: feature
- complexity: high
- dependencies: [task_23]

**Overview:**
Implements the payment flow for end clients to pay tenants. Integrated into the public quote/booking flow from Phase 2B (T19-T21). When a tenant has Stripe Connect active, the client pays via Stripe with payment methods appropriate to the tenant's country (BR: card, PIX; US: card, ACH, Apple Pay, Google Pay). When the tenant uses manual payment mode, the booking is created with "Pagamento Manual" status and no payment flow is triggered. Pre-paid bookings require payment before confirmation; post-paid bookings send a payment link after service execution. The platform collects a 1% application fee on all Connect transactions.

**Requirements:**

Backend — Database:
- MUST create migration `1714000000037-CreatePayments`:
  - Table: `payments`
  - Fields: `id uuid PK`, `tenant_id uuid FK`, `booking_id uuid FK nullable`, `quote_id uuid FK nullable`, `client_id uuid FK`, `stripe_payment_intent_id varchar UNIQUE nullable`, `stripe_charge_id varchar nullable`, `amount_cents int`, `application_fee_cents int` (platform's 1%), `stripe_fee_cents int nullable` (filled by webhook), `net_amount_cents int nullable` (amount tenant receives), `currency varchar(3)`, `status varchar` (values: 'pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded', 'manual_pending'), `payment_method varchar` (values: 'card', 'pix', 'ach', 'apple_pay', 'google_pay', 'manual'), `payment_mode varchar` (values: 'manual', 'stripe'), `payment_timing varchar` (values: 'prepaid', 'postpaid'), `paid_at timestamp nullable`, `refunded_at timestamp nullable`, `failure_reason varchar nullable`, `metadata jsonb nullable`, `created_at`, `updated_at`, `deleted_at nullable`
  - Index on `tenant_id`, `booking_id`, `client_id`, `status`
- MUST create migration `1714000000038-CreateStripeWebhookEvents`:
  - Table: `stripe_webhook_events` (for idempotency)
  - Fields: `id varchar PK` (Stripe event.id), `type varchar`, `processed_at timestamp`, `payload jsonb`, `error text nullable`
- MUST update Booking entity:
  - Add `payment_id uuid nullable` (FK to payments)
  - Update VALID_TRANSITIONS:
    - `pending_approval` → `pending_payment` (when prepaid and payment required)
    - `pending_payment` → `confirmed` (when payment succeeds)
    - `pending_payment` → `cancelled` (when payment fails after retries or client cancels)

Backend — Services:
- MUST create `PaymentService` in `src/modules/billing/payments/payment.service.ts`:
  - `createPaymentIntent({ bookingId, tenantId })` — creates Stripe PaymentIntent on connected account with `application_fee_amount`
  - `confirmManualPayment({ paymentId, tenantId })` — N/A (manual mode does not record payment, see security note)
  - `refundPayment({ paymentId, amount?, reason })` — issues refund via Stripe
  - `getPaymentMethodsForRegion(country)` — returns supported methods (BR: card, pix / US: card, ach, apple_pay, google_pay)
- MUST create `PublicPaymentService` for client-facing endpoints:
  - `createPublicPaymentIntent({ tenantSlug, bookingId, clientId })` — verifies booking belongs to client, creates PaymentIntent

Backend — Endpoints:
- `POST /api/v1/public/:tenantSlug/payments/intent` — REQUIRES client JWT:
  - Body: `{ booking_id }`
  - Returns: `{ client_secret, publishable_key, payment_methods: string[] }`
  - Validates booking belongs to authenticated client, payment_mode='stripe', booking status allows payment
  - Creates Payment record with status='pending'
  - Calculates `application_fee_cents = amount_cents * PLATFORM_FEE_PERCENT / 100`
- `GET /api/v1/public/:tenantSlug/payments/my` — REQUIRES client JWT, lists client's payments
- `GET /api/v1/payments` — admin/staff endpoint, lists tenant payments with filters
- `POST /api/v1/payments/:id/refund` — admin only, initiates refund
- `POST /api/v1/payments/:id/send-payment-link` — admin only, sends payment link for postpaid bookings

Backend — Webhook handler:
- MUST extend `StripeConnectWebhookController` to handle payment events:
  - `payment_intent.succeeded` — updates Payment status to 'succeeded', captures `stripe_fee_cents` from balance_transaction, sets `net_amount_cents`, transitions Booking to 'confirmed' (if prepaid), sends email confirmation to client
  - `payment_intent.payment_failed` — updates Payment status to 'failed', stores failure_reason, sends email to client with retry link
  - `charge.refunded` — updates Payment status to 'refunded'
  - `charge.dispute.created` — alerts admin/staff
- MUST be idempotent via stripe_webhook_events table

Backend — Booking integration:
- MUST modify Booking creation in T21 to handle payment workflow:
  - If `tenant.payment_mode === 'manual'`:
    - Booking proceeds as before (status pending_approval)
    - No Payment record created
    - No payment flow triggered
  - If `tenant.payment_mode === 'stripe'` AND `tenant.payment_timing === 'prepaid'`:
    - Booking is created with status `pending_approval`
    - After admin approval, booking transitions to `pending_payment`
    - Email sent to client with payment link
    - Booking only transitions to `confirmed` when Payment status becomes `succeeded`
  - If `tenant.payment_mode === 'stripe'` AND `tenant.payment_timing === 'postpaid'`:
    - Booking is created and confirmed normally
    - After admin marks booking as `completed`, payment link is auto-sent to client

Backend — Email integration:
- MUST create email templates (pt-BR, EN, ES):
  - `payment-link-prepaid.html` — sent when booking approved, contains payment URL
  - `payment-link-postpaid.html` — sent after booking completed
  - `payment-success.html` — confirmation after successful payment
  - `payment-failed.html` — sent on failure, contains retry link
  - `payment-refund.html` — sent on refund

Frontend — Public payment page:
- MUST create new public route `/t/:tenantSlug/pagamento?bookingId={id}` accessible only to authenticated clients
- The page MUST:
  - Verify client owns the booking
  - Display booking summary (service, date, total, breakdown)
  - Display Stripe Payment Element (using `@stripe/stripe-js` and `@stripe/react-stripe-js`)
  - Payment Element auto-detects available methods based on tenant region
  - Submit button "Pagar R$ X,XX" triggers PaymentIntent confirmation
  - On success: redirect to `/t/:tenantSlug/pagamento/sucesso?paymentId={id}`
  - On failure: show error and retry option
- MUST create success page `/t/:tenantSlug/pagamento/sucesso`:
  - Shows payment confirmation, booking details, status badge
  - Sends email confirmation triggered server-side via webhook

Frontend — Admin payment management:
- MUST add "Pagamentos" tab to existing booking detail page:
  - Shows payment status, method, amount, fees, net
  - "Reembolsar" button for succeeded payments (admin only)
  - "Reenviar link de pagamento" button for pending payments
- MUST create `PaymentsListPage` accessible from main nav for admin/staff:
  - Lists all payments with filters (status, date range, method, client)
  - Export to CSV button
  - Total received, fees paid, net summary

Frontend — Internal Kanban update:
- MUST update Kanban board to show payment status badge on booking cards:
  - "Aguardando pagamento" badge for `pending_payment` status
  - "Pago" badge for confirmed bookings with successful payment
  - "Manual" badge for manual payment mode

Security:
- Payment amounts MUST NEVER be sent from frontend — backend calculates from booking
- Payment Intent MUST be created on the connected account (`stripeAccount` parameter in Stripe SDK)
- Application fee MUST be set via `application_fee_amount` parameter
- Payment confirmation MUST happen only via Stripe webhook, never via client-side callback
- Refunds MUST require admin role AND audit log entry
- Payment links sent via email MUST expire after 7 days
- Client can only access their own payments
- All payment endpoints rate-limited

**Tests (backend):**
- POST /public/:tenantSlug/payments/intent rejects when booking belongs to different client
- POST /public/:tenantSlug/payments/intent rejects when tenant payment_mode='manual'
- POST /public/:tenantSlug/payments/intent calculates application_fee_cents correctly (1%)
- POST /public/:tenantSlug/payments/intent returns supported methods for BR (card, pix)
- POST /public/:tenantSlug/payments/intent returns supported methods for US (card, ach, apple_pay, google_pay)
- Webhook payment_intent.succeeded transitions booking to confirmed (prepaid case)
- Webhook is idempotent (duplicate event.id not reprocessed)
- Refund issues Stripe refund and updates Payment status
- Manual payment mode bookings do NOT create Payment records
- Postpaid bookings receive payment link after status becomes completed
- Email templates render correctly in all three languages
- Payment expiry link (7 days) enforced

**Tests (frontend):**
- /t/:tenantSlug/pagamento renders Payment Element with correct methods per region
- Payment Element shows PIX option for BR tenants only
- Payment Element shows Apple Pay/Google Pay for US tenants only
- Submit button disabled until Payment Element is valid
- Success page displays correct booking and payment details
- Refund button visible only to admin role
- Payment status badge appears on Kanban cards
- All pages render correctly at 375px viewport width

**Implementation files:**

Backend:
- `packages/backend/src/database/migrations/1714000000037-CreatePayments.ts` (new)
- `packages/backend/src/database/migrations/1714000000038-CreateStripeWebhookEvents.ts` (new)
- `packages/backend/src/modules/billing/payments/payment.entity.ts` (new)
- `packages/backend/src/modules/billing/payments/payment.service.ts` (new)
- `packages/backend/src/modules/billing/payments/public-payment.service.ts` (new)
- `packages/backend/src/modules/billing/payments/payment.controller.ts` (new)
- `packages/backend/src/modules/billing/payments/public-payment.controller.ts` (new)
- `packages/backend/src/modules/billing/webhooks/stripe-connect-webhook.controller.ts` (modify — add payment events)
- `packages/backend/src/modules/bookings/application/booking.service.ts` (modify — payment workflow integration)
- `packages/backend/src/modules/bookings/domain/booking.entity.ts` (modify — add payment_id, new statuses)
- `packages/backend/src/modules/notifications/templates/*` (new — 5 email templates × 3 languages)

Frontend:
- `packages/frontend/src/pages/public/PublicPaymentPage.tsx` (new)
- `packages/frontend/src/pages/public/PaymentSuccessPage.tsx` (new)
- `packages/frontend/src/components/public/StripePaymentForm.tsx` (new)
- `packages/frontend/src/pages/payments/PaymentsListPage.tsx` (new — admin)
- `packages/frontend/src/components/payments/PaymentStatusBadge.tsx` (new)
- `packages/frontend/src/components/payments/RefundModal.tsx` (new)
- `packages/frontend/src/pages/bookings/BookingDetailPage.tsx` (modify — payments tab)
- `packages/frontend/src/pages/kanban/KanbanPage.tsx` (modify — payment status badges)
- `packages/frontend/src/api/payments.ts` (new)
- `packages/frontend/src/App.tsx` (modify — add routes)

**Definition of Done:**
- All migrations executed without errors
- All backend tests pass
- All frontend tests pass
- Stripe Payment Intent flow tested end-to-end with Stripe CLI in test mode
- Card payment tested in BR (test card)
- PIX payment tested in BR (test mode)
- Card payment tested in US
- ACH tested in US (test mode)
- Webhook events properly transition booking statuses
- Application fee correctly applied to Connect transactions
- Refund flow tested
- Email confirmations sent in pt-BR, EN, ES
- Manual payment mode bookings work without Stripe involvement
- Pre-paid and post-paid flows tested separately
- Payment link expiry (7 days) enforced
- All pages render correctly on mobile (375px), tablet, desktop

---

## _tasks.md update instructions

Add the following rows to the task table, after the existing T21 row:

| 22 | Stripe Platform Subscriptions (Level A: tenant pays SaaS) | pending | high | task_21 |
| 23 | Stripe Connect Express Onboarding & Information Pages | pending | high | task_22 |
| 24 | Public Payment Flow with Stripe Connect (Level B: client pays tenant) | pending | high | task_23 |

---

## _techspec.md update instructions

EXTEND the existing "Phase 2 — Public Tenant Product" section by APPENDING the following subsections (do not duplicate or remove existing content):

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

---

Do NOT execute any task. Do NOT write any application code. Only create the task files and update `_tasks.md` and `_techspec.md`.
