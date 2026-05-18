You are a senior software engineer and technical planner.

Your task is to CREATE TASK FILES ONLY for Phase 2B of the Cleaning SaaS project — do not execute any task, do not write application code, do not modify any source file outside of the Compozy task planning system.

Read the following files before starting:
- `.compozy/tasks/cleaning-saas/_techspec.md`
- `.compozy/tasks/cleaning-saas/_design_system.md`
- `.compozy/tasks/cleaning-saas/_tasks.md`
- `.compozy/tasks/cleaning-saas/task_17.md` (Phase 2A reference)
- `.compozy/tasks/cleaning-saas/task_18.md` (Phase 2A reference)

---

## What you MUST deliver

1. Create 3 new task files in `.compozy/tasks/cleaning-saas/`:
   - `task_19.md` — Public Quote Flow Part A: Quote Request Form
   - `task_20.md` — Public Quote Flow Part B: Account Creation & Quote Submission
   - `task_21.md` — Public Scheduling Flow with Availability Sync

2. Update `.compozy/tasks/cleaning-saas/_tasks.md` to include T19, T20 and T21 with correct titles, status (pending), complexity, and dependencies.

3. Update `.compozy/tasks/cleaning-saas/_techspec.md` to extend the "Phase 2 — Public Tenant Product" section with new modules, integrations, and business rules introduced by the public quote/booking flow (Public Quote Service, Account Bridge, Social Login, Availability Sync, Approval Workflow).

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
</technical_constraints>
<validation>
* Ensure all requirements are fully implemented
* Ensure no security rules are violated
* Ensure tenant isolation is preserved
* Ensure correct error handling (401, 403, 400, 500)
* Ensure mobile responsiveness on all UI changes (test at 375px width)
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
  // onChange:
  onChange={(id) => { fieldIdRef.current = id; setFieldId(id); }}
  // in handleSubmit:
  const fid = fieldIdRef.current || fieldId;
  ```
  This prevents React closure issues where stale state is read at submit time.
- Submit button MUST be `type="button"` with `onClick={handleSubmit}` (not `type="submit"`).
- The `<form>` element MUST NOT have `onSubmit={...}` — submission is triggered exclusively by the onClick handler.
- MUST use `isSubmittingRef = useRef(false)` to prevent double submission:
  ```tsx
  if (isSubmittingRef.current) return;
  // ... validation checks ...
  isSubmittingRef.current = true;  // ONLY after validation passes
  try { ... } finally { isSubmittingRef.current = false; }
  ```
- Error message MUST be rendered immediately after the `<form>` opening tag, NOT at the bottom — bottom placement causes it to render below the fold on long forms.
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
- Public endpoints MUST be explicitly marked `@Public()` and MUST enforce tenant isolation by tenantSlug resolution, NOT by JWT.
- Public endpoints MUST NOT expose internal IDs beyond what is necessary (tenant_id, user_id, created_by are NEVER exposed publicly).
- File uploads MUST validate MIME type and size before processing.
- Webhook endpoints MUST validate signatures before processing.
- All input validation MUST use class-validator decorators on DTOs.
- Rate limiting MUST be applied to public endpoints (60 requests/minute per IP for unauthenticated routes).

---

## Design system reference (include in every frontend task)

MUST read and follow `.compozy/tasks/cleaning-saas/_design_system.md` before writing any frontend code.
All UI MUST conform strictly to the design system defined there — colors, typography, spacing, components, responsiveness, and screen patterns.

---

## Tasks to create

---

### TASK 19 — Public Quote Flow Part A: Quote Request Form

**Frontmatter:**
- status: pending
- type: feature
- complexity: high
- dependencies: [task_18]

**Overview:**
Implements the first half of the public quote flow at `/t/:tenantSlug/orcamento`. An anonymous visitor can fill out a quote request form (service selection, area or duration, location, observations, contact info) and receive an estimated price calculation. The data is held in browser state only — nothing is persisted to the database until the visitor completes account creation in T20. The page applies the tenant's white-label branding and is fully responsive mobile-first.

**Requirements:**

Backend:
- MUST create public endpoint `POST /api/v1/public/:tenantSlug/quote-estimate` marked with `@Public()`:
  - Accepts payload `{ service_id, area_sqm?, duration_hours?, manual_discount_percent?, addon_ids?: string[] }`
  - Validates that service_id and addon_ids belong to the resolved tenant (cross-tenant injection check)
  - Calls existing PricingService to compute estimated total
  - Returns `{ subtotal_cents, addon_total_cents, discount_amount_cents, estimated_total_cents, currency }`
  - Does NOT persist anything in the database
  - Rate-limited 30 req/min per IP (lower than other public endpoints since it's compute-heavy)
  - MUST validate that all addon_ids belong to the selected service AND to the resolved tenant — reject with 400 if any does not match
- MUST create public endpoint `GET /api/v1/public/:tenantSlug/services/:serviceId/addons` marked with `@Public()`:
  - Returns service addons for use in the public quote form
  - Returns 404 if service does not exist OR does not belong to the resolved tenant
  - Returns array `{ id, name, price_cents }`
  - Rate-limited 60 req/min per IP

Frontend:
- MUST create new public route `/t/:tenantSlug/orcamento` accessible without authentication
- The page MUST:
  - Load branding via existing `/api/v1/public/:tenantSlug/branding`
  - Load services via existing `/api/v1/public/:tenantSlug/services`
  - Apply primary_color CSS variable scoped to this route only
  - Display a multi-step form (single page with sections, not separate routes):
    1. Section "Selecione o serviço" — service cards with selection state
    2. Section "Detalhes do serviço" — area_sqm OR duration_hours (depending on service unit), addons multi-select (loads via the new addons endpoint when service is selected)
    3. Section "Local do serviço" — single address field (free text) plus city, state, postal_code
    4. Section "Observações" — textarea, optional
    5. Section "Seus dados" — name, email, phone (all required, validated)
  - Display sticky summary panel on desktop / bottom panel on mobile showing:
    - Selected service name
    - Subtotal
    - Addons breakdown
    - Estimated total (formatted in tenant currency)
  - The summary panel MUST call `POST /api/v1/public/:tenantSlug/quote-estimate` debounced 500ms whenever inputs change to recompute the estimate in real time
  - MUST show a clear notice at the top of the form: "O orçamento será confirmado pela empresa após sua solicitação. Você precisará criar uma conta para concluir."
- "Continuar para cadastro" CTA at the bottom:
  - Validates ALL fields client-side first
  - Stores the quote draft (all form fields + computed totals) in `sessionStorage` under key `public-quote-draft-{tenantSlug}`
  - Navigates to `/t/:tenantSlug/orcamento/cadastro` (T20 destination)
- "Voltar" button returns to `/t/:tenantSlug` (landing page)
- MUST follow ALL Phase 1 form patterns
- MUST be mobile-first responsive:
  - Single column at mobile width
  - Sticky summary panel becomes bottom-fixed action bar on mobile (shows total + CTA)
  - Service cards: 1 col mobile, 2 col tablet, 3 col desktop
  - Touch targets minimum 44x44px

Security:
- Public quote estimate endpoint MUST validate cross-tenant injection: service_id and addon_ids must belong to the resolved tenantSlug
- No persistence on this step — DB is untouched
- sessionStorage data MUST NOT contain any sensitive info beyond what the user typed
- MUST sanitize all text inputs before submission (no HTML tags in observations, name, address)
- Rate limiting applied per IP

**Tests (backend):**
- POST /api/v1/public/:tenantSlug/quote-estimate returns correct calculation without auth
- POST /api/v1/public/:tenantSlug/quote-estimate rejects when service_id belongs to different tenant
- POST /api/v1/public/:tenantSlug/quote-estimate rejects when addon_id belongs to different tenant
- POST /api/v1/public/:tenantSlug/quote-estimate rejects when addon_id does not belong to selected service
- POST /api/v1/public/:tenantSlug/quote-estimate does NOT create database records
- POST /api/v1/public/:tenantSlug/quote-estimate is rate-limited (31st request within 1 minute returns 429)
- GET /api/v1/public/:tenantSlug/services/:serviceId/addons returns correct addons
- GET /api/v1/public/:tenantSlug/services/:serviceId/addons returns 404 for service from different tenant
- Both endpoints do NOT expose tenant_id, created_by, or any internal fields

**Tests (frontend):**
- /t/:tenantSlug/orcamento renders branded with tenant primary color
- Service selection updates summary panel
- Area / duration field appears based on selected service unit
- Addons checkboxes load when service is selected
- Summary panel updates with debounce on input changes
- Notice about post-submission approval appears at top
- "Continuar para cadastro" saves draft to sessionStorage and navigates correctly
- Form validation prevents continuation when fields are missing
- Page renders correctly at 375px viewport width
- Bottom action bar appears on mobile with total and CTA

**Implementation files:**

Backend:
- `packages/backend/src/modules/public-quotes/public-quotes.module.ts` (new)
- `packages/backend/src/modules/public-quotes/interfaces/public-quote.controller.ts` (new)
- `packages/backend/src/modules/public-quotes/application/public-quote.service.ts` (new)
- `packages/backend/src/modules/public-quotes/validation/quote-estimate.dto.ts` (new)

Frontend:
- `packages/frontend/src/pages/public/PublicQuoteFormPage.tsx` (new)
- `packages/frontend/src/components/public/QuoteSummaryPanel.tsx` (new)
- `packages/frontend/src/components/public/ServiceSelector.tsx` (new)
- `packages/frontend/src/api/publicQuote.ts` (new)
- `packages/frontend/src/utils/publicQuoteDraft.ts` (new — sessionStorage helpers)
- `packages/frontend/src/App.tsx` (modify — add route)

**Definition of Done:**
- All migrations executed without errors (no new migrations expected in T19)
- All backend tests pass
- All frontend tests pass
- Form completes without any database write
- Draft persists in sessionStorage across page reloads
- Renders correctly on mobile (375px), tablet (768px), desktop (1280px)
- All public endpoints rate-limited and tenant-isolated
- No internal IDs exposed

---

### TASK 20 — Public Quote Flow Part B: Account Creation & Quote Submission

**Frontmatter:**
- status: pending
- type: feature
- complexity: high
- dependencies: [task_19]

**Overview:**
Implements the second half of the public quote flow. The visitor who completed T19 lands on `/t/:tenantSlug/orcamento/cadastro` and creates an account (email/password OR social login via Google or Facebook). Upon successful registration, the system creates a Client record for the tenant and persists the Quote with status `pending` for tenant/staff approval. The visitor receives confirmation and is redirected to the scheduling step (T21).

**Requirements:**

Backend:
- MUST create migration `1714000000027-AlterUsersAddSocialAuth` adding:
  - `auth_provider: varchar(20) NOT NULL DEFAULT 'local'` (values: `'local'`, `'google'`, `'facebook'`)
  - `provider_id: varchar(255) nullable` (external provider user ID)
  - `provider_email_verified: boolean NOT NULL DEFAULT false`
  - Unique index on `(auth_provider, provider_id)` where provider_id IS NOT NULL
- MUST create migration `1714000000028-AlterQuotesAddPublicOrigin`:
  - `origin: varchar(20) NOT NULL DEFAULT 'internal'` (values: `'internal'`, `'public'`)
  - `created_by_client_id: uuid nullable` (FK to clients — only set for public-origin quotes)
  - `approval_required: boolean NOT NULL DEFAULT false`
- MUST install and configure `passport-google-oauth20` and `passport-facebook` packages
- MUST create OAuth strategy files:
  - `src/modules/auth/strategies/google.strategy.ts`
  - `src/modules/auth/strategies/facebook.strategy.ts`
- MUST create public endpoints:
  - `POST /api/v1/public/:tenantSlug/auth/register` — accepts `{ name, email, password, phone }`, validates strong password (min 8 chars, 1 letter, 1 number), creates User with role `'client'` scoped to the tenant, creates Client record automatically, returns access + refresh tokens
  - `POST /api/v1/public/:tenantSlug/auth/login` — accepts `{ email, password }`, returns tokens for client role users only
  - `GET /api/v1/public/:tenantSlug/auth/google` — initiates Google OAuth flow with tenantSlug in state param
  - `GET /api/v1/public/:tenantSlug/auth/google/callback` — handles Google OAuth callback, creates User + Client if needed, returns tokens
  - `GET /api/v1/public/:tenantSlug/auth/facebook` — initiates Facebook OAuth flow with tenantSlug in state param
  - `GET /api/v1/public/:tenantSlug/auth/facebook/callback` — handles Facebook OAuth callback, creates User + Client if needed, returns tokens
- All public auth endpoints MUST resolve tenantSlug → tenant_id and scope user/client creation to that tenant
- MUST create `POST /api/v1/public/:tenantSlug/quotes` endpoint — REQUIRES client-role JWT (visitor must be authenticated):
  - Accepts quote draft payload (matches sessionStorage shape from T19) plus client information
  - Creates Quote with `status='draft'`, `origin='public'`, `approval_required=true`, `created_by_client_id` set to the authenticated client
  - Triggers domain event `QuotePublicCreated` for notification dispatch (admin/staff notified for approval)
  - Returns the created Quote object (id, status, estimated_total_cents)
  - Validates cross-tenant injection (service_id, addons must belong to resolved tenant)
- MUST add new role `'client'` to existing RBAC system:
  - Client role can access: own quotes, own bookings, own profile
  - Client role CANNOT access: other clients, staff endpoints, tenant settings, financial reports
- MUST update existing Quote service to handle `approval_required=true` quotes:
  - Public-origin quotes default to status `'draft'`
  - Admin/staff can approve via existing PUT /quotes/:id endpoint by setting status to `'sent'` or `'accepted'`
  - Client cannot transition status of public-origin quotes themselves

Frontend:
- MUST create new public route `/t/:tenantSlug/orcamento/cadastro` accessible without authentication
- On mount, MUST verify that sessionStorage has draft for this tenantSlug — if not, redirect to `/t/:tenantSlug/orcamento`
- The page MUST display:
  - Summary card showing the quote draft (service, total, contact info) — read-only
  - Tabs or toggle: "Criar conta" | "Já tenho conta"
  - "Criar conta" tab:
    - Form fields: name (prefilled from draft), email (prefilled), password, confirm password, phone (prefilled)
    - Password strength indicator
    - Submit button "Criar conta e enviar orçamento"
    - OR divider with social login buttons: "Entrar com Google" and "Entrar com Facebook"
  - "Já tenho conta" tab:
    - Fields: email, password
    - Submit button "Entrar e enviar orçamento"
    - Same social login buttons below
  - Notice: "Ao criar a conta, seu orçamento será enviado para análise da empresa. Você receberá a confirmação por e-mail."
- After successful auth (email/pass or OAuth):
  - Call `POST /api/v1/public/:tenantSlug/quotes` with the draft payload
  - Clear sessionStorage draft on success
  - Show success modal: "Orçamento enviado com sucesso. Aguarde a confirmação da empresa para agendar."
  - Provide CTA "Agendar serviço" that navigates to `/t/:tenantSlug/orcamento/agendar?quoteId={id}` (T21)
  - Provide secondary CTA "Voltar ao início" → `/t/:tenantSlug`
- MUST follow ALL Phase 1 form patterns
- MUST be mobile-first responsive:
  - Single column on mobile
  - Tabs become full-width on mobile
  - Social login buttons stack on mobile
  - Touch targets minimum 44x44px

Security:
- OAuth state parameter MUST include tenantSlug for validation on callback
- OAuth callbacks MUST validate state parameter to prevent CSRF
- Password validation MUST be enforced server-side
- Client role MUST be strictly limited — explicit allowlist for endpoints
- Token returned MUST be client-scoped (cannot be used for admin endpoints even with valid signature — role check at endpoint level)
- Public registration MUST be rate-limited 10 req/min per IP (prevent abuse)
- MUST log audit event for every public quote creation (origin, ip, user_agent)

**Tests (backend):**
- POST /api/v1/public/:tenantSlug/auth/register creates User and Client with correct tenant_id
- POST /api/v1/public/:tenantSlug/auth/register rejects weak password
- POST /api/v1/public/:tenantSlug/auth/register rejects duplicate email per tenant
- POST /api/v1/public/:tenantSlug/auth/register rate-limited
- POST /api/v1/public/:tenantSlug/auth/login returns client-role JWT only
- POST /api/v1/public/:tenantSlug/auth/login rejects admin/staff credentials with 403
- Google OAuth callback creates new User with auth_provider='google' on first login
- Google OAuth callback reuses existing User on subsequent logins
- OAuth state parameter validates tenantSlug correctly
- OAuth callback rejects mismatched state with 400
- POST /api/v1/public/:tenantSlug/quotes creates Quote with origin='public' and approval_required=true
- POST /api/v1/public/:tenantSlug/quotes rejects when service_id from different tenant
- POST /api/v1/public/:tenantSlug/quotes triggers QuotePublicCreated domain event
- POST /api/v1/public/:tenantSlug/quotes requires authenticated client JWT
- Client role cannot access admin endpoints (tested with 3+ endpoints)
- Audit log entry created for public quote creation with origin, ip, user_agent

**Tests (frontend):**
- /t/:tenantSlug/orcamento/cadastro redirects to /orcamento when no draft in sessionStorage
- Quote summary card displays draft data correctly
- "Criar conta" form validates password strength
- "Criar conta" submit creates account and submits quote
- Social login buttons initiate OAuth flow
- Success modal appears after quote creation
- sessionStorage draft cleared after successful submission
- Tab switching between "Criar conta" and "Já tenho conta" preserves email field
- Page renders correctly at 375px viewport width

**Implementation files:**

Backend:
- `packages/backend/src/database/migrations/1714000000027-AlterUsersAddSocialAuth.ts` (new)
- `packages/backend/src/database/migrations/1714000000028-AlterQuotesAddPublicOrigin.ts` (new)
- `packages/backend/src/modules/users/domain/user.entity.ts` (modify)
- `packages/backend/src/modules/quotes/domain/quote.entity.ts` (modify)
- `packages/backend/src/modules/auth/strategies/google.strategy.ts` (new)
- `packages/backend/src/modules/auth/strategies/facebook.strategy.ts` (new)
- `packages/backend/src/modules/auth/interfaces/public-auth.controller.ts` (new)
- `packages/backend/src/modules/auth/application/public-auth.service.ts` (new)
- `packages/backend/src/modules/public-quotes/interfaces/public-quote-submission.controller.ts` (new)
- `packages/backend/src/modules/public-quotes/application/public-quote-submission.service.ts` (new)
- `packages/backend/src/modules/auth/auth.module.ts` (modify)
- `packages/backend/src/modules/public-quotes/public-quotes.module.ts` (modify)

Frontend:
- `packages/frontend/src/pages/public/PublicQuoteRegisterPage.tsx` (new)
- `packages/frontend/src/components/public/SocialLoginButtons.tsx` (new)
- `packages/frontend/src/components/public/PasswordStrengthIndicator.tsx` (new)
- `packages/frontend/src/api/publicAuth.ts` (new)
- `packages/frontend/src/App.tsx` (modify — add route)

**Definition of Done:**
- All migrations executed without errors
- All backend tests pass
- All frontend tests pass
- Email/password registration works end-to-end
- Google OAuth works end-to-end (test mode with mock OAuth provider)
- Facebook OAuth works end-to-end (test mode with mock OAuth provider)
- Quote created with origin='public' and approval_required=true
- Client cannot access admin endpoints
- Renders correctly on mobile (375px), tablet (768px), desktop (1280px)

---

### TASK 21 — Public Scheduling Flow with Availability Sync

**Frontmatter:**
- status: pending
- type: feature
- complexity: high
- dependencies: [task_20]

**Overview:**
Implements the public scheduling flow at `/t/:tenantSlug/orcamento/agendar`. After the quote is approved by the tenant/staff, the client can select a date and time slot for the service execution. The scheduling honors the tenant's general availability and locks any time slot already booked by another visitor or internal staff — visibility synchronized across the public page and the internal Kanban/calendar in real time. The first booking from a client triggers an approval modal explaining that confirmation depends on the tenant.

**Requirements:**

Backend:
- MUST create migration `1714000000029-AlterBookingsAddPublicOrigin`:
  - `origin: varchar(20) NOT NULL DEFAULT 'internal'` (values: `'internal'`, `'public'`)
  - `approval_required: boolean NOT NULL DEFAULT false`
- MUST update Booking entity with new fields
- MUST create public endpoint `GET /api/v1/public/:tenantSlug/availability` marked with `@Public()`:
  - Accepts query params: `from: ISO date`, `to: ISO date` (max 60 days range)
  - Returns array of available slots: `[{ date: 'YYYY-MM-DD', slots: [{ start: 'HH:mm', end: 'HH:mm', available: boolean }] }]`
  - Slot granularity: 1 hour by default (configurable via tenant settings, default 60 min)
  - MUST exclude slots that have existing bookings with status IN ('confirmed', 'rescheduled', 'pending_approval')
  - MUST exclude slots outside tenant's operating hours (from existing tenant `operating_hours` field — if not configured, fallback to 08:00–18:00 Monday–Friday)
  - Rate-limited 60 req/min per IP
- MUST create new endpoint `POST /api/v1/public/:tenantSlug/bookings` — REQUIRES client-role JWT:
  - Accepts payload `{ quote_id, scheduled_start: ISO, scheduled_end: ISO, service_address?, observations? }`
  - Validates that quote_id belongs to authenticated client AND is approved (status IN ('sent', 'accepted'))
  - Validates that scheduled_start/end is in a free slot (re-checks availability atomically before insert)
  - Creates Booking with `origin='public'`, `approval_required=true`, `status='pending_approval'`
  - Triggers domain event `BookingPublicCreated` for notification dispatch (admin/staff notified for approval)
  - Returns Booking object
  - MUST use database transaction with row-level lock on overlapping bookings to prevent race conditions (two clients picking same slot)
- MUST add new booking status: `'pending_approval'` to existing enum
- MUST update VALID_TRANSITIONS in booking service:
  - `pending_approval` → `confirmed` (admin/staff approval)
  - `pending_approval` → `cancelled` (admin/staff rejection or client cancellation)
- MUST update existing GET /bookings endpoint (admin/staff) to include `origin` and `approval_required` fields
- MUST create `GET /api/v1/public/:tenantSlug/bookings/my` — REQUIRES client-role JWT:
  - Returns bookings for the authenticated client only
  - Includes status, scheduled times, service name
  - Used by client to view their own bookings

Frontend:
- MUST create new public route `/t/:tenantSlug/orcamento/agendar?quoteId={id}` accessible only to authenticated clients
- If user is not authenticated OR quoteId is missing → redirect to `/t/:tenantSlug`
- The page MUST display:
  - Header summary: quote info (service, total) — read-only
  - Calendar component (month view, mobile-first):
    - Available dates clickable
    - Past dates and dates outside operating hours disabled
    - Selected date highlighted in primary color
  - When date is selected, display time slots grid:
    - Available slots in primary color
    - Unavailable slots greyed out and disabled (with tooltip "Horário indisponível")
    - Time slots load via `GET /api/v1/public/:tenantSlug/availability?from=X&to=X`
    - Reload availability when date changes
  - Section "Local do serviço" (prefilled from quote, editable):
    - Checkbox "Executar no endereço cadastrado" (default checked, prefills from client address)
    - When unchecked, free-text address field appears
  - Section "Observações para a equipe" (textarea, optional)
- "Confirmar agendamento" CTA at bottom:
  - On first booking from this client (check client.bookings_count === 0): show modal:
    - Title: "Aguardando confirmação"
    - Body: "Seu primeiro agendamento será analisado pela empresa antes de ser confirmado. Você receberá a confirmação por e-mail em breve."
    - CTA: "Entendi, enviar agendamento"
  - On subsequent bookings: confirm directly without modal
  - Submits via POST /api/v1/public/:tenantSlug/bookings
  - On success, navigate to `/t/:tenantSlug/orcamento/confirmacao?bookingId={id}`
- MUST create confirmation page `/t/:tenantSlug/orcamento/confirmacao`:
  - Display success message
  - Show booking details (date, time, service, address)
  - Show status badge ("Aguardando confirmação")
  - Display info about next steps and contact for questions
  - CTA "Ver meus agendamentos" → client portal (placeholder for future task)
  - CTA "Voltar ao início" → `/t/:tenantSlug`
- Calendar component MUST:
  - Be touch-friendly on mobile (large tap targets)
  - Show only currently visible month with navigation arrows
  - Highlight today's date
  - Disable dates with no available slots automatically
- MUST follow ALL Phase 1 form patterns
- MUST be mobile-first responsive:
  - Calendar full-width on mobile, fixed-width on desktop
  - Time slots grid: 2 cols mobile, 4 cols desktop
  - Sticky bottom action bar on mobile with "Confirmar" CTA
  - Touch targets minimum 44x44px

Internal app integration (Kanban + Calendar):
- MUST update existing Kanban board (T13/T14) to show bookings with `status='pending_approval'` in a new column or badge
- Pending approval bookings MUST be visually distinct (different color, "Aguardando aprovação" label)
- MUST update existing booking detail page to show:
  - Origin field ("Público" or "Interno")
  - Approval required badge
  - "Aprovar" button for admin/staff (transitions to 'confirmed')
  - "Rejeitar" button for admin/staff (transitions to 'cancelled' with reason)
- Internal availability view MUST reflect public bookings:
  - Bookings created via public flow appear in internal Kanban/calendar immediately
  - Internal staff cannot double-book slots that are taken by public bookings (validation on Booking create)

Security:
- Availability endpoint MUST validate from/to range (max 60 days, no past dates beyond current day)
- Booking creation MUST be atomic with row-level lock to prevent double-booking race condition
- Client can only create booking for THEIR OWN quote (cross-quote injection check)
- Client can only view THEIR OWN bookings
- All operations rate-limited
- Audit log for every public booking creation, approval, and rejection

**Tests (backend):**
- GET /api/v1/public/:tenantSlug/availability returns correct slots for tenant operating hours
- GET /api/v1/public/:tenantSlug/availability excludes slots with existing confirmed/rescheduled/pending bookings
- GET /api/v1/public/:tenantSlug/availability rejects from/to range > 60 days
- GET /api/v1/public/:tenantSlug/availability respects tenant operating hours configuration
- POST /api/v1/public/:tenantSlug/bookings creates booking with origin='public', approval_required=true
- POST /api/v1/public/:tenantSlug/bookings rejects when quote belongs to different client
- POST /api/v1/public/:tenantSlug/bookings rejects when quote is not approved (status='draft' or 'rejected')
- POST /api/v1/public/:tenantSlug/bookings rejects when slot is already taken (race condition test with concurrent requests)
- POST /api/v1/public/:tenantSlug/bookings triggers BookingPublicCreated domain event
- VALID_TRANSITIONS allows pending_approval → confirmed and pending_approval → cancelled
- Admin/staff can approve booking via PUT /bookings/:id (status to confirmed)
- Internal Booking creation rejects slot already taken by public booking
- GET /api/v1/public/:tenantSlug/bookings/my returns only authenticated client's bookings
- Audit log entry created for every public booking event (create, approve, reject)

**Tests (frontend):**
- /t/:tenantSlug/orcamento/agendar redirects when not authenticated
- /t/:tenantSlug/orcamento/agendar redirects when quoteId missing
- Calendar loads availability for visible month
- Time slots display correctly for selected date
- Unavailable slots are disabled and show tooltip
- First-booking modal appears for client with bookings_count === 0
- First-booking modal does NOT appear for client with bookings_count > 0
- Submitting booking navigates to confirmation page
- Confirmation page displays correct booking details
- Page renders correctly at 375px viewport width
- Bottom action bar visible on mobile with Confirmar CTA
- Pending approval bookings appear in internal Kanban with distinct styling

**Implementation files:**

Backend:
- `packages/backend/src/database/migrations/1714000000029-AlterBookingsAddPublicOrigin.ts` (new)
- `packages/backend/src/modules/bookings/domain/booking.entity.ts` (modify)
- `packages/backend/src/modules/bookings/application/booking.service.ts` (modify — VALID_TRANSITIONS, atomic slot check)
- `packages/backend/src/modules/public-bookings/public-bookings.module.ts` (new)
- `packages/backend/src/modules/public-bookings/interfaces/public-booking.controller.ts` (new)
- `packages/backend/src/modules/public-bookings/application/availability.service.ts` (new)
- `packages/backend/src/modules/public-bookings/application/public-booking.service.ts` (new)

Frontend:
- `packages/frontend/src/pages/public/PublicSchedulingPage.tsx` (new)
- `packages/frontend/src/pages/public/PublicConfirmationPage.tsx` (new)
- `packages/frontend/src/components/public/AvailabilityCalendar.tsx` (new)
- `packages/frontend/src/components/public/TimeSlotGrid.tsx` (new)
- `packages/frontend/src/components/public/FirstBookingModal.tsx` (new)
- `packages/frontend/src/api/publicBooking.ts` (new)
- `packages/frontend/src/App.tsx` (modify — add routes)
- `packages/frontend/src/pages/kanban/KanbanPage.tsx` (modify — pending approval column/badge)
- `packages/frontend/src/pages/bookings/BookingDetailPage.tsx` (modify — origin badge, approve/reject buttons)

**Definition of Done:**
- All migrations executed without errors
- All backend tests pass including race condition test
- All frontend tests pass
- Availability syncs in real-time between public and internal views
- First-booking modal appears only on client's first booking
- Internal Kanban shows pending approval bookings distinctly
- Renders correctly on mobile (375px), tablet (768px), desktop (1280px)
- No double-booking possible (tested with concurrent requests)

---

## _tasks.md update instructions

Add the following rows to the task table, after the existing T18 row:

| 19 | Public Quote Flow Part A: Quote Request Form | pending | high | task_18 |
| 20 | Public Quote Flow Part B: Account Creation & Quote Submission | pending | high | task_19 |
| 21 | Public Scheduling Flow with Availability Sync | pending | high | task_20 |

---

## _techspec.md update instructions

EXTEND the existing "Phase 2 — Public Tenant Product" section by APPENDING the following subsections (do not duplicate or remove the Phase 2A content already present):

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

---

Do NOT execute any task. Do NOT write any application code. Only create the task files and update `_tasks.md` and `_techspec.md`.
