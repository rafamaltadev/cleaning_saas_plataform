import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { listBookings, completeBooking } from '../../api/bookings';
import type { RootState } from '../../store';
import type { ApiBooking, ApiBookingStatus } from '../../types';

const PAGE_SIZE = 20;

function isVisuallyExpired(booking: ApiBooking): boolean {
  return booking.status === 'cancelled' && new Date(booking.scheduled_start) < new Date();
}

function bookingBadgeVariant(status: ApiBookingStatus) {
  switch (status) {
    case 'confirmed': return 'success' as const;
    case 'rescheduled': return 'warning' as const;
    case 'cancelled': return 'error' as const;
    default: return 'neutral' as const;
  }
}

const BOOKING_STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmado',
  rescheduled: 'Reagendado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
};

const COMPLETE_ROLES = ['tenant_admin', 'supervisor'] as const;

export default function BookingListPage() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const canComplete = user?.role && (COMPLETE_ROLES as readonly string[]).includes(user.role);

  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    listBookings({ page, limit: PAGE_SIZE, status: statusFilter || undefined })
      .then((result) => {
        if (cancelled) return;
        setBookings(result.items ?? []);
        setTotal(result.meta?.total ?? 0);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Erro ao carregar agendamentos.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page, statusFilter, refreshKey]);

  async function handleComplete(id: string) {
    setCompleting(id);
    try {
      await completeBooking(id);
      setRefreshKey((k) => k + 1);
    } catch {
      setError('Erro ao concluir agendamento.');
    } finally {
      setCompleting(null);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Agendamentos</h1>
        <Button onClick={() => navigate('/bookings/new')}>+ Novo Agendamento</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filter by status"
        >
          <option value="">Todos os status</option>
          <option value="confirmed">Confirmado</option>
          <option value="rescheduled">Reagendado</option>
          <option value="cancelled">Cancelado</option>
          <option value="completed">Concluído</option>
        </select>
      </div>

      {error && <p className="text-error text-sm mb-4" role="alert">{error}</p>}

      {/* Desktop table */}
      <div className="hidden sm:block bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full" aria-label="Bookings table">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Início Agendado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Equipe</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted text-sm">Carregando…</td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted text-sm">Nenhum agendamento encontrado.</td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-border last:border-0 hover:bg-surface-alt transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm text-text-primary">{booking.client_name ?? booking.client_id.slice(0, 8) + '…'}</p>
                    {booking.service_name && <p className="text-xs text-text-muted mt-0.5">{booking.service_name}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={isVisuallyExpired(booking) ? 'error' : bookingBadgeVariant(booking.status)}>
                      {isVisuallyExpired(booking) ? 'Expirado' : (BOOKING_STATUS_LABELS[booking.status] ?? booking.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {new Date(booking.scheduled_start).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{booking.assigned_team ?? '—'}</td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/bookings/${booking.id}`)}>
                      Ver
                    </Button>
                    {(booking.status === 'confirmed' || booking.status === 'rescheduled') && (
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/bookings/${booking.id}/edit`)}>
                        Editar
                      </Button>
                    )}
                    {canComplete && booking.status === 'confirmed' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={completing === booking.id}
                        onClick={() => handleComplete(booking.id)}
                        aria-label={`Complete booking ${booking.id}`}
                      >
                        Concluir
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <p className="text-center text-text-muted text-sm py-8">Carregando…</p>
        ) : bookings.length === 0 ? (
          <p className="text-center text-text-muted text-sm py-8">Nenhum agendamento encontrado.</p>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-text-primary">{booking.client_name ?? booking.client_id.slice(0, 12) + '…'}</p>
                  {booking.service_name && <p className="text-xs text-text-muted mt-0.5">{booking.service_name}</p>}
                  <p className="text-sm text-text-secondary mt-0.5">
                    {new Date(booking.scheduled_start).toLocaleString()}
                  </p>
                  {booking.assigned_team && (
                    <p className="text-xs text-text-muted mt-0.5">Equipe: {booking.assigned_team}</p>
                  )}
                </div>
                <Badge variant={isVisuallyExpired(booking) ? 'error' : bookingBadgeVariant(booking.status)}>
                  {isVisuallyExpired(booking) ? 'Expirado' : (BOOKING_STATUS_LABELS[booking.status] ?? booking.status)}
                </Badge>
              </div>
              <div className="mt-3 flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/bookings/${booking.id}`)}>
                  Ver
                </Button>
                {(booking.status === 'confirmed' || booking.status === 'rescheduled') && (
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/bookings/${booking.id}/edit`)}>
                    Editar
                  </Button>
                )}
                {canComplete && booking.status === 'confirmed' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={completing === booking.id}
                    onClick={() => handleComplete(booking.id)}
                    aria-label={`Concluir agendamento ${booking.id}`}
                  >
                    Concluir
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-text-secondary">
            Página {page} de {totalPages} — {total} no total
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Página anterior">
              ← Anterior
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Próxima página">
              Próximo →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
