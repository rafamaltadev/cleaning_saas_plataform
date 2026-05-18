---
status: done
title: "Public Tenant Landing Page"
type: feature
complexity: high
dependencies: [task_17]
---

# Task 18: Public Tenant Landing Page

---
You are a senior software engineer executing a predefined task in an existing codebase.
Your objective is to implement the task EXACTLY as specified.
<context>
- The project follows a strict sequential task system
- All dependencies listed in the task are already implemented
- You MUST trust the task specification as the single source of truth
- Phase 1 lessons learned MUST be applied — see "Phase 1 Lessons" section in each task
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

Implements the public-facing landing page for each tenant at `/t/:tenantSlug`. This page is accessible without authentication and presents the tenant's company to potential clients. It applies the tenant's white-label branding (logo, primary color, favicon) and displays their services and contact information. The page is the entry point for the public quote flow that will be built in T19-T21.

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

- MUST create migration `1714000000026-AlterTenantsAddPublicProfile` adding the following columns to the `tenants` table:
  - `description: text nullable`
  - `phone: varchar(20) nullable`
  - `social_links: jsonb nullable` (object with optional keys: instagram, facebook, whatsapp, website)
  - `google_maps_embed_url: varchar nullable` (the full iframe src URL)
  - `public_address: varchar nullable` (separate from billing address for public display)
- MUST update the Tenant entity with the new fields
- MUST create public endpoint `GET /api/v1/public/:tenantSlug/profile` marked with `@Public()`:
  - Returns `{ tenant_slug, name, description, phone, social_links, google_maps_embed_url, public_address }`
  - Returns 404 if tenantSlug not found or tenant is soft-deleted
  - Rate-limited 60 req/min per IP
  - MUST NOT expose tenant_id, created_at, updated_at, or any internal fields
- MUST create public endpoint `GET /api/v1/public/:tenantSlug/services` marked with `@Public()`:
  - Returns array of active services: `{ id, name, description, base_rate_cents, unit, currency, category_name }`
  - Only services where deleted_at IS NULL
  - Rate-limited 60 req/min per IP
  - MUST NOT expose tenant_id, created_by, or any internal fields
  - The `id` is acceptable to expose (needed for quote flow in T19)
- MUST update `PUT /api/v1/tenants/me` to accept the new profile fields with appropriate validators:
  - description: `@IsOptional() @IsString() @MaxLength(2000)`
  - phone: `@IsOptional() @IsString() @MaxLength(20)`
  - social_links: `@IsOptional() @IsObject()` with nested validation for each key (must be URL or valid social handle)
  - google_maps_embed_url: `@IsOptional() @IsString() @MaxLength(500) @Matches(/^https:\/\/(www\.)?google\.com\/maps\/embed/, { message: 'Must be a Google Maps embed URL' })`
  - public_address: `@IsOptional() @IsString() @MaxLength(300)`

### Frontend

- MUST create new public route `/t/:tenantSlug` rendered without authentication
- The page MUST:
  - Load branding via GET /api/v1/public/:tenantSlug/branding
  - Load profile via GET /api/v1/public/:tenantSlug/profile
  - Load services via GET /api/v1/public/:tenantSlug/services
  - Apply primary_color as CSS custom property `--color-primary-override` scoped to this page only (not global)
  - Display favicon dynamically by injecting `<link rel="icon">` into head
  - Display tenant logo in header
  - Display company name (in primary color), description and tagline
  - Display services grid (responsive: 1 col mobile, 2 col tablet, 3 col desktop) — each card shows name, description, base rate, unit
  - Display contact section with phone, social links, and Google Maps iframe embed
  - Display CTA button "Solicitar Orçamento" → routes to `/t/:tenantSlug/orcamento` (link only — destination page implemented in T19)
- MUST handle errors gracefully:
  - If tenantSlug not found, show friendly 404 page "Esta empresa não foi encontrada"
  - If branding fails to load, fallback to default design system colors
- Authenticated users visiting `/t/:tenantSlug` MUST NOT be redirected to dashboard — the public page is accessible to everyone
- MUST update Settings screen (T13) "Perfil da Empresa" tab to include:
  - Field: Descrição (textarea, max 2000 chars)
  - Field: Telefone público
  - Field: Endereço público (separate from billing address)
  - Field: URL embed do Google Maps (with help text explaining how to get the embed URL)
  - Section: Redes sociais (one input per platform: Instagram, Facebook, WhatsApp, Website)
- MUST follow ALL Phase 1 form patterns when editing the profile
- MUST be mobile-first responsive:
  - Hero section: stacked vertically on mobile, side-by-side on desktop
  - Services grid: 1 col mobile, 2 col tablet (768px+), 3 col desktop (1024px+)
  - Contact section: stacked on mobile, two-column on desktop
  - Google Maps iframe responsive (aspect-ratio: 16/9, full width)
  - Touch targets minimum 44x44px
  - CTA button full-width on mobile, auto-width on desktop

### Security

- Public endpoints MUST be added to the public route allowlist
- Public endpoints MUST NOT require or validate JWT
- Public endpoints MUST enforce tenant isolation by tenantSlug — a request for tenantSlug X MUST NOT return any data from tenant Y under any circumstance
- Public endpoints MUST return ONLY the fields explicitly listed above — no field leakage

## Tests

### Backend
- GET /api/v1/public/:tenantSlug/services returns correct services without auth
- GET /api/v1/public/:tenantSlug/services returns 404 for unknown tenantSlug
- GET /api/v1/public/:tenantSlug/services returns 404 for soft-deleted tenant
- GET /api/v1/public/:tenantSlug/services does NOT include soft-deleted services
- GET /api/v1/public/:tenantSlug/services does NOT expose tenant_id, created_by
- GET /api/v1/public/:tenantSlug/profile returns correct profile without auth
- GET /api/v1/public/:tenantSlug/profile returns 404 for unknown tenantSlug
- Tenant A's services are NOT returned when querying tenant B's slug
- Both endpoints rate-limited (61st request within 1 min returns 429)
- PUT /api/v1/tenants/me rejects invalid Google Maps embed URL (e.g., https://malicious.com/embed)

### Frontend
- /t/:tenantSlug renders branding correctly (logo, primary color, favicon)
- Primary color CSS variable applied only to landing page, not other routes
- Services grid renders correct number of columns at each breakpoint
- 404 page shown for unknown tenantSlug
- Authenticated user can view /t/:tenantSlug without redirect
- "Solicitar Orçamento" CTA links to /t/:tenantSlug/orcamento
- All sections render correctly at 375px viewport width
- Google Maps iframe maintains 16:9 aspect ratio at all viewports

## Implementation Files

### Backend
- `packages/backend/src/database/migrations/1714000000026-AlterTenantsAddPublicProfile.ts` (new)
- `packages/backend/src/modules/tenants/domain/tenant.entity.ts` (modify)
- `packages/backend/src/modules/tenants/validation/update-tenant.dto.ts` (modify)
- `packages/backend/src/modules/tenants/interfaces/public-tenant.controller.ts` (new)
- `packages/backend/src/modules/tenants/application/public-tenant.service.ts` (new)

### Frontend
- `packages/frontend/src/pages/public/TenantLandingPage.tsx` (new)
- `packages/frontend/src/pages/public/PublicNotFoundPage.tsx` (new)
- `packages/frontend/src/components/public/ServiceCard.tsx` (new)
- `packages/frontend/src/components/public/ContactSection.tsx` (new)
- `packages/frontend/src/api/publicTenant.ts` (new)
- `packages/frontend/src/App.tsx` (modify — add public route)
- `packages/frontend/src/pages/settings/sections/CompanyProfileSection.tsx` (modify)

## Definition of Done

- Migrations executed without errors
- All backend tests pass
- All frontend tests pass
- Landing page accessible without authentication
- Branding applied correctly per tenant
- Page renders correctly on mobile (375px), tablet (768px) and desktop (1280px)
- All public endpoints rate-limited and tenant-isolated
- No internal IDs exposed in public responses
