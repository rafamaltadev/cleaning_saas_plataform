import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './utils';
import LoginPage from '../pages/auth/LoginPage';
import { REFRESH_TOKEN_KEY } from '../api/client';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('LoginPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    localStorage.clear();
  });

  it('submits credentials and stores tokens on success', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(store.getState().auth.isAuthenticated).toBe(true);
      expect(store.getState().auth.accessToken).toBe('test-access-token');
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('test-refresh-token');
    });

    expect(mockNavigate).toHaveBeenCalledWith('/kanban', { replace: true });
  });

  it('displays error message and does not store tokens on failed login', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'wrong@test.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
