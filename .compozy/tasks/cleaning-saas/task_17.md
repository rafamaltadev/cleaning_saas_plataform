---
status: pending
title: "White-label: Tenant Branding Configuration"
type: feature
complexity: medium
dependencies: [task_16]
---

# Task 17: White-label: Tenant Branding Configuration

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

Implements the white-label branding system. Each tenant configures their visual identity (logo, primary color, company name, favicon, tenant slug) stored in the database and served via the tenant profile API. The frontend applies the tenant's branding dynamically when rendering public-facing pages. This task lays the foundation for the public tenant product (landing page, quote flow, scheduling) implemented in subsequent tasks.

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

### Frontend

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

## Tests

### Backend
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

### Frontend
- Identidade Visual tab renders all fields correctly
- Color picker and hex input stay synchronized
- Submitting the form calls PUT /api/v1/tenants/me with correct payload
- Color preview updates in real time as user changes primary color
- File upload validation rejects files larger than 2MB client-side
- File upload validation rejects non-image files client-side
- Tab works on mobile viewport (375px width)
- Error message appears at top of form when submit fails
- Submit button cannot be clicked twice in rapid succession

## Implementation Files

### Backend
- `packages/backend/src/database/migrations/1714000000025-AlterTenantsAddBranding.ts` (new)
- `packages/backend/src/modules/tenants/domain/tenant.entity.ts` (modify)
- `packages/backend/src/modules/tenants/validation/update-tenant.dto.ts` (modify)
- `packages/backend/src/modules/tenants/application/branding.service.ts` (new)
- `packages/backend/src/modules/tenants/interfaces/branding-public.controller.ts` (new)
- `packages/backend/src/common/storage/storage.adapter.ts` (new)
- `packages/backend/src/common/storage/local-storage.adapter.ts` (new)
- `packages/backend/src/common/storage/storage.module.ts` (new)
- `packages/backend/src/modules/tenants/tenants.module.ts` (modify)

### Frontend
- `packages/frontend/src/pages/settings/SettingsPage.tsx` (modify — add tab)
- `packages/frontend/src/pages/settings/sections/BrandingSection.tsx` (new)
- `packages/frontend/src/api/tenants.ts` (modify — add upload endpoints)

## Definition of Done

- All migrations executed without errors
- All backend tests pass
- All frontend tests pass
- Branding section renders correctly on mobile (375px) and desktop
- Existing tenants without tenant_slug have one auto-generated on migration
- Public branding endpoint accessible without auth, rate-limited
