---
status: pending
title: "Email Verification Flow (Required Before Configuration)"
type: feature
complexity: medium
dependencies: [task_27]
---

# Task 28: Email Verification Flow (Required Before Configuration)

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

Implements email verification required for tenant admins and staff users. Tenant admins MUST verify their email before they can configure company settings (logo, payments, etc.). Staff users MUST verify before they can log in. The very first session after tenant registration is allowed without verification (initial onboarding), but configuration access is blocked until verification. Public clients DO NOT require email verification — their email comes from social login (already verified by provider) or is verified through booking confirmation flow.

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

- MUST create migration `1714000000048-CreateEmailVerificationTokens`:
  - Table: `email_verification_tokens`
  - Fields: `id uuid PK`, `user_id uuid FK`, `token_hash varchar(255) UNIQUE NOT NULL`, `email varchar NOT NULL` (email being verified — important if user changes email), `expires_at timestamp NOT NULL`, `verified_at timestamp nullable`, `created_at`
  - Index on `user_id`, `expires_at`
- MUST create migration `1714000000049-AlterUsersAddEmailVerification`:
  - Adds to `users` table:
    - `email_verified boolean NOT NULL DEFAULT false`
    - `email_verified_at timestamp nullable`
  - Existing seed users (admin@seed.local) MUST be set as `email_verified=true` automatically

### Backend — Service

- MUST create `EmailVerificationService`:
  - `sendVerification(userId)` — generates token, sends email, returns void
  - `verifyToken(token)` — validates and marks user as verified, returns user
  - `resendVerification(email)` — public endpoint, rate-limited; resends only if user exists AND not yet verified
  - `cleanupExpiredTokens()` — scheduled, deletes tokens older than 7 days

### Backend — Endpoints

- `POST /api/v1/auth/email/send-verification` — authenticated, sends verification email to current user
  - Rate-limited: 1 request per 5 minutes per user (prevent spam)
- `POST /api/v1/auth/email/verify` — public:
  - Body: `{ token }`
  - Returns 200 on success with updated user info
  - Returns 400 on invalid/expired token
- `POST /api/v1/auth/email/resend` — public, rate-limited 3 req/hour per email:
  - Body: `{ email }`
  - Returns 200 with generic message (no enumeration)

### Backend — Behavior on Registration

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

### Backend — Guard

- MUST create `EmailVerifiedGuard`:
  - Applied to ALL settings/configuration endpoints (tenant config, branding, Stripe Connect, staff management)
  - Returns 403 with code `EMAIL_VERIFICATION_REQUIRED` if `user.email_verified=false` AND `user.role` is admin or staff
  - Returns 200 (allows) for public client role even if not verified
- MUST add guard to all tenant configuration controllers

### Backend — Login Flow Update

- Update login endpoint behavior:
  - Admin user: login succeeds even if not verified, but JWT includes flag `email_verification_required: true`
  - Staff user: login REJECTED with 403 code `EMAIL_VERIFICATION_REQUIRED` if not verified
  - Client user: login succeeds normally regardless of verification status

### Backend — Email

- MUST create email template `email-verification` in 3 languages (pt-BR, EN, ES):
  - Subject: "Verifique seu e-mail"
  - Body includes verification link: `{frontend_url}/verify-email?token={token}`
  - Expiration: 24 hours
  - Different content for admin/staff vs client

### Frontend — Pages

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

### Frontend — Admin Verification Gate

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

### Frontend — Staff Blocked Login

- LoginPage MUST detect EMAIL_VERIFICATION_REQUIRED error
- Show specific message and resend CTA
- Do NOT allow staff to enter the app until verified

### Security

- Token MUST be cryptographically random and SHA-256 hashed before storage
- Token MUST be single-use
- Email verification status MUST be checked server-side on every protected endpoint
- Frontend banner is UX hint only — server is source of truth
- Audit log entry on email verification
- Resend rate limit: 3 per hour per email, 1 per 5 minutes per authenticated user

## Tests

### Backend
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

### Frontend
- /verify-email with valid token shows success and navigates correctly
- /verify-email with invalid token shows error and resend option
- /resend-verification shows generic success message
- Admin sees EmailVerificationBanner when not verified
- Banner does not appear after verification
- Unverified admin redirected from /settings to /dashboard
- Staff blocked at login with verification message
- Public client can use app without verification banner
- All pages render correctly at 375px viewport width

## Implementation Files

### Backend
- `packages/backend/src/database/migrations/1714000000048-CreateEmailVerificationTokens.ts` (new)
- `packages/backend/src/database/migrations/1714000000049-AlterUsersAddEmailVerification.ts` (new)
- `packages/backend/src/modules/auth/email-verification/email-verification-token.entity.ts` (new)
- `packages/backend/src/modules/auth/email-verification/email-verification.service.ts` (new)
- `packages/backend/src/modules/auth/email-verification/email-verification.controller.ts` (new)
- `packages/backend/src/modules/auth/email-verification/email-verification.guard.ts` (new)
- `packages/backend/src/modules/auth/email-verification/email-verification-cleanup.job.ts` (new)
- `packages/backend/src/modules/auth/application/auth.service.ts` (modify — login flow, registration flow)
- `packages/backend/src/modules/users/domain/user.entity.ts` (modify — email_verified fields)
- `packages/backend/src/notifications/templates/email-verification.pt-BR.hbs` (new)
- `packages/backend/src/notifications/templates/email-verification.en.hbs` (new)
- `packages/backend/src/notifications/templates/email-verification.es.hbs` (new)
- ALL settings/configuration controllers — add @UseGuards(EmailVerifiedGuard)

### Frontend
- `packages/frontend/src/pages/auth/VerifyEmailPage.tsx` (new)
- `packages/frontend/src/pages/auth/ResendVerificationPage.tsx` (new)
- `packages/frontend/src/components/auth/EmailVerificationBanner.tsx` (new)
- `packages/frontend/src/api/emailVerification.ts` (new)
- `packages/frontend/src/pages/auth/LoginPage.tsx` (modify — handle verification error)
- `packages/frontend/src/components/shared/ProtectedRoute.tsx` (modify — settings gate for unverified admin)
- `packages/frontend/src/App.tsx` (modify — add routes, banner integration)

## Definition of Done

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
