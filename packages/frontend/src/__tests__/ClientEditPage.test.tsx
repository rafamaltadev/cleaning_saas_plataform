import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, authenticatedState } from './utils';
import ClientEditPage from '../pages/clients/ClientEditPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'client-1' }),
  };
});

describe('ClientEditPage', () => {
  it('pre-populates form with existing client data', async () => {
    renderWithProviders(<ClientEditPage />, { preloadedState: authenticatedState });

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/^name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Alice Smith');

      const emailInput = screen.getByLabelText(/^email/i) as HTMLInputElement;
      expect(emailInput.value).toBe('alice@test.com');
    });
  });
});
