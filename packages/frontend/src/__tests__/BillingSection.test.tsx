import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders, authenticatedState } from './utils';
import { server } from './mocks/server';
import BillingSection from '../pages/settings/sections/BillingSection';

const BASE = '/api/v1';

const MOCK_PLANS = [
  {
    id: 'plan-monthly',
    name: 'Basic Mensal',
    description: 'Plano básico mensal',
    tier: 'basic',
    interval: 'month',
    interval_count: 1,
    amount_cents: 9900,
    currency: 'BRL',
    is_active: true,
  },
  {
    id: 'plan-semiannual',
    name: 'Basic Semestral',
    description: 'Plano básico semestral',
    tier: 'basic',
    interval: 'semiannual',
    interval_count: 6,
    amount_cents: 53460,
    currency: 'BRL',
    is_active: true,
  },
  {
    id: 'plan-annual',
    name: 'Basic Anual',
    description: 'Plano básico anual',
    tier: 'basic',
    interval: 'year',
    interval_count: 12,
    amount_cents: 95040,
    currency: 'BRL',
    is_active: true,
  },
];

const MOCK_ACTIVE_SUBSCRIPTION = {
  id: 'sub-uuid',
  tenant_id: 'tenant-1',
  plan_id: 'plan-monthly',
  stripe_subscription_id: 'sub_test123',
  status: 'active',
  current_period_start: '2024-01-01T00:00:00Z',
  current_period_end: '2024-02-01T00:00:00Z',
  cancel_at_period_end: false,
  canceled_at: null,
  trial_ends_at: null,
  grandfathered_price_cents: 9900,
  discount_ratio: null,
  created_at: '2024-01-01T00:00:00Z',
};

function setupBillingHandlers(sub: typeof MOCK_ACTIVE_SUBSCRIPTION | null = MOCK_ACTIVE_SUBSCRIPTION) {
  server.use(
    http.get(`${BASE}/billing/subscription/me`, () =>
      HttpResponse.json({ data: sub }),
    ),
    http.get(`${BASE}/billing/plans`, () =>
      HttpResponse.json({ data: MOCK_PLANS }),
    ),
    http.post(`${BASE}/billing/checkout`, async ({ request }) => {
      const body = await request.json() as { plan_id: string };
      return HttpResponse.json({
        data: {
          checkout_url: `https://checkout.stripe.com/pay/cs_test_${body.plan_id}`,
          session_id: `cs_test_${body.plan_id}`,
        },
      });
    }),
    http.post(`${BASE}/billing/subscription/cancel`, () =>
      HttpResponse.json({ data: { ...MOCK_ACTIVE_SUBSCRIPTION, cancel_at_period_end: true } }),
    ),
    http.post(`${BASE}/billing/subscription/change-plan`, () =>
      HttpResponse.json({ data: MOCK_ACTIVE_SUBSCRIPTION }),
    ),
    http.post(`${BASE}/billing/portal`, () =>
      HttpResponse.json({ data: { url: 'https://billing.stripe.com/p/session_test' } }),
    ),
  );
}

describe('BillingSection', () => {
  describe('Plans grid', () => {
    it('renders 3 plan cards when no active subscription', async () => {
      setupBillingHandlers(null);
      renderWithProviders(<BillingSection />, { preloadedState: authenticatedState });

      await waitFor(() => {
        expect(screen.getByText('Basic Mensal')).toBeInTheDocument();
        expect(screen.getByText('Basic Semestral')).toBeInTheDocument();
        expect(screen.getByText('Basic Anual')).toBeInTheDocument();
      });
    });

    it('shows 10% off badge for semiannual plan', async () => {
      setupBillingHandlers(null);
      renderWithProviders(<BillingSection />, { preloadedState: authenticatedState });

      await waitFor(() => {
        expect(screen.getByText('10% off')).toBeInTheDocument();
      });
    });

    it('shows 20% off badge for annual plan', async () => {
      setupBillingHandlers(null);
      renderWithProviders(<BillingSection />, { preloadedState: authenticatedState });

      await waitFor(() => {
        expect(screen.getByText('20% off')).toBeInTheDocument();
      });
    });
  });

  describe('"Assinar" button', () => {
    it('shows Assinar button when no subscription', async () => {
      setupBillingHandlers(null);
      renderWithProviders(<BillingSection />, { preloadedState: authenticatedState });

      await waitFor(() => {
        const assinarButtons = screen.getAllByRole('button', { name: /assinar plano/i });
        expect(assinarButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Active subscription overview', () => {
    it('shows subscription status badge when subscription is active', async () => {
      setupBillingHandlers(MOCK_ACTIVE_SUBSCRIPTION);
      renderWithProviders(<BillingSection />, { preloadedState: authenticatedState });

      await waitFor(() => {
        expect(screen.getByText('Ativa')).toBeInTheDocument();
      });
    });

    it('shows cancel confirmation modal with correct end date', async () => {
      const user = userEvent.setup();
      setupBillingHandlers(MOCK_ACTIVE_SUBSCRIPTION);
      renderWithProviders(<BillingSection />, { preloadedState: authenticatedState });

      await waitFor(() => screen.getByRole('button', { name: /cancelar assinatura/i }));

      await user.click(screen.getByRole('button', { name: /cancelar assinatura/i }));

      await waitFor(() => {
        expect(screen.getByText(/Tem certeza que deseja cancelar/i)).toBeInTheDocument();
        expect(screen.getByText(/01\/02\/2024/)).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('shows error message at top of form on submit failure', async () => {
      const user = userEvent.setup();

      server.use(
        http.get(`${BASE}/billing/subscription/me`, () =>
          HttpResponse.json({ data: null }),
        ),
        http.get(`${BASE}/billing/plans`, () =>
          HttpResponse.json({ data: MOCK_PLANS }),
        ),
        http.post(`${BASE}/billing/checkout`, () =>
          HttpResponse.json(
            { error: { message: 'Plano não encontrado' } },
            { status: 404 },
          ),
        ),
      );

      renderWithProviders(<BillingSection />, { preloadedState: authenticatedState });
      await waitFor(() => screen.getAllByRole('button', { name: /assinar plano/i }));

      const firstAssinar = screen.getAllByRole('button', { name: /assinar plano/i })[0];
      await user.click(firstAssinar);

      await waitFor(() => {
        const errorMsg = screen.getByRole('alert');
        expect(errorMsg).toBeInTheDocument();
      });
    });
  });
});
