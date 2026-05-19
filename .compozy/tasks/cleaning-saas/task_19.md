---
status: completed
title: "Public Quote Flow Part A: Quote Request Form"
type: feature
complexity: high
dependencies: [task_18]
---

# Task 19: Public Quote Flow Part A: Quote Request Form

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

Implements the first half of the public quote flow at `/t/:tenantSlug/orcamento`. An anonymous visitor can fill out a quote request form (service selection, area or duration, location, observations, contact info) and receive an estimated price calculation. The data is held in browser state only — nothing is persisted to the database until the visitor completes account creation in T20. The page applies the tenant's white-label branding and is fully responsive mobile-first.

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

### Frontend

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

### Security

- Public quote estimate endpoint MUST validate cross-tenant injection: service_id and addon_ids must belong to the resolved tenantSlug
- No persistence on this step — DB is untouched
- sessionStorage data MUST NOT contain any sensitive info beyond what the user typed
- MUST sanitize all text inputs before submission (no HTML tags in observations, name, address)
- Rate limiting applied per IP

## Tests

### Backend
- POST /api/v1/public/:tenantSlug/quote-estimate returns correct calculation without auth
- POST /api/v1/public/:tenantSlug/quote-estimate rejects when service_id belongs to different tenant
- POST /api/v1/public/:tenantSlug/quote-estimate rejects when addon_id belongs to different tenant
- POST /api/v1/public/:tenantSlug/quote-estimate rejects when addon_id does not belong to selected service
- POST /api/v1/public/:tenantSlug/quote-estimate does NOT create database records
- POST /api/v1/public/:tenantSlug/quote-estimate is rate-limited (31st request within 1 minute returns 429)
- GET /api/v1/public/:tenantSlug/services/:serviceId/addons returns correct addons
- GET /api/v1/public/:tenantSlug/services/:serviceId/addons returns 404 for service from different tenant
- Both endpoints do NOT expose tenant_id, created_by, or any internal fields

### Frontend
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

## Implementation Files

### Backend
- `packages/backend/src/modules/public-quotes/public-quotes.module.ts` (new)
- `packages/backend/src/modules/public-quotes/interfaces/public-quote.controller.ts` (new)
- `packages/backend/src/modules/public-quotes/application/public-quote.service.ts` (new)
- `packages/backend/src/modules/public-quotes/validation/quote-estimate.dto.ts` (new)

### Frontend
- `packages/frontend/src/pages/public/PublicQuoteFormPage.tsx` (new)
- `packages/frontend/src/components/public/QuoteSummaryPanel.tsx` (new)
- `packages/frontend/src/components/public/ServiceSelector.tsx` (new)
- `packages/frontend/src/api/publicQuote.ts` (new)
- `packages/frontend/src/utils/publicQuoteDraft.ts` (new — sessionStorage helpers)
- `packages/frontend/src/App.tsx` (modify — add route)

## Definition of Done

- All migrations executed without errors (no new migrations expected in T19)
- All backend tests pass
- All frontend tests pass
- Form completes without any database write
- Draft persists in sessionStorage across page reloads
- Renders correctly on mobile (375px), tablet (768px), desktop (1280px)
- All public endpoints rate-limited and tenant-isolated
- No internal IDs exposed
