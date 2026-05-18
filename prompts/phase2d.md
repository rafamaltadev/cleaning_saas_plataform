You are a senior software engineer and technical planner.

Your task is to CREATE TASK FILES ONLY for Phase 2D of the Cleaning SaaS project — do not execute any task, do not write application code, do not modify any source file outside of the Compozy task planning system.

Read the following files before starting:
- `.compozy/tasks/cleaning-saas/_techspec.md`
- `.compozy/tasks/cleaning-saas/_design_system.md`
- `.compozy/tasks/cleaning-saas/_tasks.md`
- `.compozy/tasks/cleaning-saas/task_22.md` (Phase 2C reference)
- `.compozy/tasks/cleaning-saas/task_23.md` (Phase 2C reference)

---

## What you MUST deliver

1. Create 4 new task files in `.compozy/tasks/cleaning-saas/`:
   - `task_25.md` — Staff Granular Permissions (module-level with action-ready schema)
   - `task_26.md` — Internationalization (i18n) with Auto-Detection (pt-BR / EN / ES)
   - `task_27.md` — Password Recovery Flow
   - `task_28.md` — Email Verification Flow (Required Before Configuration)

2. Update `.compozy/tasks/cleaning-saas/_tasks.md` to include T25, T26, T27 and T28 with correct titles, status (pending), complexity, and dependencies.

3. Update `.compozy/tasks/cleaning-saas/_techspec.md` to extend the "Phase 2 — Public Tenant Product" section with new modules and architectural decisions introduced by this phase.

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
- All input validation MUST use class-validator decorators on DTOs.
- Rate limiting MUST be applied to public endpoints (60 req/min per IP).
- Tokens with expiration MUST be single-use and invalidated after use.

---

## Design system reference (include in every frontend task)

MUST read and follow `.compozy/tasks/cleaning-saas/_design_system.md` before writing any frontend code.

---

## Tasks to create

---

### TASK 25 — Staff Granular Permissions (module-level with action-ready schema)

**Frontmatter:**
- status: pending
- type: feature
- complexity: medium
- dependencies: [task_24]

**Overview:**
Implements a granular permission system for staff users. Phase 2 grants permissions at module level only (read / write), but the database schema and guard infrastructure are designed to support per-action permissions in future phases without requiring refactoring. The tenant admin can create staff users and assign module-level access (read or write) for each functional area: clients, services, quotes, bookings, payments, reports, settings.

**Requirements:**

Backend — Database:
- MUST create migration `1714000000039-CreatePermissions`:
  - Table: `permissions`
  - Fields: `id uuid PK`, `module varchar` (e.g. 'clients', 'services', 'quotes', 'bookings', 'payments', 'reports', 'settings'), `action varchar` (Phase 2 values: 'read', 'write'; reserved future values: 'create', 'update', 'delete'), `description varchar`, `created_at`
  - Composite UNIQUE index on `(module, action)`
  - Seed with the following rows for Phase 2:
    - clients:read, clients:write
    - services:read, services:write
    - quotes:read, quotes:write
    - bookings:read, bookings:write
    - payments:read, payments:write
    - reports:read
    - settings:read, settings:write
- MUST create migration `1714000000040-CreateRoles`:
  - Table: `roles`
  - Fields: `id uuid PK`, `tenant_id uuid FK nullable` (null = system role, otherwise tenant-scoped custom role), `name varchar`, `description varchar nullable`, `is_system boolean DEFAULT false`, `created_at`, `updated_at`, `deleted_at nullable`
  - Composite UNIQUE index on `(tenant_id, name)` where deleted_at IS NULL
  - Seed system roles:
    - `'platform_admin'` (system role, tenant_id=null, is_system=true) — platform owner, all permissions
    - `'admin'` (system role, tenant_id=null, is_system=true) — tenant admin, all module:write
    - `'staff'` (system role, tenant_id=null, is_system=true) — generic staff, default has no permissions (must be granted per user)
    - `'client'` (system role, tenant_id=null, is_system=true) — public end client, no module access
- MUST create migration `1714000000041-CreateRolePermissions`:
  - Table: `role_permissions`
  - Fields: `id uuid PK`, `role_id uuid FK`, `permission_id uuid FK`, `created_at`
  - UNIQUE on `(role_id, permission_id)`
  - Seed default role-permission mappings:
    - platform_admin: ALL permissions
    - admin: ALL permissions (module:read AND module:write for every module)
    - staff: NONE (empty by default)
    - client: NONE
- MUST create migration `1714000000042-AlterUsersAddRolePermissions`:
  - Replace existing `role varchar` column on users with `role_id uuid FK references roles(id)`
  - Migration MUST preserve existing data — for each existing user, look up the role by name and set role_id accordingly
  - Drop the old `role` varchar column AFTER successful migration
- MUST create migration `1714000000043-CreateUserPermissionOverrides`:
  - Table: `user_permission_overrides`
  - Fields: `id uuid PK`, `user_id uuid FK`, `permission_id uuid FK`, `granted boolean` (true = explicit grant, false = explicit revoke), `created_at`, `updated_at`
  - UNIQUE on `(user_id, permission_id)`
  - Used to grant individual permissions to staff users without creating custom roles

Backend — Entities & DTOs:
- MUST create entities: `Permission`, `Role`, `RolePermission`, `UserPermissionOverride`
- MUST update `User` entity: replace `role: string` with `role_id: string` and `role: Role` relation
- MUST create DTOs:
  - `AssignPermissionsToUserDto` (`{ user_id, permissions: [{ module, action, granted }] }`)
  - `CreateStaffUserDto` (`{ name, email, password, permissions: [{ module, action }] }`)

Backend — Services:
- MUST create `PermissionService` in `src/modules/auth/permissions/permission.service.ts`:
  - `getUserPermissions(userId)` — returns effective permissions = role permissions + overrides
  - `userHas(userId, module, action)` — boolean check
  - `assignPermissionsToUser(userId, permissions)` — bulk set overrides
  - `getAllPermissions()` — returns all permissions for UI
- MUST create `RoleService`:
  - `findRoleByName(name, tenantId?)` — used during user creation
  - `assignRoleToUser(userId, roleName)` — internal use

Backend — Guard infrastructure:
- MUST create custom decorator `@RequirePermission(module: string, action: string)`:
  ```ts
  @RequirePermission('clients', 'read')
  @Get('/clients')
  findAll() { ... }
  ```
- MUST create `PermissionGuard` that:
  - Reads the @RequirePermission metadata
  - Loads user's effective permissions via PermissionService
  - Returns true if user has the required (module, action) pair OR has 'admin' role
  - Returns 403 with message `Permissão necessária: {module}:{action}` if denied
- MUST add PermissionGuard to APP_GUARD global registration AFTER JwtAuthGuard
- MUST migrate ALL existing controller endpoints to use @RequirePermission instead of @Roles where applicable:
  - clients endpoints: clients:read or clients:write
  - services endpoints: services:read or services:write
  - quotes endpoints: quotes:read or quotes:write
  - bookings endpoints: bookings:read or bookings:write
  - payments endpoints: payments:read or payments:write
  - reports endpoints: reports:read
  - settings endpoints (tenant config, branding, payments config): settings:read or settings:write
- Endpoints that MUST keep @Roles (not migrated): auth endpoints, public endpoints, platform_admin endpoints

Backend — Staff management endpoints:
- `GET /api/v1/users/staff` — lists staff users in tenant (requires settings:read)
- `POST /api/v1/users/staff` — creates staff user with initial permissions (requires settings:write)
- `PUT /api/v1/users/staff/:id` — updates staff user info (requires settings:write)
- `PUT /api/v1/users/staff/:id/permissions` — updates staff permissions (requires settings:write)
- `DELETE /api/v1/users/staff/:id` — soft-deletes staff user (requires settings:write)
- `GET /api/v1/permissions` — returns all available permissions for UI dropdowns (requires authenticated user)

Backend — Audit:
- MUST log permission changes to existing audit log infrastructure:
  - User created with initial permissions
  - Permissions changed
  - User deleted
- Audit entries MUST include: changed_by_user_id, target_user_id, before, after, timestamp

Frontend — Staff management:
- MUST create new "Equipe" tab in Settings:
  - List of staff users with role badge, permissions summary
  - "Adicionar membro" CTA
  - Edit and delete per row
- MUST create `StaffUserFormPage` for creating/editing staff:
  - Fields: name, email, password (only on create)
  - Permissions matrix:
    - Rows: modules (clients, services, quotes, bookings, payments, reports, settings)
    - Columns: Leitura / Edição (read / write)
    - Each cell is a checkbox
    - Admin tenant cannot have their own permissions edited (always full access)
  - Save button persists permissions via `PUT /api/v1/users/staff/:id/permissions`
- MUST update existing pages to show permission-denied states:
  - If user lacks read on a module, sidebar hides that menu item
  - If user lacks write on a module, edit/create/delete buttons are hidden (not just disabled — hidden to avoid confusion)
  - Server-side enforcement is the source of truth — frontend hiding is UX only

Frontend — Sidebar visibility:
- MUST update Sidebar component to dynamically show/hide menu items based on user permissions
- MUST update BottomNav (mobile) with same logic
- "Configurações" menu remains visible to all (basic profile always accessible)
- Sub-sections inside Settings hidden if user lacks read on the corresponding module

Security:
- Staff user creation MUST validate that the creating user has settings:write permission
- Admin role cannot be removed from the tenant's last admin user (prevent lockout)
- Permission checks MUST happen on backend — frontend hiding is UX only
- Audit log entries for every permission change

**Tests (backend):**
- Migration preserves existing role data when migrating users.role to users.role_id
- PermissionService.userHas returns true for admin role regardless of explicit permission
- PermissionService.userHas returns false for staff without explicit grant
- PermissionService.userHas respects overrides (explicit grant beats no role permission, explicit revoke beats role grant)
- PermissionGuard returns 403 with correct message when permission missing
- @RequirePermission decorator integrates correctly with controller endpoints
- POST /users/staff creates user with role='staff' and applies initial permissions
- PUT /users/staff/:id/permissions updates overrides correctly
- Cannot delete last admin user
- Audit log entry created for permission change
- Staff user can access modules they have permission for
- Staff user gets 403 on modules they don't have permission for

**Tests (frontend):**
- Equipe tab lists staff users correctly
- Permission matrix renders with current permissions checked
- Saving permissions calls PUT endpoint with correct payload
- Sidebar hides menu items based on permissions
- Edit/delete buttons hidden when user lacks write
- Admin user cannot edit their own permissions
- All pages render correctly at 375px viewport width

**Implementation files:**

Backend:
- `packages/backend/src/database/migrations/1714000000039-CreatePermissions.ts` (new)
- `packages/backend/src/database/migrations/1714000000040-CreateRoles.ts` (new)
- `packages/backend/src/database/migrations/1714000000041-CreateRolePermissions.ts` (new)
- `packages/backend/src/database/migrations/1714000000042-AlterUsersAddRolePermissions.ts` (new)
- `packages/backend/src/database/migrations/1714000000043-CreateUserPermissionOverrides.ts` (new)
- `packages/backend/src/modules/auth/permissions/permission.entity.ts` (new)
- `packages/backend/src/modules/auth/permissions/role.entity.ts` (new)
- `packages/backend/src/modules/auth/permissions/role-permission.entity.ts` (new)
- `packages/backend/src/modules/auth/permissions/user-permission-override.entity.ts` (new)
- `packages/backend/src/modules/auth/permissions/permission.service.ts` (new)
- `packages/backend/src/modules/auth/permissions/role.service.ts` (new)
- `packages/backend/src/modules/auth/permissions/permission.decorator.ts` (new)
- `packages/backend/src/modules/auth/permissions/permission.guard.ts` (new)
- `packages/backend/src/modules/auth/auth.module.ts` (modify)
- `packages/backend/src/modules/users/interfaces/staff.controller.ts` (new)
- `packages/backend/src/modules/users/application/staff.service.ts` (new)
- `packages/backend/src/modules/users/domain/user.entity.ts` (modify — role_id, relation)
- ALL existing controllers — replace @Roles with @RequirePermission where applicable

Frontend:
- `packages/frontend/src/pages/settings/sections/StaffSection.tsx` (new)
- `packages/frontend/src/pages/staff/StaffUserFormPage.tsx` (new)
- `packages/frontend/src/components/staff/PermissionMatrix.tsx` (new)
- `packages/frontend/src/api/staff.ts` (new)
- `packages/frontend/src/api/permissions.ts` (new)
- `packages/frontend/src/hooks/usePermissions.ts` (new — exposes user's effective permissions)
- `packages/frontend/src/components/layout/Sidebar.tsx` (modify — permission-based visibility)
- `packages/frontend/src/components/layout/BottomNav.tsx` (modify — permission-based visibility)
- `packages/frontend/src/App.tsx` (modify — add staff routes)

**Definition of Done:**
- All migrations executed without errors
- Existing user roles preserved during migration
- All backend tests pass
- All frontend tests pass
- All existing endpoints work with new permission system
- Cannot remove last admin user
- Sidebar hides menu items based on permissions
- Staff user can be created, edited, deleted via UI
- All pages render correctly on mobile (375px), tablet, desktop

---

### TASK 26 — Internationalization (i18n) with Auto-Detection (pt-BR / EN / ES)

**Frontmatter:**
- status: pending
- type: feature
- complexity: medium
- dependencies: [task_25]

**Overview:**
Implements full internationalization with three supported locales: pt-BR (default), EN (US English), and ES (Latin American Spanish). Language is auto-detected from the user's browser settings or tenant locale configuration — NO manual user override is provided in the UI. This ensures region-appropriate content (especially for Stripe info pages, payment methods, and legal text). All UI strings, backend error messages, and email templates are translated.

**Requirements:**

Backend — Internationalization setup:
- MUST install `nestjs-i18n` package on backend
- MUST configure I18nModule globally in `app.module.ts`:
  - Fallback language: pt-BR
  - Resolvers (in priority order):
    1. `AcceptLanguageResolver` — reads Accept-Language header
    2. `QueryResolver` (key: 'lang') — for API testing only
  - Loader: JSON files in `src/i18n/{lang}/`
- MUST create translation files for backend error messages:
  - `src/i18n/pt-BR/errors.json`
  - `src/i18n/en/errors.json`
  - `src/i18n/es/errors.json`
- MUST translate ALL existing backend error messages used in:
  - All controllers' exception messages
  - All service business rule violations
  - class-validator decorator messages (via custom validation pipe with i18n)
- Example structure:
  ```json
  {
    "auth": {
      "invalid_credentials": "Credenciais inválidas",
      "email_already_registered": "Este e-mail já está cadastrado"
    },
    "quotes": {
      "client_required": "Cliente é obrigatório",
      "service_required": "Serviço é obrigatório"
    }
  }
  ```
- MUST update existing exception classes to use I18nContext for message translation
- MUST update class-validator integration to translate constraint messages via i18n keys

Backend — Database:
- MUST create migration `1714000000044-AlterTenantsAddLocale`:
  - Adds to `tenants` table:
    - `locale varchar(5) NOT NULL DEFAULT 'pt-BR'` (values: 'pt-BR', 'en', 'es')
    - `country varchar(2) NOT NULL DEFAULT 'BR'` (values: 'BR', 'US')
    - `currency varchar(3) NOT NULL DEFAULT 'BRL'` (values: 'BRL', 'USD')
    - `timezone varchar NOT NULL DEFAULT 'America/Sao_Paulo'`
- MUST create migration `1714000000045-AlterUsersAddLocale`:
  - Adds to `users` table:
    - `locale varchar(5) nullable` (override tenant locale per user; null = inherit from tenant)
- MUST update existing email notification system to use user.locale (fallback to tenant.locale) when sending emails
- MUST translate ALL existing email templates into 3 languages:
  - Each existing template in `src/notifications/templates/` MUST have versions:
    - `template-name.pt-BR.hbs`
    - `template-name.en.hbs`
    - `template-name.es.hbs`
- MUST update EmailService to select template based on recipient locale

Frontend — Internationalization setup:
- MUST install `react-i18next` and `i18next` packages
- MUST install `i18next-browser-languagedetector` for auto-detection
- MUST configure i18next in `src/i18n/index.ts`:
  - Fallback: pt-BR
  - Supported languages: pt-BR, en, es
  - Detection order: 1) tenant locale from JWT or context, 2) navigator language
  - NO localStorage caching of language — auto-detection runs on every load (per requirement, no manual override)
  - NO language toggle UI component
- MUST create translation files in `src/i18n/locales/`:
  - `pt-BR/common.json`, `pt-BR/auth.json`, `pt-BR/quotes.json`, `pt-BR/bookings.json`, `pt-BR/clients.json`, `pt-BR/services.json`, `pt-BR/settings.json`, `pt-BR/billing.json`, `pt-BR/public.json`
  - Mirror structure for `en/` and `es/`
- MUST extract ALL existing hardcoded UI strings into translation files
- MUST wrap all UI text in `t()` calls or `<Trans>` components
- MUST use plural-aware translations where applicable (e.g. "1 cliente" vs "2 clientes")

Frontend — Locale detection logic:
- On app initialization:
  1. If authenticated: use user.locale (from JWT/profile)
  2. If not authenticated: use navigator.language
  3. Map browser locale to supported language:
     - `pt-*` → `pt-BR`
     - `en-*` → `en`
     - `es-*` → `es`
     - Other → `pt-BR` (fallback)
- MUST set `<html lang="">` attribute dynamically based on detected language
- MUST format dates, numbers, and currencies according to locale:
  - pt-BR: 14/05/2026, R$ 1.234,56
  - en: 05/14/2026, $1,234.56
  - es: 14/05/2026, $ 1.234,56
- MUST use `Intl.DateTimeFormat` and `Intl.NumberFormat` consistently

Frontend — Tenant locale configuration:
- MUST add locale, country, currency, timezone fields to existing Tenant configuration page (Settings → Empresa)
- Locale select: pt-BR, en, es
- Country select: BR, US
- Currency: auto-derived from country (BRL for BR, USD for US) — read-only
- Timezone: select from common timezones list, filtered by country
- When tenant updates locale, the change applies to all users in the tenant who don't have personal locale override

Email templates — Translation requirements:
- Each existing email template MUST be translated into pt-BR, EN, ES:
  - welcome.hbs
  - password-reset.hbs (from T27)
  - email-verification.hbs (from T28)
  - quote-created.hbs
  - quote-approved.hbs
  - booking-confirmed.hbs
  - booking-cancelled.hbs
  - payment-link-prepaid.hbs (from T24)
  - payment-link-postpaid.hbs (from T24)
  - payment-success.hbs (from T24)
  - payment-failed.hbs (from T24)
  - payment-refund.hbs (from T24)
  - subscription-price-change.hbs (from T22)
- Template selection logic: `template-name.{locale}.hbs` with fallback to pt-BR

Security:
- Auto-detection MUST NOT trust client-supplied locale headers blindly — server-side validates against supported list
- Translation keys MUST be referenced by code, never by user input (prevent injection)
- Email content MUST be sanitized regardless of locale

**Tests (backend):**
- Accept-Language: pt-BR returns Portuguese error messages
- Accept-Language: en-US returns English error messages
- Accept-Language: es-AR returns Spanish error messages
- Unsupported language (fr, de, etc.) falls back to pt-BR
- Email template selection respects user.locale, falls back to tenant.locale
- Email template selection falls back to pt-BR when locale not configured
- class-validator messages translated correctly via i18n pipe

**Tests (frontend):**
- App initializes in pt-BR for Brazilian browsers
- App initializes in en for US English browsers
- App initializes in es for Spanish browsers
- Unsupported browser language falls back to pt-BR
- Authenticated user's locale overrides browser detection
- <html lang="..."> attribute updated dynamically
- Date formatting respects locale (test pt-BR vs en formatting)
- Number formatting respects locale (test currency display)
- All major pages have no hardcoded strings (i18n coverage scan)
- Plural forms work correctly (e.g. "0 clientes", "1 cliente", "2 clientes")

**Implementation files:**

Backend:
- `packages/backend/src/database/migrations/1714000000044-AlterTenantsAddLocale.ts` (new)
- `packages/backend/src/database/migrations/1714000000045-AlterUsersAddLocale.ts` (new)
- `packages/backend/src/i18n/pt-BR/errors.json` (new)
- `packages/backend/src/i18n/en/errors.json` (new)
- `packages/backend/src/i18n/es/errors.json` (new)
- `packages/backend/src/common/i18n/i18n.module.ts` (new)
- `packages/backend/src/common/i18n/i18n-validation.pipe.ts` (new)
- `packages/backend/src/modules/tenants/domain/tenant.entity.ts` (modify)
- `packages/backend/src/modules/users/domain/user.entity.ts` (modify)
- `packages/backend/src/modules/notifications/email.service.ts` (modify — locale-aware template selection)
- `packages/backend/src/notifications/templates/**/*.{pt-BR,en,es}.hbs` (new — all email templates × 3 languages)
- ALL existing exception throws — replace hardcoded strings with i18n keys

Frontend:
- `packages/frontend/src/i18n/index.ts` (new — i18next config)
- `packages/frontend/src/i18n/locales/pt-BR/*.json` (new — 9 namespace files)
- `packages/frontend/src/i18n/locales/en/*.json` (new — 9 namespace files)
- `packages/frontend/src/i18n/locales/es/*.json` (new — 9 namespace files)
- `packages/frontend/src/utils/formatters.ts` (new — locale-aware date, number, currency formatters)
- `packages/frontend/src/pages/settings/sections/CompanyProfileSection.tsx` (modify — locale fields)
- `packages/frontend/src/main.tsx` (modify — import i18n config)
- ALL existing components with hardcoded strings — wrap in t()

**Definition of Done:**
- All migrations executed without errors
- All existing tenants default to pt-BR locale
- All backend tests pass
- All frontend tests pass
- All UI strings translated into 3 languages
- All email templates translated into 3 languages
- Auto-detection works correctly
- No language toggle UI present
- Date/number/currency formatting locale-aware
- All pages render correctly on mobile (375px), tablet, desktop in all 3 languages

---

### TASK 27 — Password Recovery Flow

**Frontmatter:**
- status: pending
- type: feature
- complexity: medium
- dependencies: [task_26]

**Overview:**
Implements a complete password recovery flow for tenant admins, staff users, and public clients. User requests password reset by email, receives a one-time token valid for 24 hours, sets a new password, and is auto-logged-in. Includes rate limiting (3 attempts per hour per email) to prevent abuse. All email templates respect user locale.

**Requirements:**

Backend — Database:
- MUST create migration `1714000000046-CreatePasswordResetTokens`:
  - Table: `password_reset_tokens`
  - Fields: `id uuid PK`, `user_id uuid FK`, `token_hash varchar(255) UNIQUE NOT NULL` (SHA-256 hash, never store plain token), `expires_at timestamp NOT NULL`, `used_at timestamp nullable`, `request_ip varchar nullable`, `request_user_agent varchar nullable`, `created_at`
  - Index on `user_id`, `expires_at`
- MUST create migration `1714000000047-CreatePasswordResetAttempts`:
  - Table: `password_reset_attempts`
  - Fields: `id uuid PK`, `email varchar`, `request_ip varchar`, `created_at`
  - Index on `(email, created_at)` for rate limit queries

Backend — Service:
- MUST create `PasswordResetService` in `src/modules/auth/password-reset/password-reset.service.ts`:
  - `requestReset({ email, ip, userAgent })`:
    - Checks rate limit: if 3+ attempts in last hour for this email, throw 429
    - Records attempt regardless of whether email exists (prevent enumeration)
    - If user exists: generates 256-bit random token, hashes with SHA-256, stores hash, sends email with plain token in URL
    - If user doesn't exist: silently succeeds (do NOT reveal email existence)
    - Returns `{ message: 'Se o e-mail estiver cadastrado, você receberá instruções.' }`
  - `validateToken(token)` — hashes input, looks up by hash, validates not expired and not used, returns user or null
  - `resetPassword({ token, newPassword })`:
    - Validates token
    - Validates password strength (min 8 chars, 1 letter, 1 number)
    - Updates user's password (bcrypt hash)
    - Marks token as used
    - Invalidates all other password reset tokens for this user
    - Invalidates all existing refresh tokens for this user (force re-login on all devices)
    - Returns new auth tokens for immediate login
  - `cleanupExpiredTokens()` — scheduled job to delete tokens older than 7 days

Backend — Endpoints:
- `POST /api/v1/auth/password/forgot` — public, rate-limited 10 req/min per IP:
  - Body: `{ email }`
  - Returns 200 with generic message regardless of email existence
  - Rate limit check: max 3 attempts per email per hour
- `POST /api/v1/auth/password/reset` — public:
  - Body: `{ token, new_password }`
  - Returns 200 with tokens on success, 400 on invalid/expired token
- `GET /api/v1/auth/password/validate-token?token=X` — public:
  - Returns 200 with `{ valid: boolean, expires_at }` for UI to show appropriate message
  - Used by frontend to validate token before showing reset form

Backend — Scheduled job:
- MUST create `PasswordResetCleanupJob` (uses existing scheduler):
  - Runs daily at 03:00
  - Deletes password_reset_tokens older than 7 days
  - Deletes password_reset_attempts older than 24 hours

Backend — Email:
- MUST create email template `password-reset` in 3 languages (pt-BR, EN, ES):
  - Subject: "Redefinir sua senha"
  - Body includes reset link with token: `{frontend_url}/reset-password?token={token}`
  - Body mentions expiration: "Este link expira em 24 horas"
  - Body includes IP/user agent that requested for security awareness
  - Body includes warning: "Se você não solicitou, ignore este e-mail"

Frontend — Pages:
- MUST create public route `/forgot-password`:
  - Field: email
  - Submit button "Enviar link de recuperação"
  - On success: shows confirmation message (generic, doesn't reveal email existence)
  - Link to "Voltar ao login"
  - MUST follow ALL Phase 1 form patterns
- MUST create public route `/reset-password?token=X`:
  - On mount, calls `GET /auth/password/validate-token` with token from URL
  - If invalid/expired: shows error with link to "Solicitar novo link"
  - If valid:
    - Fields: new_password, confirm_password
    - Password strength indicator
    - Submit button "Redefinir senha"
    - On success: auto-logs-in user and navigates to `/dashboard`
  - MUST follow ALL Phase 1 form patterns
- MUST add "Esqueci minha senha" link on existing LoginPage

Public client password reset:
- Public clients (created in T20) can also reset password
- Same `/forgot-password` and `/reset-password` routes work for all user types
- After reset, public clients are redirected to `/t/{tenantSlug}` (need to store tenantSlug in token metadata)

Security:
- Token MUST be cryptographically random (256-bit, generated via crypto.randomBytes)
- Token MUST be hashed with SHA-256 before storage (NEVER store plain token in DB)
- Token MUST be single-use (marked used_at on success)
- Resetting password MUST invalidate ALL refresh tokens for the user (force re-login everywhere)
- Rate limiting: 3 attempts per email per hour, 10 requests per IP per minute
- DO NOT reveal email existence (same response whether email exists or not)
- DO NOT log full tokens — only hashes
- Audit log entry on every successful reset

**Tests (backend):**
- POST /auth/password/forgot returns 200 for non-existent email (no enumeration)
- POST /auth/password/forgot returns 200 for existing email and sends email
- POST /auth/password/forgot returns 429 after 3 attempts in 1 hour for same email
- POST /auth/password/forgot rate-limited per IP (10 req/min)
- Token stored as SHA-256 hash, never plain
- POST /auth/password/reset accepts valid token and updates password
- POST /auth/password/reset rejects expired token (>24h)
- POST /auth/password/reset rejects used token
- POST /auth/password/reset rejects weak password
- Successful reset invalidates all refresh tokens for user
- Successful reset marks token as used
- Successful reset invalidates other pending tokens for user
- Cleanup job deletes tokens older than 7 days
- Audit log entry created for successful reset
- Email sent in user's locale (pt-BR, EN, or ES)

**Tests (frontend):**
- /forgot-password form validates email
- /forgot-password shows generic success message regardless of email existence
- /reset-password validates token on mount
- /reset-password shows error UI for invalid token
- /reset-password shows error UI for expired token
- /reset-password password strength indicator works
- /reset-password rejects passwords that don't match confirm field
- Successful reset auto-logs-in user
- "Esqueci minha senha" link visible on login page
- All pages render correctly at 375px viewport width

**Implementation files:**

Backend:
- `packages/backend/src/database/migrations/1714000000046-CreatePasswordResetTokens.ts` (new)
- `packages/backend/src/database/migrations/1714000000047-CreatePasswordResetAttempts.ts` (new)
- `packages/backend/src/modules/auth/password-reset/password-reset.entity.ts` (new)
- `packages/backend/src/modules/auth/password-reset/password-reset-attempt.entity.ts` (new)
- `packages/backend/src/modules/auth/password-reset/password-reset.service.ts` (new)
- `packages/backend/src/modules/auth/password-reset/password-reset.controller.ts` (new)
- `packages/backend/src/modules/auth/password-reset/password-reset-cleanup.job.ts` (new)
- `packages/backend/src/notifications/templates/password-reset.pt-BR.hbs` (new)
- `packages/backend/src/notifications/templates/password-reset.en.hbs` (new)
- `packages/backend/src/notifications/templates/password-reset.es.hbs` (new)
- `packages/backend/src/modules/auth/auth.module.ts` (modify)

Frontend:
- `packages/frontend/src/pages/auth/ForgotPasswordPage.tsx` (new)
- `packages/frontend/src/pages/auth/ResetPasswordPage.tsx` (new)
- `packages/frontend/src/api/passwordReset.ts` (new)
- `packages/frontend/src/pages/auth/LoginPage.tsx` (modify — add forgot password link)
- `packages/frontend/src/App.tsx` (modify — add routes)

**Definition of Done:**
- All migrations executed without errors
- All backend tests pass
- All frontend tests pass
- Email sent in 3 languages correctly
- Token never stored in plain form
- Rate limiting enforced (3/hour per email, 10/min per IP)
- Password reset invalidates all sessions
- All pages render correctly on mobile (375px), tablet, desktop

---

### TASK 28 — Email Verification Flow (Required Before Configuration)

**Frontmatter:**
- status: pending
- type: feature
- complexity: medium
- dependencies: [task_27]

**Overview:**
Implements email verification required for tenant admins and staff users. Tenant admins MUST verify their email before they can configure company settings (logo, payments, etc.). Staff users MUST verify before they can log in. The very first session after tenant registration is allowed without verification (initial onboarding), but configuration access is blocked until verification. Public clients DO NOT require email verification — their email comes from social login (already verified by provider) or is verified through booking confirmation flow.

**Requirements:**

Backend — Database:
- MUST create migration `1714000000048-CreateEmailVerificationTokens`:
  - Table: `email_verification_tokens`
  - Fields: `id uuid PK`, `user_id uuid FK`, `token_hash varchar(255) UNIQUE NOT NULL`, `email varchar NOT NULL` (email being verified — important if user changes email), `expires_at timestamp NOT NULL`, `verified_at timestamp nullable`, `created_at`
  - Index on `user_id`, `expires_at`
- MUST create migration `1714000000049-AlterUsersAddEmailVerification`:
  - Adds to `users` table:
    - `email_verified boolean NOT NULL DEFAULT false`
    - `email_verified_at timestamp nullable`
  - Existing seed users (admin@seed.local) MUST be set as `email_verified=true` automatically

Backend — Service:
- MUST create `EmailVerificationService`:
  - `sendVerification(userId)` — generates token, sends email, returns void
  - `verifyToken(token)` — validates and marks user as verified, returns user
  - `resendVerification(email)` — public endpoint, rate-limited; resends only if user exists AND not yet verified
  - `cleanupExpiredTokens()` — scheduled, deletes tokens older than 7 days

Backend — Endpoints:
- `POST /api/v1/auth/email/send-verification` — authenticated, sends verification email to current user
  - Rate-limited: 1 request per 5 minutes per user (prevent spam)
- `POST /api/v1/auth/email/verify` — public:
  - Body: `{ token }`
  - Returns 200 on success with updated user info
  - Returns 400 on invalid/expired token
- `POST /api/v1/auth/email/resend` — public, rate-limited 3 req/hour per email:
  - Body: `{ email }`
  - Returns 200 with generic message (no enumeration)

Backend — Behavior on registration:
- When admin user is created via tenant registration (existing flow):
  - User created with `email_verified=false`
  - Verification email sent automatically
  - First login session allowed (special token flag `requires_verification_to_configure`)
- When staff user is created (from T25):
  - User created with `email_verified=false`
  - Verification email sent automatically
  - Staff CANNOT log in until verified
- When public client registers (from T20):
  - Email/password registration: user created with `email_verified=false`, verification email sent, but client CAN log in immediately and proceed with quote flow
  - OAuth registration (Google/Facebook): user created with `email_verified=true` automatically (provider verified)
  - Public clients can use the app fully without verification — verification optional for them

Backend — Guard:
- MUST create `EmailVerifiedGuard`:
  - Applied to ALL settings/configuration endpoints (tenant config, branding, Stripe Connect, staff management)
  - Returns 403 with code `EMAIL_VERIFICATION_REQUIRED` if `user.email_verified=false` AND `user.role` is admin or staff
  - Returns 200 (allows) for public client role even if not verified
- MUST add guard to all tenant configuration controllers

Backend — Login flow update:
- Update login endpoint behavior:
  - Admin user: login succeeds even if not verified, but JWT includes flag `email_verification_required: true`
  - Staff user: login REJECTED with 403 code `EMAIL_VERIFICATION_REQUIRED` if not verified
  - Client user: login succeeds normally regardless of verification status

Backend — Email:
- MUST create email template `email-verification` in 3 languages (pt-BR, EN, ES):
  - Subject: "Verifique seu e-mail"
  - Body includes verification link: `{frontend_url}/verify-email?token={token}`
  - Expiration: 24 hours
  - Different content for admin/staff vs client

Frontend — Pages:
- MUST create public route `/verify-email?token=X`:
  - On mount, calls `POST /auth/email/verify` with token
  - On success:
    - If user not logged in: navigate to `/login` with success message
    - If user logged in: navigate to `/dashboard` with success message
  - On failure: shows error with "Solicitar novo e-mail de verificação" CTA → form to enter email and resend
- MUST create public route `/resend-verification`:
  - Field: email
  - Submit button "Reenviar e-mail de verificação"
  - On success: generic message (no enumeration)
- MUST update LoginPage to handle `EMAIL_VERIFICATION_REQUIRED` error code:
  - Show specific error message and "Reenviar e-mail" button

Frontend — Admin verification gate:
- MUST add `EmailVerificationBanner` component shown at top of all pages for admins with `email_verified=false`:
  - Visual: prominent yellow/warning banner
  - Text: "Verifique seu e-mail para configurar sua empresa"
  - CTA: "Reenviar e-mail de verificação"
  - Cannot be dismissed
- MUST block settings pages for unverified admins:
  - Routes blocked: /settings/* (except /settings/profile basic page)
  - When unverified admin tries to access blocked route, redirect to /dashboard with toast notification
- Dashboard remains accessible for unverified admins
- Other functional pages (clients, services, quotes, bookings) remain accessible for unverified admins to start using the app

Frontend — Staff blocked login:
- LoginPage MUST detect EMAIL_VERIFICATION_REQUIRED error
- Show specific message and resend CTA
- Do NOT allow staff to enter the app until verified

Security:
- Token MUST be cryptographically random and SHA-256 hashed before storage
- Token MUST be single-use
- Email verification status MUST be checked server-side on every protected endpoint
- Frontend banner is UX hint only — server is source of truth
- Audit log entry on email verification
- Resend rate limit: 3 per hour per email, 1 per 5 minutes per authenticated user

**Tests (backend):**
- User created via tenant registration has email_verified=false
- User created via OAuth (Google/Facebook) has email_verified=true
- Existing seed user (admin@seed.local) has email_verified=true
- Verification email sent on registration
- POST /auth/email/verify accepts valid token and marks verified
- POST /auth/email/verify rejects expired token
- POST /auth/email/verify rejects used token
- EmailVerifiedGuard blocks unverified admin from settings endpoints
- EmailVerifiedGuard allows unverified admin to access non-settings endpoints
- EmailVerifiedGuard allows unverified public client on any endpoint they can normally access
- Staff login rejected with EMAIL_VERIFICATION_REQUIRED when not verified
- Admin login succeeds with email_verification_required flag in JWT
- Resend endpoint rate-limited (3/hour per email)
- Email sent in user's locale

**Tests (frontend):**
- /verify-email with valid token shows success and navigates correctly
- /verify-email with invalid token shows error and resend option
- /resend-verification shows generic success message
- Admin sees EmailVerificationBanner when not verified
- Banner does not appear after verification
- Unverified admin redirected from /settings to /dashboard
- Staff blocked at login with verification message
- Public client can use app without verification banner
- All pages render correctly at 375px viewport width

**Implementation files:**

Backend:
- `packages/backend/src/database/migrations/1714000000048-CreateEmailVerificationTokens.ts` (new)
- `packages/backend/src/database/migrations/1714000000049-AlterUsersAddEmailVerification.ts` (new)
- `packages/backend/src/modules/auth/email-verification/email-verification-token.entity.ts` (new)
- `packages/backend/src/modules/auth/email-verification/email-verification.service.ts` (new)
- `packages/backend/src/modules/auth/email-verification/email-verification.controller.ts` (new)
- `packages/backend/src/modules/auth/email-verification/email-verification.guard.ts` (new)
- `packages/backend/src/modules/auth/email-verification/email-verification-cleanup.job.ts` (new)
- `packages/backend/src/modules/auth/application/auth.service.ts` (modify — login flow, registration flow)
- `packages/backend/src/modules/users/domain/user.entity.ts` (modify — email_verified fields)
- `packages/backend/src/notifications/templates/email-verification.{pt-BR,en,es}.hbs` (new)
- ALL settings/configuration controllers — add @UseGuards(EmailVerifiedGuard)

Frontend:
- `packages/frontend/src/pages/auth/VerifyEmailPage.tsx` (new)
- `packages/frontend/src/pages/auth/ResendVerificationPage.tsx` (new)
- `packages/frontend/src/components/auth/EmailVerificationBanner.tsx` (new)
- `packages/frontend/src/api/emailVerification.ts` (new)
- `packages/frontend/src/pages/auth/LoginPage.tsx` (modify — handle verification error)
- `packages/frontend/src/components/shared/ProtectedRoute.tsx` (modify — settings gate for unverified admin)
- `packages/frontend/src/App.tsx` (modify — add routes, banner integration)

**Definition of Done:**
- All migrations executed without errors
- Existing seed user marked as verified
- All backend tests pass
- All frontend tests pass
- Email sent in 3 languages
- Admin can use dashboard but not settings until verified
- Staff blocked from login until verified
- Public client unaffected by verification gate
- Banner not dismissible
- All pages render correctly on mobile (375px), tablet, desktop

---

## _tasks.md update instructions

Add the following rows to the task table, after the existing T24 row:

| 25 | Staff Granular Permissions (module-level with action-ready schema) | pending | medium | task_24 |
| 26 | Internationalization (i18n) with Auto-Detection (pt-BR / EN / ES) | pending | medium | task_25 |
| 27 | Password Recovery Flow | pending | medium | task_26 |
| 28 | Email Verification Flow (Required Before Configuration) | pending | medium | task_27 |

---

## _techspec.md update instructions

EXTEND the existing "Phase 2 — Public Tenant Product" section by APPENDING the following subsections (do not duplicate or remove existing content):

#### Granular Permissions System (Phase 2D)

The platform uses a permission system designed to support per-module access in Phase 2 with the schema ready for per-action granularity in future phases without refactoring.

**Schema:**
- `permissions` table: `(module, action)` — Phase 2 actions are `'read'` and `'write'`. Future actions (`'create'`, `'update'`, `'delete'`) can be added without schema changes.
- `roles` table: tenant-scoped or system roles
- `role_permissions` table: many-to-many between roles and permissions
- `user_permission_overrides` table: per-user grants/revokes beyond role defaults

**System Roles (seeded):**
- `platform_admin` — platform owner, all permissions
- `admin` — tenant admin, all module:read AND module:write
- `staff` — generic staff, no permissions by default (granted per user)
- `client` — public end client, no module permissions (different access path)

**Guard:**
- `@RequirePermission(module, action)` decorator replaces `@Roles()` on protected endpoints
- `PermissionGuard` evaluates effective permissions = role permissions + overrides
- Admin role bypasses permission checks (always allowed)

**Migration Note:** Existing `users.role: string` is migrated to `users.role_id: uuid` referencing the `roles` table. Existing role names ('admin', 'staff') are mapped to corresponding role_ids during migration.

#### Internationalization (Phase 2D)

The platform supports three languages: pt-BR (default), EN (US English), and ES (Latin American Spanish). Language is auto-detected from browser/locale settings with NO manual user override (intentional design decision to ensure region-appropriate content).

**Backend:**
- `nestjs-i18n` package, JSON-based translations in `src/i18n/{lang}/`
- `AcceptLanguageResolver` reads from request headers
- Fallback: pt-BR
- All exception messages, validation messages, and email templates translated

**Frontend:**
- `react-i18next` + `i18next-browser-languagedetector`
- NO localStorage caching, NO manual toggle UI
- Detection order: authenticated user.locale → navigator.language → fallback pt-BR
- `<html lang="">` updated dynamically
- All UI strings extracted to translation files in `src/i18n/locales/{lang}/{namespace}.json`

**Email Templates:**
- All templates have `{name}.pt-BR.hbs`, `{name}.en.hbs`, `{name}.es.hbs` versions
- Template selection: `user.locale ?? tenant.locale ?? 'pt-BR'`

**Locale-Aware Formatting:**
- Use `Intl.DateTimeFormat`, `Intl.NumberFormat` consistently
- pt-BR: 14/05/2026, R$ 1.234,56
- en: 05/14/2026, $1,234.56
- es: 14/05/2026, $ 1.234,56

#### Password Recovery (Phase 2D)

- Token-based, 24-hour expiration, single-use
- Token stored as SHA-256 hash (never plain)
- Rate limit: 3 attempts per email per hour, 10 requests per IP per minute
- Successful reset invalidates all refresh tokens for the user (force re-login on all devices)
- Cleanup job deletes expired tokens after 7 days
- Generic responses regardless of email existence (prevent enumeration)

#### Email Verification (Phase 2D)

- Required for admin and staff users to access configuration endpoints
- NOT required for public clients (OAuth users are auto-verified; email/password public clients can use app without verification)
- Token-based, 24-hour expiration, single-use
- Admin can log in without verification but settings/configuration endpoints are blocked
- Staff CANNOT log in without verification
- `EmailVerifiedGuard` enforces on all settings/configuration controllers
- Verification banner shown on UI for unverified admins (not dismissible)

#### New Roles (Phase 2D additions)
- (no new roles — refactor of existing role system into permission-based)

#### New Frontend Routes (Phase 2D)
- `/forgot-password` — password recovery request
- `/reset-password?token=X` — password reset form
- `/verify-email?token=X` — email verification handler
- `/resend-verification` — resend verification email
- `/staff` — staff user management (admin only)
- `/staff/new` — create staff user
- `/staff/:id/edit` — edit staff user permissions

#### Critical Rules (Phase 2D additions)
- Permission checks MUST happen on backend — frontend hiding is UX only
- Tenant CANNOT remove the last admin user (prevent lockout)
- Tokens (password reset, email verification) MUST be cryptographically random AND SHA-256 hashed before storage
- Tokens MUST be single-use (marked used_at on success)
- Password reset MUST invalidate all refresh tokens for the user
- NO language toggle UI — locale is auto-detected and immutable per session
- Locale validation MUST be server-side (don't trust client-supplied headers blindly)
- Email verification gate applies to admin/staff settings ONLY — does NOT block public clients
- Existing seed user (admin@seed.local) MUST be marked email_verified=true during migration
- `@RequirePermission(module, action)` MUST replace `@Roles()` on all migrated endpoints; auth and public endpoints retain `@Public()` or `@Roles()` as appropriate
- Audit log entries required for: permission changes, password resets, email verification

---

Do NOT execute any task. Do NOT write any application code. Only create the task files and update `_tasks.md` and `_techspec.md`.
