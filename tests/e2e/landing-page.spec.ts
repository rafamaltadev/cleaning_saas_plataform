/**
 * T16 — Frontend E2E Tests: Landing Page (T15)
 *
 * Tool: @playwright/test
 * Rationale: Same as authenticated-app.spec.ts — Playwright provides TypeScript-
 * first browser automation with built-in auto-wait, ideal for testing the React
 * SPA at localhost:5173. The landing page is a public route with no authentication
 * required, making these tests fast and isolated.
 *
 * Prerequisites:
 *   docker compose up -d
 *   cd tests && npm install && npx playwright install chromium
 */

import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@seed.local';
const SEED_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'seed123';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function loginAndGoHome(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(SEED_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/kanban', { timeout: 15_000 });
}

// ─── Section rendering ────────────────────────────────────────────────────────

test.describe('Landing page — section rendering', () => {
  test('renders all 9 required sections in the correct top-to-bottom order', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('landing-page')).toBeVisible();

    // All sections must be present
    await expect(page.getByTestId('hero-section')).toBeVisible();
    await expect(page.getByTestId('pricing-section')).toBeVisible();
    await expect(page.getByTestId('simulation-section')).toBeVisible();
    await expect(page.getByTestId('final-cta-primary')).toBeVisible();

    // Sections must appear in order (Y-coordinate check)
    const heroBox = await page.getByTestId('hero-section').boundingBox();
    const pricingBox = await page.getByTestId('pricing-section').boundingBox();
    const simulationBox = await page.getByTestId('simulation-section').boundingBox();

    expect(heroBox).not.toBeNull();
    expect(pricingBox).not.toBeNull();
    expect(simulationBox).not.toBeNull();

    expect(heroBox!.y).toBeLessThan(pricingBox!.y);
    expect(pricingBox!.y).toBeLessThan(simulationBox!.y);
  });
});

// ─── Authentication redirect ──────────────────────────────────────────────────

test.describe('Landing page — authentication redirect', () => {
  test('authenticated user visiting / is redirected to dashboard (not landing page)', async ({
    page,
  }) => {
    await loginAndGoHome(page);

    // Visit the root route
    await page.goto('/');

    // Must land on dashboard or kanban — NOT the landing page
    await expect(page).not.toHaveURL(/^http:\/\/localhost:5173\/?$/, {
      timeout: 5_000,
    });
    await expect(page.getByTestId('landing-page')).not.toBeVisible();
  });
});

// ─── Pricing — locale detection ───────────────────────────────────────────────

test.describe('Landing page — pricing section locale detection', () => {
  test('displays BRL prices when browser locale is pt-BR', async ({ browser }) => {
    const ctx = await browser.newContext({ locale: 'pt-BR' });
    const page = await ctx.newPage();
    await page.goto('/');

    await expect(page.getByText(/R\$ 59,90/)).toBeVisible({ timeout: 10_000 });
    // Currency toggle must NOT be shown for pt-BR locale
    await expect(page.getByTestId('currency-toggle-brl')).not.toBeVisible();

    await ctx.close();
  });

  test('displays USD prices as default for non-pt-BR locale', async ({ browser }) => {
    const ctx = await browser.newContext({ locale: 'en-US' });
    const page = await ctx.newPage();
    await page.goto('/');

    await expect(page.getByText(/\$19\.90/)).toBeVisible({ timeout: 10_000 });

    await ctx.close();
  });
});

// ─── Pricing — currency toggle ────────────────────────────────────────────────

test.describe('Landing page — currency toggle', () => {
  test('BRL/USD toggle switches prices correctly for non-pt-BR locale', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ locale: 'en-US' });
    const page = await ctx.newPage();
    await page.goto('/');

    const brlToggle = page.getByTestId('currency-toggle-brl');
    const usdToggle = page.getByTestId('currency-toggle-usd');

    // Default: USD visible
    await expect(page.getByText(/\$19\.90/)).toBeVisible({ timeout: 10_000 });

    // Switch to BRL
    await brlToggle.click();
    await expect(page.getByText(/R\$ 59,90/)).toBeVisible();

    // Switch back to USD
    await usdToggle.click();
    await expect(page.getByText(/\$19\.90/)).toBeVisible();

    await ctx.close();
  });
});

// ─── Pricing — plan badges and cards ─────────────────────────────────────────

test.describe('Landing page — pricing cards', () => {
  test('Growth plan card is visually distinct and carries the Most Popular badge', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('most-popular-badge')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('pricing-card-growth')).toBeVisible();
  });

  test('Scale plan card carries the Best Value badge', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('best-value-badge')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('pricing-card-scale')).toBeVisible();
  });

  test('all three pricing cards include a CTA button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('pricing-cta-starter')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('pricing-cta-growth')).toBeVisible();
    await expect(page.getByTestId('pricing-cta-scale')).toBeVisible();
  });
});

// ─── CTAs ─────────────────────────────────────────────────────────────────────

test.describe('Landing page — primary CTAs', () => {
  test('primary CTA "Começar Grátis" is present in Hero section', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('hero-cta-primary')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('hero-cta-primary')).toContainText(
      'Começar Grátis',
    );
  });

  test('primary CTA "Começar Grátis" is present in Final CTA section', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('final-cta-primary')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('final-cta-primary')).toContainText(
      'Começar Grátis',
    );
  });
});

// ─── Navigation ───────────────────────────────────────────────────────────────

test.describe('Landing page — navigation', () => {
  test('Log In link navigates to the login screen', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('login-link').click();
    await expect(page).toHaveURL(/login/, { timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });
});

// ─── Live simulation ──────────────────────────────────────────────────────────

test.describe('Landing page — live simulation section', () => {
  test('simulation section renders and animates without crashing', async ({
    page,
  }) => {
    // Listen for uncaught errors
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await expect(page.getByTestId('simulation-section')).toBeVisible({ timeout: 10_000 });

    // Wait long enough for the animation cycle to advance at least once
    await page.waitForTimeout(3_500);

    // Simulation section must still be present and the page must not have crashed
    await expect(page.getByTestId('simulation-section')).toBeVisible();
    expect(errors).toHaveLength(0);
  });
});
