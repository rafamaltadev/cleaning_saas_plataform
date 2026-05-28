import type { ApiBookingStatus } from '../types';

export const BOOKING_STATUS_LABELS: Record<ApiBookingStatus, string> = {
  pending_approval: 'Aguardando aprovação',
  pending_payment: 'Aguardando pagamento',
  confirmed: 'Confirmado',
  rescheduled: 'Reagendado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export function bookingBadgeVariant(status: ApiBookingStatus) {
  switch (status) {
    case 'confirmed': return 'success' as const;
    case 'rescheduled': return 'warning' as const;
    case 'pending_approval': return 'warning' as const;
    case 'pending_payment': return 'warning' as const;
    case 'cancelled': return 'error' as const;
    default: return 'neutral' as const;
  }
}
