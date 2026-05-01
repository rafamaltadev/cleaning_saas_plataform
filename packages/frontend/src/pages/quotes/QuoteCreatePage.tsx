import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { createQuote } from '../../api/quotes';
import { getClients } from '../../api/clients';
import { getServices } from '../../api/tenants';
import { getPricingRules } from '../../api/pricingRules';
import { calculatePriceCents, formatCurrency } from '../../utils/pricing';
import type { RootState } from '../../store';
import type { Client, Service, ApiPricingRule } from '../../types';

export default function QuoteCreatePage() {
  const navigate = useNavigate();
  const tenant = useSelector((state: RootState) => state.auth.user);

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [pricingRules, setPricingRules] = useState<ApiPricingRule[]>([]);

  const [clientId, setClientId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [pricingRuleId, setPricingRuleId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [validUntil, setValidUntil] = useState('');
  const [manualDiscount, setManualDiscount] = useState(0);
  const [areaSqm, setAreaSqm] = useState<number | ''>('');
  const [durationHours, setDurationHours] = useState<number | ''>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    Promise.all([
      getClients({ limit: 100 }),
      getServices(),
      getPricingRules(),
    ]).then(([clientRes, svcRes, ruleRes]) => {
      setClients(clientRes.data);
      setServices(svcRes);
      setPricingRules(ruleRes);
    }).catch(() => setError('Failed to load form data.'));
  }, []);

  useEffect(() => {
    if (tenant) setCurrency('USD');
  }, [tenant]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clientId || !serviceId || !validUntil) {
      setError('Client, service, and valid until date are required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        client_id: clientId,
        service_id: serviceId,
        pricing_rule_id: pricingRuleId || undefined,
        currency,
        valid_until: new Date(validUntil).toISOString(),
        manual_discount_percent: manualDiscount || undefined,
        area_sqm: selectedService?.unit === 'sqm' && typeof areaSqm === 'number' ? areaSqm : undefined,
        duration_hours: selectedService?.unit === 'hour' && typeof durationHours === 'number' ? durationHours : undefined,
      };
      const created = await createQuote(payload);
      navigate(`/quotes/${created.id}`);
    } catch {
      setError('Failed to create quote. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">New Quote</h1>
        <p className="text-text-secondary text-sm mt-1">Create a new quote for a client</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4" aria-label="Create quote form">
        <Card title="Quote Details">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="client-select">
                Client <span className="text-error">*</span>
              </label>
              <select
                id="client-select"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Select client"
                required
              >
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="service-select">
                Service <span className="text-error">*</span>
              </label>
              <select
                id="service-select"
                value={serviceId}
                onChange={(e) => { setServiceId(e.target.value); setPricingRuleId(''); }}
                className="w-full h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Select service"
                required
              >
                <option value="">Select a service…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {serviceId && filteredRules.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="rule-select">
                  Pricing Rule (optional)
                </label>
                <select
                  id="rule-select"
                  value={pricingRuleId}
                  onChange={(e) => setPricingRuleId(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Select pricing rule"
                >
                  <option value="">No pricing rule</option>
                  {filteredRules.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.frequency} — {r.discount_percent}% off × {r.price_multiplier}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedService?.unit === 'sqm' && (
              <Input
                label="Area (sqm)"
                type="number"
                value={areaSqm === '' ? '' : String(areaSqm)}
                onChange={(e) => setAreaSqm(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 50"
                required
              />
            )}

            {selectedService?.unit === 'hour' && (
              <Input
                label="Duration (hours)"
                type="number"
                value={durationHours === '' ? '' : String(durationHours)}
                onChange={(e) => setDurationHours(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 3"
                required
              />
            )}

            <Input
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="USD"
            />

            <Input
              label="Valid Until"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              required
            />

            <Input
              label="Manual Discount (%)"
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
              <span className="text-sm font-medium text-text-secondary">Estimated Total</span>
              <span className="text-xl font-bold text-text-primary" data-testid="estimated-total">
                {formatCurrency(estimatedTotal, currency)}
              </span>
            </div>
          </Card>
        )}

        {error && <p className="text-sm text-error" role="alert">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Create Quote</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/quotes')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
