import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, authenticatedState, staffState } from './utils';
import QuoteListPage from '../pages/quotes/QuoteListPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('QuoteListPage', () => {
  it('renders paginated results with correct status badges per state', async () => {
    renderWithProviders(<QuoteListPage />, { preloadedState: authenticatedState });

    await waitFor(() => {
      // Each quote status should appear as a badge — dual render (desktop + mobile) may produce multiple
      const draftBadges = screen.getAllByText('draft');
      const sentBadges = screen.getAllByText('sent');
      const acceptedBadges = screen.getAllByText('accepted');
      const expiredBadges = screen.getAllByText('expired');
      const rejectedBadges = screen.getAllByText('rejected');

      expect(draftBadges.length).toBeGreaterThan(0);
      expect(sentBadges.length).toBeGreaterThan(0);
      expect(acceptedBadges.length).toBeGreaterThan(0);
      expect(expiredBadges.length).toBeGreaterThan(0);
      expect(rejectedBadges.length).toBeGreaterThan(0);
    });
  });

  it('send button is hidden for staff role', async () => {
    renderWithProviders(<QuoteListPage />, { preloadedState: staffState });

    await waitFor(() => screen.getAllByText('draft'));

    // Staff should not see any Send button
    const sendButtons = screen.queryAllByRole('button', { name: /send quote/i });
    expect(sendButtons).toHaveLength(0);
  });

  it('send button is visible for tenant_admin on draft quotes', async () => {
    renderWithProviders(<QuoteListPage />, { preloadedState: authenticatedState });

    await waitFor(() => screen.getAllByText('draft'));

    // tenant_admin should see Send button for draft quotes (at least one in desktop+mobile)
    const sendButtons = screen.getAllByRole('button', { name: /send quote/i });
    expect(sendButtons.length).toBeGreaterThan(0);
  });
});
