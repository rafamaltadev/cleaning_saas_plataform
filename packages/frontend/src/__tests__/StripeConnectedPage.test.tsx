import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders, authenticatedState } from './utils';
import { server } from './mocks/server';
import StripeConnectedPage from '../pages/settings/StripeConnectedPage';

const BASE = '/api/v1';

describe('StripeConnectedPage', () => {
  it('shows "Stripe Connected!" when charges and payouts enabled', async () => {
    server.use(
      http.get(`${BASE}/billing/connect/status`, () =>
        HttpResponse.json({
          data: {
            connected: true,
            stripe_connect_status: 'active',
            stripe_connect_charges_enabled: true,
            stripe_connect_payouts_enabled: true,
            stripe_connect_requirements: null,
            payment_mode: 'manual',
            payment_timing: 'prepaid',
          },
        }),
      ),
    );

    renderWithProviders(<StripeConnectedPage />, { preloadedState: authenticatedState });

    await waitFor(() => {
      expect(screen.getByText(/Stripe Connected!/i)).toBeDefined();
    });
  });

  it('shows "Setup In Progress" when account is pending', async () => {
    server.use(
      http.get(`${BASE}/billing/connect/status`, () =>
        HttpResponse.json({
          data: {
            connected: true,
            stripe_connect_status: 'pending',
            stripe_connect_charges_enabled: false,
            stripe_connect_payouts_enabled: false,
            stripe_connect_requirements: null,
            payment_mode: 'manual',
            payment_timing: 'prepaid',
          },
        }),
      ),
    );

    renderWithProviders(<StripeConnectedPage />, { preloadedState: authenticatedState });

    await waitFor(() => {
      expect(screen.getByText(/Setup In Progress/i)).toBeDefined();
    });
  });
});
