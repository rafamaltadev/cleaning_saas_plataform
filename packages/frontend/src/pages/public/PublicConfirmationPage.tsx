import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { getPublicBranding, type PublicBranding } from '../../api/publicTenant';
import { getMyBookings, setupPublicBookingInterceptor, type MyBooking } from '../../api/publicBooking';
import { loadPublicSession } from '../../utils/publicSession';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function PublicConfirmationPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [branding, setBranding] = useState<PublicBranding | null>(null);
  const [booking, setBooking] = useState<MyBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const faviconInjectedRef = useRef(false);

  useEffect(() => {
    if (!tenantSlug || !bookingId) {
      navigate(`/t/${tenantSlug ?? ''}`, { replace: true });
      return;
    }

    setupPublicBookingInterceptor(tenantSlug);
    const token = loadPublicSession(tenantSlug);

    const brandingPromise = getPublicBranding(tenantSlug).catch(() => null);
    const bookingsPromise = token
      ? getMyBookings(tenantSlug, token).catch(() => [] as MyBooking[])
      : Promise.resolve([] as MyBooking[]);

    Promise.all([brandingPromise, bookingsPromise])
      .then(([b, myBookings]) => {
        setBranding(b);
        const found = myBookings.find((bk) => bk.id === bookingId) ?? null;
        setBooking(found);
      })
      .finally(() => setLoading(false));
  }, [tenantSlug, bookingId, navigate]);

  // Apply branding
  useEffect(() => {
    if (!branding) return;
    const color = branding.primary_color;
    if (color) {
      document.documentElement.style.setProperty('--color-primary-override', color);
    }
    if (branding.favicon_url && !faviconInjectedRef.current) {
      faviconInjectedRef.current = true;
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = branding.favicon_url;
      link.id = 'tenant-favicon-confirmation';
      document.head.appendChild(link);
    }
    return () => {
      document.documentElement.style.removeProperty('--color-primary-override');
      const existing = document.getElementById('tenant-favicon-confirmation');
      if (existing) existing.remove();
      faviconInjectedRef.current = false;
    };
  }, [branding]);

  const primaryColor = branding?.primary_color ?? '#4F46E5';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Carregando…</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ '--color-primary-override': primaryColor } as React.CSSProperties}
      data-testid="confirmation-page"
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          {branding?.logo_url ? (
            <img src={branding.logo_url} alt={`Logo ${branding.name}`} className="h-10 w-auto object-contain" />
          ) : (
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {branding?.name ? branding.name.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <span className="font-semibold text-gray-900 text-lg truncate">{branding?.name}</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Success icon + message */}
        <div className="text-center mb-8" data-testid="confirmation-header">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M20 6L9 17l-5-5"
                stroke={primaryColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Agendamento enviado!</h1>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Seu agendamento foi recebido com sucesso e será confirmado em breve.
          </p>
        </div>

        {/* Status badge */}
        <div className="flex justify-center mb-6">
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
            data-testid="status-badge"
          >
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            Aguardando confirmação
          </span>
        </div>

        {/* Booking details card */}
        {booking ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4" data-testid="booking-details-card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Detalhes do agendamento</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <dt className="text-gray-500">Data</dt>
                <dd className="text-gray-900 font-medium capitalize">
                  {formatDate(booking.scheduled_start)}
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <dt className="text-gray-500">Horário</dt>
                <dd className="text-gray-900 font-medium">
                  {formatTime(booking.scheduled_start)} – {formatTime(booking.scheduled_end)}
                </dd>
              </div>
              {booking.service_name && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="text-gray-500">Serviço</dt>
                  <dd className="text-gray-900 font-medium">{booking.service_name}</dd>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <dt className="text-gray-500">Local</dt>
                <dd className="text-gray-900 font-medium">
                  {booking.service_address ?? 'Endereço do cliente'}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <p className="text-sm text-gray-500">Detalhes do agendamento: #{bookingId?.slice(0, 8)}</p>
          </div>
        )}

        {/* Next steps info */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Próximos passos</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">1.</span>
              <span>A empresa irá analisar e confirmar seu agendamento.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">2.</span>
              <span>Você receberá a confirmação por e-mail.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">3.</span>
              <span>Na data agendada, a equipe estará pronta para atendê-lo.</span>
            </li>
          </ul>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Link
            to={`/t/${tenantSlug}/portal`}
            className="block w-full min-h-[44px] rounded-lg text-white font-semibold text-sm text-center flex items-center justify-center transition-opacity hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
            data-testid="view-bookings-cta"
          >
            Ver meus agendamentos
          </Link>
          <Link
            to={`/t/${tenantSlug}`}
            className="block w-full min-h-[44px] rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm text-center flex items-center justify-center transition-colors hover:bg-gray-50"
            data-testid="back-home-cta"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
