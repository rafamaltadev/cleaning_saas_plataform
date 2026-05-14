---
status: pending
title: "In-App Onboarding (Welcome Modal + Progressive Checklist)"
type: feature
complexity: medium
dependencies: [task_29]
---

# Task 30: In-App Onboarding (Welcome Modal + Progressive Checklist)

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

Implements a guided onboarding experience for tenant admins on first login. Combines a welcome modal (first session only) with a progressive checklist persistently visible in the sidebar showing onboarding completion status. Each checklist item is automatically marked as completed when the corresponding action is performed in the app. The checklist disappears after all items are complete.

## Phase 1 Patterns (MUST follow)

**Backend DTO patterns:**
- For UUID validation, MUST use `@Matches(UUID_REGEX, UUID_MSG)` with constants at top of file:
  ```ts
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const UUID_MSG = { message: '$property must be a valid UUID' };
  ```
  MUST NOT use `@IsUUID()`.
- For partial updates, every DTO field MUST be `@IsOptional()` and the service MUST check `if (dto.field !== undefined) entity.field = dto.field`.
- Service `create()` MUST assign every DTO field to the entity — never silently drop fields.
- All new columns MUST be nullable or have defaults.

**Frontend form patterns:**
- For dropdown selections (SearchableSelect), MUST use `useRef` alongside `useState`:
  ```tsx
  const fieldIdRef = useRef('');
  const [fieldId, setFieldId] = useState('');
  onChange={(id) => { fieldIdRef.current = id; setFieldId(id); }}
  const fid = fieldIdRef.current || fieldId;
  ```
- Submit button MUST be `type="button"` with `onClick={handleSubmit}`.
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
- Touch targets MUST be at least 44x44px.
- No horizontal scroll allowed.

**Security patterns:**
- Every controller endpoint MUST have explicit RBAC guard (`@RequirePermission(...)` or `@Roles(...)`).
- All input validation MUST use class-validator decorators on DTOs.
- Tenant isolation enforced at query level — analytics endpoints MUST scope all queries to current tenant.
- Numeric calculations MUST happen on backend, never trust client-sent aggregates.

---

MUST read and follow `.compozy/tasks/cleaning-saas/_design_system.md` before writing any frontend code.
All UI MUST conform strictly to the design system defined there — colors, typography, spacing, components, responsiveness, and screen patterns.

---

## Requirements

### Backend — Database

- MUST create migration `1714000000052-CreateOnboardingProgress`:
  - Table: `tenant_onboarding_progress`
  - Fields: `id uuid PK`, `tenant_id uuid FK UNIQUE`, `email_verified boolean DEFAULT false`, `branding_configured boolean DEFAULT false`, `first_service_created boolean DEFAULT false`, `first_client_created boolean DEFAULT false`, `payment_configured boolean DEFAULT false`, `first_quote_created boolean DEFAULT false`, `welcome_modal_dismissed boolean DEFAULT false`, `completed_at timestamp nullable`, `created_at`, `updated_at`
  - Trigger: when all 6 boolean flags become true, set `completed_at = NOW()`
  - Index on `tenant_id`
- MUST seed existing tenants with `tenant_onboarding_progress` rows during migration (existing tenants have everything pre-completed — completed_at set to migration timestamp)

### Backend — Service

- MUST create `OnboardingService` in `src/modules/onboarding/onboarding.service.ts`:
  - `getProgress(tenantId)` — returns current onboarding state
  - `markStepCompleted(tenantId, step)` — sets specific flag to true; if all flags true, sets completed_at
  - `dismissWelcomeModal(tenantId)` — sets welcome_modal_dismissed=true
- MUST integrate with existing services to auto-update progress:
  - When `email_verified` changes on user: update tenant's `email_verified` flag if user is admin
  - When tenant's branding fields (logo_url, primary_color) are saved: set `branding_configured=true`
  - When first service is created: set `first_service_created=true`
  - When first client is created: set `first_client_created=true`
  - When payment config is saved (manual mode confirmed OR Stripe Connect active): set `payment_configured=true`
  - When first quote is created: set `first_quote_created=true`
- These integrations MUST use domain events from existing infrastructure (subscribe to existing entity-created events)

### Backend — Endpoints

- `GET /api/v1/onboarding/progress` — returns current tenant's progress (any authenticated user can read; only used by admins to render UI)
- `POST /api/v1/onboarding/welcome-dismiss` — dismisses welcome modal for current tenant (admin only)
- `POST /api/v1/onboarding/skip` — (admin only) marks all steps as completed manually (escape hatch for users who don't want onboarding)

### Backend — Auto-Completion Logic

- MUST add event listeners in `OnboardingService`:
  - `EmailVerifiedEvent` → mark email_verified
  - `BrandingUpdatedEvent` → mark branding_configured if logo_url OR primary_color non-null
  - `ServiceCreatedEvent` → mark first_service_created
  - `ClientCreatedEvent` → mark first_client_created
  - `PaymentConfigUpdatedEvent` → mark payment_configured if payment_mode != null AND (manual OR Stripe active)
  - `QuoteCreatedEvent` → mark first_quote_created
- Events MUST be created/extended where they don't exist

### Frontend — Welcome Modal

- MUST create `WelcomeModal` component shown on first login for tenant admin:
  - Triggered when `getProgress()` returns `welcome_modal_dismissed=false`
  - Modal contents:
    - Title: "Bem-vindo ao CleanSaaS!"
    - Brief description of the platform (2-3 sentences)
    - "Vamos começar?" — list of onboarding steps with brief descriptions
    - CTA: "Começar configuração" (closes modal, dismisses, navigates to /settings/empresa)
    - Secondary CTA: "Explorar primeiro" (closes modal, dismisses, stays on current page)
  - Modal cannot be reopened after dismissal (one-time experience)

### Frontend — Onboarding Checklist Widget

- MUST create `OnboardingChecklist` component shown in sidebar (or as floating widget on mobile):
  - Visible only when `completed_at IS NULL` (onboarding incomplete)
  - Shows progress (e.g. "3 de 6 concluídos") with progress bar
  - Lists all 6 steps:
    1. ✅ Verificar e-mail (links to verification resend if not verified)
    2. ✅ Configurar identidade visual (links to /settings/empresa branding tab)
    3. ✅ Cadastrar primeiro serviço (links to /services/new)
    4. ✅ Cadastrar primeiro cliente (links to /clients/new)
    5. ✅ Conectar pagamento (links to /settings/payments)
    6. ✅ Criar primeiro orçamento (links to /quotes/new)
  - Each item shows checkmark when completed, action button when pending
  - "Pular onboarding" link at bottom (calls POST /onboarding/skip with confirmation modal: "Tem certeza? Você pode reativar nas configurações." — but this is a one-way action, no reactivation in Phase 2)
- After all steps completed, widget shows celebration state for 24h then disappears
- Widget must be collapsible (chevron icon) — collapsed state shows only progress count badge

### Frontend — Mobile Experience

- On mobile, checklist appears as bottom sheet accessible via floating icon
- Welcome modal full-screen on mobile

### Frontend — State Management

- MUST add Redux slice `onboardingSlice`:
  - Stores current progress
  - Refetched on app init and after any potentially-completing action (service created, client created, etc.)
  - Updated via API responses to reduce polling

### Frontend — Visibility Rules

- Onboarding UI MUST only appear for users with `'admin'` role (tenant admin)
- Staff users MUST NOT see onboarding UI (they didn't create the tenant)
- Public clients MUST NEVER see onboarding UI

### Security

- Onboarding state is tenant-scoped (one record per tenant)
- Only admin can dismiss/skip
- Frontend hiding is UX only — backend prevents non-admin from calling skip/dismiss

## Tests

### Backend
- Existing tenants get pre-completed progress records on migration
- markStepCompleted updates correct flag
- completed_at is set automatically when all flags true
- ServiceCreatedEvent triggers first_service_created flag
- ClientCreatedEvent triggers first_client_created flag
- PaymentConfigUpdatedEvent triggers payment_configured flag
- QuoteCreatedEvent triggers first_quote_created flag
- BrandingUpdatedEvent triggers branding_configured when fields populated
- EmailVerifiedEvent triggers email_verified for admin user only
- POST /onboarding/welcome-dismiss requires admin role
- POST /onboarding/skip requires admin role and marks all flags true
- Staff user cannot dismiss/skip onboarding (403)
- Progress is tenant-scoped (no cross-tenant leakage)

### Frontend
- Welcome modal appears on first admin login
- Welcome modal dismissed flag persists across reloads
- Checklist widget visible only for admin
- Checklist widget shows correct progress
- Each checklist item shows checkmark when completed
- Action buttons navigate to correct routes
- Skip button shows confirmation modal
- Widget disappears after all items completed (with celebration state for 24h)
- Widget collapsible state persists
- All UI renders correctly at 375px viewport width

## Implementation Files

### Backend
- `packages/backend/src/database/migrations/1714000000052-CreateOnboardingProgress.ts` (new)
- `packages/backend/src/modules/onboarding/onboarding.module.ts` (new)
- `packages/backend/src/modules/onboarding/onboarding.entity.ts` (new)
- `packages/backend/src/modules/onboarding/onboarding.service.ts` (new)
- `packages/backend/src/modules/onboarding/onboarding.controller.ts` (new)
- `packages/backend/src/modules/onboarding/listeners/onboarding-event.listener.ts` (new)
- Various event files in their respective modules (create or extend as needed)

### Frontend
- `packages/frontend/src/components/onboarding/WelcomeModal.tsx` (new)
- `packages/frontend/src/components/onboarding/OnboardingChecklist.tsx` (new)
- `packages/frontend/src/components/onboarding/ChecklistItem.tsx` (new)
- `packages/frontend/src/store/onboardingSlice.ts` (new)
- `packages/frontend/src/api/onboarding.ts` (new)
- `packages/frontend/src/components/layout/AppShell.tsx` (modify — integrate WelcomeModal and OnboardingChecklist)
- `packages/frontend/src/components/layout/Sidebar.tsx` (modify — integrate checklist widget for desktop)
- `packages/frontend/src/components/layout/BottomNav.tsx` (modify — floating icon for mobile checklist)

## Definition of Done

- All migrations executed without errors
- Existing tenants pre-completed
- All backend tests pass
- All frontend tests pass
- Welcome modal appears once and never again
- Auto-completion works for all 6 steps via domain events
- Checklist hides after completion
- Only admin sees onboarding UI
- All UI renders correctly on mobile (375px), tablet, desktop
