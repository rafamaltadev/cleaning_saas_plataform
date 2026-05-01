import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { listBookings, completeBooking } from '../../api/bookings';
import type { RootState } from '../../store';
import type { ApiBooking, ApiBookingStatus } from '../../types';

const PAGE_SIZE = 20;

function bookingBadgeVariant(status: ApiBookingStatus) {
  switch (status) {
    case 'confirmed': return 'success' as const;
    case 'rescheduled': return 'warning' as const;
    case 'cancelled': return 'error' as const;
    default: return 'neutral' as const;
  }
}

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

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listBookings({ page, limit: PAGE_SIZE, status: statusFilter || undefined });
      setBookings(result.items);
      setTotal(result.meta.total);
    } catch {
      setError('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  async function handleComplete(id: string) {
    setCompleting(id);
    try {
      await completeBooking(id);
      void fetchBookings();
    } catch {
      setError('Failed to complete booking.');
    } finally {
      setCompleting(null);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Bookings</h1>
        <Button onClick={() => navigate('/bookings/new')}>+ New Booking</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="rescheduled">Rescheduled</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {error && <p className="text-error text-sm mb-4" role="alert">{error}</p>}

      {/* Desktop table */}
      <div className="hidden sm:block bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full" aria-label="Bookings table">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Scheduled Start</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Team</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted text-sm">Loading…</td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted text-sm">No bookings found.</td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-border last:border-0 hover:bg-surface-alt transition-colors">
                  <td className="px-4 py-3 text-sm text-text-primary font-mono">{booking.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    <Badge variant={bookingBadgeVariant(booking.status)}>{booking.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {new Date(booking.scheduled_start).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{booking.assigned_team ?? '—'}</td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/bookings/${booking.id}`)}>
                      View
                    </Button>
                    {canComplete && booking.status === 'confirmed' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={completing === booking.id}
                        onClick={() => handleComplete(booking.id)}
                        aria-label={`Complete booking ${booking.id}`}
                      >
                        Complete
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
          <p className="text-center text-text-muted text-sm py-8">Loading…</p>
        ) : bookings.length === 0 ? (
          <p className="text-center text-text-muted text-sm py-8">No bookings found.</p>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-mono text-text-secondary">{booking.id.slice(0, 12)}…</p>
                  <p className="text-sm font-medium text-text-primary mt-0.5">
                    {new Date(booking.scheduled_start).toLocaleString()}
                  </p>
                  {booking.assigned_team && (
                    <p className="text-xs text-text-muted mt-0.5">Team: {booking.assigned_team}</p>
                  )}
                </div>
                <Badge variant={bookingBadgeVariant(booking.status)}>{booking.status}</Badge>
              </div>
              <div className="mt-3 flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/bookings/${booking.id}`)}>
                  View
                </Button>
                {canComplete && booking.status === 'confirmed' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={completing === booking.id}
                    onClick={() => handleComplete(booking.id)}
                    aria-label={`Complete booking ${booking.id}`}
                  >
                    Complete
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
            Page {page} of {totalPages} — {total} total
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
              ← Prev
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
