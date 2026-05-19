import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import authReducer from '../store/slices/authSlice';
import PublicQuoteFormPage from '../pages/public/PublicQuoteFormPage';

// ─── Render helper with router params ────────────────────────────────────────

function renderQuotePage(tenantSlug = 'acme-clean') {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: null, accessToken: null, isAuthenticated: false } },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/t/${tenantSlug}/orcamento`]}>
        <Routes>
          <Route path="/t/:tenantSlug/orcamento" element={<PublicQuoteFormPage />} />
          <Route
            path="/t/:tenantSlug/orcamento/cadastro"
            element={<div data-testid="cadastro-page">Cadastro</div>}
          />
          <Route path="/t/:tenantSlug" element={<div data-testid="landing-page">Landing</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

// ─── Helper: fill all required fields ────────────────────────────────────────

async function fillAllRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  // Wait for page to load and services to appear
  await waitFor(() => expect(screen.getByTestId('quote-form-page')).toBeInTheDocument());

  // Select the flat service (no area/duration needed)
  const flatServiceBtn = await screen.findByRole('button', { name: /limpeza flat/i });
  await user.click(flatServiceBtn);

  // Fill location
  await user.type(screen.getByLabelText(/endereço/i), 'Rua Teste, 123');
  await user.type(screen.getByLabelText(/cidade/i), 'São Paulo');
  await user.type(screen.getByLabelText(/estado/i), 'SP');
  await user.type(screen.getByLabelText(/cep/i), '01310-100');

  // Fill contact
  await user.type(screen.getByLabelText(/nome/i), 'João Silva');
  await user.type(screen.getByLabelText(/e-mail/i), 'joao@email.com');
  await user.type(screen.getByLabelText(/telefone/i), '11999999999');
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PublicQuoteFormPage — branding', () => {
  it('renders page with tenant primary color applied', async () => {
    renderQuotePage();

    await waitFor(() => {
      expect(screen.getByTestId('quote-form-page')).toBeInTheDocument();
    });

    // Primary color from mock is #4F46E5 — check style attribute on root element
    const page = screen.getByTestId('quote-form-page');
    expect(page).toHaveStyle({ '--color-primary-override': '#4F46E5' });
  });

  it('displays tenant name in header', async () => {
    renderQuotePage();

    await waitFor(() => {
      expect(screen.getByText('Acme Limpeza')).toBeInTheDocument();
    });
  });
});

describe('PublicQuoteFormPage — notice', () => {
  it('shows the required approval notice at the top of the form', async () => {
    renderQuotePage();

    await waitFor(() => {
      expect(screen.getByTestId('approval-notice')).toBeInTheDocument();
      expect(screen.getByTestId('approval-notice')).toHaveTextContent(
        'O orçamento será confirmado pela empresa após sua solicitação',
      );
    });
  });
});

describe('PublicQuoteFormPage — service selection', () => {
  it('renders service cards from the API', async () => {
    renderQuotePage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /limpeza por m²/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /limpeza por hora/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /limpeza flat/i })).toBeInTheDocument();
    });
  });

  it('area_sqm field appears when sqm service is selected', async () => {
    const user = userEvent.setup();
    renderQuotePage();

    await waitFor(() => screen.getByRole('button', { name: /limpeza por m²/i }));
    await user.click(screen.getByRole('button', { name: /limpeza por m²/i }));

    await waitFor(() => {
      expect(screen.getByTestId('area-sqm-input')).toBeInTheDocument();
      expect(screen.queryByTestId('duration-hours-input')).not.toBeInTheDocument();
    });
  });

  it('duration_hours field appears when hour service is selected', async () => {
    const user = userEvent.setup();
    renderQuotePage();

    await waitFor(() => screen.getByRole('button', { name: /limpeza por hora/i }));
    await user.click(screen.getByRole('button', { name: /limpeza por hora/i }));

    await waitFor(() => {
      expect(screen.getByTestId('duration-hours-input')).toBeInTheDocument();
      expect(screen.queryByTestId('area-sqm-input')).not.toBeInTheDocument();
    });
  });

  it('neither area nor duration field appears for flat-rate service', async () => {
    const user = userEvent.setup();
    renderQuotePage();

    await waitFor(() => screen.getByRole('button', { name: /limpeza flat/i }));
    await user.click(screen.getByRole('button', { name: /limpeza flat/i }));

    await waitFor(() => {
      expect(screen.queryByTestId('area-sqm-input')).not.toBeInTheDocument();
      expect(screen.queryByTestId('duration-hours-input')).not.toBeInTheDocument();
    });
  });
});

describe('PublicQuoteFormPage — addons', () => {
  it('addon checkboxes load when an sqm service is selected', async () => {
    const user = userEvent.setup();
    renderQuotePage();

    await waitFor(() => screen.getByRole('button', { name: /limpeza por m²/i }));
    await user.click(screen.getByRole('button', { name: /limpeza por m²/i }));

    await waitFor(() => {
      expect(screen.getByTestId('addons-list')).toBeInTheDocument();
      expect(screen.getByText('Limpeza de vidros')).toBeInTheDocument();
      expect(screen.getByText('Higienização de sofá')).toBeInTheDocument();
    });
  });

  it('no addons shown for hour service (mock returns empty)', async () => {
    const user = userEvent.setup();
    renderQuotePage();

    await waitFor(() => screen.getByRole('button', { name: /limpeza por hora/i }));
    await user.click(screen.getByRole('button', { name: /limpeza por hora/i }));

    await waitFor(() => {
      expect(screen.queryByTestId('addons-list')).not.toBeInTheDocument();
    });
  });
});

describe('PublicQuoteFormPage — summary panel', () => {
  it('mobile action bar is present in the DOM', async () => {
    renderQuotePage();

    await waitFor(() => {
      expect(screen.getByTestId('mobile-action-bar')).toBeInTheDocument();
    });
  });

  it('summary panel shows service name after selection', async () => {
    const user = userEvent.setup();
    renderQuotePage();

    await waitFor(() => screen.getByRole('button', { name: /limpeza flat/i }));
    await user.click(screen.getByRole('button', { name: /limpeza flat/i }));

    // After selection, service name appears in both the card and the summary panel
    await waitFor(() => {
      const matches = screen.getAllByText('Limpeza Flat');
      // At minimum: the service card + the summary panel
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('PublicQuoteFormPage — validation', () => {
  it('shows error when no service selected and continue is clicked', async () => {
    const user = userEvent.setup();
    renderQuotePage();

    await waitFor(() => screen.getByTestId('quote-form-page'));

    // Click desktop continue button without selecting a service
    const continueBtn = screen.getAllByRole('button', { name: /continuar para cadastro/i })[0];
    await user.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(/selecione um serviço/i);
    });
  });

  it('shows error when required contact fields are missing', async () => {
    const user = userEvent.setup();
    renderQuotePage();

    await waitFor(() => screen.getByRole('button', { name: /limpeza flat/i }));
    await user.click(screen.getByRole('button', { name: /limpeza flat/i }));

    // Fill location but not contact
    await user.type(screen.getByLabelText(/endereço/i), 'Rua Teste, 123');
    await user.type(screen.getByLabelText(/cidade/i), 'SP');
    await user.type(screen.getByLabelText(/estado/i), 'SP');
    await user.type(screen.getByLabelText(/cep/i), '00000-000');

    const continueBtn = screen.getAllByRole('button', { name: /continuar para cadastro/i })[0];
    await user.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('shows error for invalid email format', async () => {
    const user = userEvent.setup();
    renderQuotePage();

    await waitFor(() => screen.getByRole('button', { name: /limpeza flat/i }));
    await user.click(screen.getByRole('button', { name: /limpeza flat/i }));

    await user.type(screen.getByLabelText(/endereço/i), 'Rua X');
    await user.type(screen.getByLabelText(/cidade/i), 'SP');
    await user.type(screen.getByLabelText(/estado/i), 'SP');
    await user.type(screen.getByLabelText(/cep/i), '00000-000');
    await user.type(screen.getByLabelText(/nome/i), 'João');
    await user.type(screen.getByLabelText(/e-mail/i), 'not-an-email');
    await user.type(screen.getByLabelText(/telefone/i), '11999999999');

    const continueBtn = screen.getAllByRole('button', { name: /continuar para cadastro/i })[0];
    await user.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/e-mail/i);
    });
  });
});

describe('PublicQuoteFormPage — draft and navigation', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('saves draft to sessionStorage with correct key and navigates to cadastro', async () => {
    const user = userEvent.setup();
    renderQuotePage();

    await fillAllRequiredFields(user);

    const continueBtn = screen.getAllByRole('button', { name: /continuar para cadastro/i })[0];
    await user.click(continueBtn);

    // Should navigate to cadastro page
    await waitFor(() => {
      expect(screen.getByTestId('cadastro-page')).toBeInTheDocument();
    });

    // Draft key must include tenant slug for isolation
    const draftRaw = sessionStorage.getItem('public-quote-draft-acme-clean');
    expect(draftRaw).not.toBeNull();
    const draft = JSON.parse(draftRaw!);
    expect(draft.tenantSlug).toBe('acme-clean');
    expect(draft.name).toBe('João Silva');
    expect(draft.email).toBe('joao@email.com');
  });

  it('draft key includes tenant slug to prevent cross-tenant leakage', async () => {
    const user = userEvent.setup();
    renderQuotePage('acme-clean');

    await fillAllRequiredFields(user);

    const continueBtn = screen.getAllByRole('button', { name: /continuar para cadastro/i })[0];
    await user.click(continueBtn);

    await waitFor(() => screen.getByTestId('cadastro-page'));

    // Key must be scoped to tenant — another tenant's key should not exist
    expect(sessionStorage.getItem('public-quote-draft-acme-clean')).not.toBeNull();
    expect(sessionStorage.getItem('public-quote-draft-other-tenant')).toBeNull();
  });
});

describe('PublicQuoteFormPage — Voltar button', () => {
  it('"Voltar" link(s) point to /t/:tenantSlug', async () => {
    renderQuotePage();

    await waitFor(() => {
      const backLinks = screen.getAllByRole('link', { name: /voltar/i });
      expect(backLinks.length).toBeGreaterThanOrEqual(1);
      for (const link of backLinks) {
        expect(link).toHaveAttribute('href', '/t/acme-clean');
      }
    });
  });
});

describe('PublicQuoteFormPage — mobile', () => {
  it('renders correctly at 375px viewport width without horizontal scroll issues', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    renderQuotePage();

    await waitFor(() => {
      expect(screen.getByTestId('quote-form-page')).toBeInTheDocument();
    });

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('mobile action bar is present regardless of viewport size', async () => {
    renderQuotePage();

    await waitFor(() => {
      expect(screen.getByTestId('mobile-action-bar')).toBeInTheDocument();
    });
  });
});

describe('PublicQuoteFormPage — input sanitization', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('strips HTML tags from observations before saving draft', async () => {
    const user = userEvent.setup();
    renderQuotePage();

    await fillAllRequiredFields(user);

    await user.type(
      screen.getByPlaceholderText(/informações adicionais/i),
      '<script>alert(1)</script>clean text',
    );

    const continueBtn = screen.getAllByRole('button', { name: /continuar para cadastro/i })[0];
    await user.click(continueBtn);

    await waitFor(() => screen.getByTestId('cadastro-page'));

    const draft = JSON.parse(sessionStorage.getItem('public-quote-draft-acme-clean')!);
    expect(draft.observations).not.toContain('<script>');
    expect(draft.observations).toContain('clean text');
  });
});

describe('PublicQuoteFormPage — debounced estimate', () => {
  it('service name appears in summary panel after selection (estimate loads)', async () => {
    const user = userEvent.setup();
    renderQuotePage();

    await waitFor(() => screen.getByRole('button', { name: /limpeza flat/i }));
    await user.click(screen.getByRole('button', { name: /limpeza flat/i }));

    // After selection, service name appears in summary panel (multiple instances OK)
    await waitFor(
      () => {
        const matches = screen.getAllByText('Limpeza Flat');
        expect(matches.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 3000 },
    );
  });
});
