import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PaymentStatusBadge from '../../components/payments/PaymentStatusBadge';
import RefundModal from '../../components/payments/RefundModal';
import { listAdminPayments, sendPaymentLink } from '../../api/payments';
import type { ApiPayment } from '../../api/payments';
import type { RootState } from '../../store';

function formatAmount(cents: number, currency: string): string {
  const locale = currency.toUpperCase() === 'BRL' ? 'pt-BR' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
}

function exportToCsv(payments: ApiPayment[]): void {
  const headers = ['ID', 'Status', 'Método', 'Modo', 'Valor', 'Taxa App', 'Taxa Stripe', 'Líquido', 'Pago em', 'Criado em'];
  const rows = payments.map((p) => [
    p.id,
    p.status,
    p.payment_method,
    p.payment_mode,
    (p.amount_cents / 100).toFixed(2),
    (p.application_fee_cents / 100).toFixed(2),
    p.stripe_fee_cents != null ? (p.stripe_fee_cents / 100).toFixed(2) : '',
    p.net_amount_cents != null ? (p.net_amount_cents / 100).toFixed(2) : '',
    p.paid_at ?? '',
    p.created_at,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PaymentsListPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === 'tenant_admin';

  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [refundTarget, setRefundTarget] = useState<ApiPayment | null>(null);

  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listAdminPayments({
        status: statusFilter || undefined,
        page,
        limit: LIMIT,
      });
      setPayments(result.items);
      setTotal(result.total);
    } catch {
      setError('Erro ao carregar pagamentos.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { void load(); }, [load]);

  const totalReceived = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((s, p) => s + p.amount_cents, 0);
  const totalFees = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((s, p) => s + (p.stripe_fee_cents ?? 0) + p.application_fee_cents, 0);
  const totalNet = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((s, p) => s + (p.net_amount_cents ?? 0), 0);

  const currency = payments[0]?.currency ?? 'BRL';

  async function handleSendLink(paymentId: string) {
    try {
      await sendPaymentLink(paymentId);
    } catch {
      setError('Erro ao reenviar link.');
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Pagamentos</h1>
          <p className="text-text-secondary text-sm mt-1">{total} registro(s)</p>
        </div>
        <Button
          variant="ghost"
          onClick={() => exportToCsv(payments)}
          aria-label="Exportar CSV"
        >
          Exportar CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card title="Total Recebido">
          <p className="text-2xl font-bold text-success">{formatAmount(totalReceived, currency)}</p>
        </Card>
        <Card title="Taxas Pagas">
          <p className="text-2xl font-bold text-warning">{formatAmount(totalFees, currency)}</p>
        </Card>
        <Card title="Líquido">
          <p className="text-2xl font-bold text-text-primary">{formatAmount(totalNet, currency)}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filtrar por status"
        >
          <option value="">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="succeeded">Pago</option>
          <option value="failed">Falhou</option>
          <option value="refunded">Reembolsado</option>
          <option value="manual_pending">Manual</option>
        </select>
      </div>

      {error && <p className="text-error text-sm mb-4" role="alert">{error}</p>}

      {loading ? (
        <p className="text-text-muted text-sm">Carregando…</p>
      ) : payments.length === 0 ? (
        <p className="text-text-muted text-sm">Nenhum pagamento encontrado.</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {payments.map((p) => (
              <div key={p.id} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <PaymentStatusBadge status={p.status as any} />
                  <span className="text-text-primary font-semibold text-sm">
                    {formatAmount(p.amount_cents, p.currency)}
                  </span>
                </div>
                <p className="text-text-secondary text-xs font-mono mb-1">{p.id.slice(0, 16)}…</p>
                <p className="text-text-secondary text-xs">{p.payment_method} · {p.payment_mode}</p>
                <div className="flex gap-2 mt-3">
                  {isAdmin && p.status === 'succeeded' && (
                    <button
                      type="button"
                      onClick={() => setRefundTarget(p)}
                      className="text-xs text-error underline min-h-[44px] px-2"
                    >
                      Reembolsar
                    </button>
                  )}
                  {p.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleSendLink(p.id)}
                      className="text-xs text-primary underline min-h-[44px] px-2"
                    >
                      Reenviar link
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="pb-3 text-text-secondary font-medium">ID</th>
                  <th className="pb-3 text-text-secondary font-medium">Status</th>
                  <th className="pb-3 text-text-secondary font-medium">Método</th>
                  <th className="pb-3 text-text-secondary font-medium">Valor</th>
                  <th className="pb-3 text-text-secondary font-medium">Taxa</th>
                  <th className="pb-3 text-text-secondary font-medium">Líquido</th>
                  <th className="pb-3 text-text-secondary font-medium">Criado em</th>
                  <th className="pb-3 text-text-secondary font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-surface-alt/30 transition-colors">
                    <td className="py-3 font-mono text-xs text-text-muted">{p.id.slice(0, 8)}…</td>
                    <td className="py-3"><PaymentStatusBadge status={p.status as any} /></td>
                    <td className="py-3 text-text-secondary capitalize">{p.payment_method}</td>
                    <td className="py-3 text-text-primary font-medium">{formatAmount(p.amount_cents, p.currency)}</td>
                    <td className="py-3 text-text-secondary">
                      {p.stripe_fee_cents != null
                        ? formatAmount(p.stripe_fee_cents + p.application_fee_cents, p.currency)
                        : formatAmount(p.application_fee_cents, p.currency)}
                    </td>
                    <td className="py-3 text-text-primary">
                      {p.net_amount_cents != null ? formatAmount(p.net_amount_cents, p.currency) : '—'}
                    </td>
                    <td className="py-3 text-text-secondary">
                      {new Date(p.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        {isAdmin && p.status === 'succeeded' && (
                          <button
                            type="button"
                            onClick={() => setRefundTarget(p)}
                            className="text-xs text-error hover:underline"
                          >
                            Reembolsar
                          </button>
                        )}
                        {p.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleSendLink(p.id)}
                            className="text-xs text-primary hover:underline"
                          >
                            Reenviar link
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex gap-3 mt-4 justify-center">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-10 px-4 rounded bg-surface-alt border border-border text-text-primary text-sm disabled:opacity-40 min-w-[44px]"
            >
              Anterior
            </button>
            <span className="h-10 flex items-center text-text-secondary text-sm px-2">
              Página {page} · {Math.ceil(total / LIMIT)} total
            </span>
            <button
              type="button"
              disabled={page * LIMIT >= total}
              onClick={() => setPage((p) => p + 1)}
              className="h-10 px-4 rounded bg-surface-alt border border-border text-text-primary text-sm disabled:opacity-40 min-w-[44px]"
            >
              Próxima
            </button>
          </div>
        </>
      )}

      {refundTarget && (
        <RefundModal
          payment={refundTarget}
          onClose={() => setRefundTarget(null)}
          onSuccess={(updated) => {
            setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            setRefundTarget(null);
          }}
        />
      )}
    </div>
  );
}
