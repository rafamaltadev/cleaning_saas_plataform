You are a senior software engineer and technical planner.

Your task is to CREATE TASK FILES ONLY for Phase 2A of the Cleaning SaaS project — do not execute any task, do not write application code, do not modify any source file outside of the Compozy task planning system.

Read the following files before starting:
- `.compozy/tasks/cleaning-saas/_techspec.md`
- `.compozy/tasks/cleaning-saas/_design_system.md`
- `.compozy/tasks/cleaning-saas/_tasks.md`
- `.compozy/tasks/cleaning-saas/task_16.md` (use as format reference)

---

## What you MUST deliver

1. Create 2 new task files in `.compozy/tasks/cleaning-saas/`:
   - `task_17.md` — White-label: Tenant Branding Configuration
   - `task_18.md` — Public Tenant Landing Page

2. Update `.compozy/tasks/cleaning-saas/_tasks.md` to include T17 and T18 with correct titles, status (pending), complexity, and dependencies.

3. Update `.compozy/tasks/cleaning-saas/_techspec.md` to add a new section titled "Phase 2 — Public Tenant Product" with the initial subsections for Branding and Public Routes (this will be expanded in later prompts).

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

---

## Phase 1 Lessons Learned (MANDATORY — include in every task file as a "## Phase 1 Patterns" section)

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

### TASK 17 — White-label: Tenant Branding Configuration

**Frontmatter:**
- status: pending
- type: feature
- complexity: medium
- dependencies: [task_16]

**Overview:**
Implements the white-label branding system. Each tenant configures their visual identity (logo, primary color, company name, favicon, tenant slug) stored in the database and served via the tenant profile API. The frontend applies the tenant's branding dynamically when rendering public-facing pages. This task lays the foundation for the public tenant product (landing page, quote flow, scheduling) implemented in subsequent tasks.

**Requirements:**

Backend:
- MUST create migration `1714000000025-AlterTenantsAddBranding` adding the following columns to the `tenants` table:
  - `tenant_slug: varchar(60) UNIQUE NOT NULL` (URL-safe, auto-generated from name on creation if not provided — slugify name, fall back to `tenant-{uuid8}` if conflict)
  - `logo_url: varchar nullable`
  - `primary_color: varchar(7) nullable` (hex format `#RRGGBB`, validated)
  - `favicon_url: varchar nullable`
- MUST add unique index on `tenant_slug`
- MUST update the Tenant entity with the new fields
- MUST update `PUT /api/v1/tenants/me` to accept and validate the new fields. The validation DTO MUST:
  - Use `@Matches(/^#[0-9a-fA-F]{6}$/, { message: 'primary_color must be a 6-digit hex color' })` for primary_color
  - Use `@IsOptional() @IsString() @MaxLength(60) @Matches(/^[a-z0-9-]+$/, { message: 'tenant_slug must contain only lowercase letters, numbers and hyphens' })` for tenant_slug
  - Use `@IsOptional() @IsString()` for logo_url and favicon_url
- MUST create a new public endpoint `GET /api/v1/public/:tenantSlug/branding` marked with `@Public()`:
  - No JWT required
  - Returns `{ tenant_slug, name, logo_url, primary_color, favicon_url }`
  - Returns 404 if tenantSlug not found or tenant is soft-deleted
  - MUST be rate-limited to 60 requests/minute per IP
- MUST create a `BrandingService` that:
  - Resolves branding by tenantSlug
  - Caches result in-memory for 60 seconds (use simple Map with TTL — do NOT introduce Redis at this stage)
  - Exposes `getBrandingBySlug(slug: string): Promise<BrandingDto | null>`
- MUST create a `StorageAdapter` interface in `src/common/storage/storage.adapter.ts`:
  ```ts
  export interface StorageAdapter {
    save(file: Buffer, filename: string, mimetype: string): Promise<string>; // returns public URL
    delete(url: string): Promise<void>;
  }
  ```
- MUST implement `LocalStorageAdapter` that saves files to `uploads/` directory at project root, returns relative URL `/uploads/{filename}`
- MUST register StorageAdapter as injectable provider, bound to `LocalStorageAdapter` by default — configurable via `STORAGE_ADAPTER` env var (`local` is the only supported value in Phase 2)
- MUST add file upload endpoints:
  - `POST /api/v1/tenants/me/logo` accepts multipart/form-data with `file` field, validates MIME type (image/png, image/jpeg only), validates size (max 2MB), saves via StorageAdapter, updates tenant.logo_url, returns `{ logo_url }`
  - `POST /api/v1/tenants/me/favicon` same as logo but for favicon
  - Both endpoints require admin role
- MUST add rate limiting to public branding endpoint via existing ThrottlerGuard configuration (60 requests/minute per IP)

Frontend:
- MUST update Settings screen (existing SettingsPage.tsx) to include a new tab "Identidade Visual" between the existing tabs
- The tab MUST contain:
  - Section "Identidade da empresa":
    - Field: Tenant slug (read-only display, with copy-to-clipboard button)
    - Field: Logo (file input, image preview, upload button)
    - Field: Favicon (file input, image preview, upload button)
    - Field: Cor primária (color picker + hex input synchronized)
  - Section "Pré-visualização":
    - Card showing how the branding will appear on the public page
    - Logo display, company name in primary color, sample button styled with primary color
- File uploads MUST:
  - Show local preview before upload
  - Display upload progress
  - Show success or error message clearly
  - Validate MIME and size client-side before sending (mirror backend rules)
- MUST follow ALL Phase 1 form patterns:
  - Error message at top of form
  - Submit button type="button" with onClick
  - isSubmittingRef for double-submit prevention
  - Dual-path error extraction
- MUST be mobile-first responsive:
  - Single column at mobile width
  - Preview card moves below form on mobile
  - File input buttons full-width on mobile
  - Touch targets minimum 44x44px

**Tests (backend):**
- PUT /api/v1/tenants/me accepts valid logo_url, primary_color and favicon_url
- PUT /api/v1/tenants/me rejects invalid hex color format
- PUT /api/v1/tenants/me rejects invalid tenant_slug format (uppercase, spaces, special chars)
- PUT /api/v1/tenants/me rejects duplicate tenant_slug
- GET /api/v1/public/:tenantSlug/branding returns correct branding for existing tenant
- GET /api/v1/public/:tenantSlug/branding returns 404 for unknown tenantSlug
- GET /api/v1/public/:tenantSlug/branding works without authentication
- GET /api/v1/public/:tenantSlug/branding does NOT expose tenant_id, created_by, or any internal fields
- BrandingService returns cached result on second call within 60 seconds
- POST /api/v1/tenants/me/logo accepts image/png file up to 2MB
- POST /api/v1/tenants/me/logo rejects file larger than 2MB
- POST /api/v1/tenants/me/logo rejects non-image MIME types
- StorageAdapter interface is injectable and replaceable
- Public branding endpoint is rate-limited (61st request within 1 minute returns 429)

**Tests (frontend):**
- Identidade Visual tab renders all fields correctly
- Color picker and hex input stay synchronized
- Submitting the form calls PUT /api/v1/tenants/me with correct payload
- Color preview updates in real time as user changes primary color
- File upload validation rejects files larger than 2MB client-side
- File upload validation rejects non-image files client-side
- Tab works on mobile viewport (375px width)
- Error message appears at top of form when submit fails
- Submit button cannot be clicked twice in rapid succession

**Implementation files:**

Backend:
- `packages/backend/src/database/migrations/1714000000025-AlterTenantsAddBranding.ts` (new)
- `packages/backend/src/modules/tenants/domain/tenant.entity.ts` (modify)
- `packages/backend/src/modules/tenants/validation/update-tenant.dto.ts` (modify)
- `packages/backend/src/modules/tenants/application/branding.service.ts` (new)
- `packages/backend/src/modules/tenants/interfaces/branding-public.controller.ts` (new)
- `packages/backend/src/common/storage/storage.adapter.ts` (new)
- `packages/backend/src/common/storage/local-storage.adapter.ts` (new)
- `packages/backend/src/common/storage/storage.module.ts` (new)
- `packages/backend/src/modules/tenants/tenants.module.ts` (modify)

Frontend:
- `packages/frontend/src/pages/settings/SettingsPage.tsx` (modify — add tab)
- `packages/frontend/src/pages/settings/sections/BrandingSection.tsx` (new)
- `packages/frontend/src/api/tenants.ts` (modify — add upload endpoints)

**Definition of Done:**
- All migrations executed without errors
- All backend tests pass
- All frontend tests pass
- Branding section renders correctly on mobile (375px) and desktop
- Existing tenants without tenant_slug have one auto-generated on migration
- Public branding endpoint accessible without auth, rate-limited

---

### TASK 18 — Public Tenant Landing Page

**Frontmatter:**
- status: pending
- type: feature
- complexity: high
- dependencies: [task_17]

**Overview:**
Implements the public-facing landing page for each tenant at `/t/:tenantSlug`. This page is accessible without authentication and presents the tenant's company to potential clients. It applies the tenant's white-label branding (logo, primary color, favicon) and displays their services and contact information. The page is the entry point for the public quote flow that will be built in T19-T21.

**Requirements:**

Backend:
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

Frontend:
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

Security:
- Public endpoints MUST be added to the public route allowlist
- Public endpoints MUST NOT require or validate JWT
- Public endpoints MUST enforce tenant isolation by tenantSlug — a request for tenantSlug X MUST NOT return any data from tenant Y under any circumstance
- Public endpoints MUST return ONLY the fields explicitly listed above — no field leakage

**Tests (backend):**
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

**Tests (frontend):**
- /t/:tenantSlug renders branding correctly (logo, primary color, favicon)
- Primary color CSS variable applied only to landing page, not other routes
- Services grid renders correct number of columns at each breakpoint
- 404 page shown for unknown tenantSlug
- Authenticated user can view /t/:tenantSlug without redirect
- "Solicitar Orçamento" CTA links to /t/:tenantSlug/orcamento
- All sections render correctly at 375px viewport width
- Google Maps iframe maintains 16:9 aspect ratio at all viewports

**Implementation files:**

Backend:
- `packages/backend/src/database/migrations/1714000000026-AlterTenantsAddPublicProfile.ts` (new)
- `packages/backend/src/modules/tenants/domain/tenant.entity.ts` (modify)
- `packages/backend/src/modules/tenants/validation/update-tenant.dto.ts` (modify)
- `packages/backend/src/modules/tenants/interfaces/public-tenant.controller.ts` (new)
- `packages/backend/src/modules/tenants/application/public-tenant.service.ts` (new)

Frontend:
- `packages/frontend/src/pages/public/TenantLandingPage.tsx` (new)
- `packages/frontend/src/pages/public/PublicNotFoundPage.tsx` (new)
- `packages/frontend/src/components/public/ServiceCard.tsx` (new)
- `packages/frontend/src/components/public/ContactSection.tsx` (new)
- `packages/frontend/src/api/publicTenant.ts` (new)
- `packages/frontend/src/App.tsx` (modify — add public route)
- `packages/frontend/src/pages/settings/sections/CompanyProfileSection.tsx` (modify)

**Definition of Done:**
- Migrations executed without errors
- All backend tests pass
- All frontend tests pass
- Landing page accessible without authentication
- Branding applied correctly per tenant
- Page renders correctly on mobile (375px), tablet (768px) and desktop (1280px)
- All public endpoints rate-limited and tenant-isolated
- No internal IDs exposed in public responses

---

## _tasks.md update instructions

Add the following rows to the task table, after the existing T16 row:

| 17 | White-label: Tenant Branding Configuration | pending | medium | task_16 |
| 18 | Public Tenant Landing Page | pending | high | task_17 |

---

## _techspec.md update instructions

Add a new section at the end of the file titled "Phase 2 — Public Tenant Product" with the following INITIAL content (later prompts will expand this section):

### Phase 2 — Public Tenant Product

#### New Modules (Phase 2A)
- `PublicModule` — unauthenticated public endpoints for tenant landing. All endpoints prefixed `/api/v1/public/:tenantSlug/`. Tenant isolation enforced by tenantSlug resolution, never by JWT.
- `BrandingModule` — resolves and caches tenant branding by tenantSlug. 60-second in-memory cache (no Redis).
- `StorageModule` — file storage abstraction. `StorageAdapter` interface with `LocalStorageAdapter` implementation. Configurable via `STORAGE_ADAPTER` env var.

#### New Public Routes (Frontend)
- `/t/:tenantSlug` — public tenant landing page

#### New Environment Variables (add to .env.example)
- `STORAGE_ADAPTER` (local — only supported value in Phase 2)
- `UPLOAD_DIR` (local storage path, default: uploads/)

#### Phase 1 Patterns (MANDATORY for all Phase 2 tasks)
All Phase 2 implementations MUST follow the patterns documented in each task file under "Phase 1 Patterns". These patterns address bugs encountered during Phase 1:
- UUID validation via `@Matches(UUID_REGEX, UUID_MSG)`, NEVER `@IsUUID()`
- DTO fields fully assigned in service create/update — no silent drops
- Frontend form double-submit prevention via `isSubmittingRef`
- SearchableSelect with paired `useRef` + `useState`
- Error message at top of form
- Mobile-first responsive design at 375px minimum width

#### Critical Rules (Phase 2 additions)
- ALL public endpoints MUST enforce tenant isolation by tenantSlug resolution
- Public endpoints MUST NOT expose internal IDs (tenant_id, user_id, created_by, etc.)
- File uploads MUST validate MIME type and size (image/png, image/jpeg; max 2MB) before processing
- Public endpoints MUST be rate-limited (60 req/min per IP minimum)
- The frontend `--color-primary-override` CSS variable MUST scope only to the public landing page, NEVER globally

---

Do NOT execute any task. Do NOT write any application code. Only create the task files and update `_tasks.md` and `_techspec.md`.
