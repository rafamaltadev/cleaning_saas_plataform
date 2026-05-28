import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import axios from 'axios';
import StripePaymentForm from '../../components/public/StripePaymentForm';
import { loadPublicSession } from '../../utils/publicSession';
import type { MyBooking } from '../../api/publicBooking';

const publicClient = axios.create({ baseURL: '/api/v1' });

interface PaymentIntentResponse {
  clientSecret: string;
  publishableKey: string;
  paymentMethods: string[];
}

interface BookingSummary {
  id: string;
  serviceName?: string;
  scheduledStart?: string;
  amountCents: number;
  currency: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function PublicPaymentPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('bookingId') ?? '';

  const [intentData, setIntentData] = useState<PaymentIntentResponse | null>(null);
  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (!tenantSlug || !bookingId || isFetchingRef.current) return;
    isFetchingRef.current = true;

    const token = loadPublicSession(tenantSlug);
    if (!token) {
      navigate(`/t/${tenantSlug}/orcamento/cadastro?sessionExpired=1`);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    async function init() {
      try {
        // Fetch my bookings to get booking details
        const bookingsRes = await publicClient.get<{ data?: MyBooking[]; items?: MyBooking[] } | MyBooking[]>(
          `/public/${tenantSlug}/bookings/my`,
          { headers },
        );
        const rawBookings = Array.isArray(bookingsRes.data)
          ? bookingsRes.data
          : (bookingsRes.data as any).data ?? (bookingsRes.data as any).items ?? [];
        const found = (rawBookings as MyBooking[]).find((b) => b.id === bookingId);

        // Create payment intent
        const intentRes = await publicClient.post<PaymentIntentResponse | { data: PaymentIntentResponse }>(
          `/public/${tenantSlug}/payments/intent`,
          { booking_id: bookingId },
          { headers },
        );
        const intent: PaymentIntentResponse = (intentRes.data as any).data ?? intentRes.data;

        setIntentData(intent);
        setBooking({
          id: bookingId,
          serviceName: found?.service_name,
          scheduledStart: found?.scheduled_start,
          amountCents: 0,
          currency: 'BRL',
        });
      } catch (err) {
        const axiosErr = err as import('axios').AxiosError<{ error?: { message?: string | string[] }; message?: string | string[] }>;
        const raw = axiosErr.response?.data;
        const msg = raw?.error?.message ?? raw?.message;
        const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao carregar pagamento.');
        setError(detail);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    }

    void init();
  }, [tenantSlug, bookingId, navigate]);

  function handleSuccess(paymentIntentId: string) {
    navigate(`/t/${tenantSlug}/pagamento/sucesso?bookingId=${bookingId}&paymentIntentId=${paymentIntentId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-secondary text-sm">Carregando informações de pagamento…</p>
      </div>
    );
  }

  if (error || !intentData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-surface border border-border rounded-xl p-8 max-w-md w-full text-center">
          <p className="text-error text-sm mb-4" role="alert">{error || 'Não foi possível carregar o pagamento.'}</p>
          <button
            type="button"
            className="text-primary underline text-sm"
            onClick={() => navigate(`/t/${tenantSlug}`)}
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  const stripePromise = loadStripe(intentData.publishableKey);
  const successRedirectUrl = `${window.location.origin}/t/${tenantSlug}/pagamento/sucesso?bookingId=${bookingId}`;

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Finalizar Pagamento</h1>
        <p className="text-text-secondary text-sm mb-8">Pague com segurança via Stripe</p>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Payment form */}
          <div className="flex-1 order-2 lg:order-1">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-base font-semibold text-text-primary mb-4">Dados de Pagamento</h2>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: intentData.clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#4F46E5',
                      colorBackground: '#1F2937',
                      colorText: '#F9FAFB',
                      colorDanger: '#EF4444',
                      borderRadius: '8px',
                    },
                  },
                }}
              >
                <StripePaymentForm
                  amountCents={booking?.amountCents ?? 0}
                  currency={booking?.currency ?? 'BRL'}
                  onSuccess={handleSuccess}
                  successRedirectUrl={successRedirectUrl}
                />
              </Elements>
            </div>
          </div>

          {/* Booking summary */}
          <div className="lg:w-72 order-1 lg:order-2 lg:sticky lg:top-4 self-start">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-base font-semibold text-text-primary mb-4">Resumo do Agendamento</h2>
              {booking?.serviceName && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary">Serviço</span>
                  <span className="text-text-primary font-medium">{booking.serviceName}</span>
                </div>
              )}
              {booking?.scheduledStart && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary">Data</span>
                  <span className="text-text-primary font-medium">{formatDate(booking.scheduledStart)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold mt-4 pt-4 border-t border-border">
                <span className="text-text-primary">Total</span>
                <span className="text-primary">
                  {booking?.amountCents != null && booking.amountCents > 0
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: booking.currency }).format(booking.amountCents / 100)
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
