import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import LoginPage from './pages/auth/LoginPage';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/shared/ProtectedRoute';
import PublicLandingRoute from './components/shared/PublicLandingRoute';
import RoleGuard from './components/shared/RoleGuard';
import LandingPage from './pages/landing/LandingPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ClientListPage from './pages/clients/ClientListPage';
import ClientCreatePage from './pages/clients/ClientCreatePage';
import ClientEditPage from './pages/clients/ClientEditPage';
import SettingsPage from './pages/settings/SettingsPage';
import KanbanPage from './pages/kanban/KanbanPage';
import QuoteListPage from './pages/quotes/QuoteListPage';
import QuoteCreatePage from './pages/quotes/QuoteCreatePage';
import QuoteDetailPage from './pages/quotes/QuoteDetailPage';
import QuoteEditPage from './pages/quotes/QuoteEditPage';
import BookingListPage from './pages/bookings/BookingListPage';
import BookingCreatePage from './pages/bookings/BookingCreatePage';
import BookingDetailPage from './pages/bookings/BookingDetailPage';
import BookingEditPage from './pages/bookings/BookingEditPage';
import ServiceListPage from './pages/services/ServiceListPage';
import ServiceFormPage from './pages/services/ServiceFormPage';
import TenantLandingPage from './pages/public/TenantLandingPage';
import PublicQuoteFormPage from './pages/public/PublicQuoteFormPage';
import PublicQuoteRegisterPage from './pages/public/PublicQuoteRegisterPage';
import PublicSchedulingPage from './pages/public/PublicSchedulingPage';
import PublicConfirmationPage from './pages/public/PublicConfirmationPage';
import SubscriptionSuccessPage from './pages/billing/SubscriptionSuccessPage';
import SubscriptionCancelPage from './pages/billing/SubscriptionCancelPage';
import PlansPage from './pages/platform-admin/PlansPage';
import SubscriptionsPage from './pages/platform-admin/SubscriptionsPage';

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLandingRoute />}>
            <Route index element={<LandingPage />} />
          </Route>
          <Route path="/t/:tenantSlug" element={<TenantLandingPage />} />
          <Route path="/t/:tenantSlug/orcamento" element={<PublicQuoteFormPage />} />
          <Route path="/t/:tenantSlug/orcamento/cadastro" element={<PublicQuoteRegisterPage />} />
          <Route path="/t/:tenantSlug/orcamento/agendar" element={<PublicSchedulingPage />} />
          <Route path="/t/:tenantSlug/orcamento/confirmacao" element={<PublicConfirmationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/quotes" element={<QuoteListPage />} />
              <Route path="/quotes/new" element={<QuoteCreatePage />} />
              <Route path="/quotes/:id" element={<QuoteDetailPage />} />
              <Route path="/quotes/:id/edit" element={<QuoteEditPage />} />
              <Route path="/bookings" element={<BookingListPage />} />
              <Route path="/bookings/new" element={<BookingCreatePage />} />
              <Route path="/bookings/:id" element={<BookingDetailPage />} />
              <Route path="/bookings/:id/edit" element={<BookingEditPage />} />
              <Route path="/kanban" element={<KanbanPage />} />
              <Route path="/clients" element={<ClientListPage />} />
              <Route path="/clients/new" element={<ClientCreatePage />} />
              <Route path="/clients/:id/edit" element={<ClientEditPage />} />
              <Route
                path="/services"
                element={
                  <RoleGuard requiredRoles={['tenant_admin', 'supervisor']}>
                    <ServiceListPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/services/new"
                element={
                  <RoleGuard requiredRoles={['tenant_admin', 'supervisor']}>
                    <ServiceFormPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/services/:id/edit"
                element={
                  <RoleGuard requiredRoles={['tenant_admin', 'supervisor']}>
                    <ServiceFormPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/settings"
                element={
                  <RoleGuard requiredRoles={['tenant_admin', 'supervisor']}>
                    <SettingsPage />
                  </RoleGuard>
                }
              />
              <Route path="/settings/billing/success" element={<SubscriptionSuccessPage />} />
              <Route path="/settings/billing/cancel" element={<SubscriptionCancelPage />} />
              <Route
                path="/platform-admin/plans"
                element={
                  <RoleGuard requiredRoles={['platform_admin']}>
                    <PlansPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/platform-admin/subscriptions"
                element={
                  <RoleGuard requiredRoles={['platform_admin']}>
                    <SubscriptionsPage />
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
