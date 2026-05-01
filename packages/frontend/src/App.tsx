import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import LoginPage from './pages/auth/LoginPage';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/shared/ProtectedRoute';
import RoleGuard from './components/shared/RoleGuard';
import DashboardPage from './pages/dashboard/DashboardPage';
import ClientListPage from './pages/clients/ClientListPage';
import ClientCreatePage from './pages/clients/ClientCreatePage';
import ClientEditPage from './pages/clients/ClientEditPage';
import SettingsPage from './pages/settings/SettingsPage';
import KanbanPage from './pages/kanban/KanbanPage';
import QuoteListPage from './pages/quotes/QuoteListPage';
import QuoteCreatePage from './pages/quotes/QuoteCreatePage';
import QuoteDetailPage from './pages/quotes/QuoteDetailPage';
import BookingListPage from './pages/bookings/BookingListPage';
import BookingCreatePage from './pages/bookings/BookingCreatePage';
import BookingDetailPage from './pages/bookings/BookingDetailPage';

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/quotes" element={<QuoteListPage />} />
              <Route path="/quotes/new" element={<QuoteCreatePage />} />
              <Route path="/quotes/:id" element={<QuoteDetailPage />} />
              <Route path="/bookings" element={<BookingListPage />} />
              <Route path="/bookings/new" element={<BookingCreatePage />} />
              <Route path="/bookings/:id" element={<BookingDetailPage />} />
              <Route path="/kanban" element={<KanbanPage />} />
              <Route path="/clients" element={<ClientListPage />} />
              <Route path="/clients/new" element={<ClientCreatePage />} />
              <Route path="/clients/:id/edit" element={<ClientEditPage />} />
              <Route
                path="/settings"
                element={
                  <RoleGuard requiredRoles={['tenant_admin', 'supervisor']}>
                    <SettingsPage />
                  </RoleGuard>
                }
              />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}
