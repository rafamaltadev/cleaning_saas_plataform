import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { createQuote } from '../../api/quotes';
import { getClients } from '../../api/clients';
import { getServices } from '../../api/tenants';
import { getPricingRules } from '../../api/pricingRules';
import { calculatePriceCents, formatCurrency } from '../../utils/pricing';
import type { Client, Service, ApiPricingRule } from '../../types';

const CURRENCY = 'BRL';

export default function QuoteCreatePage() {
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [pricingRules, setPricingRules] = useState<ApiPricingRule[]>([]);

  const [clientId, setClientId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [pricingRuleId, setPricingRuleId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [manualDiscount, setManualDiscount] = useState(0);
  const [areaSqm, setAreaSqm] = useState<number | ''>('');
  const [durationHours, setDurationHours] = useState<number | ''>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getClients({ limit: 100 }),
      getServices(),
      getPricingRules(),
    ]).then(([clientRes, svcRes, ruleRes]) => {
      setClients(clientRes.data);
      setServices(svcRes);
      setPricingRules(ruleRes);
    }).catch(() => setError('Erro ao carregar dados do formulário.'));
  }, []);

  const selectedService = services.find((s) => s.id === serviceId);
  const selectedRule = pricingRules.find((r) => r.id === pricingRuleId);
  const filteredRules = pricingRules.filter((r) => !serviceId || r.service_id === serviceId);

  const estimatedTotal = selectedService
    ? calculatePriceCents({
        unit: selectedService.unit ?? 'flat',
        baseRateCents: selectedService.base_rate_cents ?? Math.round(selectedService.baseRate * 100),
        areaSqm: typeof areaSqm === 'number' ? areaSqm : undefined,
        durationHours: typeof durationHours === 'number' ? durationHours : undefined,
        priceMultiplier: selectedRule ? selectedRule.price_multiplier : 1,
        discountPercent: selectedRule ? selectedRule.discount_percent : 0,
        manualDiscountPercent: manualDiscount,
      })
    : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clientId || !serviceId || !validUntil) {
      setError('Cliente, serviço e data de validade são obrigatórios.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        client_id: clientId,
        service_id: serviceId,
        pricing_rule_id: pricingRuleId || undefined,
        currency: CURRENCY,
        valid_until: new Date(validUntil).toISOString(),
        manual_discount_percent: manualDiscount || undefined,
        area_sqm: selectedService?.unit === 'sqm' && typeof areaSqm === 'number' ? areaSqm : undefined,
        duration_hours: selectedService?.unit === 'hour' && typeof durationHours === 'number' ? durationHours : undefined,
      };
      const created = await createQuote(payload);
      navigate(`/quotes/${created.id}`);
    } catch {
      setError('Erro ao criar orçamento. Tente novamente.');
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

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4" aria-label="Criar orçamento">
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
              onChange={(id) => { setServiceId(id); setPricingRuleId(''); }}
              getId={(s) => s.id}
              getLabel={(s) => s.name}
              placeholder="Buscar serviço…"
              emptyMessage="Nenhum serviço cadastrado. Cadastre serviços em Serviços."
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

            <Input
              label="Válido até"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              required
            />

            <Input
              label="Desconto manual (%)"
              type="number"
              value={String(manualDiscount)}
              onChange={(e) => setManualDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
              placeholder="0"
            />
          </div>
        </Card>

        {serviceId && (
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Total estimado</span>
              <span className="text-xl font-bold text-text-primary" data-testid="estimated-total">
                {formatCurrency(estimatedTotal, CURRENCY)}
              </span>
            </div>
          </Card>
        )}

        {error && <p className="text-sm text-error" role="alert">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Criar Orçamento</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/quotes')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
