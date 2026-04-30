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

  it('renders Stripe placeholder section without errors', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />, { preloadedState: authenticatedState });

    // Click the Payment tab
    await user.click(screen.getByRole('button', { name: /^payment$/i }));

    // Verify Stripe placeholder content renders
    await waitFor(() => {
      expect(screen.getByText(/stripe integration/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /coming soon/i })).toBeInTheDocument();
    });
  });
});
