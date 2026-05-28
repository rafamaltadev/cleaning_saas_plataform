import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders, authenticatedState } from './utils';
import { server } from './mocks/server';
import TermsAcceptanceBlock from '../components/settings/TermsAcceptanceBlock';

const BASE = '/api/v1';

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

describe('TermsAcceptanceBlock', () => {
  it('renders terms content', () => {
    const onAccepted = vi.fn();
    renderWithProviders(
      <TermsAcceptanceBlock terms={MOCK_TERMS} onAccepted={onAccepted} isBR />,
      { preloadedState: authenticatedState },
    );

    expect(screen.getByText(/Termos de serviço de pagamentos v1.0/i)).toBeDefined();
    expect(screen.getByText(/v1.0-BR-pt-BR/i)).toBeDefined();
  });

  it('shows error when trying to submit without checking checkbox', async () => {
    const onAccepted = vi.fn();
    renderWithProviders(
      <TermsAcceptanceBlock terms={MOCK_TERMS} onAccepted={onAccepted} isBR />,
      { preloadedState: authenticatedState },
    );

    const btn = screen.getByRole('button', { name: /Aceitar e Continuar/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText(/Você deve aceitar os termos/i)).toBeDefined();
    });
  });

  it('calls onAccepted after accepting terms', async () => {
    server.use(
      http.post(`${BASE}/billing/connect/accept-terms`, () =>
        HttpResponse.json({ data: { id: 'consent-uuid', accepted_at: new Date().toISOString() } }),
      ),
    );

    const onAccepted = vi.fn();
    renderWithProviders(
      <TermsAcceptanceBlock terms={MOCK_TERMS} onAccepted={onAccepted} isBR />,
      { preloadedState: authenticatedState },
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const btn = screen.getByRole('button', { name: /Aceitar e Continuar/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(onAccepted).toHaveBeenCalledWith('v1.0-BR-pt-BR');
    });
  });
});
