import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Badge from '../../components/ui/Badge';
import { loadPublicSession } from '../../utils/publicSession';
import type { MyBooking } from '../../api/publicBooking';

const publicClient = axios.create({ baseURL: '/api/v1' });

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' });
}

export default function PaymentSuccessPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('bookingId') ?? '';

  const [booking, setBooking] = useState<MyBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantSlug || !bookingId) { setLoading(false); return; }
    const token = loadPublicSession(tenantSlug);
    if (!token) { setLoading(false); return; }

    publicClient
      .get<MyBooking[] | { data?: MyBooking[] }>(`/public/${tenantSlug}/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).data ?? [];
        const found = (list as MyBooking[]).find((b) => b.id === bookingId);
        setBooking(found ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenantSlug, bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-secondary text-sm">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <div className="text-5xl mb-4" aria-hidden="true">✅</div>
          <h1 className="text-2xl font-bold text-success mb-2">Pagamento Confirmado!</h1>
          <p className="text-text-secondary text-sm mb-6">
            Seu pagamento foi processado com sucesso. Você receberá uma confirmação por email.
          </p>

          {booking && (
            <div className="bg-surface-alt rounded-lg p-4 text-left mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-text-secondary">Status</span>
                <Badge variant="success">Confirmado</Badge>
              </div>
              {booking.service_name && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary">Serviço</span>
                  <span className="text-text-primary font-medium">{booking.service_name}</span>
                </div>
              )}
              {booking.scheduled_start && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary">Data</span>
                  <span className="text-text-primary font-medium">{formatDate(booking.scheduled_start)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">ID do Agendamento</span>
                <span className="text-text-muted font-mono text-xs">{bookingId.slice(0, 8)}…</span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate(`/t/${tenantSlug}`)}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold text-sm transition-all duration-200 min-h-[44px]"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  );
}
