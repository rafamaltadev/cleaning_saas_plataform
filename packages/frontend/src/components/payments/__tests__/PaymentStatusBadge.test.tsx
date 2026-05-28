import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PaymentStatusBadge, { PAYMENT_STATUS_LABELS } from '../PaymentStatusBadge';

describe('PaymentStatusBadge', () => {
  it('renders "Pago" for succeeded status', () => {
    render(<PaymentStatusBadge status="succeeded" />);
    expect(screen.getByText('Pago')).toBeDefined();
  });

  it('renders "Pendente" for pending status', () => {
    render(<PaymentStatusBadge status="pending" />);
    expect(screen.getByText('Pendente')).toBeDefined();
  });

  it('renders "Reembolsado" for refunded status', () => {
    render(<PaymentStatusBadge status="refunded" />);
    expect(screen.getByText('Reembolsado')).toBeDefined();
  });

  it('renders "Falhou" for failed status', () => {
    render(<PaymentStatusBadge status="failed" />);
    expect(screen.getByText('Falhou')).toBeDefined();
  });

  it('renders "Pagamento Manual" for manual_pending status', () => {
    render(<PaymentStatusBadge status="manual_pending" />);
    expect(screen.getByText('Pagamento Manual')).toBeDefined();
  });

  it('has correct label for all statuses', () => {
    expect(PAYMENT_STATUS_LABELS.succeeded).toBe('Pago');
    expect(PAYMENT_STATUS_LABELS.failed).toBe('Falhou');
    expect(PAYMENT_STATUS_LABELS.refunded).toBe('Reembolsado');
    expect(PAYMENT_STATUS_LABELS.manual_pending).toBe('Pagamento Manual');
  });
});
