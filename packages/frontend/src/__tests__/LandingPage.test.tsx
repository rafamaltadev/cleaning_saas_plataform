import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import authReducer from '../store/slices/authSlice';
import { renderWithProviders, authenticatedState } from './utils';
import LandingPage from '../pages/landing/LandingPage';
import PublicLandingRoute from '../components/shared/PublicLandingRoute';

// ─── Routing-aware render helper (for redirect tests) ────────────────────────

type AuthShape = {
  user?: { id: string; email: string; name: string; role: 'tenant_admin' | 'supervisor' | 'staff'; tenantId: string } | null;
  accessToken?: string | null;
  isAuthenticated?: boolean;
};

function renderWithRouting(initialEntry = '/', authState: AuthShape = {}) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { user: null, accessToken: null, isAuthenticated: false, ...authState },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<PublicLandingRoute />}>
            <Route index element={<LandingPage />} />
          </Route>
          <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
          <Route path="/login" element={<div data-testid="login-page">Login</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

// ─── Reset navigator.language before each test ───────────────────────────────

beforeEach(() => {
  Object.defineProperty(navigator, 'language', {
    get: () => 'en-US',
    configurable: true,
  });
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('LandingPage — route behavior', () => {
  it('redirects authenticated users to /dashboard', () => {
    renderWithRouting('/', authenticatedState.auth as AuthShape);
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();
  });

  it('shows full landing page for unauthenticated users', () => {
    renderWithRouting('/');
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });
});

describe('LandingPage — pricing section locale detection', () => {
  it('displays BRL prices when browser locale is pt-BR', () => {
    Object.defineProperty(navigator, 'language', {
      get: () => 'pt-BR',
      configurable: true,
    });
    renderWithProviders(<LandingPage />);
    expect(screen.getByText(/R\$ 59,90/)).toBeInTheDocument();
    // No currency toggle should be shown for pt-BR locale
    expect(screen.queryByTestId('currency-toggle-brl')).not.toBeInTheDocument();
  });

  it('displays USD prices as default when locale is not pt-BR', () => {
    renderWithProviders(<LandingPage />);
    // $19.90 appears in the starter plan
    const matches = screen.getAllByText(/\$19\.90/);
    expect(matches.length).toBeGreaterThan(0);
  });
});

describe('LandingPage — pricing section currency toggle', () => {
  it('switches prices from USD to BRL when BRL toggle is clicked', () => {
    renderWithProviders(<LandingPage />);
    // Toggle is shown for non-pt-BR locale
    const brlButton = screen.getByTestId('currency-toggle-brl');
    expect(brlButton).toBeInTheDocument();

    fireEvent.click(brlButton);
    expect(screen.getByText(/R\$ 59,90/)).toBeInTheDocument();
  });

  it('switches prices back to USD when USD toggle is clicked', () => {
    renderWithProviders(<LandingPage />);
    const brlButton = screen.getByTestId('currency-toggle-brl');
    const usdButton = screen.getByTestId('currency-toggle-usd');

    // Switch to BRL
    fireEvent.click(brlButton);
    expect(screen.getByText(/R\$ 59,90/)).toBeInTheDocument();

    // Switch back to USD
    fireEvent.click(usdButton);
    const usdMatches = screen.getAllByText(/\$19\.90/);
    expect(usdMatches.length).toBeGreaterThan(0);
  });
});

describe('LandingPage — pricing cards', () => {
  it('Growth plan card is visually distinct and carries Most Popular badge', () => {
    renderWithProviders(<LandingPage />);
    const badge = screen.getByTestId('most-popular-badge');
    expect(badge).toBeInTheDocument();
    expect(screen.getByTestId('pricing-card-growth')).toBeInTheDocument();
  });

  it('Scale plan card carries Best Value badge', () => {
    renderWithProviders(<LandingPage />);
    const badge = screen.getByTestId('best-value-badge');
    expect(badge).toBeInTheDocument();
    expect(screen.getByTestId('pricing-card-scale')).toBeInTheDocument();
  });

  it('all three pricing cards include a CTA button', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByTestId('pricing-cta-starter')).toBeInTheDocument();
    expect(screen.getByTestId('pricing-cta-growth')).toBeInTheDocument();
    expect(screen.getByTestId('pricing-cta-scale')).toBeInTheDocument();
  });
});

describe('LandingPage — header and navigation', () => {
  it('Log in link is present and routes to /login', () => {
    renderWithProviders(<LandingPage />);
    const loginLink = screen.getByTestId('login-link');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.getAttribute('href')).toBe('/login');
  });
});

describe('LandingPage — CTAs', () => {
  it('primary CTA "Começar Grátis" is visible in Hero section', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByTestId('hero-cta-primary')).toBeInTheDocument();
    expect(screen.getByTestId('hero-cta-primary')).toHaveTextContent('Começar Grátis');
  });

  it('primary CTA "Começar Grátis" is visible in Final CTA section', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByTestId('final-cta-primary')).toBeInTheDocument();
    expect(screen.getByTestId('final-cta-primary')).toHaveTextContent('Começar Grátis');
  });
});

describe('LandingPage — simulation section', () => {
  it('renders Live Simulation section without errors', () => {
    vi.useFakeTimers();
    renderWithProviders(<LandingPage />);
    expect(screen.getByTestId('simulation-section')).toBeInTheDocument();
    vi.useRealTimers();
  });
});
