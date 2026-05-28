---
status: completed
title: "Public Payment Flow with Stripe Connect (Level B: client pays tenant)"
type: feature
complexity: high
dependencies: [task_23]
---

# Task 24: Public Payment Flow with Stripe Connect (Level B: client pays tenant)

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

Implements the payment flow for end clients to pay tenants. Integrated into the public quote/booking flow from Phase 2B (T19-T21). When a tenant has Stripe Connect active, the client pays via Stripe with payment methods appropriate to the tenant's country (BR: card, PIX; US: card, ACH, Apple Pay, Google Pay). When the tenant uses manual payment mode, the booking is created with "Pagamento Manual" status and no payment flow is triggered. Pre-paid bookings require payment before confirmation; post-paid bookings send a payment link after service execution. The platform collects a 1% application fee on all Connect transactions.

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

### Backend — Database

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

### Backend — Services

- MUST create `PaymentService` in `src/modules/billing/payments/payment.service.ts`:
  - `createPaymentIntent({ bookingId, tenantId })` — creates Stripe PaymentIntent on connected account with `application_fee_amount`
  - `refundPayment({ paymentId, amount?, reason })` — issues refund via Stripe
  - `getPaymentMethodsForRegion(country)` — returns supported methods (BR: card, pix / US: card, ach, apple_pay, google_pay)
- MUST create `PublicPaymentService` for client-facing endpoints:
  - `createPublicPaymentIntent({ tenantSlug, bookingId, clientId })` — verifies booking belongs to client, creates PaymentIntent

### Backend — Endpoints

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

### Backend — Webhook Handler

- MUST extend `StripeConnectWebhookController` to handle payment events:
  - `payment_intent.succeeded` — updates Payment status to 'succeeded', captures `stripe_fee_cents` from balance_transaction, sets `net_amount_cents`, transitions Booking to 'confirmed' (if prepaid), sends email confirmation to client
  - `payment_intent.payment_failed` — updates Payment status to 'failed', stores failure_reason, sends email to client with retry link
  - `charge.refunded` — updates Payment status to 'refunded'
  - `charge.dispute.created` — alerts admin/staff
- MUST be idempotent via stripe_webhook_events table

### Backend — Booking Integration

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

### Backend — Email Integration

- MUST create email templates (pt-BR, EN, ES):
  - `payment-link-prepaid.html` — sent when booking approved, contains payment URL
  - `payment-link-postpaid.html` — sent after booking completed
  - `payment-success.html` — confirmation after successful payment
  - `payment-failed.html` — sent on failure, contains retry link
  - `payment-refund.html` — sent on refund

### Frontend — Public Payment Page

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

### Frontend — Admin Payment Management

- MUST add "Pagamentos" tab to existing booking detail page:
  - Shows payment status, method, amount, fees, net
  - "Reembolsar" button for succeeded payments (admin only)
  - "Reenviar link de pagamento" button for pending payments
- MUST create `PaymentsListPage` accessible from main nav for admin/staff:
  - Lists all payments with filters (status, date range, method, client)
  - Export to CSV button
  - Total received, fees paid, net summary

### Frontend — Internal Kanban Update

- MUST update Kanban board to show payment status badge on booking cards:
  - "Aguardando pagamento" badge for `pending_payment` status
  - "Pago" badge for confirmed bookings with successful payment
  - "Manual" badge for manual payment mode

### Security

- Payment amounts MUST NEVER be sent from frontend — backend calculates from booking
- Payment Intent MUST be created on the connected account (`stripeAccount` parameter in Stripe SDK)
- Application fee MUST be set via `application_fee_amount` parameter
- Payment confirmation MUST happen only via Stripe webhook, never via client-side callback
- Refunds MUST require admin role AND audit log entry
- Payment links sent via email MUST expire after 7 days
- Client can only access their own payments
- All payment endpoints rate-limited

## Tests

### Backend
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

### Frontend
- /t/:tenantSlug/pagamento renders Payment Element with correct methods per region
- Payment Element shows PIX option for BR tenants only
- Payment Element shows Apple Pay/Google Pay for US tenants only
- Submit button disabled until Payment Element is valid
- Success page displays correct booking and payment details
- Refund button visible only to admin role
- Payment status badge appears on Kanban cards
- All pages render correctly at 375px viewport width

## Implementation Files

### Backend
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

### Frontend
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

## Definition of Done

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
