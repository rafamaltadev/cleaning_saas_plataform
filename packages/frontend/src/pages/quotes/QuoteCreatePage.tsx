import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { createQuote } from '../../api/quotes';
import { syncQuoteAddons } from '../../api/quoteAddons';
import { getClients } from '../../api/clients';
import { getServices } from '../../api/services';
import { getAddonsByService } from '../../api/addons';
import { calculatePriceCents, formatCurrency } from '../../utils/pricing';
import type { Client, Service, ServiceAddon } from '../../types';

const CURRENCY = 'BRL';

export default function QuoteCreatePage() {
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [addons, setAddons] = useState<ServiceAddon[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  const [clientId, setClientId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [manualDiscount, setManualDiscount] = useState(0);
  const [areaSqm, setAreaSqm] = useState<number | ''>('');
  const [durationHours, setDurationHours] = useState<number | ''>('');
  const [serviceDate, setServiceDate] = useState('');
  const [useClientAddress, setUseClientAddress] = useState(true);
  const [serviceAddress, setServiceAddress] = useState('');
  const [observations, setObservations] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const clientIdRef = useRef('');
  const serviceIdRef = useRef('');

  useEffect(() => {
    Promise.all([
      getClients({ limit: 100 }),
      getServices(),
    ]).then(([clientRes, svcRes]) => {
      setClients(clientRes.data);
      setServices(svcRes);
    }).catch(() => setError('Erro ao carregar dados do formulário.'));
  }, []);

  useEffect(() => {
    if (!serviceId) { setAddons([]); setSelectedAddonIds([]); return; }
    getAddonsByService(serviceId)
      .then(setAddons)
      .catch(() => setAddons([]));
  }, [serviceId]);

  const selectedService = services.find((s) => s.id === serviceId);

  const basePrice = selectedService
    ? calculatePriceCents({
        unit: selectedService.unit ?? 'flat',
        baseRateCents: selectedService.base_rate_cents ?? Math.round((selectedService.baseRate ?? 0) * 100),
        areaSqm: typeof areaSqm === 'number' ? areaSqm : undefined,
        durationHours: typeof durationHours === 'number' ? durationHours : undefined,
        priceMultiplier: 1,
        discountPercent: 0,
        manualDiscountPercent: 0,
      })
    : 0;

  const subtotal = selectedService
    ? calculatePriceCents({
        unit: selectedService.unit ?? 'flat',
        baseRateCents: selectedService.base_rate_cents ?? Math.round((selectedService.baseRate ?? 0) * 100),
        areaSqm: typeof areaSqm === 'number' ? areaSqm : undefined,
        durationHours: typeof durationHours === 'number' ? durationHours : undefined,
        priceMultiplier: 1,
        discountPercent: 0,
        manualDiscountPercent: manualDiscount,
      })
    : 0;

  const discountAmt = basePrice - subtotal;

  const addonTotal = addons
    .filter((a) => selectedAddonIds.includes(a.id))
    .reduce((sum, a) => sum + a.price_cents, 0);

  const estimatedTotal = subtotal + addonTotal;

  function toggleAddon(addonId: string) {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validUntil) {
      setError('Data de validade é obrigatória.');
      return;
    }
    const cid = clientIdRef.current || clientId;
    const sid = serviceIdRef.current || serviceId;
    if (!cid) {
      setError('Selecione um cliente da lista de sugestões.');
      return;
    }
    if (!sid) {
      setError('Selecione um serviço da lista de sugestões.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        client_id: cid,
        service_id: sid,
        currency: CURRENCY,
        valid_until: new Date(validUntil).toISOString(),
        manual_discount_percent: manualDiscount || undefined,
        area_sqm: selectedService?.unit === 'sqm' && typeof areaSqm === 'number' ? areaSqm : undefined,
        duration_hours: selectedService?.unit === 'hour' && typeof durationHours === 'number' ? durationHours : undefined,
        service_date: serviceDate ? new Date(serviceDate).toISOString() : undefined,
        use_client_address: useClientAddress,
        service_address: !useClientAddress && serviceAddress.trim() ? serviceAddress.trim() : undefined,
        observations: observations.trim() || undefined,
      };
      const created = await createQuote(payload);
      if (selectedAddonIds.length > 0) {
        const selectedAddons = addons.filter((a) => selectedAddonIds.includes(a.id));
        await syncQuoteAddons(
          created.id,
          selectedAddons.map((a) => ({ addon_id: a.id, name: a.name, price_cents: a.price_cents })),
        );
      }
      navigate('/quotes');
    } catch (err) {
      const axiosErr = err as import('axios').AxiosError<{ error?: { message?: string | string[] }; message?: string | string[] }>;
      const raw = axiosErr.response?.data;
      const msg = raw?.error?.message ?? raw?.message;
      const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao criar orçamento. Tente novamente.');
      setError(detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Novo Orçamento</h1>
        <p className="text-text-secondary text-sm mt-1">Criar um novo orçamento para um cliente</p>
      </div>

      <form onSubmit={handleSubmit} aria-label="Criar orçamento">
        {error && <p className="text-sm text-error mb-4" role="alert">{error}</p>}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-4">
            <Card title="Detalhes do Orçamento">
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      label="Cliente *"
                      items={clients}
                      value={clientId}
                      onChange={(id) => { clientIdRef.current = id; setClientId(id); }}
                      getId={(c) => c.id}
                      getLabel={(c) => c.name}
                      placeholder="Buscar cliente…"
                      emptyMessage="Nenhum cliente encontrado."
                    />
                  </div>
                  <Link
                    to="/clients/new"
                    className="shrink-0 text-xs text-primary hover:underline pb-1"
                  >
                    + Novo cliente
                  </Link>
                </div>

                <SearchableSelect
                  label="Serviço *"
                  items={services}
                  value={serviceId}
                  onChange={(id) => { serviceIdRef.current = id; setServiceId(id); }}
                  getId={(s) => s.id}
                  getLabel={(s) => s.name}
                  placeholder="Buscar serviço…"
                  emptyMessage="Nenhum serviço cadastrado. Cadastre serviços em Serviços."
                />

                {selectedService?.unit === 'sqm' && (
                  <Input
                    label="Área (m²)"
                    type="number"
                    value={areaSqm === '' ? '' : String(areaSqm)}
                    onChange={(e) => setAreaSqm(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="ex: 50"
                    required
                  />
                )}

                {selectedService?.unit === 'hour' && (
                  <Input
                    label="Duração (horas)"
                    type="number"
                    value={durationHours === '' ? '' : String(durationHours)}
                    onChange={(e) => setDurationHours(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="ex: 3"
                    required
                  />
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Válido até *"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    required
                  />
                  <Input
                    label="Data do serviço"
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                  />
                </div>

                <Input
                  label="Desconto manual (%)"
                  type="number"
                  value={String(manualDiscount)}
                  onChange={(e) => setManualDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                  placeholder="0"
                />
              </div>
            </Card>

            {/* Addons */}
            {addons.length > 0 && (
              <Card title="Adicionais">
                <div className="space-y-2">
                  {addons.map((addon) => (
                    <label key={addon.id} className="flex items-center justify-between cursor-pointer py-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedAddonIds.includes(addon.id)}
                          onChange={() => toggleAddon(addon.id)}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-sm text-text-primary">{addon.name}</span>
                      </div>
                      <span className="text-sm text-text-secondary">
                        {formatCurrency(addon.price_cents, CURRENCY)}
                      </span>
                    </label>
                  ))}
                </div>
              </Card>
            )}

            {/* Local do serviço */}
            <Card title="Local do Serviço">
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useClientAddress}
                    onChange={(e) => setUseClientAddress(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm text-text-primary">Usar endereço do cliente</span>
                </label>
                {!useClientAddress && (
                  <Input
                    label="Endereço do serviço"
                    value={serviceAddress}
                    onChange={(e) => setServiceAddress(e.target.value)}
                    placeholder="Rua, número, bairro, cidade"
                  />
                )}
              </div>
            </Card>

            {/* Observations */}
            <Card title="Observações">
              <div className="flex flex-col gap-1">
                <label htmlFor="observations" className="text-sm font-medium text-text-primary">
                  Observações para a equipe
                </label>
                <textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Informações adicionais sobre o serviço…"
                  rows={3}
                  className="px-3 py-2 rounded bg-surface-alt border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 resize-none"
                />
              </div>
            </Card>

            <div className="flex gap-3 pb-6">
              <Button type="submit" loading={loading}>Criar Orçamento</Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/quotes')}>Cancelar</Button>
            </div>
          </div>

          {/* Right column: summary */}
          <div className="lg:w-72 shrink-0">
            <div className="sticky top-6">
              <Card title="Resumo">
                {!serviceId ? (
                  <p className="text-sm text-text-muted">Selecione um serviço para ver o resumo.</p>
                ) : (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Serviço</span>
                        <span className="text-text-primary font-medium">
                          {selectedService?.name}
                        </span>
                      </div>
                      {basePrice > 0 && discountAmt > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Subtotal</span>
                          <span className="text-text-primary">
                            {formatCurrency(basePrice, CURRENCY)}
                          </span>
                        </div>
                      )}
                      {discountAmt > 0 && (
                        <div className="flex justify-between text-sm text-success">
                          <span>Desconto ({manualDiscount}%)</span>
                          <span>−{formatCurrency(discountAmt, CURRENCY)}</span>
                        </div>
                      )}
                      {selectedAddonIds.length > 0 && (
                        <>
                          {addons
                            .filter((a) => selectedAddonIds.includes(a.id))
                            .map((a) => (
                              <div key={a.id} className="flex justify-between text-sm">
                                <span className="text-text-secondary">+ {a.name}</span>
                                <span className="text-text-primary">
                                  {formatCurrency(a.price_cents, CURRENCY)}
                                </span>
                              </div>
                            ))}
                        </>
                      )}
                    </div>

                    <div className="border-t border-border pt-2">
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-text-primary">Total estimado</span>
                        <span className="text-primary text-base" data-testid="estimated-total">
                          {formatCurrency(estimatedTotal, CURRENCY)}
                        </span>
                      </div>
                    </div>

                    {serviceDate && (
                      <div className="border-t border-border pt-2 text-xs text-text-secondary">
                        Data do serviço:{' '}
                        <span className="text-text-primary">
                          {new Date(serviceDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}

                    {!useClientAddress && serviceAddress.trim() && (
                      <div className="border-t border-border pt-2 text-xs text-text-secondary">
                        Local: <span className="text-text-primary">{serviceAddress}</span>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
