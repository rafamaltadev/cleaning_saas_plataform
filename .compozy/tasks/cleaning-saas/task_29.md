---
status: pending
title: "Operational & Financial Analytics Dashboard"
type: feature
complexity: high
dependencies: [task_28]
---

# Task 29: Operational & Financial Analytics Dashboard

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

Implements a unified analytics dashboard at `/analytics` accessible to users with `reports:read` permission. The page has two tabs: "Operacional" (quote funnel, conversion rates, booking statuses, service popularity, average approval times) and "Financeiro" (revenue, fees, MRR/ARR, ticket size, period comparisons). All metrics are scoped to the current tenant, calculated on the backend (never trust client-side aggregates), and respect the tenant's currency and locale. The dashboard supports date range filtering, comparison with previous period, and CSV/PDF export.

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

- MUST create migration `1714000000050-CreateAnalyticsViews`:
  - Creates database views per metric for performance:
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

### Backend — Snapshot Job

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

### Backend — Services

- MUST create `AnalyticsService` in `src/modules/analytics/analytics.service.ts`:
  - All methods accept `{ tenantId, from: Date, to: Date, compareToPreviousPeriod?: boolean }`
  - `getQuoteFunnel(params)` — returns counts at each stage: created → sent → accepted → rejected → expired; conversion rates between stages
  - `getBookingsByStatus(params)` — returns counts by status (pending_approval, confirmed, completed, cancelled)
  - `getAverageApprovalTime(params)` — average time between quote `sent` and `accepted` status changes (hours)
  - `getServicePopularity(params)` — top 10 services by quote count and revenue
  - `getRevenue(params)` — total revenue, breakdown by payment method, period comparison
  - `getFees(params)` — platform fees collected + stripe fees paid (both as separate values)
  - `getMRR(tenantId)` — calculates Monthly Recurring Revenue from active subscriptions
  - `getTicketSize(params)` — average paid amount per booking
  - `getActiveClients(params)` — distinct clients with activity, comparison with previous period
- All queries MUST be `tenant_id`-scoped at SQL level — never trust user-supplied tenant ID
- MUST use database views/snapshots when available for performance — fall back to live queries for date ranges within last 24h

### Backend — Endpoints

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

### Backend — Date Range Validation

- Max range: 365 days
- `to` must not be in the future
- `from` must be <= `to`
- If `compare_previous=true`, automatically calculates the equivalent previous period (e.g. last 30 days → previous 30 days)

### Frontend — Page Structure

- MUST create new route `/analytics` accessible to users with `reports:read` permission
- MUST be added to sidebar with icon (only visible to users with permission)
- Page header:
  - Title "Analytics"
  - Date range picker (presets: "Últimos 7 dias", "Últimos 30 dias", "Este mês", "Mês passado", "Este ano", "Personalizado")
  - Comparison toggle: "Comparar com período anterior"
  - Export dropdown: "Exportar CSV" / "Exportar PDF"
- Tab navigation: "Operacional" | "Financeiro"

### Frontend — Operacional Tab

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

### Frontend — Financeiro Tab

- Revenue total (large stat card):
  - Total revenue in tenant's currency
  - Comparison with previous period
- Revenue by method (donut chart):
  - Cartão de crédito, Cartão de débito, PIX, ACH, Apple Pay, Google Pay, Manual
- Platform fees collected (stat card):
  - Total application_fee_cents (platform's revenue from this tenant)
- Stripe fees paid (stat card):
  - Total stripe_fee_cents paid by tenant
- Net revenue (stat card):
  - Revenue minus all fees
- Ticket size (stat card):
  - Average net amount per completed booking
- Trend chart (line chart):
  - Daily revenue over the selected period
  - X-axis: dates, Y-axis: revenue in tenant currency

### Frontend — Chart Library

- MUST use `recharts` library (already in stack from frontend MVP)
- All charts MUST be responsive (full width on mobile, fixed aspect on desktop)
- All charts MUST use design system colors
- Tooltips on hover/touch with formatted values (locale-aware)

### Frontend — Empty States

- If no data for selected period, show friendly empty state:
  - "Nenhum dado para o período selecionado"
  - CTA to adjust date range

### Frontend — Mobile Responsiveness

- Charts stack vertically on mobile
- Date range picker collapses into modal on mobile
- Export menu becomes bottom sheet on mobile
- Stat cards: 1 col mobile, 2 cols tablet, 3-4 cols desktop
- Tab navigation sticky at top

### Security

- All queries scoped to `tenant_id` at SQL level
- Analytics endpoints require `reports:read` permission
- Export endpoints log audit entries with: user_id, tenant_id, date_range, format
- Numeric calculations always server-side
- CSV/PDF generated server-side (never trust client-rendered exports)
- Rate limiting applied

## Tests

### Backend
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

### Frontend
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

## Implementation Files

### Backend
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

### Frontend
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

## Definition of Done

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
