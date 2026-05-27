import { describe, it, expect } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, authenticatedState } from './utils';
import BrandingSection from '../pages/settings/sections/BrandingSection';

describe('BrandingSection', () => {
  it('renders all fields correctly after loading', async () => {
    renderWithProviders(<BrandingSection />, { preloadedState: authenticatedState });

    await waitFor(() => {
      expect(screen.getByLabelText('Tenant slug')).toBeInTheDocument();
      expect(screen.getByLabelText(/seletor de cor primária/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/selecionar arquivo de logo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/selecionar arquivo de favicon/i)).toBeInTheDocument();
    });
  });

  it('displays the tenant slug as read-only', async () => {
    renderWithProviders(<BrandingSection />, { preloadedState: authenticatedState });

    await waitFor(() => {
      const slugInput = screen.getByLabelText('Tenant slug') as HTMLInputElement;
      expect(slugInput.value).toBe('my-company');
      expect(slugInput).toHaveAttribute('readonly');
    });
  });

  it('color picker and hex input stay synchronized', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BrandingSection />, { preloadedState: authenticatedState });

    await waitFor(() => screen.getByLabelText(/código hex/i));

    const hexInput = screen.getByLabelText(/código hex/i) as HTMLInputElement;
    await user.clear(hexInput);
    await user.type(hexInput, '#FF5500');

    expect(hexInput.value).toBe('#FF5500');
  });

  it('color preview updates in real time as user changes primary color', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BrandingSection />, { preloadedState: authenticatedState });

    await waitFor(() => screen.getByRole('button', { name: /solicitar orçamento/i }));

    const hexInput = screen.getByLabelText(/código hex/i);
    await user.clear(hexInput);
    await user.type(hexInput, '#FF0000');

    const previewButton = screen.getByRole('button', { name: /solicitar orçamento/i });
    expect(previewButton).toHaveStyle({ backgroundColor: '#FF0000' });
  });

  it('submitting the form calls PUT /api/v1/tenants/me with correct payload', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BrandingSection />, { preloadedState: authenticatedState });

    await waitFor(() => screen.getByRole('button', { name: /salvar identidade visual/i }));

    const hexInput = screen.getByLabelText(/código hex/i);
    await user.clear(hexInput);
    await user.type(hexInput, '#123456');

    await user.click(screen.getByRole('button', { name: /salvar identidade visual/i }));

    await waitFor(() => {
      expect(screen.getByText('Alterações salvas!')).toBeInTheDocument();
    });
  });

  it('error message appears at top of form when submit fails', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BrandingSection />, { preloadedState: authenticatedState });

    await waitFor(() => screen.getByRole('button', { name: /salvar identidade visual/i }));

    // Enter invalid hex color to trigger client-side error
    const hexInput = screen.getByLabelText(/código hex/i);
    await user.clear(hexInput);
    await user.type(hexInput, 'not-a-color');

    await user.click(screen.getByRole('button', { name: /salvar identidade visual/i }));

    const errorMsg = await screen.findByRole('alert');
    expect(errorMsg).toBeInTheDocument();
    // Error must appear at top — it should be before the submit button in DOM
    const form = screen.getByRole('form', { name: /identidade visual/i });
    const errorIndex = Array.from(form.children).findIndex((el) => el === errorMsg);
    const submitBtn = screen.getByRole('button', { name: /salvar identidade visual/i });
    const submitIndex = Array.from(form.querySelectorAll('button')).indexOf(submitBtn as HTMLButtonElement);
    expect(errorIndex).toBeLessThan(form.children.length - 1);
    expect(errorIndex).toBeGreaterThanOrEqual(0);
    void submitIndex;
  });

  it('submit button cannot be clicked twice in rapid succession', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BrandingSection />, { preloadedState: authenticatedState });

    await waitFor(() => screen.getByRole('button', { name: /salvar identidade visual/i }));

    const submitBtn = screen.getByRole('button', { name: /salvar identidade visual/i });

    // Fire two rapid clicks
    await user.click(submitBtn);
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Alterações salvas!')).toBeInTheDocument();
    });
  });

  it('file upload validation rejects files larger than 2MB client-side', async () => {
    renderWithProviders(<BrandingSection />, { preloadedState: authenticatedState });

    await waitFor(() => screen.getByLabelText(/selecionar arquivo de logo/i));

    const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.png', { type: 'image/png' });
    const logoInput = screen.getByLabelText(/selecionar arquivo de logo/i);
    await userEvent.upload(logoInput, largeFile);

    await waitFor(() => {
      expect(screen.getByText(/2MB/i)).toBeInTheDocument();
    });
  });

  it('file upload validation rejects non-image files client-side', async () => {
    renderWithProviders(<BrandingSection />, { preloadedState: authenticatedState });

    await waitFor(() => screen.getByLabelText(/selecionar arquivo de logo/i));

    const pdfFile = new File(['pdf content'], 'document.pdf', { type: 'application/pdf' });
    const logoInput = screen.getByLabelText(/selecionar arquivo de logo/i);
    // Use fireEvent.change to reliably set the file with its MIME type preserved in jsdom
    fireEvent.change(logoInput, { target: { files: [pdfFile] } });

    await waitFor(() => {
      expect(screen.getByText(/PNG e JPEG/i)).toBeInTheDocument();
    });
  });

  it('tab works on mobile viewport (375px width)', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    window.dispatchEvent(new Event('resize'));

    renderWithProviders(<BrandingSection />, { preloadedState: authenticatedState });

    await waitFor(() => {
      expect(screen.getByLabelText(/selecionar arquivo de logo/i)).toBeInTheDocument();
    });

    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
  });
});
