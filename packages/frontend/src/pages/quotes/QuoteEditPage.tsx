import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { getQuoteById } from '../../api/quotes';
import { getClients } from '../../api/clients';
import { getServices } from '../../api/services';
import { getPricingRules } from '../../api/pricingRules';
import { apiClient } from '../../api/client';
import type { ApiQuote, Client, Service, ApiPricingRule } from '../../types';

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

  const [clientId, setClientId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [pricingRuleId, setPricingRuleId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [manualDiscount, setManualDiscount] = useState(0);
  const [areaSqm, setAreaSqm] = useState<number | ''>('');
  const [durationHours, setDurationHours] = useState<number | ''>('');

  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedService = services.find((s) => s.id === serviceId);
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
      })
      .catch(() => setError('Erro ao carregar orçamento.'))
      .finally(() => setLoadingData(false));
  }, [id]);

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
      };
      if (selectedService?.unit === 'sqm' && typeof areaSqm === 'number') {
        payload.area_sqm = areaSqm;
      }
      if (selectedService?.unit === 'hour' && typeof durationHours === 'number') {
        payload.duration_hours = durationHours;
      }
      await apiClient.put(`/quotes/${id}`, payload);
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Editar Orçamento</h1>
        <p className="text-text-secondary text-sm mt-1 font-mono">{quote.id}</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4" aria-label="Editar orçamento">
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
              onChange={(sid) => { setServiceId(sid); setPricingRuleId(''); }}
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

            <Input
              label="Válido até *"
              type="date"
              value={validUntil}
              min={todayDate()}
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

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Total Estimado Atual</span>
            <span className="text-xl font-bold text-text-primary">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: quote.currency || 'BRL' }).format(
                quote.estimated_total_cents / 100,
              )}
            </span>
          </div>
        </Card>

        {error && <p className="text-sm text-error" role="alert">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Salvar Alterações</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/quotes')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
