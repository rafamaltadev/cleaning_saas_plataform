---
status: pending
title: "Staff Granular Permissions (module-level with action-ready schema)"
type: feature
complexity: medium
dependencies: [task_24]
---

# Task 25: Staff Granular Permissions (module-level with action-ready schema)

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

Implements a granular permission system for staff users. Phase 2 grants permissions at module level only (read / write), but the database schema and guard infrastructure are designed to support per-action permissions in future phases without requiring refactoring. The tenant admin can create staff users and assign module-level access (read or write) for each functional area: clients, services, quotes, bookings, payments, reports, settings.

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
- All input validation MUST use class-validator decorators on DTOs.
- Rate limiting MUST be applied to public endpoints (60 req/min per IP).
- Tokens with expiration MUST be single-use and invalidated after use.

---

MUST read and follow `.compozy/tasks/cleaning-saas/_design_system.md` before writing any frontend code.
All UI MUST conform strictly to the design system defined there — colors, typography, spacing, components, responsiveness, and screen patterns.

---

## Requirements

### Backend — Database

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

### Backend — Entities & DTOs

- MUST create entities: `Permission`, `Role`, `RolePermission`, `UserPermissionOverride`
- MUST update `User` entity: replace `role: string` with `role_id: string` and `role: Role` relation
- MUST create DTOs:
  - `AssignPermissionsToUserDto` (`{ user_id, permissions: [{ module, action, granted }] }`)
  - `CreateStaffUserDto` (`{ name, email, password, permissions: [{ module, action }] }`)

### Backend — Services

- MUST create `PermissionService` in `src/modules/auth/permissions/permission.service.ts`:
  - `getUserPermissions(userId)` — returns effective permissions = role permissions + overrides
  - `userHas(userId, module, action)` — boolean check
  - `assignPermissionsToUser(userId, permissions)` — bulk set overrides
  - `getAllPermissions()` — returns all permissions for UI
- MUST create `RoleService`:
  - `findRoleByName(name, tenantId?)` — used during user creation
  - `assignRoleToUser(userId, roleName)` — internal use

### Backend — Guard Infrastructure

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

### Backend — Staff Management Endpoints

- `GET /api/v1/users/staff` — lists staff users in tenant (requires settings:read)
- `POST /api/v1/users/staff` — creates staff user with initial permissions (requires settings:write)
- `PUT /api/v1/users/staff/:id` — updates staff user info (requires settings:write)
- `PUT /api/v1/users/staff/:id/permissions` — updates staff permissions (requires settings:write)
- `DELETE /api/v1/users/staff/:id` — soft-deletes staff user (requires settings:write)
- `GET /api/v1/permissions` — returns all available permissions for UI dropdowns (requires authenticated user)

### Backend — Audit

- MUST log permission changes to existing audit log infrastructure:
  - User created with initial permissions
  - Permissions changed
  - User deleted
- Audit entries MUST include: changed_by_user_id, target_user_id, before, after, timestamp

### Frontend — Staff Management

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

### Frontend — Sidebar Visibility

- MUST update Sidebar component to dynamically show/hide menu items based on user permissions
- MUST update BottomNav (mobile) with same logic
- "Configurações" menu remains visible to all (basic profile always accessible)
- Sub-sections inside Settings hidden if user lacks read on the corresponding module

### Security

- Staff user creation MUST validate that the creating user has settings:write permission
- Admin role cannot be removed from the tenant's last admin user (prevent lockout)
- Permission checks MUST happen on backend — frontend hiding is UX only
- Audit log entries for every permission change

## Tests

### Backend
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

### Frontend
- Equipe tab lists staff users correctly
- Permission matrix renders with current permissions checked
- Saving permissions calls PUT endpoint with correct payload
- Sidebar hides menu items based on permissions
- Edit/delete buttons hidden when user lacks write
- Admin user cannot edit their own permissions
- All pages render correctly at 375px viewport width

## Implementation Files

### Backend
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

### Frontend
- `packages/frontend/src/pages/settings/sections/StaffSection.tsx` (new)
- `packages/frontend/src/pages/staff/StaffUserFormPage.tsx` (new)
- `packages/frontend/src/components/staff/PermissionMatrix.tsx` (new)
- `packages/frontend/src/api/staff.ts` (new)
- `packages/frontend/src/api/permissions.ts` (new)
- `packages/frontend/src/hooks/usePermissions.ts` (new — exposes user's effective permissions)
- `packages/frontend/src/components/layout/Sidebar.tsx` (modify — permission-based visibility)
- `packages/frontend/src/components/layout/BottomNav.tsx` (modify — permission-based visibility)
- `packages/frontend/src/App.tsx` (modify — add staff routes)

## Definition of Done

- All migrations executed without errors
- Existing user roles preserved during migration
- All backend tests pass
- All frontend tests pass
- All existing endpoints work with new permission system
- Cannot remove last admin user
- Sidebar hides menu items based on permissions
- Staff user can be created, edited, deleted via UI
- All pages render correctly on mobile (375px), tablet, desktop
