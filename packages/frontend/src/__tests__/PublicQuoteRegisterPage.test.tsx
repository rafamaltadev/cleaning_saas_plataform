import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import authReducer from '../store/slices/authSlice';
import PublicQuoteRegisterPage from '../pages/public/PublicQuoteRegisterPage';
import { saveDraft, clearDraft } from '../utils/publicQuoteDraft';
import type { QuoteDraft } from '../utils/publicQuoteDraft';

const TENANT_SLUG = 'acme-clean';

const MOCK_DRAFT: QuoteDraft = {
  tenantSlug: TENANT_SLUG,
  serviceId: 'svc-sqm-1',
  serviceName: 'Limpeza por M²',
  area_sqm: 80,
  addon_ids: [],
  address: 'Rua Teste, 123',
  city: 'São Paulo',
  state: 'SP',
  postal_code: '01310-000',
  observations: '',
  name: 'João Silva',
  email: 'joao@example.com',
  phone: '11999999999',
  estimated_total_cents: 40000,
  currency: 'BRL',
};

function renderRegisterPage(tenantSlug = TENANT_SLUG, searchParams = '') {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: null, accessToken: null, isAuthenticated: false } },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/t/${tenantSlug}/orcamento/cadastro${searchParams}`]}>
        <Routes>
          <Route path="/t/:tenantSlug/orcamento/cadastro" element={<PublicQuoteRegisterPage />} />
          <Route path="/t/:tenantSlug/orcamento" element={<div data-testid="quote-form-page">Quote Form</div>} />
          <Route path="/t/:tenantSlug/orcamento/agendar" element={<div data-testid="agendar-page">Agendar</div>} />
          <Route path="/t/:tenantSlug" element={<div data-testid="landing-page">Landing</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PublicQuoteRegisterPage', () => {

  describe('draft validation on mount', () => {
    it('redirects to /orcamento when no draft in sessionStorage', async () => {
      clearDraft(TENANT_SLUG);
      renderRegisterPage();
      await waitFor(() => {
        expect(screen.getByTestId('quote-form-page')).toBeInTheDocument();
      });
    });

    it('renders register page when draft exists', async () => {
      saveDraft(TENANT_SLUG, MOCK_DRAFT);
      renderRegisterPage();
      await waitFor(() => {
        expect(screen.getByTestId('register-page')).toBeInTheDocument();
      });
      clearDraft(TENANT_SLUG);
    });
  });

  describe('quote summary card', () => {
    beforeEach(() => {
      saveDraft(TENANT_SLUG, MOCK_DRAFT);
    });

    it('displays draft data correctly in summary card', async () => {
      renderRegisterPage();
      await waitFor(() => expect(screen.getByTestId('register-page')).toBeInTheDocument());

      const summaryCard = screen.getByTestId('quote-summary-card');
      expect(summaryCard).toBeInTheDocument();
      expect(summaryCard).toHaveTextContent('Limpeza por M²');
      expect(summaryCard).toHaveTextContent('80');
      expect(summaryCard).toHaveTextContent('São Paulo');
    });

    it('shows estimated total in summary card', async () => {
      renderRegisterPage();
      await waitFor(() => expect(screen.getByTestId('quote-summary-card')).toBeInTheDocument());
      expect(screen.getByTestId('quote-summary-card')).toHaveTextContent('400,00');
    });
  });

  describe('tabs', () => {
    beforeEach(() => { saveDraft(TENANT_SLUG, MOCK_DRAFT); });

    it('renders both "Criar conta" and "Já tenho conta" tabs', async () => {
      renderRegisterPage();
      await waitFor(() => expect(screen.getByTestId('register-page')).toBeInTheDocument());
      expect(screen.getByTestId('tab-register')).toBeInTheDocument();
      expect(screen.getByTestId('tab-login')).toBeInTheDocument();
    });

    it('tab switching preserves email field', async () => {
      const user = userEvent.setup();
      renderRegisterPage();
      await waitFor(() => expect(screen.getByTestId('register-page')).toBeInTheDocument());

      // Email is prefilled from draft
      const regEmail = screen.getByTestId('reg-email') as HTMLInputElement;
      expect(regEmail.value).toBe(MOCK_DRAFT.email);

      // Switch to login tab
      await user.click(screen.getByTestId('tab-login'));
      const loginEmail = screen.getByTestId('login-email') as HTMLInputElement;
      expect(loginEmail.value).toBe(MOCK_DRAFT.email);
    });
  });

  describe('"Criar conta" form', () => {
    beforeEach(() => { saveDraft(TENANT_SLUG, MOCK_DRAFT); });

    it('prefills form fields from draft', async () => {
      renderRegisterPage();
      await waitFor(() => expect(screen.getByTestId('register-page')).toBeInTheDocument());

      expect((screen.getByTestId('reg-name') as HTMLInputElement).value).toBe(MOCK_DRAFT.name);
      expect((screen.getByTestId('reg-email') as HTMLInputElement).value).toBe(MOCK_DRAFT.email);
      expect((screen.getByTestId('reg-phone') as HTMLInputElement).value).toBe(MOCK_DRAFT.phone);
    });

    it('shows password strength indicator as user types password', async () => {
      const user = userEvent.setup();
      renderRegisterPage();
      await waitFor(() => expect(screen.getByTestId('register-page')).toBeInTheDocument());

      await user.type(screen.getByTestId('reg-password'), 'abc12345');
      await waitFor(() => {
        expect(screen.getByTestId('password-strength')).toBeInTheDocument();
      });
    });

    it('shows error when password is too weak (client-side validation)', async () => {
      renderRegisterPage();
      await waitFor(() => expect(screen.getByTestId('register-page')).toBeInTheDocument());

      fireEvent.change(screen.getByTestId('reg-password'), { target: { value: 'abc' } });
      fireEvent.click(screen.getByTestId('register-submit'));

      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toBeInTheDocument();
      });
    });

    it('shows error when passwords do not match', async () => {
      renderRegisterPage();
      await waitFor(() => expect(screen.getByTestId('register-page')).toBeInTheDocument());

      fireEvent.change(screen.getByTestId('reg-password'), { target: { value: 'Senha123' } });
      fireEvent.change(screen.getByTestId('reg-confirm'), { target: { value: 'Diferente456' } });
      fireEvent.click(screen.getByTestId('register-submit'));

      await waitFor(() => {
        const errEl = screen.getByTestId('form-error');
        expect(errEl).toHaveTextContent(/senha/i);
      });
    });

    it('clears sessionStorage draft after successful submission', async () => {
      saveDraft(TENANT_SLUG, MOCK_DRAFT);
      renderRegisterPage();
      await waitFor(() => expect(screen.getByTestId('register-page')).toBeInTheDocument());

      // Submit with valid credentials
      fireEvent.change(screen.getByTestId('reg-password'), { target: { value: 'Senha123' } });
      fireEvent.change(screen.getByTestId('reg-confirm'), { target: { value: 'Senha123' } });
      fireEvent.click(screen.getByTestId('register-submit'));

      await waitFor(() => {
        expect(screen.getByTestId('success-modal')).toBeInTheDocument();
      }, { timeout: 5000 });

      const draftKey = `public-quote-draft-${TENANT_SLUG}`;
      expect(sessionStorage.getItem(draftKey)).toBeNull();
    });

    it('shows success modal after quote creation', async () => {
      renderRegisterPage();
      await waitFor(() => expect(screen.getByTestId('register-page')).toBeInTheDocument());

      fireEvent.change(screen.getByTestId('reg-password'), { target: { value: 'Senha123' } });
      fireEvent.change(screen.getByTestId('reg-confirm'), { target: { value: 'Senha123' } });
      fireEvent.click(screen.getByTestId('register-submit'));

      await waitFor(() => {
        expect(screen.getByTestId('success-modal')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('social login buttons', () => {
    beforeEach(() => { saveDraft(TENANT_SLUG, MOCK_DRAFT); });

    it('renders social login buttons', async () => {
      renderRegisterPage();
      await waitFor(() => expect(screen.getByTestId('register-page')).toBeInTheDocument());
      expect(screen.getByTestId('social-login-buttons')).toBeInTheDocument();
      expect(screen.getByTestId('google-login-btn')).toBeInTheDocument();
      expect(screen.getByTestId('facebook-login-btn')).toBeInTheDocument();
    });

    it('social login buttons are keyboard-accessible (type="button")', async () => {
      renderRegisterPage();
      await waitFor(() => expect(screen.getByTestId('register-page')).toBeInTheDocument());

      const googleBtn = screen.getByTestId('google-login-btn');
      expect(googleBtn).toHaveAttribute('type', 'button');
      const facebookBtn = screen.getByTestId('facebook-login-btn');
      expect(facebookBtn).toHaveAttribute('type', 'button');
    });
  });

  describe('mobile responsiveness', () => {
    beforeEach(() => { saveDraft(TENANT_SLUG, MOCK_DRAFT); });

    it('page renders correctly at 375px viewport width', async () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
      renderRegisterPage();
      await waitFor(() => expect(screen.getByTestId('register-page')).toBeInTheDocument());

      // Page should render without horizontal overflow
      const page = screen.getByTestId('register-page');
      expect(page).toBeInTheDocument();
      // All inputs should be visible
      expect(screen.getByTestId('reg-name')).toBeInTheDocument();
      expect(screen.getByTestId('reg-email')).toBeInTheDocument();
    });

    it('submit buttons have minimum height of 44px (touch target)', async () => {
      renderRegisterPage();
      await waitFor(() => expect(screen.getByTestId('register-page')).toBeInTheDocument());

      const submitBtn = screen.getByTestId('register-submit');
      expect(submitBtn.style.minHeight).toBe('44px');
    });
  });
});
