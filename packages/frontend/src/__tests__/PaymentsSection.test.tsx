import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders, authenticatedState } from './utils';
import { server } from './mocks/server';
import PaymentsSection from '../pages/settings/sections/PaymentsSection';

const BASE = '/api/v1';

const MOCK_STATUS_DISCONNECTED = {
  connected: false,
  stripe_connect_status: null,
  stripe_connect_charges_enabled: false,
  stripe_connect_payouts_enabled: false,
  stripe_connect_requirements: null,
  payment_mode: 'manual',
  payment_timing: 'prepaid',
};

const MOCK_STATUS_CONNECTED = {
  connected: true,
  stripe_connect_status: 'active',
  stripe_connect_charges_enabled: true,
  stripe_connect_payouts_enabled: true,
  stripe_connect_requirements: null,
  payment_mode: 'manual',
  payment_timing: 'prepaid',
};

const MOCK_TERMS = {
  id: 'terms-uuid',
  version: 'v1.0-BR-pt-BR',
  country: 'BR',
  language: 'pt-BR',
  content: 'Termos de serviço de pagamentos v1.0',
  platform_fee_percent: 1,
  stripe_fee_card_percent: 3.99,
  stripe_fee_pix_percent: 0.99,
  stripe_fee_ach_percent: null,
  effective_from: '2024-01-01T00:00:00Z',
  effective_until: null,
};

describe('PaymentsSection', () => {
  it('shows info card when not connected', async () => {
    server.use(
      http.get(`${BASE}/billing/connect/status`, () =>
        HttpResponse.json({ data: MOCK_STATUS_DISCONNECTED }),
      ),
    );

    renderWithProviders(<PaymentsSection />, { preloadedState: authenticatedState });

    await waitFor(() => {
      expect(screen.getByText(/Configurar Pagamentos/i)).toBeDefined();
    });
  });

  it('shows connected status card when account is connected', async () => {
    server.use(
      http.get(`${BASE}/billing/connect/status`, () =>
        HttpResponse.json({ data: MOCK_STATUS_CONNECTED }),
      ),
    );

    renderWithProviders(<PaymentsSection />, { preloadedState: authenticatedState });

    await waitFor(() => {
      expect(screen.getByText(/Status da Conta Stripe Connect/i)).toBeDefined();
    });
  });

  it('loads terms when user clicks on setup button', async () => {
    server.use(
      http.get(`${BASE}/billing/connect/status`, () =>
        HttpResponse.json({ data: MOCK_STATUS_DISCONNECTED }),
      ),
      http.get(`${BASE}/billing/connect/terms`, () =>
        HttpResponse.json({ data: MOCK_TERMS }),
      ),
    );

    renderWithProviders(<PaymentsSection />, {
      preloadedState: authenticatedState,
    });

    await waitFor(() => {
      expect(screen.getByText(/Configurar Pagamentos/i)).toBeDefined();
    });

    const setupBtn = screen.getAllByText(/Configurar Pagamentos/i)[0];
    setupBtn.click();

    await waitFor(() => {
      expect(screen.getByText(/Termos de Serviço de Pagamentos/i)).toBeDefined();
    });
  });
});
