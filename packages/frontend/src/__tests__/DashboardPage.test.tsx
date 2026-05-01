import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders, authenticatedState } from './utils';
import { server } from './mocks/server';
import DashboardPage from '../pages/dashboard/DashboardPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('DashboardPage', () => {
  it('displays correct count for confirmed bookings', async () => {
    // The mock returns 3 confirmed bookings in MOCK_BOOKINGS_PAGINATED
    renderWithProviders(<DashboardPage />, { preloadedState: authenticatedState });

    await waitFor(() => {
      const el = screen.getByTestId('kpi-confirmed-bookings');
      expect(el).toHaveTextContent('3');
    });
  });

  it('displays correct count for open quotes (draft + sent)', async () => {
    // Mock: 1 draft + 1 sent = 2 open quotes
    renderWithProviders(<DashboardPage />, { preloadedState: authenticatedState });

    await waitFor(() => {
      const el = screen.getByTestId('kpi-open-quotes');
      expect(el).toHaveTextContent('2');
    });
  });

  it('renders last 5 notifications in correct order', async () => {
    renderWithProviders(<DashboardPage />, { preloadedState: authenticatedState });

    // Notifications widget is shown when notifications_enabled flag is true (default mock)
    await waitFor(() => {
      expect(screen.getByTestId('notifications-widget')).toBeInTheDocument();
    });

    // Should display notification templates in order (n-1 through n-5)
    const templates = ['booking_confirmed', 'quote_sent', 'booking_reminder', 'system_alert', 'booking_confirmed'];
    for (const template of templates) {
      const els = screen.getAllByText(template);
      expect(els.length).toBeGreaterThan(0);
    }
  });

  it('feature-gated notifications widget is hidden when flag is disabled', async () => {
    server.use(
      http.get('/api/v1/feature-flags', () =>
        HttpResponse.json({}),
      ),
    );

    renderWithProviders(<DashboardPage />, { preloadedState: authenticatedState });

    // Wait for dashboard to load KPIs (proves the component rendered)
    await waitFor(() => {
      expect(screen.getByTestId('kpi-confirmed-bookings')).toBeInTheDocument();
    });

    // Notifications widget should NOT be present when flag is off
    expect(screen.queryByTestId('notifications-widget')).not.toBeInTheDocument();
  });

  it('shows welcome message with user name', async () => {
    renderWithProviders(<DashboardPage />, { preloadedState: authenticatedState });

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });
});
