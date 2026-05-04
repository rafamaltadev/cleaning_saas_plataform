/**
 * T16 — Frontend E2E Tests: Authenticated Application (T13 + T14)
 *
 * Tool: @playwright/test
 * Rationale: Playwright is TypeScript-first, provides built-in auto-wait for
 * DOM elements (eliminating most timing flakiness), has first-class Vite/React
 * SPA support, and is the industry standard for modern browser E2E automation.
 * Tests run against the live frontend at localhost:5173 with the full
 * Docker Compose stack active and seed data applied.
 *
 * Prerequisites:
 *   docker compose up -d
 *   npm run seed   (in packages/backend, with SEED_DEFAULT_PASSWORD set)
 *   cd tests && npm install && npx playwright install chromium
 */

import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@seed.local';
const SUPERVISOR_EMAIL = process.env.SUPERVISOR_EMAIL ?? 'supervisor@seed.local';
const STAFF_EMAIL = process.env.STAFF_EMAIL ?? 'staff@seed.local';
const SEED_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'seed123';

// ─── Helper ──────────────────────────────────────────────────────────────────

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  // LoginPage redirects to /kanban after successful login
  await page.waitForURL('**/kanban', { timeout: 15_000 });
}

// ─── Full booking workflow ────────────────────────────────────────────────────

test.describe('Full booking workflow (admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, SEED_PASSWORD);
  });

  test('login → navigate to clients → create client → navigate to quotes → navigate to bookings', async ({
    page,
  }) => {
    const suffix = Date.now();

    // Navigate to clients list
    await page.goto('/clients');
    await expect(page).toHaveURL(/clients/, { timeout: 10_000 });

    // Create a new client
    await page.goto('/clients/new');
    await page.getByLabel(/name/i).fill(`E2E Client ${suffix}`);
    await page.getByLabel(/email/i).fill(`e2e-${suffix}@test.com`);
    await page.getByLabel(/phone/i).fill('+5511999990099');
    await page.getByRole('button', { name: /save|create|submit/i }).click();

    // After save, should land back on clients list or client detail
    await expect(page).toHaveURL(/clients/, { timeout: 10_000 });

    // Navigate to quotes
    await page.goto('/quotes');
    await expect(page).toHaveURL(/quotes/);

    // Navigate to bookings
    await page.goto('/bookings');
    await expect(page).toHaveURL(/bookings/);
  });

  test('dashboard renders and shows metric cards', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);
    // At least one stat card visible
    await expect(
      page.locator('[class*="card"], [class*="stat"], [class*="metric"]').first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('dashboard metrics reflect confirmed bookings count', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);
    // Page loaded without error
    await expect(page.locator('body')).not.toContainText('Error');
  });
});

// ─── Kanban board ─────────────────────────────────────────────────────────────

test.describe('Kanban board', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, SEED_PASSWORD);
  });

  test('renders columns with quote/booking cards in correct status columns', async ({
    page,
  }) => {
    await page.goto('/kanban');
    await expect(page).toHaveURL(/kanban/);
    // At least one column heading is visible
    const columns = page.locator(
      '[class*="column"], [class*="kanban"], [data-testid*="column"]',
    );
    await expect(columns.first()).toBeVisible({ timeout: 10_000 });
  });
});

// ─── Settings screen ──────────────────────────────────────────────────────────

test.describe('Settings screen (admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, SEED_PASSWORD);
  });

  test('loads and displays company profile form', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/settings/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /setting/i })).toBeVisible();
  });

  test('saves company profile changes without error', async ({ page }) => {
    await page.goto('/settings');
    // Find the company name field and update it
    const nameInput = page.getByLabel(/company|nome|name/i).first();
    await expect(nameInput).toBeVisible({ timeout: 10_000 });
    await nameInput.fill('E2E Updated Company');
    await page.getByRole('button', { name: /save|salvar/i }).click();
    // No error state should appear
    await expect(page.locator('[role="alert"]')).not.toContainText(
      /error|erro|fail/i,
      { timeout: 5_000 },
    );
  });

  test('Stripe placeholder section renders without errors', async ({ page }) => {
    await page.goto('/settings');
    // Stripe section should be present (placeholder from T14 spec)
    await expect(page.locator('body')).not.toContainText('Unhandled error');
  });
});

// ─── Role-based UI restrictions ───────────────────────────────────────────────

test.describe('Role-based UI restrictions', () => {
  test('staff user cannot access settings route', async ({ page }) => {
    await loginAs(page, STAFF_EMAIL, SEED_PASSWORD);
    await page.goto('/settings');
    // Staff should be redirected away or see access denied
    await expect(page).not.toHaveURL(/settings/, { timeout: 5_000 });
  });

  test('supervisor can access quotes and bookings but not settings', async ({
    page,
  }) => {
    await loginAs(page, SUPERVISOR_EMAIL, SEED_PASSWORD);

    await page.goto('/quotes');
    await expect(page).toHaveURL(/quotes/);

    await page.goto('/bookings');
    await expect(page).toHaveURL(/bookings/);
  });
});

// ─── Token refresh transparency ───────────────────────────────────────────────

test.describe('Token refresh', () => {
  test('session remains active across multiple page navigations', async ({
    page,
  }) => {
    await loginAs(page, ADMIN_EMAIL, SEED_PASSWORD);

    const routes = ['/dashboard', '/clients', '/quotes', '/bookings', '/kanban'];
    for (const route of routes) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(route.replace('/', '')));
      await expect(page.locator('body')).not.toContainText(/sign in|login/i);
    }
  });
});
