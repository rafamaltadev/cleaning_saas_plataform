import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  getPublicBranding,
  getPublicServices,
  type PublicBranding,
  type PublicService,
} from '../../api/publicTenant';
import {
  getPublicServiceAddons,
  postQuoteEstimate,
  type PublicAddon,
  type QuoteEstimateResponse,
} from '../../api/publicQuote';
import { saveDraft } from '../../utils/publicQuoteDraft';
import ServiceSelector from '../../components/public/ServiceSelector';
import QuoteSummaryPanel from '../../components/public/QuoteSummaryPanel';
import PublicNotFoundPage from './PublicNotFoundPage';
import Input from '../../components/ui/Input';

function sanitizeText(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim();
}

export default function PublicQuoteFormPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();

  // Branding & services loading
  const [branding, setBranding] = useState<PublicBranding | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const faviconInjectedRef = useRef(false);

  // Service selection — useRef alongside useState per Phase 1 pattern
  const serviceIdRef = useRef('');
  const [serviceId, setServiceId] = useState('');

  // Addons
  const [addons, setAddons] = useState<PublicAddon[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(false);

  // Service detail fields
  const [areaSqm, setAreaSqm] = useState('');
  const [durationHours, setDurationHours] = useState('');

  // Location fields
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Observations
  const [observations, setObservations] = useState('');

  // Contact fields
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Estimate state
  const [estimate, setEstimate] = useState<QuoteEstimateResponse | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prevent double submission per Phase 1 pattern
  const isSubmittingRef = useRef(false);
  const [error, setError] = useState('');

  // Load branding and services on mount
  useEffect(() => {
    if (!tenantSlug) return;
    const slug = tenantSlug;

    Promise.all([
      getPublicBranding(slug).catch(() => null),
      getPublicServices(slug).catch((e: { response?: { status?: number } }) => {
        if (e?.response?.status === 404) setNotFound(true);
        return [];
      }),
    ]).then(([b, s]) => {
      setBranding(b);
      setServices(Array.isArray(s) ? s : []);
      setLoading(false);
    });
  }, [tenantSlug]);

  // Apply tenant primary color as scoped CSS variable and inject favicon
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
      link.id = 'tenant-favicon-quote';
      document.head.appendChild(link);
    }
    return () => {
      document.documentElement.style.removeProperty('--color-primary-override');
      const existing = document.getElementById('tenant-favicon-quote');
      if (existing) existing.remove();
      faviconInjectedRef.current = false;
    };
  }, [branding]);

  // Load addons when service changes
  useEffect(() => {
    const sid = serviceIdRef.current || serviceId;
    if (!sid || !tenantSlug) {
      setAddons([]);
      setSelectedAddonIds([]);
      return;
    }
    setAddonsLoading(true);
    getPublicServiceAddons(tenantSlug, sid)
      .then((a) => setAddons(a))
      .catch(() => setAddons([]))
      .finally(() => setAddonsLoading(false));
  }, [serviceId, tenantSlug]);

  // Debounced quote estimate fetch — 500ms after any input change
  const fetchEstimate = useCallback(() => {
    const sid = serviceIdRef.current || serviceId;
    if (!sid || !tenantSlug) return;

    const selectedService = services.find((s) => s.id === sid);
    if (!selectedService) return;

    const areaNum = parseFloat(areaSqm);
    const durationNum = parseFloat(durationHours);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      setEstimateLoading(true);
      try {
        const result = await postQuoteEstimate(tenantSlug, {
          service_id: sid,
          area_sqm:
            selectedService.unit === 'sqm' && !isNaN(areaNum) && areaNum > 0
              ? areaNum
              : undefined,
          duration_hours:
            selectedService.unit === 'hour' && !isNaN(durationNum) && durationNum > 0
              ? durationNum
              : undefined,
          addon_ids: selectedAddonIds.length > 0 ? selectedAddonIds : undefined,
        });
        setEstimate(result);
      } catch {
        // Silently ignore estimate errors — they don't block form completion
      } finally {
        setEstimateLoading(false);
      }
    }, 500);
  }, [serviceId, tenantSlug, services, areaSqm, durationHours, selectedAddonIds]);

  useEffect(() => {
    fetchEstimate();
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [fetchEstimate]);

  const handleServiceSelect = (id: string) => {
    serviceIdRef.current = id;
    setServiceId(id);
    setSelectedAddonIds([]);
    setEstimate(null);
    setAreaSqm('');
    setDurationHours('');
    setError('');
  };

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId],
    );
  };

  const handleContinue = () => {
    if (isSubmittingRef.current) return;

    // Client-side validation — error rendered at top of form per Phase 1 pattern
    const sid = serviceIdRef.current || serviceId;
    if (!sid) {
      setError('Selecione um serviço para continuar.');
      return;
    }

    const selectedService = services.find((s) => s.id === sid);
    if (selectedService?.unit === 'sqm' && (!areaSqm || parseFloat(areaSqm) <= 0)) {
      setError('Informe a área em m².');
      return;
    }
    if (selectedService?.unit === 'hour' && (!durationHours || parseFloat(durationHours) <= 0)) {
      setError('Informe a duração em horas.');
      return;
    }
    if (!address.trim()) {
      setError('Informe o endereço do serviço.');
      return;
    }
    if (!city.trim()) {
      setError('Informe a cidade.');
      return;
    }
    if (!state.trim()) {
      setError('Informe o estado.');
      return;
    }
    if (!postalCode.trim()) {
      setError('Informe o CEP.');
      return;
    }
    if (!contactName.trim()) {
      setError('Informe seu nome.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (!phone.trim()) {
      setError('Informe seu telefone.');
      return;
    }

    isSubmittingRef.current = true;
    try {
      const sanitizedName = sanitizeText(contactName);
      const sanitizedAddress = sanitizeText(address);
      const sanitizedObservations = sanitizeText(observations);

      saveDraft(tenantSlug!, {
        tenantSlug: tenantSlug!,
        serviceId: sid,
        serviceName: selectedService?.name ?? '',
        area_sqm:
          selectedService?.unit === 'sqm' && areaSqm ? parseFloat(areaSqm) : undefined,
        duration_hours:
          selectedService?.unit === 'hour' && durationHours
            ? parseFloat(durationHours)
            : undefined,
        addon_ids: selectedAddonIds,
        address: sanitizedAddress,
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        observations: sanitizedObservations,
        name: sanitizedName,
        email: email.trim(),
        phone: phone.trim(),
        subtotal_cents: estimate?.subtotal_cents,
        addon_total_cents: estimate?.addon_total_cents,
        discount_amount_cents: estimate?.discount_amount_cents,
        estimated_total_cents: estimate?.estimated_total_cents,
        currency: estimate?.currency,
      });

      navigate(`/t/${tenantSlug}/orcamento/cadastro`);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Carregando…</p>
      </div>
    );
  }

  if (notFound || !branding) {
    return <PublicNotFoundPage />;
  }

  const primaryColor = branding.primary_color || '#4F46E5';
  const selectedService =
    services.find((s) => s.id === (serviceIdRef.current || serviceId)) ?? null;

  return (
    <div
      className="min-h-screen bg-gray-50 pb-24 lg:pb-0"
      style={{ '--color-primary-override': primaryColor } as React.CSSProperties}
      data-testid="quote-form-page"
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          {branding.logo_url ? (
            <img
              src={branding.logo_url}
              alt={`Logo ${branding.name}`}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {branding.name ? branding.name.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <span className="font-semibold text-gray-900 text-lg truncate">{branding.name}</span>
          <Link
            to={`/t/${tenantSlug}`}
            className="ml-auto text-sm text-gray-500 hover:text-gray-700 transition-colors shrink-0"
          >
            ← Voltar
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Notice */}
        <div
          className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 leading-relaxed"
          data-testid="approval-notice"
        >
          O orçamento será confirmado pela empresa após sua solicitação. Você precisará criar uma
          conta para concluir.
        </div>

        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:items-start">
          {/* Form */}
          <form aria-label="Solicitar orçamento" noValidate>
            {/* Error message at top of form — Phase 1 pattern */}
            {error && (
              <div
                role="alert"
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                {error}
              </div>
            )}

            {/* Section 1: Select service */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Selecione o serviço</h2>
              <ServiceSelector
                services={services}
                selectedId={serviceIdRef.current || serviceId}
                onSelect={handleServiceSelect}
                primaryColor={primaryColor}
              />
            </section>

            {/* Section 2: Service details (shown only after service is selected) */}
            {selectedService && (
              <section className="mb-8" data-testid="service-details-section">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalhes do serviço</h2>

                {selectedService.unit === 'sqm' && (
                  <div className="mb-4">
                    <label
                      htmlFor="area-sqm"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Área (m²) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="area-sqm"
                      type="number"
                      min="1"
                      step="0.5"
                      value={areaSqm}
                      onChange={(e) => {
                        setAreaSqm(e.target.value);
                        setError('');
                      }}
                      className="w-full"
                      placeholder="Ex: 80"
                      variant="public"
                      data-testid="area-sqm-input"
                    />
                  </div>
                )}

                {selectedService.unit === 'hour' && (
                  <div className="mb-4">
                    <label
                      htmlFor="duration-hours"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Duração (horas) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="duration-hours"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={durationHours}
                      onChange={(e) => {
                        setDurationHours(e.target.value);
                        setError('');
                      }}
                      className="w-full"
                      placeholder="Ex: 3"
                      variant="public"
                      data-testid="duration-hours-input"
                    />
                  </div>
                )}

                {/* Addons multi-select */}
                {addonsLoading ? (
                  <p className="text-gray-400 text-sm" data-testid="addons-loading">
                    Carregando adicionais...
                  </p>
                ) : addons.length > 0 ? (
                  <div data-testid="addons-list">
                    <p className="text-sm font-medium text-gray-700 mb-2">Adicionais</p>
                    <div className="space-y-2">
                      {addons.map((addon) => (
                        <label
                          key={addon.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 min-h-[44px]"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAddonIds.includes(addon.id)}
                            onChange={() => handleAddonToggle(addon.id)}
                            className="h-4 w-4 rounded"
                            style={{ accentColor: primaryColor }}
                            data-testid={`addon-checkbox-${addon.id}`}
                          />
                          <span className="flex-1 text-sm text-gray-900">{addon.name}</span>
                          <span className="text-sm text-gray-500 shrink-0">
                            +{' '}
                            {(addon.price_cents / 100).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            )}

            {/* Section 3: Location */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Local do serviço</h2>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Endereço <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setError('');
                    }}
                    className="w-full"
                    placeholder="Rua, número, complemento"
                    variant="public"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Cidade <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setError('');
                      }}
                      className="w-full"
                      placeholder="São Paulo"
                      variant="public"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="state"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Estado <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="state"
                      type="text"
                      value={state}
                      onChange={(e) => {
                        setState(e.target.value);
                        setError('');
                      }}
                      className="w-full"
                      placeholder="SP"
                      maxLength={2}
                      variant="public"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="postal-code"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    CEP <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="postal-code"
                    type="text"
                    value={postalCode}
                    onChange={(e) => {
                      setPostalCode(e.target.value);
                      setError('');
                    }}
                    className="w-full"
                    placeholder="00000-000"
                    variant="public"
                  />
                </div>
              </div>
            </section>

            {/* Section 4: Observations */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Observações</h2>
              <textarea
                id="observations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all duration-200"
                placeholder="Informações adicionais (opcional)"
              />
            </section>

            {/* Section 5: Contact info */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Seus dados</h2>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="contact-name"
                    type="text"
                    value={contactName}
                    onChange={(e) => {
                      setContactName(e.target.value);
                      setError('');
                    }}
                    className="w-full"
                    placeholder="Seu nome completo"
                    variant="public"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    className="w-full"
                    placeholder="seu@email.com"
                    variant="public"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Telefone <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setError('');
                    }}
                    className="w-full"
                    placeholder="(11) 99999-9999"
                    variant="public"
                  />
                </div>
              </div>
            </section>

            {/* Desktop CTA — hidden on mobile (mobile uses QuoteSummaryPanel bottom bar) */}
            <div className="hidden lg:flex gap-3 mb-4">
              <Link
                to={`/t/${tenantSlug}`}
                className="flex-1 h-11 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Voltar
              </Link>
              <button
                type="button"
                onClick={handleContinue}
                className="flex-1 h-11 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: primaryColor }}
              >
                Continuar para cadastro
              </button>
            </div>
          </form>

          {/* Summary panel — desktop sticky / mobile fixed bottom */}
          <QuoteSummaryPanel
            service={selectedService}
            estimate={estimate}
            loading={estimateLoading}
            primaryColor={primaryColor}
            onContinue={handleContinue}
          />
        </div>
      </div>
    </div>
  );
}
