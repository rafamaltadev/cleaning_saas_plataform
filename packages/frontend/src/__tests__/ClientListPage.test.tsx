import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, authenticatedState } from './utils';
import ClientListPage from '../pages/clients/ClientListPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('ClientListPage', () => {
  it('renders paginated results', async () => {
    renderWithProviders(<ClientListPage />, { preloadedState: authenticatedState });

    // Use getAllByText to handle both desktop-table and mobile-card renders
    await waitFor(() => {
      const aliceEls = screen.getAllByText('Alice Smith');
      const bobEls = screen.getAllByText('Bob Jones');
      expect(aliceEls.length).toBeGreaterThan(0);
      expect(bobEls.length).toBeGreaterThan(0);
    });
  });

  it('shows pagination info when total > page size', async () => {
    renderWithProviders(<ClientListPage />, { preloadedState: authenticatedState });

    await waitFor(() => {
      expect(screen.getByText(/page 1 of/i)).toBeInTheDocument();
    });
  });

  it('navigates to next page on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClientListPage />, { preloadedState: authenticatedState });

    await waitFor(() => screen.getAllByText('Alice Smith'));

    const nextBtn = screen.getByRole('button', { name: /next page/i });
    await user.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText(/page 2 of/i)).toBeInTheDocument();
    });
  });
});
