import type { TenantSubscription } from '../../api/billing';

type Status = TenantSubscription['status'];

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  active: { label: 'Ativa', className: 'bg-success/20 text-success' },
  trialing: { label: 'Trial', className: 'bg-secondary/20 text-secondary' },
  past_due: { label: 'Pagamento Atrasado', className: 'bg-warning/20 text-warning' },
  canceled: { label: 'Cancelada', className: 'bg-error/20 text-error' },
  incomplete: { label: 'Incompleta', className: 'bg-warning/20 text-warning' },
  incomplete_expired: { label: 'Expirada', className: 'bg-error/20 text-error' },
  unpaid: { label: 'Não Paga', className: 'bg-error/20 text-error' },
};

interface Props {
  status: Status;
}

export default function SubscriptionStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-surface-alt text-text-secondary' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
