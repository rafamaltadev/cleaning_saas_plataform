import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, authenticatedState, staffState } from './utils';
import BookingListPage from '../pages/bookings/BookingListPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('BookingListPage', () => {
  it('renders paginated results with correct status badges', async () => {
    renderWithProviders(<BookingListPage />, { preloadedState: authenticatedState });

    await waitFor(() => {
      // Should see confirmed, cancelled, completed badges (dual desktop+mobile render)
      const confirmedBadges = screen.getAllByText('confirmed');
      const cancelledBadges = screen.getAllByText('cancelled');
      const completedBadges = screen.getAllByText('completed');

      expect(confirmedBadges.length).toBeGreaterThan(0);
      expect(cancelledBadges.length).toBeGreaterThan(0);
      expect(completedBadges.length).toBeGreaterThan(0);
    });
  });

  it('complete button is hidden for staff role', async () => {
    renderWithProviders(<BookingListPage />, { preloadedState: staffState });

    await waitFor(() => screen.getAllByText('confirmed'));

    // Staff should not see any Complete button
    const completeButtons = screen.queryAllByRole('button', { name: /complete booking/i });
    expect(completeButtons).toHaveLength(0);
  });

  it('complete button is visible for tenant_admin on confirmed bookings', async () => {
    renderWithProviders(<BookingListPage />, { preloadedState: authenticatedState });

    await waitFor(() => screen.getAllByText('confirmed'));

    // tenant_admin should see Complete button for confirmed bookings
    const completeButtons = screen.getAllByRole('button', { name: /complete booking/i });
    expect(completeButtons.length).toBeGreaterThan(0);
  });
});
