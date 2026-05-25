import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, authenticatedState } from './utils';
import SettingsPage from '../pages/settings/SettingsPage';

describe('SettingsPage', () => {
  it('loads company profile data from tenant API', async () => {
    renderWithProviders(<SettingsPage />, { preloadedState: authenticatedState });

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/company name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('My Company');
    });
  });

  it('saves changes to company profile', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />, { preloadedState: authenticatedState });

    await waitFor(() => screen.getByLabelText(/company name/i));

    const nameInput = screen.getByLabelText(/company name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Company');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText('Changes saved!')).toBeInTheDocument();
    });
  });

  it('renders billing section when Plano e Cobrança tab is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />, { preloadedState: authenticatedState });

    await user.click(screen.getByRole('button', { name: /plano e cobrança/i }));

    await waitFor(() => {
      expect(screen.getByText(/você ainda não possui uma assinatura ativa/i)).toBeInTheDocument();
    });
  });
});
