---
status: pending
title: "Stripe Connect Express Onboarding & Information Pages"
type: feature
complexity: high
dependencies: [task_22]
---

# Task 23: Stripe Connect Express Onboarding & Information Pages

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

Implements Stripe Connect Express onboarding for tenants who want to receive payments directly from their end clients. Includes a comprehensive information page (separate versions for BR and US, with EN/ES toggle for US) detailing fees, required documents, processing times, and supported payment methods. The information page requires explicit consent before enabling Stripe integration. A highlighted card at the top of the company configuration page directs the tenant to read the information page before connecting.

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

- MUST add environment variables:
  - `STRIPE_CONNECT_CLIENT_ID` (ca_test_... / ca_live_...)
  - `STRIPE_CONNECT_WEBHOOK_SECRET` (whsec_... — separate from platform webhook secret)
  - `STRIPE_CONNECT_RETURN_URL` (e.g. https://app.example.com/settings/payments/connected)
  - `STRIPE_CONNECT_REFRESH_URL` (e.g. https://app.example.com/settings/payments/refresh)

### Backend — Database

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

### Backend — Entities & Services

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

### Backend — Endpoints

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

### Backend — Webhook Handler

- MUST create `StripeConnectWebhookController` at `POST /api/v1/webhooks/stripe/connect`:
  - MUST validate signature using `STRIPE_CONNECT_WEBHOOK_SECRET`
  - MUST handle events:
    - `account.updated` — sync `charges_enabled`, `payouts_enabled`, `requirements`, `status`
    - `account.application.deauthorized` — clears Connect fields on tenant
  - MUST be idempotent

### Frontend — Information Pages

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

### Frontend — Configuration Card

- MUST add a highlighted card at the top of the Company Configuration page (Settings → Empresa):
  - Visual treatment: distinct background color (use design system accent), border, icon
  - Title: "Antes de integrar pagamentos, leia as informações importantes"
  - Body: brief explanation
  - CTA button: "Ler informações sobre pagamentos" → navigates to the info page
  - Card is dismissible only AFTER terms accepted
  - After acceptance, card transforms into success state: "Termos aceitos em {date}. Você pode integrar pagamentos."

### Frontend — Connect Onboarding

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

### Security

- Connect account creation MUST require admin role
- Disconnect MUST require admin role AND confirmation
- Terms acceptance MUST be tied to the user who accepted (audit trail)
- Webhook MUST validate signature with separate Connect webhook secret
- Frontend MUST NEVER store Stripe account ID in localStorage — only sessionStorage or memory
- Information pages MUST be publicly accessible (don't require auth)

## Tests

### Backend
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

### Frontend
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

## Implementation Files

### Backend
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

### Frontend
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

## Definition of Done

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
