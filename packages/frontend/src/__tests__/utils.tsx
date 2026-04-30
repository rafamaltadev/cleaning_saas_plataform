import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { type AuthState } from '../store/slices/authSlice';

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: { auth: Partial<AuthState> };
  routerProps?: MemoryRouterProps;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    routerProps,
    ...renderOptions
  }: RenderWithProvidersOptions = {},
) {
  const testStore = configureStore({
    reducer: { auth: authReducer },
    preloadedState: preloadedState
      ? { auth: { user: null, accessToken: null, isAuthenticated: false, ...preloadedState.auth } }
      : undefined,
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={testStore}>
        <MemoryRouter {...routerProps}>{children}</MemoryRouter>
      </Provider>
    );
  }

  return { store: testStore, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

export const authenticatedState: { auth: Partial<AuthState> } = {
  auth: {
    user: { id: 'u1', email: 'admin@test.com', name: 'Admin', role: 'tenant_admin', tenantId: 't1' },
    accessToken: 'test-token',
    isAuthenticated: true,
  },
};

export const staffState: { auth: Partial<AuthState> } = {
  auth: {
    user: { id: 'u2', email: 'staff@test.com', name: 'Staff', role: 'staff', tenantId: 't1' },
    accessToken: 'staff-token',
    isAuthenticated: true,
  },
};
