import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getPublicBranding, type PublicBranding } from '../../api/publicTenant';
import {
  getPublicAvailability,
  createPublicBooking,
  getMyBookingsCount,
  setupPublicBookingInterceptor,
  type DayAvailability,
  type TimeSlot,
} from '../../api/publicBooking';
import { loadPublicSession } from '../../utils/publicSession';
import AvailabilityCalendar from '../../components/public/AvailabilityCalendar';
import TimeSlotGrid from '../../components/public/TimeSlotGrid';
import FirstBookingModal from '../../components/public/FirstBookingModal';

function getMonthRange(year: number, month: number): { from: string; to: string } {
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

export default function PublicSchedulingPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quoteId = searchParams.get('quoteId');

  const [branding, setBranding] = useState<PublicBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const faviconInjectedRef = useRef(false);

  // Availability state
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selection state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slotsForDate, setSlotsForDate] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Form fields
  const [useClientAddress, setUseClientAddress] = useState(true);
  const [customAddress, setCustomAddress] = useState('');
  const [observations, setObservations] = useState('');

  // Submit state
  const isSubmittingRef = useRef(false);
  const [error, setError] = useState('');
  const [showFirstBookingModal, setShowFirstBookingModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auth token
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Redirect if not authenticated or no quoteId; wire up 401 interceptor
  useEffect(() => {
    if (!tenantSlug) return;
    setupPublicBookingInterceptor(tenantSlug);
    const token = loadPublicSession(tenantSlug);
    if (!token || !quoteId) {
      navigate(`/t/${tenantSlug}`, { replace: true });
      return;
    }
    setAccessToken(token);
  }, [tenantSlug, quoteId, navigate]);

  // Load branding
  useEffect(() => {
    if (!tenantSlug) return;
    Promise.all([getPublicBranding(tenantSlug).catch(() => null)])
      .then(([b]) => { setBranding(b); })
      .finally(() => setLoading(false));
  }, [tenantSlug]);

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
      link.id = 'tenant-favicon-scheduling';
      document.head.appendChild(link);
    }
    return () => {
      document.documentElement.style.removeProperty('--color-primary-override');
      const existing = document.getElementById('tenant-favicon-scheduling');
      if (existing) existing.remove();
      faviconInjectedRef.current = false;
    };
  }, [branding]);

  // Load availability for current month (debounced)
  const loadAvailability = useCallback(() => {
    if (!tenantSlug) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setAvailLoading(true);
      const { from, to } = getMonthRange(viewYear, viewMonth);
      try {
        const data = await getPublicAvailability(tenantSlug, from, to);
        setAvailability(data);
      } catch {
        // silently fail — calendar will show no available dates
      } finally {
        setAvailLoading(false);
      }
    }, 300);
  }, [tenantSlug, viewYear, viewMonth]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  // When month changes, reset date selection
  const handleMonthChange = useCallback((year: number, month: number) => {
    setViewYear(year);
    setViewMonth(month);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSlotsForDate([]);
  }, []);

  // When date selected, show its slots
  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    const day = availability.find((d) => d.date === date);
    setSlotsForDate(day?.slots ?? []);
  }, [availability]);

  // Compute available dates set for calendar
  const availableDates = new Set(
    availability
      .filter((d) => d.slots.some((s) => s.available))
      .map((d) => d.date),
  );

  const primaryColor = branding?.primary_color ?? '#4F46E5';

  async function doSubmit() {
    if (isSubmittingRef.current) return;
    if (!selectedDate || !selectedSlot) {
      setError('Selecione uma data e horário para continuar.');
      return;
    }
    if (!useClientAddress && !customAddress.trim()) {
      setError('Informe o endereço do serviço.');
      return;
    }
    if (!accessToken || !quoteId || !tenantSlug) return;

    isSubmittingRef.current = true;
    setSubmitting(true);
    setError('');

    try {
      const scheduledStart = new Date(`${selectedDate}T${selectedSlot.start}:00`).toISOString();
      const scheduledEnd = new Date(`${selectedDate}T${selectedSlot.end}:00`).toISOString();

      const result = await createPublicBooking(tenantSlug, accessToken, {
        quote_id: quoteId,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        service_address: !useClientAddress && customAddress.trim() ? customAddress.trim() : undefined,
        observations: observations.trim() || undefined,
      });

      navigate(`/t/${tenantSlug}/orcamento/confirmacao?bookingId=${result.id}`);
    } catch (err) {
      const axiosErr = err as import('axios').AxiosError<{ error?: { message?: string | string[] }; message?: string | string[] }>;
      const raw = axiosErr.response?.data;
      const msg = raw?.error?.message ?? raw?.message;
      const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao criar agendamento. Tente novamente.');
      setError(detail);
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  }

  async function handleConfirmClick() {
    if (isSubmittingRef.current) return;
    if (!selectedDate || !selectedSlot) {
      setError('Selecione uma data e horário para continuar.');
      return;
    }
    if (!useClientAddress && !customAddress.trim()) {
      setError('Informe o endereço do serviço.');
      return;
    }
    if (!accessToken || !tenantSlug) return;

    // Check first booking
    try {
      const count = await getMyBookingsCount(tenantSlug, accessToken);
      if (count === 0) {
        setShowFirstBookingModal(true);
        return;
      }
    } catch {
      // If check fails, proceed normally
    }

    void doSubmit();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Carregando…</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 pb-24 sm:pb-8"
      style={{ '--color-primary-override': primaryColor } as React.CSSProperties}
      data-testid="scheduling-page"
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

      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Agendar serviço</h1>
        <p className="text-gray-500 text-sm mb-6">
          Escolha uma data e horário para a realização do serviço.
        </p>

        {/* Error at top — Phase 1 pattern */}
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            data-testid="form-error"
          >
            {error}
          </div>
        )}

        <form noValidate>
          {/* Calendar section */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Selecione a data</h2>
            {availLoading && (
              <p className="text-sm text-gray-400 mb-3">Carregando disponibilidade…</p>
            )}
            <AvailabilityCalendar
              availableDates={availableDates}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onMonthChange={handleMonthChange}
              primaryColor={primaryColor}
            />
          </div>

          {/* Time slots section */}
          {selectedDate && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4" data-testid="time-slots-section">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Selecione o horário — {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })}
              </h2>
              <TimeSlotGrid
                slots={slotsForDate}
                selectedStart={selectedSlot?.start ?? null}
                onSlotSelect={(slot) => { setSelectedSlot(slot); setError(''); }}
                loading={availLoading}
                primaryColor={primaryColor}
              />
            </div>
          )}

          {/* Service address section */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Local do serviço</h2>
            <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={useClientAddress}
                onChange={(e) => {
                  setUseClientAddress(e.target.checked);
                  if (e.target.checked) setCustomAddress('');
                }}
                className="w-5 h-5 rounded border-gray-300 accent-[var(--color-primary-override,#4F46E5)]"
                data-testid="use-client-address-checkbox"
              />
              <span className="text-sm text-gray-700">Executar no endereço cadastrado</span>
            </label>

            {!useClientAddress && (
              <div className="mt-3">
                <label htmlFor="custom-address" className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço do serviço <span className="text-red-500">*</span>
                </label>
                <input
                  id="custom-address"
                  type="text"
                  value={customAddress}
                  onChange={(e) => { setCustomAddress(e.target.value); setError(''); }}
                  placeholder="Rua, número, bairro, cidade"
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-override,#4F46E5)]"
                  data-testid="custom-address-input"
                />
              </div>
            )}
          </div>

          {/* Observations section */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Observações para a equipe</h2>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Algum detalhe importante? (opcional)"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-override,#4F46E5)] resize-none"
              data-testid="observations-textarea"
            />
          </div>

          {/* Desktop CTA */}
          <div className="hidden sm:block">
            <button
              type="button"
              onClick={handleConfirmClick}
              disabled={!selectedDate || !selectedSlot || submitting}
              style={{
                backgroundColor: !selectedDate || !selectedSlot || submitting ? '#D1D5DB' : primaryColor,
              }}
              className="w-full min-h-[44px] rounded-lg text-white font-semibold text-base transition-opacity hover:opacity-90 disabled:cursor-not-allowed"
              data-testid="confirm-booking-btn"
            >
              {submitting ? 'Enviando…' : 'Confirmar agendamento'}
            </button>
          </div>
        </form>
      </div>

      {/* Mobile sticky bottom action bar */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-10"
        data-testid="mobile-action-bar"
      >
        {selectedSlot && selectedDate && (
          <p className="text-xs text-gray-500 mb-1 truncate">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
            {' — '}{selectedSlot.start} às {selectedSlot.end}
          </p>
        )}
        <button
          type="button"
          onClick={handleConfirmClick}
          disabled={!selectedDate || !selectedSlot || submitting}
          style={{
            backgroundColor: !selectedDate || !selectedSlot || submitting ? '#D1D5DB' : primaryColor,
          }}
          className="w-full min-h-[44px] rounded-lg text-white font-semibold text-base transition-opacity hover:opacity-90 disabled:cursor-not-allowed"
          data-testid="confirm-booking-btn-mobile"
        >
          {submitting ? 'Enviando…' : 'Confirmar agendamento'}
        </button>
      </div>

      {/* First booking modal */}
      {showFirstBookingModal && (
        <FirstBookingModal
          onConfirm={() => { setShowFirstBookingModal(false); void doSubmit(); }}
          onCancel={() => setShowFirstBookingModal(false)}
          loading={submitting}
          primaryColor={primaryColor}
        />
      )}
    </div>
  );
}
