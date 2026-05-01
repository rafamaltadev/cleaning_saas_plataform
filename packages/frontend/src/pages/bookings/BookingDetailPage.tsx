import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { getBookingById, completeBooking } from '../../api/bookings';
import type { RootState } from '../../store';
import type { ApiBooking, ApiBookingStatus } from '../../types';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getBookingById(id)
      .then(setBooking)
      .catch(() => setError('Failed to load booking.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleComplete() {
    if (!id) return;
    setCompleting(true);
    try {
      const updated = await completeBooking(id);
      setBooking(updated);
    } catch {
      setError('Failed to complete booking.');
    } finally {
      setCompleting(false);
    }
  }

  if (loading) return <p className="text-text-muted text-sm">Loading…</p>;
  if (error && !booking) return <p className="text-error text-sm">{error}</p>;
  if (!booking) return null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Booking Detail</h1>
          <p className="text-text-secondary text-sm mt-1 font-mono">{booking.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={bookingBadgeVariant(booking.status)}>{booking.status}</Badge>
          {canComplete && booking.status === 'confirmed' && (
            <Button variant="primary" loading={completing} onClick={handleComplete} aria-label="Complete booking">
              Complete Booking
            </Button>
          )}
          <Button variant="ghost" onClick={() => navigate('/bookings')}>Back</Button>
        </div>
      </div>

      {error && <p className="text-error text-sm mb-4" role="alert">{error}</p>}

      <div className="space-y-4 max-w-2xl">
        <Card title="Booking Information">
          <dl className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Status</dt>
              <dd><Badge variant={bookingBadgeVariant(booking.status)}>{booking.status}</Badge></dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Scheduled Start</dt>
              <dd className="text-sm text-text-primary">{new Date(booking.scheduled_start).toLocaleString()}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Scheduled End</dt>
              <dd className="text-sm text-text-primary">{new Date(booking.scheduled_end).toLocaleString()}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Assigned Team</dt>
              <dd className="text-sm text-text-primary">{booking.assigned_team ?? '—'}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Reference IDs">
          <dl className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Booking ID</dt>
              <dd className="text-xs font-mono text-text-primary break-all">{booking.id}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Quote ID</dt>
              <dd className="text-xs font-mono text-text-primary break-all">{booking.quote_id}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Client ID</dt>
              <dd className="text-xs font-mono text-text-primary break-all">{booking.client_id}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Service ID</dt>
              <dd className="text-xs font-mono text-text-primary break-all">{booking.service_id}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Idempotency Key</dt>
              <dd className="text-xs font-mono text-text-primary break-all">{booking.idempotency_key}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Created At</dt>
              <dd className="text-sm text-text-primary">{new Date(booking.created_at).toLocaleString()}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
