import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import PaymentStatusBadge from '../../components/payments/PaymentStatusBadge';
import RefundModal from '../../components/payments/RefundModal';
import { getBookingById, completeBooking } from '../../api/bookings';
import { listAdminPayments, sendPaymentLink } from '../../api/payments';
import { apiClient } from '../../api/client';
import type { RootState } from '../../store';
import type { ApiBooking } from '../../types';
import type { ApiPayment } from '../../api/payments';
import { BOOKING_STATUS_LABELS, bookingBadgeVariant } from '../../utils/bookingStatusLabels';

function nowDatetimeLocal(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

function formatDuration(start: string, end: string): string {
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${mins.toString().padStart(2, '0')}min`;
  return `${mins}min`;
}

const COMPLETE_ROLES = ['tenant_admin', 'supervisor'] as const;

function formatAmount(cents: number, currency = 'BRL'): string {
  const locale = currency.toUpperCase() === 'BRL' ? 'pt-BR' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const canComplete = user?.role && (COMPLETE_ROLES as readonly string[]).includes(user.role);
  const isAdmin = user?.role === 'tenant_admin';

  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [reactivating, setReactivating] = useState(false);
  const [modalError, setModalError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'payments'>('details');
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [refundTarget, setRefundTarget] = useState<ApiPayment | null>(null);

  useEffect(() => {
    if (!id) return;
    getBookingById(id)
      .then(setBooking)
      .catch(() => setError('Erro ao carregar agendamento.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (activeTab !== 'payments' || !id) return;
    setPaymentsLoading(true);
    listAdminPayments()
      .then((result) => {
        setPayments(result.items.filter((p) => p.booking_id === id));
      })
      .catch(() => {})
      .finally(() => setPaymentsLoading(false));
  }, [activeTab, id]);

  useEffect(() => {
    if (!showReactivateModal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowReactivateModal(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showReactivateModal]);

  const isVisuallyExpired = booking !== null
    && booking.status === 'cancelled'
    && new Date(booking.scheduled_start) < new Date();

  async function handleApprove() {
    if (!id) return;
    setApproving(true);
    try {
      const { data } = await apiClient.put<{ data: ApiBooking }>(`/bookings/${id}`, { status: 'confirmed' });
      setBooking(data.data);
    } catch {
      setError('Erro ao aprovar agendamento.');
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!id) return;
    setRejecting(true);
    try {
      const { data } = await apiClient.put<{ data: ApiBooking }>(`/bookings/${id}`, {
        status: 'cancelled',
        observations: rejectReason || undefined,
      });
      setBooking(data.data);
      setShowRejectModal(false);
      setRejectReason('');
    } catch {
      setError('Erro ao rejeitar agendamento.');
    } finally {
      setRejecting(false);
    }
  }

  async function handleComplete() {
    if (!id) return;
    setCompleting(true);
    try {
      const updated = await completeBooking(id);
      setBooking(updated);
    } catch {
      setError('Erro ao concluir agendamento.');
    } finally {
      setCompleting(false);
    }
  }

  async function handleCancel() {
    if (!id) return;
    if (!window.confirm('Cancelar este agendamento? Esta ação não pode ser desfeita.')) return;
    setCancelling(true);
    try {
      const { data } = await apiClient.put<{ data: ApiBooking }>(`/bookings/${id}`, { status: 'cancelled' });
      setBooking(data.data);
    } catch {
      setError('Erro ao cancelar agendamento.');
    } finally {
      setCancelling(false);
    }
  }

  async function handleReactivate() {
    if (!id || !newStart || !newEnd) return;
    setReactivating(true);
    setModalError('');
    try {
      const { data } = await apiClient.put<{ data: ApiBooking }>(`/bookings/${id}`, {
        status: 'confirmed',
        scheduled_start: new Date(newStart).toISOString(),
        scheduled_end: new Date(newEnd).toISOString(),
      });
      setBooking(data.data);
      setShowReactivateModal(false);
      setNewStart('');
      setNewEnd('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: unknown } } };
      const msg = e?.response?.data?.message;
      setModalError(typeof msg === 'string' ? msg : 'Erro ao reativar agendamento.');
    } finally {
      setReactivating(false);
    }
  }

  if (loading) return <p className="text-text-muted text-sm">Carregando…</p>;
  if (error && !booking) return <p className="text-error text-sm">{error}</p>;
  if (!booking) return null;

  const showReactivateButton = booking.status === 'cancelled';
  const reactivateLabel = isVisuallyExpired ? 'Reagendar' : 'Reativar Agendamento';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Detalhes do Agendamento</h1>
          <p className="text-text-secondary text-sm mt-1 font-mono">{booking.id}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant={bookingBadgeVariant(booking.status)}>
            {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
          </Badge>
          {booking.status === 'pending_approval' && canComplete && (
            <>
              <Button
                variant="primary"
                loading={approving}
                onClick={handleApprove}
                aria-label="Aprovar agendamento"
              >
                Aprovar
              </Button>
              <Button
                variant="danger"
                loading={rejecting}
                onClick={() => setShowRejectModal(true)}
                aria-label="Rejeitar agendamento"
              >
                Rejeitar
              </Button>
            </>
          )}
          {booking.status === 'confirmed' && (
            <>
              {canComplete && (
                <Button
                  variant="primary"
                  loading={completing}
                  onClick={handleComplete}
                  aria-label="Concluir agendamento"
                >
                  Concluir Agendamento
                </Button>
              )}
              <Button
                variant="danger"
                loading={cancelling}
                onClick={handleCancel}
                aria-label="Cancelar agendamento"
              >
                Cancelar Agendamento
              </Button>
            </>
          )}
          {showReactivateButton && (
            <Button
              variant="secondary"
              onClick={() => { setModalError(''); setNewStart(''); setNewEnd(''); setShowReactivateModal(true); }}
              aria-label={reactivateLabel}
            >
              {reactivateLabel}
            </Button>
          )}
          {booking.status === 'completed' && (
            <Button
              variant="secondary"
              onClick={() => { setModalError(''); setNewStart(''); setNewEnd(''); setShowReactivateModal(true); }}
              aria-label="Reverter para confirmado"
            >
              Reverter para Confirmado
            </Button>
          )}
          {(booking.status === 'confirmed' || booking.status === 'rescheduled') && (
            <Button variant="ghost" onClick={() => navigate(`/bookings/${id}/edit`)}>Editar</Button>
          )}
          <Button variant="ghost" onClick={() => navigate('/bookings')}>Voltar</Button>
        </div>
      </div>

      {error && <p className="text-error text-sm mb-4" role="alert">{error}</p>}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors min-h-[44px] ${
            activeTab === 'details'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Detalhes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors min-h-[44px] ${
            activeTab === 'payments'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Pagamentos
        </button>
      </div>

      {activeTab === 'payments' && (
        <div className="max-w-2xl mb-6">
          {paymentsLoading ? (
            <p className="text-text-muted text-sm">Carregando pagamentos…</p>
          ) : payments.length === 0 ? (
            <p className="text-text-muted text-sm">Nenhum pagamento encontrado para este agendamento.</p>
          ) : (
            <div className="space-y-4">
              {payments.map((p) => (
                <Card key={p.id} title="">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <PaymentStatusBadge status={p.status as any} />
                      <span className="text-text-primary font-semibold">
                        {formatAmount(p.amount_cents, p.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Método</span>
                      <span className="text-text-primary capitalize">{p.payment_method}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Modo</span>
                      <span className="text-text-primary capitalize">{p.payment_mode}</span>
                    </div>
                    {p.application_fee_cents > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Taxa plataforma</span>
                        <span className="text-text-primary">{formatAmount(p.application_fee_cents, p.currency)}</span>
                      </div>
                    )}
                    {p.stripe_fee_cents != null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Taxa Stripe</span>
                        <span className="text-text-primary">{formatAmount(p.stripe_fee_cents, p.currency)}</span>
                      </div>
                    )}
                    {p.net_amount_cents != null && (
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-text-secondary">Líquido</span>
                        <span className="text-success">{formatAmount(p.net_amount_cents, p.currency)}</span>
                      </div>
                    )}
                    <div className="flex gap-3 pt-2 flex-wrap">
                      {isAdmin && p.status === 'succeeded' && (
                        <button
                          type="button"
                          onClick={() => setRefundTarget(p)}
                          className="text-sm text-error underline min-h-[44px]"
                        >
                          Reembolsar
                        </button>
                      )}
                      {p.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => sendPaymentLink(p.id).catch(() => {})}
                          className="text-sm text-primary underline min-h-[44px]"
                        >
                          Reenviar link de pagamento
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'details' && <div className="space-y-4 max-w-2xl">
        <Card title="Informações do Agendamento">
          <dl className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Status</dt>
              <dd>
                <Badge variant={bookingBadgeVariant(booking.status)}>
                  {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                </Badge>
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Início Agendado</dt>
              <dd className="text-sm text-text-primary">
                {new Date(booking.scheduled_start).toLocaleString('pt-BR')}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Término Agendado</dt>
              <dd className="text-sm text-text-primary">
                {new Date(booking.scheduled_end).toLocaleString('pt-BR')}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Equipe Responsável</dt>
              <dd className="text-sm text-text-primary">{booking.assigned_team ?? '—'}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Detalhes do Agendamento">
          <dl className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Cliente</dt>
              <dd className="text-sm text-text-primary break-all">
                {booking.client_name ?? <span className="text-xs font-mono">{booking.client_id}</span>}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Serviço</dt>
              <dd className="text-sm text-text-primary break-all">
                {booking.service_name ?? <span className="text-xs font-mono">{booking.service_id}</span>}
              </dd>
            </div>
            {booking.quote_total_cents != null && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <dt className="text-sm text-text-secondary">Valor total</dt>
                <dd className="text-sm font-semibold text-text-primary">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(booking.quote_total_cents / 100)}
                </dd>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Início</dt>
              <dd className="text-sm text-text-primary">
                {new Date(booking.scheduled_start).toLocaleString('pt-BR')}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Término</dt>
              <dd className="text-sm text-text-primary">
                {new Date(booking.scheduled_end).toLocaleString('pt-BR')}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Duração</dt>
              <dd className="text-sm text-text-primary">
                {formatDuration(booking.scheduled_start, booking.scheduled_end)}
              </dd>
            </div>
            {booking.assigned_team && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <dt className="text-sm text-text-secondary">Equipe</dt>
                <dd className="text-sm text-text-primary">{booking.assigned_team}</dd>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Local do serviço</dt>
              <dd className="text-sm text-text-primary">
                {booking.use_client_address === false && booking.service_address
                  ? booking.service_address
                  : 'Endereço do cliente'}
              </dd>
            </div>
            {booking.observations && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <dt className="text-sm text-text-secondary">Observações</dt>
                <dd className="text-sm text-text-primary">{booking.observations}</dd>
              </div>
            )}
            {booking.origin && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <dt className="text-sm text-text-secondary">Origem</dt>
                <dd className="text-sm text-text-primary">
                  {booking.origin === 'public' ? 'Público' : 'Interno'}
                </dd>
              </div>
            )}
            {booking.approval_required && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <dt className="text-sm text-text-secondary">Aprovação</dt>
                <dd>
                  <Badge variant="warning">Requer aprovação</Badge>
                </dd>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Criado em</dt>
              <dd className="text-sm text-text-primary">
                {new Date(booking.created_at).toLocaleString('pt-BR')}
              </dd>
            </div>
          </dl>
        </Card>
      </div>}

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

      {showRejectModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowRejectModal(false)}
          aria-modal="true"
          role="dialog"
          aria-labelledby="reject-booking-modal-title"
        >
          <div
            className="bg-surface rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="reject-booking-modal-title" className="text-lg font-semibold text-text-primary mb-2">
              Rejeitar Agendamento
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              O agendamento será cancelado. Motivo (opcional):
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo da rejeição…"
              rows={3}
              className="w-full px-3 py-2 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                loading={rejecting}
                onClick={handleReject}
              >
                Rejeitar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReactivateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowReactivateModal(false)}
          aria-modal="true"
          role="dialog"
          aria-labelledby="reactivate-booking-modal-title"
        >
          <div
            className="bg-surface rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="reactivate-booking-modal-title" className="text-lg font-semibold text-text-primary mb-2">
              Reativar Agendamento
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              Informe uma nova data para reativar este agendamento.
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label htmlFor="new-start" className="block text-sm font-medium text-text-primary mb-1">
                  Nova data de início *
                </label>
                <input
                  id="new-start"
                  type="datetime-local"
                  value={newStart}
                  min={nowDatetimeLocal()}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="new-end" className="block text-sm font-medium text-text-primary mb-1">
                  Nova data de término *
                </label>
                <input
                  id="new-end"
                  type="datetime-local"
                  value={newEnd}
                  min={newStart || nowDatetimeLocal()}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            {modalError && (
              <p className="text-sm text-error mb-3" role="alert">{modalError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowReactivateModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                loading={reactivating}
                disabled={!newStart || !newEnd}
                onClick={handleReactivate}
              >
                Reativar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
