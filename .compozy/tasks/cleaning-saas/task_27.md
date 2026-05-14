---
status: pending
title: "Password Recovery Flow"
type: feature
complexity: medium
dependencies: [task_26]
---

# Task 27: Password Recovery Flow

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

Implements a complete password recovery flow for tenant admins, staff users, and public clients. User requests password reset by email, receives a one-time token valid for 24 hours, sets a new password, and is auto-logged-in. Includes rate limiting (3 attempts per hour per email) to prevent abuse. All email templates respect user locale.

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

- MUST create migration `1714000000046-CreatePasswordResetTokens`:
  - Table: `password_reset_tokens`
  - Fields: `id uuid PK`, `user_id uuid FK`, `token_hash varchar(255) UNIQUE NOT NULL` (SHA-256 hash, never store plain token), `expires_at timestamp NOT NULL`, `used_at timestamp nullable`, `request_ip varchar nullable`, `request_user_agent varchar nullable`, `created_at`
  - Index on `user_id`, `expires_at`
- MUST create migration `1714000000047-CreatePasswordResetAttempts`:
  - Table: `password_reset_attempts`
  - Fields: `id uuid PK`, `email varchar`, `request_ip varchar`, `created_at`
  - Index on `(email, created_at)` for rate limit queries

### Backend — Service

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

### Backend — Endpoints

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

### Backend — Scheduled Job

- MUST create `PasswordResetCleanupJob` (uses existing scheduler):
  - Runs daily at 03:00
  - Deletes password_reset_tokens older than 7 days
  - Deletes password_reset_attempts older than 24 hours

### Backend — Email

- MUST create email template `password-reset` in 3 languages (pt-BR, EN, ES):
  - Subject: "Redefinir sua senha"
  - Body includes reset link with token: `{frontend_url}/reset-password?token={token}`
  - Body mentions expiration: "Este link expira em 24 horas"
  - Body includes IP/user agent that requested for security awareness
  - Body includes warning: "Se você não solicitou, ignore este e-mail"

### Frontend — Pages

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

### Public Client Password Reset

- Public clients (created in T20) can also reset password
- Same `/forgot-password` and `/reset-password` routes work for all user types
- After reset, public clients are redirected to `/t/{tenantSlug}` (need to store tenantSlug in token metadata)

### Security

- Token MUST be cryptographically random (256-bit, generated via crypto.randomBytes)
- Token MUST be hashed with SHA-256 before storage (NEVER store plain token in DB)
- Token MUST be single-use (marked used_at on success)
- Resetting password MUST invalidate ALL refresh tokens for the user (force re-login everywhere)
- Rate limiting: 3 attempts per email per hour, 10 requests per IP per minute
- DO NOT reveal email existence (same response whether email exists or not)
- DO NOT log full tokens — only hashes
- Audit log entry on every successful reset

## Tests

### Backend
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

### Frontend
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

## Implementation Files

### Backend
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

### Frontend
- `packages/frontend/src/pages/auth/ForgotPasswordPage.tsx` (new)
- `packages/frontend/src/pages/auth/ResetPasswordPage.tsx` (new)
- `packages/frontend/src/api/passwordReset.ts` (new)
- `packages/frontend/src/pages/auth/LoginPage.tsx` (modify — add forgot password link)
- `packages/frontend/src/App.tsx` (modify — add routes)

## Definition of Done

- All migrations executed without errors
- All backend tests pass
- All frontend tests pass
- Email sent in 3 languages correctly
- Token never stored in plain form
- Rate limiting enforced (3/hour per email, 10/min per IP)
- Password reset invalidates all sessions
- All pages render correctly on mobile (375px), tablet, desktop
