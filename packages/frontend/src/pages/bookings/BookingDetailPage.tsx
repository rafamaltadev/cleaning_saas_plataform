import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { getBookingById, completeBooking } from '../../api/bookings';
import { getClient } from '../../api/clients';
import { apiClient } from '../../api/client';
import type { RootState } from '../../store';
import type { ApiBooking, ApiBookingStatus } from '../../types';

const BOOKING_STATUS_LABELS: Record<ApiBookingStatus, string> = {
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  rescheduled: 'Reagendado',
};

function bookingBadgeVariant(status: ApiBookingStatus) {
  switch (status) {
    case 'confirmed': return 'success' as const;
    case 'rescheduled': return 'warning' as const;
    case 'cancelled': return 'error' as const;
    default: return 'neutral' as const;
  }
}

const COMPLETE_ROLES = ['tenant_admin', 'supervisor'] as const;

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const canComplete = user?.role && (COMPLETE_ROLES as readonly string[]).includes(user.role);

  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    getBookingById(id)
      .then((b) => {
        setBooking(b);
        getClient(b.client_id)
          .then((c) => setClientName(c.name))
          .catch(() => setClientName(null));
      })
      .catch(() => setError('Erro ao carregar agendamento.'))
      .finally(() => setLoading(false));
  }, [id]);

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

  if (loading) return <p className="text-text-muted text-sm">Carregando…</p>;
  if (error && !booking) return <p className="text-error text-sm">{error}</p>;
  if (!booking) return null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Detalhes do Agendamento</h1>
          <p className="text-text-secondary text-sm mt-1 font-mono">{booking.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={bookingBadgeVariant(booking.status)}>
            {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
          </Badge>
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
          <Button variant="ghost" onClick={() => navigate('/bookings')}>Voltar</Button>
        </div>
      </div>

      {error && <p className="text-error text-sm mb-4" role="alert">{error}</p>}

      <div className="space-y-4 max-w-2xl">
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

        <Card title="Identificadores">
          <dl className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">ID do Agendamento</dt>
              <dd className="text-xs font-mono text-text-primary break-all">{booking.id}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">ID do Orçamento</dt>
              <dd className="text-xs font-mono text-text-primary break-all">{booking.quote_id}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Cliente</dt>
              <dd className="text-sm text-text-primary">
                {clientName === null
                  ? <span className="text-xs font-mono break-all">{booking.client_id}</span>
                  : clientName}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">ID do Serviço</dt>
              <dd className="text-xs font-mono text-text-primary break-all">{booking.service_id}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Criado em</dt>
              <dd className="text-sm text-text-primary">
                {new Date(booking.created_at).toLocaleString('pt-BR')}
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
