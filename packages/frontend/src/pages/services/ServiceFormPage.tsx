import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import {
  getServiceById,
  createService,
  updateService,
  getPricingRuleForService,
  createPricingRule,
  updatePricingRule,
} from '../../api/services';
import type { ApiPricingRule } from '../../types';

const MULTIPLIER_OPTIONS = [
  { label: '2×', value: 2 },
  { label: '3×', value: 3 },
  { label: '4×', value: 4 },
];

function splitDescription(raw: string): { descricao: string; anotacoes: string } {
  const idx = raw.indexOf('\n---\n');
  if (idx === -1) return { descricao: raw, anotacoes: '' };
  return { descricao: raw.slice(0, idx), anotacoes: raw.slice(idx + 5) };
}

export default function ServiceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [anotacoes, setAnotacoes] = useState('');
  const [valorBase, setValorBase] = useState<number | ''>('');
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [applyMultiplier, setApplyMultiplier] = useState(false);
  const [multiplier, setMultiplier] = useState(2);

  const [existingRule, setExistingRule] = useState<ApiPricingRule | null>(null);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoadingData(true);
    Promise.all([
      getServiceById(id),
      getPricingRuleForService(id),
    ])
      .then(([service, rule]) => {
        const { descricao: desc, anotacoes: notes } = splitDescription(service.description ?? '');
        setNome(service.name);
        setDescricao(desc);
        setAnotacoes(notes);
        const cents = service.base_rate_cents ?? Math.round(service.baseRate * 100);
        setValorBase(cents / 100);

        if (rule) {
          setExistingRule(rule);
          if (rule.discount_percent > 0) {
            setApplyDiscount(true);
            setDiscountPercent(rule.discount_percent);
          }
          if (rule.price_multiplier > 1) {
            setApplyMultiplier(true);
            setMultiplier(rule.price_multiplier);
          }
        }
      })
      .catch(() => setError('Erro ao carregar dados do serviço.'))
      .finally(() => setLoadingData(false));
  }, [isEdit, id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !descricao.trim() || valorBase === '') {
      setError('Nome, descrição e valor base são obrigatórios.');
      return;
    }

    setLoading(true);
    setError('');

    const fullDescription = anotacoes.trim()
      ? `${descricao}\n---\n${anotacoes}`
      : descricao;

    const base_rate_cents = Math.round(Number(valorBase) * 100);
    const discount_percent = applyDiscount ? discountPercent : 0;
    const price_multiplier = applyMultiplier ? multiplier : 1;

    try {
      let serviceId: string;

      if (isEdit && id) {
        await updateService(id, {
          name: nome.trim(),
          description: fullDescription,
          base_rate_cents,
          unit: 'sqm',
        });
        serviceId = id;
      } else {
        const created = await createService({
          name: nome.trim(),
          description: fullDescription,
          base_rate_cents,
          unit: 'sqm',
        });
        serviceId = created.id;
      }

      const rulePayload = {
        service_id: serviceId,
        frequency: 'once',
        discount_percent,
        price_multiplier,
        min_area: null,
        max_area: null,
      };

      if (existingRule) {
        await updatePricingRule(existingRule.id, rulePayload);
      } else {
        await createPricingRule(rulePayload);
      }

      navigate('/services');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg || 'Erro ao salvar serviço. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted">Carregando dados do serviço…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          {isEdit ? 'Editar Serviço' : 'Novo Serviço'}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {isEdit ? 'Atualize os dados do serviço' : 'Cadastre um novo serviço'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4" aria-label={isEdit ? 'Editar serviço' : 'Novo serviço'}>
        <Card title="Informações do Serviço">
          <div className="space-y-3">
            <Input
              label="Nome *"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Limpeza residencial"
              required
            />

            <div className="flex flex-col gap-1">
              <label htmlFor="descricao" className="text-sm font-medium text-text-primary">
                Descrição *
              </label>
              <textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o serviço oferecido"
                required
                rows={3}
                className="px-3 py-2 rounded bg-surface-alt border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="anotacoes" className="text-sm font-medium text-text-primary">
                Anotações internas
              </label>
              <textarea
                id="anotacoes"
                value={anotacoes}
                onChange={(e) => setAnotacoes(e.target.value)}
                placeholder="Anotações visíveis apenas internamente"
                rows={2}
                className="px-3 py-2 rounded bg-surface-alt border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-surface-alt border border-border rounded text-sm text-text-secondary">
              <span>Unidade:</span>
              <span className="font-medium text-text-primary">m²</span>
            </div>
          </div>
        </Card>

        <Card title="Precificação">
          <div className="space-y-3">
            <Input
              label="Valor base (R$/m²) *"
              type="number"
              value={valorBase === '' ? '' : String(valorBase)}
              onChange={(e) => setValorBase(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Ex: 12.50"
              required
            />

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyDiscount}
                  onChange={(e) => setApplyDiscount(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-text-primary">Aplicar desconto</span>
              </label>
              {applyDiscount && (
                <Input
                  label="Desconto (%)"
                  type="number"
                  value={String(discountPercent)}
                  onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                  placeholder="0"
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyMultiplier}
                  onChange={(e) => setApplyMultiplier(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-text-primary">Multiplicador de preço</span>
              </label>
              {applyMultiplier && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="multiplier-select">
                    Multiplicador
                  </label>
                  <select
                    id="multiplier-select"
                    value={multiplier}
                    onChange={(e) => setMultiplier(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {MULTIPLIER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </Card>

        {error && <p className="text-sm text-error" role="alert">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            {isEdit ? 'Salvar Alterações' : 'Criar Serviço'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/services')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
