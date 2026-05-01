import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, authenticatedState } from './utils';
import QuoteCreatePage from '../pages/quotes/QuoteCreatePage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('QuoteCreatePage', () => {
  it('computes estimated total client-side correctly matching SPEC formula', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuoteCreatePage />, { preloadedState: authenticatedState });

    // Wait for services to load
    await waitFor(() => expect(screen.getByRole('combobox', { name: /select service/i })).toBeInTheDocument());

    // Select "Deep Clean" — base_rate_cents=15000, unit='flat', no pricing rule
    await user.selectOptions(screen.getByRole('combobox', { name: /select service/i }), 'svc-1');

    // Estimated total should be: flat rate = 15000 cents = $150.00
    // calculatePriceCents({ unit: 'flat', baseRateCents: 15000 }) = 15000
    await waitFor(() => {
      expect(screen.getByTestId('estimated-total')).toHaveTextContent('$150.00');
    });
  });

  it('shows area input when sqm service is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuoteCreatePage />, { preloadedState: authenticatedState });

    await waitFor(() => screen.getByRole('combobox', { name: /select service/i }));

    // Select "Window Clean" — unit='sqm'
    await user.selectOptions(screen.getByRole('combobox', { name: /select service/i }), 'svc-2');

    await waitFor(() => {
      expect(screen.getByLabelText(/area \(sqm\)/i)).toBeInTheDocument();
    });
  });

  it('updates estimated total when area_sqm changes for sqm service', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuoteCreatePage />, { preloadedState: authenticatedState });

    await waitFor(() => screen.getByRole('combobox', { name: /select service/i }));

    // Window Clean: base_rate_cents=500, unit='sqm'
    await user.selectOptions(screen.getByRole('combobox', { name: /select service/i }), 'svc-2');

    await waitFor(() => screen.getByLabelText(/area \(sqm\)/i));

    await user.clear(screen.getByLabelText(/area \(sqm\)/i));
    await user.type(screen.getByLabelText(/area \(sqm\)/i), '20');

    // calculatePriceCents({ unit: 'sqm', baseRateCents: 500, areaSqm: 20 }) = 500 * 20 = 10000 = $100.00
    await waitFor(() => {
      expect(screen.getByTestId('estimated-total')).toHaveTextContent('$100.00');
    });
  });
});
