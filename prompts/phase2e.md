You are a senior software engineer and technical planner.

Your task is to CREATE TASK FILES ONLY for Phase 2E of the Cleaning SaaS project — do not execute any task, do not write application code, do not modify any source file outside of the Compozy task planning system.

Read the following files before starting:
- `.compozy/tasks/cleaning-saas/_techspec.md`
- `.compozy/tasks/cleaning-saas/_design_system.md`
- `.compozy/tasks/cleaning-saas/_tasks.md`
- `.compozy/tasks/cleaning-saas/task_16.md` (use as format reference for the E2E validation task, T31)
- `.compozy/tasks/cleaning-saas/task_25.md` (permissions reference)
- `.compozy/tasks/cleaning-saas/task_28.md` (email verification reference)

---

## What you MUST deliver

1. Create 3 new task files in `.compozy/tasks/cleaning-saas/`:
   - `task_29.md` — Operational & Financial Analytics Dashboard
   - `task_30.md` — In-App Onboarding (Welcome Modal + Progressive Checklist)
   - `task_31.md` — Phase 2 Full System Validation (E2E)

2. Update `.compozy/tasks/cleaning-saas/_tasks.md` to include T29, T30 and T31 with correct titles, status (pending), complexity, and dependencies.

3. Update `.compozy/tasks/cleaning-saas/_techspec.md` to extend the "Phase 2 — Public Tenant Product" section with the analytics architecture, onboarding state machine, and E2E testing strategy.

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

## Phase 1 Patterns (MANDATORY — include verbatim in T29 and T30; T31 is a test-only task and follows task_16.md format)

For T29 and T30, every task MUST include the following section after the Overview, with the EXACT content below:

### Phase 1 Patterns (MUST follow)

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

## Design system reference (include in T29 and T30)

MUST read and follow `.compozy/tasks/cleaning-saas/_design_system.md` before writing any frontend code.

---

## Tasks to create

---

### TASK 29 — Operational & Financial Analytics Dashboard

**Frontmatter:**
- status: pending
- type: feature
- complexity: high
- dependencies: [task_28]

**Overview:**
Implements a unified analytics dashboard at `/analytics` accessible to users with `reports:read` permission. The page has two tabs: "Operacional" (quote funnel, conversion rates, booking statuses, service popularity, average approval times) and "Financeiro" (revenue, fees, MRR/ARR, ticket size, period comparisons). All metrics are scoped to the current tenant, calculated on the backend (never trust client-side aggregates), and respect the tenant's currency and locale. The dashboard supports date range filtering, comparison with previous period, and CSV/PDF export.

**Requirements:**

Backend — Database:
- MUST create migration `1714000000050-CreateAnalyticsViews`:
  - Creates a SQL materialized view or regular view per metric for performance:
    - `mv_quotes_funnel` — aggregates by tenant_id, period, status
    - `mv_bookings_status` — aggregates by tenant_id, period, status
    - `mv_revenue_by_method` — aggregates by tenant_id, period, payment_method
    - `mv_service_popularity` — counts by tenant_id, period, service_id
  - All views MUST include `tenant_id` for filtering
  - MUST create scheduled job to refresh materialized views every 30 minutes
- MUST create migration `1714000000051-CreateAnalyticsSnapshots`:
  - Table: `analytics_snapshots` for daily aggregated data (faster than real-time computation for historical comparison)
  - Fields: `id uuid PK`, `tenant_id uuid FK`, `snapshot_date date`, `metric_type varchar` (e.g. 'daily_revenue', 'daily_quotes', 'daily_bookings'), `value_numeric numeric nullable`, `value_json jsonb nullable` (for structured breakdowns), `currency varchar(3) nullable`, `created_at`
  - UNIQUE on `(tenant_id, snapshot_date, metric_type)`
  - Index on `(tenant_id, snapshot_date)`

Backend — Snapshot job:
- MUST create `AnalyticsSnapshotJob`:
  - Runs daily at 01:00
  - For each tenant, generates snapshots for the previous day:
    - `daily_revenue` — total succeeded payments with breakdown by method (jsonb)
    - `daily_quotes_created` — count + breakdown by status
    - `daily_bookings_created` — count + breakdown by status
    - `daily_active_clients` — distinct clients with activity
    - `daily_platform_fees` — total application_fee_cents collected
    - `daily_stripe_fees` — total stripe_fee_cents paid
  - Uses upsert pattern (ON CONFLICT (tenant_id, snapshot_date, metric_type) DO UPDATE)

Backend — Services:
- MUST create `AnalyticsService` in `src/modules/analytics/analytics.service.ts`:
  - All methods accept `{ tenantId, from: Date, to: Date, compareToPreviousPeriod?: boolean }`
  - `getQuoteFunnel(params)` — returns counts at each stage: created → sent → accepted → rejected → expired; conversion rates between stages
  - `getBookingsByStatus(params)` — returns counts by status (pending_approval, confirmed, completed, cancelled)
  - `getAverageApprovalTime(params)` — average time between quote `sent` and `accepted` status changes (hours)
  - `getServicePopularity(params)` — top 10 services by quote count and revenue
  - `getRevenue(params)` — total revenue, breakdown by payment method, period comparison
  - `getFees(params)` — platform fees collected + stripe fees paid (both as separate values)
  - `getMRR(tenantId)` — calculates Monthly Recurring Revenue from active subscriptions (relevant for tenant subscription revenue if applicable)
  - `getTicketSize(params)` — average paid amount per booking
  - `getActiveClients(params)` — distinct clients with activity, comparison with previous period
- All queries MUST be `tenant_id`-scoped at SQL level — never trust user-supplied tenant ID
- MUST use database views/snapshots when available for performance — fall back to live queries for date ranges within last 24h

Backend — Endpoints:
- `GET /api/v1/analytics/operational` — operational metrics:
  - Query params: `from`, `to`, `compare_previous?` (boolean)
  - Requires `reports:read` permission
  - Returns: `{ quote_funnel, bookings_by_status, average_approval_time_hours, service_popularity, active_clients }`
- `GET /api/v1/analytics/financial` — financial metrics:
  - Query params: `from`, `to`, `compare_previous?` (boolean)
  - Requires `reports:read` permission
  - Returns: `{ revenue, platform_fees, stripe_fees, ticket_size, revenue_by_method, mrr? }`
- `GET /api/v1/analytics/export.csv` — CSV export of selected metrics:
  - Query params: `from`, `to`, `tab` (operational | financial)
  - Returns CSV file with all metrics for the period
  - Requires `reports:read` permission
- `GET /api/v1/analytics/export.pdf` — PDF export with charts (uses `puppeteer` or similar to render HTML to PDF server-side)
- All endpoints MUST be rate-limited (30 req/min per user, as analytics queries can be heavy)

Backend — Date range validation:
- Max range: 365 days
- `to` must not be in the future
- `from` must be <= `to`
- If `compare_previous=true`, automatically calculates the equivalent previous period (e.g. last 30 days → previous 30 days)

Frontend — Page structure:
- MUST create new route `/analytics` accessible to users with `reports:read` permission
- MUST be added to sidebar with icon (only visible to users with permission)
- Page header:
  - Title "Analytics"
  - Date range picker (presets: "Últimos 7 dias", "Últimos 30 dias", "Este mês", "Mês passado", "Este ano", "Personalizado")
  - Comparison toggle: "Comparar com período anterior"
  - Export dropdown: "Exportar CSV" / "Exportar PDF"
- Tab navigation: "Operacional" | "Financeiro"

Frontend — Operacional tab:
- Quote funnel widget (visual conversion funnel):
  - Stages: Created → Sent → Accepted → Rejected → Expired
  - Each stage shows count and percentage from previous stage
  - Conversion rate displayed prominently
- Bookings by status (stacked bar chart or donut):
  - Pending Approval, Confirmed, Completed, Cancelled
- Average approval time (stat card):
  - Hours from `sent` to `accepted`
  - Comparison with previous period (delta arrow up/down)
- Top services (bar chart):
  - Top 10 services by quote count
  - Toggle to see by revenue instead
- Active clients (stat card):
  - Distinct clients with activity in period
  - Comparison with previous period

Frontend — Financeiro tab:
- Revenue total (large stat card):
  - Total revenue in tenant's currency
  - Comparison with previous period
- Revenue by method (donut chart):
  - Cartão de crédito, Cartão de débito, PIX, ACH, Apple Pay, Google Pay, Manual
- Platform fees collected (stat card):
  - Total application_fee_cents (your platform's revenue from this tenant)
  - Note: this metric only relevant for platform_admin role; tenant sees what they paid to platform
- Stripe fees paid (stat card):
  - Total stripe_fee_cents paid by tenant
- Net revenue (stat card):
  - Revenue minus all fees
- Ticket size (stat card):
  - Average net amount per completed booking
- Trend chart (line chart):
  - Daily revenue over the selected period
  - X-axis: dates, Y-axis: revenue in tenant currency

Frontend — Chart library:
- MUST use `recharts` library (already in stack from frontend MVP)
- All charts MUST be responsive (full width on mobile, fixed aspect on desktop)
- All charts MUST use design system colors
- Tooltips on hover/touch with formatted values (locale-aware)

Frontend — Empty states:
- If no data for selected period, show friendly empty state with illustration:
  - "Nenhum dado para o período selecionado"
  - CTA to adjust date range

Frontend — Mobile responsiveness:
- Charts stack vertically on mobile
- Date range picker collapses into modal on mobile
- Export menu becomes bottom sheet on mobile
- Stat cards: 1 col mobile, 2 cols tablet, 3-4 cols desktop
- Tab navigation sticky at top

Security:
- All queries scoped to `tenant_id` at SQL level
- Analytics endpoints require `reports:read` permission
- Export endpoints log audit entries with: user_id, tenant_id, date_range, format
- Numeric calculations always server-side
- CSV/PDF generated server-side (never trust client-rendered exports)
- Rate limiting applied

**Tests (backend):**
- Quote funnel correctly aggregates by status for tenant
- Quote funnel does NOT include other tenants' data
- Average approval time calculates correctly using audit log timestamps
- Revenue total matches sum of succeeded payments for tenant in period
- Revenue by method correctly breaks down by payment_method enum
- Period comparison returns correct previous period range
- Date range validation rejects >365 days
- Date range validation rejects future `to`
- Snapshot job creates correct daily snapshots
- Snapshot job is idempotent (re-running same day doesn't duplicate)
- CSV export returns correct file format with all metrics
- PDF export renders correctly with charts
- All endpoints require reports:read permission
- All endpoints rate-limited (31st request returns 429)
- Concurrent requests for different tenants return separate isolated data

**Tests (frontend):**
- /analytics renders correctly with default date range (last 30 days)
- Date range picker presets work correctly
- Comparison toggle shows delta values
- Tab switching between Operacional and Financeiro preserves date range
- Charts render with correct data
- Export CSV downloads file
- Export PDF downloads file
- Empty state shown when no data for period
- All charts responsive on mobile (375px)
- Sidebar item only visible to users with reports:read

**Implementation files:**

Backend:
- `packages/backend/src/database/migrations/1714000000050-CreateAnalyticsViews.ts` (new)
- `packages/backend/src/database/migrations/1714000000051-CreateAnalyticsSnapshots.ts` (new)
- `packages/backend/src/modules/analytics/analytics.module.ts` (new)
- `packages/backend/src/modules/analytics/analytics.service.ts` (new)
- `packages/backend/src/modules/analytics/snapshot.job.ts` (new)
- `packages/backend/src/modules/analytics/export/csv-export.service.ts` (new)
- `packages/backend/src/modules/analytics/export/pdf-export.service.ts` (new)
- `packages/backend/src/modules/analytics/analytics.controller.ts` (new)
- `packages/backend/src/modules/analytics/domain/analytics-snapshot.entity.ts` (new)
- `packages/backend/src/modules/analytics/validation/analytics-query.dto.ts` (new)

Frontend:
- `packages/frontend/src/pages/analytics/AnalyticsPage.tsx` (new)
- `packages/frontend/src/pages/analytics/OperationalTab.tsx` (new)
- `packages/frontend/src/pages/analytics/FinancialTab.tsx` (new)
- `packages/frontend/src/components/analytics/QuoteFunnelChart.tsx` (new)
- `packages/frontend/src/components/analytics/BookingsStatusChart.tsx` (new)
- `packages/frontend/src/components/analytics/RevenueByMethodChart.tsx` (new)
- `packages/frontend/src/components/analytics/StatCard.tsx` (new)
- `packages/frontend/src/components/analytics/DateRangePicker.tsx` (new)
- `packages/frontend/src/components/analytics/ExportMenu.tsx` (new)
- `packages/frontend/src/api/analytics.ts` (new)
- `packages/frontend/src/App.tsx` (modify — add route)
- `packages/frontend/src/components/layout/Sidebar.tsx` (modify — add Analytics item)
- `packages/frontend/src/components/layout/BottomNav.tsx` (modify)

**Definition of Done:**
- All migrations executed without errors
- All backend tests pass
- All frontend tests pass
- Snapshot job runs successfully in test environment
- Charts render correctly with sample data
- Export CSV and PDF work correctly
- Period comparison delta indicators correct
- All pages render correctly on mobile (375px), tablet, desktop
- Analytics scoped per tenant (no data leakage)
- All metrics respect tenant locale and currency

---

### TASK 30 — In-App Onboarding (Welcome Modal + Progressive Checklist)

**Frontmatter:**
- status: pending
- type: feature
- complexity: medium
- dependencies: [task_29]

**Overview:**
Implements a guided onboarding experience for tenant admins on first login. Combines a welcome modal (first session only) with a progressive checklist persistently visible in the sidebar showing onboarding completion status. Each checklist item is automatically marked as completed when the corresponding action is performed in the app. The checklist disappears after all items are complete.

**Requirements:**

Backend — Database:
- MUST create migration `1714000000052-CreateOnboardingProgress`:
  - Table: `tenant_onboarding_progress`
  - Fields: `id uuid PK`, `tenant_id uuid FK UNIQUE`, `email_verified boolean DEFAULT false`, `branding_configured boolean DEFAULT false`, `first_service_created boolean DEFAULT false`, `first_client_created boolean DEFAULT false`, `payment_configured boolean DEFAULT false`, `first_quote_created boolean DEFAULT false`, `welcome_modal_dismissed boolean DEFAULT false`, `completed_at timestamp nullable`, `created_at`, `updated_at`
  - Trigger: when all 6 boolean flags become true, set `completed_at = NOW()`
  - Index on `tenant_id`
- MUST seed existing tenants with `tenant_onboarding_progress` rows during migration (existing tenants have everything pre-completed — completed_at set to migration timestamp)

Backend — Service:
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

Backend — Endpoints:
- `GET /api/v1/onboarding/progress` — returns current tenant's progress (any authenticated user can read; only used by admins to render UI)
- `POST /api/v1/onboarding/welcome-dismiss` — dismisses welcome modal for current tenant (admin only)
- `POST /api/v1/onboarding/skip` — (admin only) marks all steps as completed manually (escape hatch for users who don't want onboarding)

Backend — Auto-completion logic:
- MUST add event listeners in `OnboardingService`:
  - `EmailVerifiedEvent` → mark email_verified
  - `BrandingUpdatedEvent` → mark branding_configured if logo_url OR primary_color non-null
  - `ServiceCreatedEvent` → mark first_service_created
  - `ClientCreatedEvent` → mark first_client_created
  - `PaymentConfigUpdatedEvent` → mark payment_configured if payment_mode != null AND (manual OR Stripe active)
  - `QuoteCreatedEvent` → mark first_quote_created
- Events MUST be created/extended where they don't exist

Frontend — Welcome modal:
- MUST create `WelcomeModal` component shown on first login for tenant admin:
  - Triggered when `getProgress()` returns `welcome_modal_dismissed=false`
  - Modal contents:
    - Title: "Bem-vindo ao CleanSaaS!"
    - Brief description of the platform (2-3 sentences)
    - "Vamos começar?" — list of onboarding steps with brief descriptions
    - CTA: "Começar configuração" (closes modal, dismisses, navigates to /settings/empresa)
    - Secondary CTA: "Explorar primeiro" (closes modal, dismisses, stays on current page)
- Modal cannot be reopened after dismissal (one-time experience)

Frontend — Onboarding checklist widget:
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

Frontend — Mobile experience:
- On mobile, checklist appears as bottom sheet accessible via floating icon
- Welcome modal full-screen on mobile

Frontend — State management:
- MUST add Redux slice `onboardingSlice`:
  - Stores current progress
  - Refetched on app init and after any potentially-completing action (service created, client created, etc.)
  - Updated via API responses to reduce polling

Frontend — Visibility rules:
- Onboarding UI MUST only appear for users with `'admin'` role (tenant admin)
- Staff users MUST NOT see onboarding UI (they didn't create the tenant)
- Public clients MUST NEVER see onboarding UI

Security:
- Onboarding state is tenant-scoped (one record per tenant)
- Only admin can dismiss/skip
- Frontend hiding is UX only — backend prevents non-admin from calling skip/dismiss

**Tests (backend):**
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

**Tests (frontend):**
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

**Implementation files:**

Backend:
- `packages/backend/src/database/migrations/1714000000052-CreateOnboardingProgress.ts` (new)
- `packages/backend/src/modules/onboarding/onboarding.module.ts` (new)
- `packages/backend/src/modules/onboarding/onboarding.entity.ts` (new)
- `packages/backend/src/modules/onboarding/onboarding.service.ts` (new)
- `packages/backend/src/modules/onboarding/onboarding.controller.ts` (new)
- `packages/backend/src/modules/onboarding/listeners/onboarding-event.listener.ts` (new)
- Various event files in their respective modules (create or extend as needed)

Frontend:
- `packages/frontend/src/components/onboarding/WelcomeModal.tsx` (new)
- `packages/frontend/src/components/onboarding/OnboardingChecklist.tsx` (new)
- `packages/frontend/src/components/onboarding/ChecklistItem.tsx` (new)
- `packages/frontend/src/store/onboardingSlice.ts` (new)
- `packages/frontend/src/api/onboarding.ts` (new)
- `packages/frontend/src/components/layout/AppShell.tsx` (modify — integrate WelcomeModal and OnboardingChecklist)
- `packages/frontend/src/components/layout/Sidebar.tsx` (modify — integrate checklist widget for desktop)
- `packages/frontend/src/components/layout/BottomNav.tsx` (modify — floating icon for mobile checklist)

**Definition of Done:**
- All migrations executed without errors
- Existing tenants pre-completed
- All backend tests pass
- All frontend tests pass
- Welcome modal appears once and never again
- Auto-completion works for all 6 steps via domain events
- Checklist hides after completion
- Only admin sees onboarding UI
- All UI renders correctly on mobile (375px), tablet, desktop

---

### TASK 31 — Phase 2 Full System Validation (E2E)

**Frontmatter:**
- status: pending
- type: test
- complexity: critical
- dependencies: [task_30]

**Overview:**
Comprehensive end-to-end validation of all Phase 2 functionality. This is a test-only task — NO production code is written. Uses Playwright for automated browser-based E2E tests covering critical user flows, complemented by a manual test suite documented for visual/UX verification. Validates the full lifecycle: tenant registration → branding setup → public landing → public quote flow → account creation → quote approval → scheduling → payment → analytics → onboarding completion.

**Note: This task is test-only. Use task_16.md as the format reference. Do NOT include the "Phase 1 Patterns" section since this is not a production code task. Include execution header from task_16.md style.**

**Requirements:**

Setup:
- MUST install Playwright with TypeScript support: `npm install -D @playwright/test`
- MUST configure Playwright in `playwright.config.ts` at project root:
  - Test directory: `packages/backend/test/e2e/`
  - Base URL: `http://localhost:5173`
  - Browsers: chromium (primary), firefox, webkit (smoke tests only)
  - Mobile viewport tests: iPhone 13 viewport size (390x844)
  - Retries: 2 on CI, 0 locally
  - Parallel workers: 4 max
- MUST create test database initialization script that seeds a clean state before each test suite

Test fixtures:
- MUST create `test/e2e/fixtures/` directory with reusable fixtures:
  - `auth.fixture.ts` — pre-authenticated tenant admin, staff, and client contexts
  - `tenant.fixture.ts` — fresh tenant with seed data
  - `stripe-mock.fixture.ts` — Stripe webhook test events
  - `email-mock.fixture.ts` — captures sent emails for assertion

E2E test suites:

## E2E Suite 1: Tenant Onboarding Flow
Tests the complete first-time user experience from registration to first quote.

Scenarios:
- New tenant registers with email/password
- Receives verification email
- Verifies email via link
- Sees welcome modal on first login
- Dismisses welcome modal
- Configures branding (logo, primary color, slug)
- Creates first service
- Creates first client
- Configures payment as Manual
- Creates first quote
- Onboarding checklist shows 6/6 completed and disappears

## E2E Suite 2: Public Tenant Product Flow
Tests the public-facing quote and booking flow for end clients.

Scenarios:
- Anonymous visitor accesses `/t/:tenantSlug` and sees branded landing page
- Visitor clicks "Solicitar Orçamento" and fills public quote form
- Real-time price estimate updates as form changes
- Visitor clicks "Continuar para cadastro"
- Draft persists in sessionStorage
- Visitor creates account via email/password
- Quote is submitted with origin='public', status='draft', approval_required=true
- Tenant admin approves quote
- Client logs in and accesses scheduling page
- Calendar shows available time slots
- Client selects date/time
- First-booking modal appears
- Client confirms booking
- Booking is created with status='pending_approval'
- Tenant admin approves booking via Kanban
- Booking transitions to confirmed

## E2E Suite 3: Stripe Connect & Payment Flow
Tests Stripe Connect onboarding and end-to-end payment with Stripe test mode.

Scenarios:
- Tenant admin sees highlighted card about reading payment info
- Admin navigates to /settings/payments/info-br (BR tenant)
- Admin scrolls to bottom and accepts terms
- Admin returns to /settings/payments and selects "Integração com Stripe"
- Admin sees fee summary modal and confirms
- Admin is redirected to Stripe Connect test onboarding
- Admin completes Stripe-hosted onboarding (test mode)
- Returns to /settings/payments/connected and sees status active
- Admin enables "Pré-pagamento" (default)
- Client completes quote/booking flow (Suite 2)
- After admin approves booking, client receives payment link email
- Client opens payment page and sees Stripe Payment Element
- Client pays with test card 4242 4242 4242 4242
- Webhook payment_intent.succeeded transitions booking to confirmed
- Client receives payment success email
- Admin sees payment in /payments with correct fees breakdown

## E2E Suite 4: Subscription Flow (Platform Level)
Tests platform subscription flow for tenants paying SaaS.

Scenarios:
- Tenant admin views /settings/billing
- Sees available plans (monthly, semiannual, annual)
- Clicks "Assinar" on annual plan
- Redirected to Stripe Checkout (test mode)
- Completes checkout with test card
- Webhook checkout.session.completed creates TenantSubscription
- Returns to /settings/billing/success
- Sees active subscription details
- Tests cancellation flow (at period end)

## E2E Suite 5: Permissions & Staff Management
Tests granular permissions and staff user management.

Scenarios:
- Admin creates staff user with limited permissions (clients:read only)
- Staff receives verification email
- Staff is blocked from login until verified
- Staff verifies email and logs in
- Staff sees only Clients menu in sidebar
- Staff can view clients but no edit buttons visible
- Staff attempts API call to create client → 403
- Admin updates staff to add clients:write
- Staff sees edit buttons after refresh
- Admin cannot remove their own admin role (last admin protection)

## E2E Suite 6: Password Recovery & Email Verification
Tests forgot password flow and email verification edge cases.

Scenarios:
- User requests password reset for valid email
- Receives email with reset link
- Clicks link, sets new password
- Auto-logged in to dashboard
- Old password no longer works
- Rate limit: 4th request within 1 hour returns 429
- Token expires after 24h (test by manipulating DB)
- Used token cannot be reused
- Forgot password for non-existent email returns generic success (no enumeration)
- Unverified admin can access dashboard but redirected from /settings to /dashboard
- Banner shown to unverified admin
- Verification link verifies and removes banner

## E2E Suite 7: i18n & Locale Detection
Tests language detection and switching across locales.

Scenarios:
- BR tenant with browser pt-BR sees Portuguese UI
- US tenant with browser en sees English UI
- US tenant with browser es sees Spanish UI
- Email sent to user matches user.locale
- Email sent to user with null user.locale falls back to tenant.locale
- Date formatting respects locale (14/05/2026 vs 05/14/2026)
- Currency formatting respects locale (R$ 1.234,56 vs $1,234.56)
- All error messages localized

## E2E Suite 8: Analytics Dashboard
Tests analytics page with sample data.

Scenarios:
- Admin navigates to /analytics
- Sees Operational tab by default
- Quote funnel renders with correct data
- Switches date range to last 7 days
- Numbers update accordingly
- Toggles comparison with previous period
- Switches to Financial tab
- Revenue total matches sum of test payments
- Exports CSV — file downloads
- Exports PDF — file downloads
- Staff without reports:read permission does NOT see analytics in sidebar
- Staff API call to /analytics/operational returns 403

## E2E Suite 9: Mobile-First Responsiveness
Tests all critical flows on mobile viewport (390x844).

Scenarios:
- Public landing page renders correctly on mobile
- Public quote form is usable on mobile (no horizontal scroll, all CTAs accessible)
- Bottom action bar shows total and CTA on mobile
- Scheduling calendar usable on mobile
- Payment page renders Payment Element on mobile
- Admin can complete all onboarding steps on mobile
- BottomNav shows correct items based on permissions
- Settings tabs accessible on mobile

## E2E Suite 10: Cross-Tenant Isolation
Critical security validation — ensures NO data leakage between tenants.

Scenarios:
- Tenant A creates services, clients, quotes
- Tenant B login: cannot see Tenant A's data on any list page
- Tenant B API calls with Tenant A's UUIDs return 404 or 403
- Public endpoint GET /public/:tenantSlugA/services queried with tenantSlugB returns 404
- Public quote estimate rejects service_id from different tenant
- Public booking rejects quote_id from different client
- Analytics returns only current tenant's metrics
- Stripe Connect: payments scoped per tenant Stripe account

Manual test suite (documented in `test/e2e/manual/`):
- Visual regression for design system compliance
- Animations and transitions feel polished
- Loading states clear and consistent
- Error states friendly and actionable
- Accessibility: keyboard navigation works on all forms
- Accessibility: screen reader announcements correct
- Print stylesheets for invoices and reports

CI integration:
- MUST add GitHub Actions workflow at `.github/workflows/e2e.yml`:
  - Runs on PR and main branch pushes
  - Spins up Postgres, Stripe-mock, and runs full E2E suite
  - Uploads test artifacts (screenshots, videos) on failure
  - Fails build if any E2E test fails

Test reports:
- MUST generate HTML report after each run via `playwright-html-reporter`
- MUST store reports in `test-results/` directory (gitignored)
- MUST capture screenshots and videos on failure

## Definition of Done:
- Playwright configured and runs successfully
- All 10 E2E suites pass in CI
- Test database seeding works deterministically
- Stripe Connect onboarding tested in test mode end-to-end
- All critical flows have automated coverage
- Manual test suite documented in `test/e2e/manual/README.md`
- CI workflow runs on every PR
- Test report generated and reviewable
- Cross-tenant isolation validated with explicit security tests
- Mobile responsiveness validated on iPhone 13 viewport
- No flaky tests (retry passes do not mask flakiness)

**Implementation files:**
- `playwright.config.ts` (new — at project root)
- `packages/backend/test/e2e/fixtures/*.ts` (new — auth, tenant, stripe-mock, email-mock fixtures)
- `packages/backend/test/e2e/suite-01-tenant-onboarding.spec.ts` (new)
- `packages/backend/test/e2e/suite-02-public-tenant-product.spec.ts` (new)
- `packages/backend/test/e2e/suite-03-stripe-connect-payment.spec.ts` (new)
- `packages/backend/test/e2e/suite-04-subscription-flow.spec.ts` (new)
- `packages/backend/test/e2e/suite-05-permissions-staff.spec.ts` (new)
- `packages/backend/test/e2e/suite-06-password-recovery-email-verification.spec.ts` (new)
- `packages/backend/test/e2e/suite-07-i18n-locale.spec.ts` (new)
- `packages/backend/test/e2e/suite-08-analytics.spec.ts` (new)
- `packages/backend/test/e2e/suite-09-mobile-responsiveness.spec.ts` (new)
- `packages/backend/test/e2e/suite-10-cross-tenant-isolation.spec.ts` (new)
- `packages/backend/test/e2e/manual/README.md` (new — manual test checklist)
- `.github/workflows/e2e.yml` (new — CI workflow)
- `packages/backend/test/e2e/scripts/seed-test-db.ts` (new — deterministic seeding)

---

## _tasks.md update instructions

Add the following rows to the task table, after the existing T28 row:

| 29 | Operational & Financial Analytics Dashboard | pending | high | task_28 |
| 30 | In-App Onboarding (Welcome Modal + Progressive Checklist) | pending | medium | task_29 |
| 31 | Phase 2 Full System Validation (E2E) | pending | critical | task_30 |

---

## _techspec.md update instructions

EXTEND the existing "Phase 2 — Public Tenant Product" section by APPENDING the following subsections (do not duplicate or remove existing content):

#### Analytics Architecture (Phase 2E)

**Data layer:**
- `analytics_snapshots` table — daily aggregated metrics per tenant, populated by scheduled job at 01:00
- Database views/materialized views for real-time aggregation: `mv_quotes_funnel`, `mv_bookings_status`, `mv_revenue_by_method`, `mv_service_popularity`
- Snapshot strategy: historical data from snapshots (fast), recent 24h from live queries (accurate)

**Service layer:**
- `AnalyticsService` exposes scoped metrics per tenant
- All queries tenant_id-scoped at SQL level
- Date range validation: max 365 days, no future `to`
- Period comparison auto-calculates equivalent previous period

**Endpoints:**
- `GET /api/v1/analytics/operational` — quote funnel, bookings status, approval times, service popularity, active clients
- `GET /api/v1/analytics/financial` — revenue, fees, ticket size, revenue by method, MRR
- `GET /api/v1/analytics/export.csv` — CSV export
- `GET /api/v1/analytics/export.pdf` — PDF export via server-side rendering
- All require `reports:read` permission and rate-limited (30 req/min)

**Frontend:**
- Single route `/analytics` with two tabs: Operacional / Financeiro
- Charts via `recharts` library
- Date range picker with presets
- Period comparison toggle
- Export menu (CSV / PDF)
- Mobile-first responsive

#### Onboarding System (Phase 2E)

**State:**
- `tenant_onboarding_progress` table — one record per tenant tracking 6 boolean flags + `welcome_modal_dismissed` + `completed_at`
- Existing tenants pre-completed on migration

**Auto-completion via domain events:**
- `EmailVerifiedEvent` → email_verified
- `BrandingUpdatedEvent` → branding_configured
- `ServiceCreatedEvent` → first_service_created
- `ClientCreatedEvent` → first_client_created
- `PaymentConfigUpdatedEvent` → payment_configured
- `QuoteCreatedEvent` → first_quote_created

**UI components:**
- `WelcomeModal` — first-session only, dismissible (one-time)
- `OnboardingChecklist` — sidebar widget (desktop), bottom sheet via floating icon (mobile)
- Visibility: admin role only; staff and public clients do NOT see onboarding UI
- Disappears 24h after `completed_at` is set

**Endpoints:**
- `GET /api/v1/onboarding/progress`
- `POST /api/v1/onboarding/welcome-dismiss` (admin)
- `POST /api/v1/onboarding/skip` (admin, one-way action)

#### E2E Testing Strategy (Phase 2E)

**Framework:**
- Playwright with TypeScript
- 10 test suites covering critical flows
- Mobile viewport tests on iPhone 13 (390x844)
- Cross-browser smoke tests (chromium primary, firefox/webkit smoke)

**Test suites:**
1. Tenant Onboarding Flow
2. Public Tenant Product Flow
3. Stripe Connect & Payment Flow
4. Subscription Flow (Platform Level)
5. Permissions & Staff Management
6. Password Recovery & Email Verification
7. i18n & Locale Detection
8. Analytics Dashboard
9. Mobile-First Responsiveness
10. Cross-Tenant Isolation (security validation)

**Infrastructure:**
- Test database seeded deterministically before each suite
- Stripe-mock fixture for Stripe API simulation
- Email-mock fixture captures sent emails for assertion
- GitHub Actions CI runs full suite on every PR
- HTML reports + screenshots + videos on failure

**Manual test suite:**
- Visual regression
- Animations and transitions
- Accessibility (keyboard, screen reader)
- Print stylesheets

#### New Frontend Routes (Phase 2E)
- `/analytics` — analytics dashboard

#### Critical Rules (Phase 2E additions)
- Analytics queries MUST be tenant_id-scoped at SQL level — NEVER trust user-supplied tenant ID
- Numeric aggregations MUST happen server-side; client only renders
- Date range validation MUST cap at 365 days
- Export files (CSV/PDF) MUST be generated server-side
- Snapshot job MUST be idempotent (UPSERT pattern)
- Onboarding state changes MUST flow through domain events — never direct UI flag manipulation
- Onboarding UI MUST be hidden for staff and public clients (admin-only experience)
- E2E tests MUST cover cross-tenant isolation explicitly (security test suite)
- E2E tests MUST run in CI on every PR; failures block merge
- No flaky tests tolerated — retries pass MUST not mask flakiness (fix or quarantine)

---

Do NOT execute any task. Do NOT write any application code. Only create the task files and update `_tasks.md` and `_techspec.md`.
