import Badge from '../ui/Badge';

type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded' | 'manual_pending' | 'completed';

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  succeeded: 'Pago',
  failed: 'Falhou',
  canceled: 'Cancelado',
  refunded: 'Reembolsado',
  manual_pending: 'Pagamento Manual',
  completed: 'Concluído',
};

function paymentBadgeVariant(status: PaymentStatus): 'success' | 'error' | 'warning' | 'neutral' {
  if (status === 'succeeded' || status === 'completed') return 'success';
  if (status === 'failed' || status === 'canceled') return 'error';
  if (status === 'pending' || status === 'processing' || status === 'manual_pending') return 'warning';
  if (status === 'refunded') return 'neutral';
  return 'neutral';
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export default function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <Badge variant={paymentBadgeVariant(status)}>
      {PAYMENT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export { PAYMENT_STATUS_LABELS, paymentBadgeVariant };
