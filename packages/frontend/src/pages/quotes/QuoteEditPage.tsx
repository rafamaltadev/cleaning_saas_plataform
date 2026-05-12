import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { getQuoteById, updateQuote } from '../../api/quotes';
import { syncQuoteAddons } from '../../api/quoteAddons';
import { getClients } from '../../api/clients';
import { getServices } from '../../api/services';
import { getPricingRules } from '../../api/pricingRules';
import { getAddonsByService } from '../../api/addons';
import { calculatePriceCents, formatCurrency } from '../../utils/pricing';
import type { ApiQuote, Client, Service, ApiPricingRule, ServiceAddon } from '../../types';

function toDateInput(isoString: string): string {
  return isoString.split('T')[0];
}

function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export default function QuoteEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quote, setQuote] = useState<ApiQuote | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [pricingRules, setPricingRules] = useState<ApiPricingRule[]>([]);
  const [addons, setAddons] = useState<ServiceAddon[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  const [clientId, setClientId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [pricingRuleId, setPricingRuleId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [manualDiscount, setManualDiscount] = useState(0);
  const [areaSqm, setAreaSqm] = useState<number | ''>('');
  const [durationHours, setDurationHours] = useState<number | ''>('');
  const [serviceDate, setServiceDate] = useState('');
  const [useClientAddress, setUseClientAddress] = useState(true);
  const [serviceAddress, setServiceAddress] = useState('');
  const [observations, setObservations] = useState('');

  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedService = services.find((s) => s.id === serviceId);
  const selectedRule = pricingRules.find((r) => r.id === pricingRuleId);
  const filteredRules = pricingRules.filter((r) => !serviceId || r.service_id === serviceId);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getQuoteById(id),
      getClients({ limit: 100 }),
      getServices(),
      getPricingRules(),
    ])
      .then(([q, clientRes, svcRes, ruleRes]) => {
        setQuote(q);
        setClients(clientRes.data);
        setServices(svcRes);
        setPricingRules(ruleRes);
        setClientId(q.client_id);
        setServiceId(q.service_id);
        setPricingRuleId(q.pricing_rule_id ?? '');
        setValidUntil(toDateInput(q.valid_until));
        setManualDiscount(q.manual_discount_percent);
        const areaSqmValue = (q as Record<string, unknown>).area_sqm;
        if (typeof areaSqmValue === 'number') setAreaSqm(areaSqmValue);
        if (q.service_date) setServiceDate(toDateInput(q.service_date));
        setUseClientAddress(q.use_client_address ?? true);
        setServiceAddress(q.service_address ?? '');
        setObservations(q.observations ?? '');
        if (q.addons && q.addons.length > 0) {
          setSelectedAddonIds(q.addons.map((a) => a.addon_id));
        }
      })
      .catch(() => setError('Erro ao carregar orçamento.'))
      .finally(() => setLoadingData(false));
  }, [id]);

  useEffect(() => {
    if (!serviceId) { setAddons([]); return; }
    getAddonsByService(serviceId).then(setAddons).catch(() => setAddons([]));
  }, [serviceId]);

  const subtotal = selectedService
    ? calculatePriceCents({
        unit: selectedService.unit ?? 'flat',
        baseRateCents: selectedService.base_rate_cents ?? Math.round(selectedService.baseRate * 100),
        areaSqm: typeof areaSqm === 'number' ? areaSqm : undefined,
        durationHours: typeof durationHours === 'number' ? durationHours : undefined,
        priceMultiplier: selectedRule ? selectedRule.price_multiplier : 1,
        discountPercent: selectedRule ? selectedRule.discount_percent : 0,
        manualDiscountPercent: manualDiscount,
      })
    : (quote?.estimated_total_cents ?? 0);

  const addonTotal = addons
    .filter((a) => selectedAddonIds.includes(a.id))
    .reduce((sum, a) => sum + a.price_cents, 0);

  const estimatedTotal = subtotal + addonTotal;

  function toggleAddon(addonId: string) {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((i) => i !== addonId) : [...prev, addonId]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id || !clientId || !serviceId || !validUntil) {
      setError('Cliente, serviço e data de validade são obrigatórios.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        client_id: clientId,
        service_id: serviceId,
        pricing_rule_id: pricingRuleId || undefined,
        currency: quote?.currency ?? 'BRL',
        valid_until: new Date(validUntil).toISOString(),
        manual_discount_percent: manualDiscount || undefined,
        service_date: serviceDate ? new Date(serviceDate).toISOString() : undefined,
        use_client_address: useClientAddress,
        service_address: !useClientAddress && serviceAddress.trim() ? serviceAddress.trim() : undefined,
        observations: observations.trim() || undefined,
      };
      if (selectedService?.unit === 'sqm' && typeof areaSqm === 'number') {
        payload.area_sqm = areaSqm;
      }
      if (selectedService?.unit === 'hour' && typeof durationHours === 'number') {
        payload.duration_hours = durationHours;
      }
      await updateQuote(id, payload);
      const selectedAddons = addons.filter((a) => selectedAddonIds.includes(a.id));
      await syncQuoteAddons(
        id,
        selectedAddons.map((a) => ({ addon_id: a.id, name: a.name, price_cents: a.price_cents })),
      );
      navigate('/quotes');
    } catch {
      setError('Erro ao salvar orçamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted text-sm">Carregando orçamento…</p>
      </div>
    );
  }

  if (error && !quote) {
    return <p className="text-error text-sm">{error}</p>;
  }

  if (!quote) return null;

  const currency = quote.currency || 'BRL';
  const discountAmt = manualDiscount > 0 ? Math.round(subtotal * manualDiscount / 100) : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Editar Orçamento</h1>
        <p className="text-text-secondary text-sm mt-1 font-mono">{quote.id}</p>
      </div>

      <form onSubmit={handleSubmit} aria-label="Editar orçamento">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-4">
            <Card title="Detalhes do Orçamento">
              <div className="space-y-3">
                <SearchableSelect
                  label="Cliente *"
                  items={clients}
                  value={clientId}
                  onChange={setClientId}
                  getId={(c) => c.id}
                  getLabel={(c) => c.name}
                  placeholder="Buscar cliente…"
                  emptyMessage="Nenhum cliente encontrado."
                />

                <SearchableSelect
                  label="Serviço *"
                  items={services}
                  value={serviceId}
                  onChange={(sid) => { setServiceId(sid); setPricingRuleId(''); setSelectedAddonIds([]); }}
                  getId={(s) => s.id}
                  getLabel={(s) => s.name}
                  placeholder="Buscar serviço…"
                  emptyMessage="Nenhum serviço cadastrado."
                />

                {serviceId && filteredRules.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="rule-select">
                      Regra de Preço (opcional)
                    </label>
                    <select
                      id="rule-select"
                      value={pricingRuleId}
                      onChange={(e) => setPricingRuleId(e.target.value)}
                      className="w-full h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Sem regra de preço</option>
                      {filteredRules.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.frequency} — {r.discount_percent}% desc × {r.price_multiplier}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedService?.unit === 'sqm' && (
                  <Input
                    label="Área (m²)"
                    type="number"
                    value={areaSqm === '' ? '' : String(areaSqm)}
                    onChange={(e) => setAreaSqm(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="ex: 50"
                  />
                )}

                {selectedService?.unit === 'hour' && (
                  <Input
                    label="Duração (horas)"
                    type="number"
                    value={durationHours === '' ? '' : String(durationHours)}
                    onChange={(e) => setDurationHours(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="ex: 3"
                  />
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Válido até *"
                    type="date"
                    value={validUntil}
                    min={todayDate()}
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
                        {formatCurrency(addon.price_cents, currency)}
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

            {error && <p className="text-sm text-error" role="alert">{error}</p>}

            <div className="flex gap-3 pb-6">
              <Button type="submit" loading={loading}>Salvar Alterações</Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/quotes')}>
                Cancelar
              </Button>
            </div>
          </div>

          {/* Right column: summary */}
          <div className="lg:w-72 shrink-0">
            <div className="sticky top-6">
              <Card title="Resumo">
                <div className="space-y-2">
                  <div className="space-y-1">
                    {selectedService && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Serviço</span>
                        <span className="text-text-primary font-medium">{selectedService.name}</span>
                      </div>
                    )}
                    {subtotal > 0 && discountAmt > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Subtotal</span>
                        <span className="text-text-primary">
                          {formatCurrency(subtotal + discountAmt, currency)}
                        </span>
                      </div>
                    )}
                    {discountAmt > 0 && (
                      <div className="flex justify-between text-sm text-success">
                        <span>Desconto ({manualDiscount}%)</span>
                        <span>−{formatCurrency(discountAmt, currency)}</span>
                      </div>
                    )}
                    {selectedAddonIds.length > 0 && addons
                      .filter((a) => selectedAddonIds.includes(a.id))
                      .map((a) => (
                        <div key={a.id} className="flex justify-between text-sm">
                          <span className="text-text-secondary">+ {a.name}</span>
                          <span className="text-text-primary">{formatCurrency(a.price_cents, currency)}</span>
                        </div>
                      ))}
                  </div>

                  <div className="border-t border-border pt-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-text-primary">Total estimado</span>
                      <span className="text-primary text-base">
                        {formatCurrency(estimatedTotal, currency)}
                      </span>
                    </div>
                    {quote.estimated_total_cents !== estimatedTotal && (
                      <p className="text-xs text-text-muted mt-1">
                        Salvo: {formatCurrency(quote.estimated_total_cents, currency)}
                      </p>
                    )}
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
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
