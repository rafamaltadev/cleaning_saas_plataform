import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, authenticatedState, staffState } from './utils';
import ProtectedRoute from '../components/shared/ProtectedRoute';
import RoleGuard from '../components/shared/RoleGuard';
import { Route, Routes } from 'react-router-dom';

function MockProtected() {
  return (
    <Routes>
      <Route path="/login" element={<div>Login page</div>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<div>Protected content</div>} />
      </Route>
    </Routes>
  );
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to login', () => {
    renderWithProviders(<MockProtected />, {
      preloadedState: { auth: { isAuthenticated: false, user: null, accessToken: null } },
      routerProps: { initialEntries: ['/'] },
    });
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('renders protected content for authenticated users', () => {
    renderWithProviders(<MockProtected />, {
      preloadedState: authenticatedState,
      routerProps: { initialEntries: ['/'] },
    });
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});

function MockRoleGuard() {
  return (
    <Routes>
      <Route path="/kanban" element={<div>Kanban fallback</div>} />
      <Route
        path="/settings"
        element={
          <RoleGuard requiredRoles={['tenant_admin', 'supervisor']}>
            <div>Settings page</div>
          </RoleGuard>
        }
      />
    </Routes>
  );
}

describe('RoleGuard', () => {
  it('redirects staff users away from supervisor-only routes', () => {
    renderWithProviders(<MockRoleGuard />, {
      preloadedState: staffState,
      routerProps: { initialEntries: ['/settings'] },
    });
    expect(screen.getByText('Kanban fallback')).toBeInTheDocument();
  });

  it('allows tenant_admin to access protected routes', () => {
    renderWithProviders(<MockRoleGuard />, {
      preloadedState: authenticatedState,
      routerProps: { initialEntries: ['/settings'] },
    });
    expect(screen.getByText('Settings page')).toBeInTheDocument();
  });
});
