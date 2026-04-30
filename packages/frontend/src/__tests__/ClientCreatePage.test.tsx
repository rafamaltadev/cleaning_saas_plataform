import { describe, it, expect } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, authenticatedState } from './utils';
import ClientCreatePage from '../pages/clients/ClientCreatePage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('ClientCreatePage', () => {
  it('validates required fields before submitting', () => {
    const { container } = renderWithProviders(<ClientCreatePage />, { preloadedState: authenticatedState });

    // Submit form directly — validation is synchronous, no waitFor needed
    fireEvent.submit(container.querySelector('form')!);

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('submits form with valid data and navigates away', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClientCreatePage />, { preloadedState: authenticatedState });

    await user.type(screen.getByLabelText(/^name/i), 'Test Client');
    await user.type(screen.getByLabelText(/^email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /create client/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/clients');
    });
  });
});
