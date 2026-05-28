import { useRef, useState } from 'react';
import Button from '../ui/Button';
import { refundPayment } from '../../api/payments';
import type { ApiPayment } from '../../api/payments';

interface RefundModalProps {
  payment: ApiPayment;
  onClose: () => void;
  onSuccess: (updated: ApiPayment) => void;
}

export default function RefundModal({ payment, onClose, onSuccess }: RefundModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const isSubmittingRef = useRef(false);

  const amountFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: payment.currency || 'BRL',
  }).format(payment.amount_cents / 100);

  async function handleRefund() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setError('');
    try {
      const updated = await refundPayment(payment.id, undefined, reason || undefined);
      onSuccess(updated);
    } catch (err) {
      const axiosErr = err as import('axios').AxiosError<{ error?: { message?: string | string[] }; message?: string | string[] }>;
      const raw = axiosErr.response?.data;
      const msg = raw?.error?.message ?? raw?.message;
      const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao processar reembolso.');
      setError(detail);
    } finally {
      isSubmittingRef.current = false;
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="refund-modal-title"
    >
      <div
        className="bg-surface rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="refund-modal-title" className="text-lg font-semibold text-text-primary mb-2">
          Reembolsar Pagamento
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Confirmar reembolso integral de <strong className="text-text-primary">{amountFormatted}</strong>?
        </p>
        <form>
          {error && (
            <p className="text-sm text-error mb-3" role="alert">{error}</p>
          )}
          <div className="mb-4">
            <label htmlFor="refund-reason" className="block text-sm font-medium text-text-primary mb-1">
              Motivo (opcional)
            </label>
            <input
              id="refund-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Cliente solicitou cancelamento"
              className="w-full h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </form>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" type="button" onClick={handleRefund}>
            Confirmar Reembolso
          </Button>
        </div>
      </div>
    </div>
  );
}
