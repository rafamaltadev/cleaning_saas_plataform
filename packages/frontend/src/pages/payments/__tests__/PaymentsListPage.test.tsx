import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../api/payments', () => ({
  listAdminPayments: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  refundPayment: vi.fn(),
  sendPaymentLink: vi.fn(),
}));

import PaymentsListPage from '../PaymentsListPage';
import { listAdminPayments } from '../../../api/payments';

function makeStore(role = 'tenant_admin') {
  return configureStore({
    reducer: {
      auth: (state = { user: { id: 'u-1', email: 'a@b.com', name: 'A', role, tenantId: 't-1' }, tokens: null, loading: false, error: null }) => state,
    },
  });
}

function renderComponent(role = 'tenant_admin') {
  return render(
    <Provider store={makeStore(role)}>
      <MemoryRouter>
        <PaymentsListPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe('PaymentsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the payments page title', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Pagamentos')).toBeDefined();
    });
  });

  it('shows empty state when no payments', async () => {
    (listAdminPayments as ReturnType<typeof vi.fn>).mockResolvedValue({ items: [], total: 0 });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Nenhum pagamento encontrado.')).toBeDefined();
    });
  });

  it('renders payment rows when payments exist', async () => {
    const mockPayments = [
      {
        id: 'pay-1',
        tenant_id: 'tenant-uuid',
        booking_id: 'booking-uuid',
        quote_id: null,
        client_id: 'client-uuid',
        stripe_payment_intent_id: 'pi_test',
        stripe_charge_id: null,
        amount_cents: 5000,
        application_fee_cents: 50,
        stripe_fee_cents: 145,
        net_amount_cents: 4805,
        currency: 'BRL',
        status: 'succeeded',
        payment_method: 'card',
        payment_mode: 'stripe',
        payment_timing: 'prepaid',
        paid_at: new Date().toISOString(),
        refunded_at: null,
        failure_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    (listAdminPayments as ReturnType<typeof vi.fn>).mockResolvedValue({ items: mockPayments, total: 1 });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Pago')).toBeDefined();
    });
  });

  it('shows Reembolsar button only for admin role on succeeded payments', async () => {
    const mockPayments = [
      {
        id: 'pay-1',
        tenant_id: 'tenant-uuid',
        booking_id: 'booking-uuid',
        quote_id: null,
        client_id: 'client-uuid',
        stripe_payment_intent_id: 'pi_test',
        stripe_charge_id: null,
        amount_cents: 5000,
        application_fee_cents: 50,
        stripe_fee_cents: null,
        net_amount_cents: null,
        currency: 'BRL',
        status: 'succeeded',
        payment_method: 'card',
        payment_mode: 'stripe',
        payment_timing: 'prepaid',
        paid_at: new Date().toISOString(),
        refunded_at: null,
        failure_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    (listAdminPayments as ReturnType<typeof vi.fn>).mockResolvedValue({ items: mockPayments, total: 1 });

    renderComponent('tenant_admin');
    await waitFor(() => {
      expect(screen.getAllByText('Reembolsar').length).toBeGreaterThan(0);
    });
  });
});
