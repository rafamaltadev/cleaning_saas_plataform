---
status: pending
title: "Phase 2 Full System Validation (E2E)"
type: test
complexity: critical
dependencies: [task_30]
---

# Task 31: Phase 2 Full System Validation (E2E)

---
You are a senior software engineer executing a predefined task in an existing codebase.
Your objective is to implement the task EXACTLY as specified.
<context>
- The project follows a strict sequential task system
- All dependencies listed in the task are already implemented
- You MUST trust the task specification as the single source of truth
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
</execution_rules>
<technical_constraints>
* Follow the current project stack and patterns strictly
* Maintain consistency with existing modules and naming conventions
* Ensure proper integration with previously implemented tasks
* Respect authentication, RBAC, and multi-tenancy rules
</technical_constraints>
<validation>
* Ensure all requirements are fully implemented
* Ensure no security rules are violated
* Ensure tenant isolation is preserved
* Ensure correct error handling (401, 403, 400, 500)
</validation>
<output_format>
* Provide only the necessary code changes
* Do not include explanations unless strictly necessary
* Keep output minimal, technical, and implementation-focused
</output_format>
Now execute the task below exactly as specified:
---

## Overview

Comprehensive end-to-end validation of all Phase 2 functionality. This is a test-only task — NO production code is written. Uses Playwright for automated browser-based E2E tests covering critical user flows, complemented by a manual test suite documented for visual/UX verification. Validates the full lifecycle: tenant registration → branding setup → public landing → public quote flow → account creation → quote approval → scheduling → payment → analytics → onboarding completion.

<requirements>
- This task contains NO production code changes
- All test files MUST be created in `packages/backend/test/e2e/` and fixture files in `packages/backend/test/e2e/fixtures/` — no existing production file outside these folders may be modified
- Playwright with TypeScript is the mandated E2E framework (justified: full-stack browser automation, native TypeScript support, mobile viewport simulation, built-in network mocking for Stripe webhooks, parallel test execution)
- All tests run against the local environment (Docker Compose up with deterministic seed data)
- Test database initialization script MUST seed a clean state before each test suite
- If a required fixture or helper does not exist, it MAY be created inside `packages/backend/test/e2e/fixtures/` — no production code may be created or modified
</requirements>

## Setup

- MUST install Playwright with TypeScript support: `npm install -D @playwright/test`
- MUST configure Playwright in `playwright.config.ts` at project root:
  - Test directory: `packages/backend/test/e2e/`
  - Base URL: `http://localhost:5173`
  - Browsers: chromium (primary), firefox, webkit (smoke tests only)
  - Mobile viewport tests: iPhone 13 viewport size (390x844)
  - Retries: 2 on CI, 0 locally
  - Parallel workers: 4 max
- MUST create test database initialization script that seeds a clean state before each test suite

## Test Fixtures

- MUST create `test/e2e/fixtures/` directory with reusable fixtures:
  - `auth.fixture.ts` — pre-authenticated tenant admin, staff, and client contexts
  - `tenant.fixture.ts` — fresh tenant with seed data
  - `stripe-mock.fixture.ts` — Stripe webhook test events
  - `email-mock.fixture.ts` — captures sent emails for assertion

## E2E Test Suites

### Suite 1: Tenant Onboarding Flow

Tests the complete first-time user experience from registration to first quote.

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

### Suite 2: Public Tenant Product Flow

Tests the public-facing quote and booking flow for end clients.

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

### Suite 3: Stripe Connect & Payment Flow

Tests Stripe Connect onboarding and end-to-end payment with Stripe test mode.

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

### Suite 4: Subscription Flow (Platform Level)

Tests platform subscription flow for tenants paying SaaS.

- Tenant admin views /settings/billing
- Sees available plans (monthly, semiannual, annual)
- Clicks "Assinar" on annual plan
- Redirected to Stripe Checkout (test mode)
- Completes checkout with test card
- Webhook checkout.session.completed creates TenantSubscription
- Returns to /settings/billing/success
- Sees active subscription details
- Tests cancellation flow (at period end)

### Suite 5: Permissions & Staff Management

Tests granular permissions and staff user management.

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

### Suite 6: Password Recovery & Email Verification

Tests forgot password flow and email verification edge cases.

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

### Suite 7: i18n & Locale Detection

Tests language detection and switching across locales.

- BR tenant with browser pt-BR sees Portuguese UI
- US tenant with browser en sees English UI
- US tenant with browser es sees Spanish UI
- Email sent to user matches user.locale
- Email sent to user with null user.locale falls back to tenant.locale
- Date formatting respects locale (14/05/2026 vs 05/14/2026)
- Currency formatting respects locale (R$ 1.234,56 vs $1,234.56)
- All error messages localized

### Suite 8: Analytics Dashboard

Tests analytics page with sample data.

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

### Suite 9: Mobile-First Responsiveness

Tests all critical flows on mobile viewport (390x844).

- Public landing page renders correctly on mobile
- Public quote form is usable on mobile (no horizontal scroll, all CTAs accessible)
- Bottom action bar shows total and CTA on mobile
- Scheduling calendar usable on mobile
- Payment page renders Payment Element on mobile
- Admin can complete all onboarding steps on mobile
- BottomNav shows correct items based on permissions
- Settings tabs accessible on mobile

### Suite 10: Cross-Tenant Isolation

Critical security validation — ensures NO data leakage between tenants.

- Tenant A creates services, clients, quotes
- Tenant B login: cannot see Tenant A's data on any list page
- Tenant B API calls with Tenant A's UUIDs return 404 or 403
- Public endpoint GET /public/:tenantSlugA/services queried with tenantSlugB returns 404
- Public quote estimate rejects service_id from different tenant
- Public booking rejects quote_id from different client
- Analytics returns only current tenant's metrics
- Stripe Connect: payments scoped per tenant Stripe account

## Manual Test Suite

Documented in `test/e2e/manual/README.md`:

- Visual regression for design system compliance
- Animations and transitions feel polished
- Loading states clear and consistent
- Error states friendly and actionable
- Accessibility: keyboard navigation works on all forms
- Accessibility: screen reader announcements correct
- Print stylesheets for invoices and reports

## CI Integration

- MUST add GitHub Actions workflow at `.github/workflows/e2e.yml`:
  - Runs on PR and main branch pushes
  - Spins up Postgres, Stripe-mock, and runs full E2E suite
  - Uploads test artifacts (screenshots, videos) on failure
  - Fails build if any E2E test fails

## Test Reports

- MUST generate HTML report after each run via `playwright-html-reporter`
- MUST store reports in `test-results/` directory (gitignored)
- MUST capture screenshots and videos on failure

## Definition of Done

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

## Implementation Files

- `playwright.config.ts` (new — at project root)
- `packages/backend/test/e2e/fixtures/auth.fixture.ts` (new)
- `packages/backend/test/e2e/fixtures/tenant.fixture.ts` (new)
- `packages/backend/test/e2e/fixtures/stripe-mock.fixture.ts` (new)
- `packages/backend/test/e2e/fixtures/email-mock.fixture.ts` (new)
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
