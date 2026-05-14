---
status: pending
title: "Public Quote Flow Part B: Account Creation & Quote Submission"
type: feature
complexity: high
dependencies: [task_19]
---

# Task 20: Public Quote Flow Part B: Account Creation & Quote Submission

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

## Overview

Implements the second half of the public quote flow. The visitor who completed T19 lands on `/t/:tenantSlug/orcamento/cadastro` and creates an account (email/password OR social login via Google or Facebook). Upon successful registration, the system creates a Client record for the tenant and persists the Quote with status `pending` for tenant/staff approval. The visitor receives confirmation and is redirected to the scheduling step (T21).

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

MUST read and follow `.compozy/tasks/cleaning-saas/_design_system.md` before writing any frontend code.
All UI MUST conform strictly to the design system defined there — colors, typography, spacing, components, responsiveness, and screen patterns.

---

## Requirements

### Backend

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

### Frontend

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

### Security

- OAuth state parameter MUST include tenantSlug for validation on callback
- OAuth callbacks MUST validate state parameter to prevent CSRF
- Password validation MUST be enforced server-side
- Client role MUST be strictly limited — explicit allowlist for endpoints
- Token returned MUST be client-scoped (cannot be used for admin endpoints even with valid signature — role check at endpoint level)
- Public registration MUST be rate-limited 10 req/min per IP (prevent abuse)
- MUST log audit event for every public quote creation (origin, ip, user_agent)

## Tests

### Backend
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

### Frontend
- /t/:tenantSlug/orcamento/cadastro redirects to /orcamento when no draft in sessionStorage
- Quote summary card displays draft data correctly
- "Criar conta" form validates password strength
- "Criar conta" submit creates account and submits quote
- Social login buttons initiate OAuth flow
- Success modal appears after quote creation
- sessionStorage draft cleared after successful submission
- Tab switching between "Criar conta" and "Já tenho conta" preserves email field
- Page renders correctly at 375px viewport width

## Implementation Files

### Backend
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

### Frontend
- `packages/frontend/src/pages/public/PublicQuoteRegisterPage.tsx` (new)
- `packages/frontend/src/components/public/SocialLoginButtons.tsx` (new)
- `packages/frontend/src/components/public/PasswordStrengthIndicator.tsx` (new)
- `packages/frontend/src/api/publicAuth.ts` (new)
- `packages/frontend/src/App.tsx` (modify — add route)

## Definition of Done

- All migrations executed without errors
- All backend tests pass
- All frontend tests pass
- Email/password registration works end-to-end
- Google OAuth works end-to-end (test mode with mock OAuth provider)
- Facebook OAuth works end-to-end (test mode with mock OAuth provider)
- Quote created with origin='public' and approval_required=true
- Client cannot access admin endpoints
- Renders correctly on mobile (375px), tablet (768px), desktop (1280px)
