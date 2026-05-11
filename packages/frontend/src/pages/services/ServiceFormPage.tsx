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
import { getCategories } from '../../api/categories';
import { getAddonsByService, createAddon, updateAddon, deleteAddon } from '../../api/addons';
import type { ApiPricingRule, ServiceCategory, ServiceAddon } from '../../types';

const DAYS_PT: Record<string, string> = {
  sunday: 'Dom',
  monday: 'Seg',
  tuesday: 'Ter',
  wednesday: 'Qua',
  thursday: 'Qui',
  friday: 'Sex',
  saturday: 'Sáb',
};
const ALL_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

interface AddonRow {
  id?: string;
  name: string;
  price_cents: number | '';
  _delete?: boolean;
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function availabilityText(days: string[]): string {
  if (days.length === 0) return 'Sem restrição de dias';
  if (days.length === 7) return 'Todos os dias';
  return days.map((d) => DAYS_PT[d]).join(', ');
}

export default function ServiceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  // Basic info
  const [nome, setNome] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [unit, setUnit] = useState<'sqm' | 'hour' | 'flat'>('sqm');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');
  const [valorBase, setValorBase] = useState<number | ''>('');
  const [billingType, setBillingType] = useState<'fixed' | 'hourly'>('fixed');

  // Availability
  const [availDays, setAvailDays] = useState<string[]>([]);
  const [availStart, setAvailStart] = useState('08:00');
  const [availEnd, setAvailEnd] = useState('18:00');

  // Materials
  const [materialsIncluded, setMaterialsIncluded] = useState(false);
  const [materialsCostCents, setMaterialsCostCents] = useState<number | ''>('');

  // Observations
  const [obsEquipamento, setObsEquipamento] = useState(false);
  const [obsAcesso, setObsAcesso] = useState(false);
  const [observations, setObservations] = useState('');

  // Addons
  const [hasAddons, setHasAddons] = useState(false);
  const [addons, setAddons] = useState<AddonRow[]>([]);

  // Pricing rule
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [existingRule, setExistingRule] = useState<ApiPricingRule | null>(null);

  // Meta
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoadingData(true);
    Promise.all([
      getServiceById(id),
      getPricingRuleForService(id),
      getAddonsByService(id),
    ])
      .then(([service, rule, existingAddons]) => {
        setNome(service.name);
        setCategoryId(service.category_id ?? '');
        setDescricao(service.description ?? '');
        setUnit((service.unit as 'sqm' | 'hour' | 'flat') ?? 'sqm');
        setDurationMinutes(service.estimated_duration_minutes ?? '');
        const cents = service.base_rate_cents ?? Math.round((service.baseRate ?? 0) * 100);
        setValorBase(cents / 100);
        setBillingType((service.billing_type as 'fixed' | 'hourly') ?? 'fixed');
        setMaterialsIncluded(service.materials_included ?? false);
        setMaterialsCostCents(
          service.materials_cost_cents != null ? service.materials_cost_cents / 100 : ''
        );

        const avail = service.availability as
          | { days?: string[]; start?: string; end?: string }
          | null
          | undefined;
        if (avail?.days) setAvailDays(avail.days);
        if (avail?.start) setAvailStart(avail.start);
        if (avail?.end) setAvailEnd(avail.end);

        const obs = service.observations ?? '';
        setObsEquipamento(obs.includes('[equipamento]'));
        setObsAcesso(obs.includes('[acesso]'));
        setObservations(
          obs.replace('[equipamento]', '').replace('[acesso]', '').trim()
        );

        if (rule) {
          setExistingRule(rule);
          if (rule.discount_percent > 0) {
            setApplyDiscount(true);
            setDiscountPercent(rule.discount_percent);
          }
        }

        if (existingAddons.length > 0) {
          setHasAddons(true);
          setAddons(
            existingAddons.map((a: ServiceAddon) => ({
              id: a.id,
              name: a.name,
              price_cents: a.price_cents / 100,
            }))
          );
        }
      })
      .catch(() => setError('Erro ao carregar dados do serviço.'))
      .finally(() => setLoadingData(false));
  }, [isEdit, id]);

  function toggleDay(day: string) {
    setAvailDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function addAddonRow() {
    setAddons((prev) => [...prev, { name: '', price_cents: '' }]);
  }

  function updateAddonRow(idx: number, field: keyof AddonRow, value: string | number | boolean) {
    setAddons((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a))
    );
  }

  function removeAddonRow(idx: number) {
    setAddons((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, _delete: true } : a))
    );
  }

  const activeAddons = addons.filter((a) => !a._delete);

  async function syncAddons(serviceId: string) {
    for (const addon of addons) {
      const price_cents = Math.round(Number(addon.price_cents) * 100);
      if (addon._delete && addon.id) {
        await deleteAddon(serviceId, addon.id);
      } else if (!addon._delete && addon.name.trim()) {
        if (addon.id) {
          await updateAddon(serviceId, addon.id, { name: addon.name.trim(), price_cents });
        } else {
          await createAddon(serviceId, { name: addon.name.trim(), price_cents });
        }
      }
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim() || valorBase === '') {
      setError('Nome e valor base são obrigatórios.');
      return;
    }

    setLoading(true);
    setError('');

    const obsFlags = [obsEquipamento ? '[equipamento]' : '', obsAcesso ? '[acesso]' : '']
      .filter(Boolean)
      .join(' ');
    const fullObs = [obsFlags, observations.trim()].filter(Boolean).join(' ');

    const base_rate_cents = Math.round(Number(valorBase) * 100);

    const availabilityPayload =
      availDays.length > 0
        ? { days: availDays, start: availStart, end: availEnd }
        : null;

    const servicePayload = {
      name: nome.trim(),
      description: descricao.trim() || undefined,
      base_rate_cents,
      unit,
      category_id: categoryId || undefined,
      estimated_duration_minutes: durationMinutes !== '' ? Number(durationMinutes) : undefined,
      billing_type: billingType,
      availability: availabilityPayload,
      materials_included: materialsIncluded,
      materials_cost_cents:
        materialsIncluded && materialsCostCents !== ''
          ? Math.round(Number(materialsCostCents) * 100)
          : undefined,
      observations: fullObs || undefined,
      has_addons: hasAddons,
    };

    try {
      let serviceId: string;

      if (isEdit && id) {
        await updateService(id, servicePayload);
        serviceId = id;
      } else {
        const created = await createService(servicePayload);
        serviceId = created.id;
      }

      if (hasAddons) {
        await syncAddons(serviceId);
      }

      const discount_percent = applyDiscount ? discountPercent : 0;
      const rulePayload = {
        service_id: serviceId,
        frequency: 'one_time' as const,
        discount_percent,
        price_multiplier: 1,
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

  const previewTotal =
    valorBase !== ''
      ? Math.round(Number(valorBase) * 100) +
        (materialsIncluded && materialsCostCents !== ''
          ? Math.round(Number(materialsCostCents) * 100)
          : 0)
      : null;

  const addonTotal = activeAddons.reduce((sum, a) => {
    const c = Math.round(Number(a.price_cents) * 100);
    return sum + (isNaN(c) ? 0 : c);
  }, 0);

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

      <form onSubmit={handleSubmit} aria-label={isEdit ? 'Editar serviço' : 'Novo serviço'}>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column: fields */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Basic info */}
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
                  <label htmlFor="category-select" className="text-sm font-medium text-text-primary">
                    Categoria
                  </label>
                  <select
                    id="category-select"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="descricao" className="text-sm font-medium text-text-primary">
                    Descrição
                  </label>
                  <textarea
                    id="descricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva o serviço oferecido"
                    rows={3}
                    className="px-3 py-2 rounded bg-surface-alt border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="unit-select" className="text-sm font-medium text-text-primary">
                      Unidade
                    </label>
                    <select
                      id="unit-select"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as 'sqm' | 'hour' | 'flat')}
                      className="h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="sqm">m²</option>
                      <option value="hour">Hora</option>
                      <option value="flat">Fixo</option>
                    </select>
                  </div>

                  <Input
                    label="Duração estimada (min)"
                    type="number"
                    value={durationMinutes === '' ? '' : String(durationMinutes)}
                    onChange={(e) =>
                      setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Ex: 120"
                  />
                </div>
              </div>
            </Card>

            {/* Pricing */}
            <Card title="Precificação">
              <div className="space-y-3">
                <Input
                  label={`Valor base (R$/${unit === 'sqm' ? 'm²' : unit === 'hour' ? 'hora' : 'fixo'}) *`}
                  type="number"
                  value={valorBase === '' ? '' : String(valorBase)}
                  onChange={(e) =>
                    setValorBase(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="Ex: 12.50"
                  required
                />

                <div className="flex flex-col gap-1">
                  <label htmlFor="billing-select" className="text-sm font-medium text-text-primary">
                    Tipo de cobrança
                  </label>
                  <select
                    id="billing-select"
                    value={billingType}
                    onChange={(e) => setBillingType(e.target.value as 'fixed' | 'hourly')}
                    className="h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="fixed">Preço fixo</option>
                    <option value="hourly">Por hora</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyDiscount}
                    onChange={(e) => setApplyDiscount(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm text-text-primary">Aplicar desconto padrão</span>
                </label>
                {applyDiscount && (
                  <Input
                    label="Desconto (%)"
                    type="number"
                    value={String(discountPercent)}
                    onChange={(e) =>
                      setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))
                    }
                    placeholder="0"
                  />
                )}
              </div>
            </Card>

            {/* Availability */}
            <Card title="Disponibilidade">
              <div className="space-y-3">
                <p className="text-xs text-text-muted">
                  Selecione os dias em que este serviço está disponível. Deixe em branco para sem restrição.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        availDays.includes(day)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface-alt text-text-secondary border-border hover:border-primary'
                      }`}
                    >
                      {DAYS_PT[day]}
                    </button>
                  ))}
                </div>
                {availDays.length > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <label className="text-text-secondary">Horário:</label>
                    <input
                      type="time"
                      value={availStart}
                      onChange={(e) => setAvailStart(e.target.value)}
                      className="h-8 px-2 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-text-muted">–</span>
                    <input
                      type="time"
                      value={availEnd}
                      onChange={(e) => setAvailEnd(e.target.value)}
                      className="h-8 px-2 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Materials */}
            <Card title="Materiais">
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={materialsIncluded}
                    onChange={(e) => setMaterialsIncluded(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm text-text-primary">Materiais incluídos no serviço</span>
                </label>
                {materialsIncluded && (
                  <Input
                    label="Custo dos materiais (R$)"
                    type="number"
                    value={materialsCostCents === '' ? '' : String(materialsCostCents)}
                    onChange={(e) =>
                      setMaterialsCostCents(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Ex: 25.00"
                  />
                )}
              </div>
            </Card>

            {/* Observations */}
            <Card title="Observações">
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={obsEquipamento}
                    onChange={(e) => setObsEquipamento(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm text-text-primary">Requer equipamento específico</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={obsAcesso}
                    onChange={(e) => setObsAcesso(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm text-text-primary">Requer acesso especial</span>
                </label>
                <div className="flex flex-col gap-1">
                  <label htmlFor="observations" className="text-sm font-medium text-text-primary">
                    Observações adicionais
                  </label>
                  <textarea
                    id="observations"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Informações relevantes para a equipe"
                    rows={2}
                    className="px-3 py-2 rounded bg-surface-alt border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 resize-none"
                  />
                </div>
              </div>
            </Card>

            {/* Addons */}
            <Card title="Adicionais">
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAddons}
                    onChange={(e) => setHasAddons(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm text-text-primary">Este serviço possui adicionais opcionais</span>
                </label>

                {hasAddons && (
                  <div className="space-y-2">
                    {addons
                      .map((addon, idx) => ({ addon, idx }))
                      .filter(({ addon }) => !addon._delete)
                      .map(({ addon, idx }) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={addon.name}
                            onChange={(e) => updateAddonRow(idx, 'name', e.target.value)}
                            placeholder="Nome do adicional"
                            className="flex-1 h-9 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <input
                            type="number"
                            value={addon.price_cents === '' ? '' : String(addon.price_cents)}
                            onChange={(e) =>
                              updateAddonRow(
                                idx,
                                'price_cents',
                                e.target.value === '' ? '' : Number(e.target.value)
                              )
                            }
                            placeholder="R$"
                            className="w-24 h-9 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button
                            type="button"
                            onClick={() => removeAddonRow(idx)}
                            className="text-error hover:text-error/80 text-sm px-2"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    <Button type="button" size="sm" variant="ghost" onClick={addAddonRow}>
                      + Adicionar item
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {error && <p className="text-sm text-error" role="alert">{error}</p>}

            <div className="flex gap-3 pb-6">
              <Button type="submit" loading={loading}>
                {isEdit ? 'Salvar Alterações' : 'Criar Serviço'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/services')}>
                Cancelar
              </Button>
            </div>
          </div>

          {/* Right column: preview */}
          <div className="lg:w-72 shrink-0">
            <div className="sticky top-6 space-y-4">
              <Card title="Prévia do Serviço">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Nome</p>
                    <p className="text-sm font-semibold text-text-primary">
                      {nome.trim() || <span className="text-text-muted italic">Sem nome</span>}
                    </p>
                    {categoryId && (
                      <p className="text-xs text-text-secondary mt-0.5">
                        {categories.find((c) => c.id === categoryId)?.name}
                      </p>
                    )}
                  </div>

                  {descricao.trim() && (
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Descrição</p>
                      <p className="text-xs text-text-secondary line-clamp-3">{descricao}</p>
                    </div>
                  )}

                  <div className="border-t border-border pt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Unidade</span>
                      <span className="text-text-primary font-medium">
                        {unit === 'sqm' ? 'm²' : unit === 'hour' ? 'hora' : 'fixo'}
                      </span>
                    </div>
                    {durationMinutes !== '' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Duração</span>
                        <span className="text-text-primary font-medium">{durationMinutes} min</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Cobrança</span>
                      <span className="text-text-primary font-medium">
                        {billingType === 'fixed' ? 'Preço fixo' : 'Por hora'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Disponibilidade</span>
                      <span className="text-text-primary font-medium text-right text-xs">
                        {availabilityText(availDays)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 space-y-1">
                    {previewTotal !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Valor base</span>
                        <span className="text-text-primary font-medium">
                          {formatBRL(Math.round(Number(valorBase) * 100))}
                        </span>
                      </div>
                    )}
                    {materialsIncluded && materialsCostCents !== '' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Materiais</span>
                        <span className="text-text-primary font-medium">
                          {formatBRL(Math.round(Number(materialsCostCents) * 100))}
                        </span>
                      </div>
                    )}
                    {applyDiscount && discountPercent > 0 && (
                      <div className="flex justify-between text-sm text-success">
                        <span>Desconto</span>
                        <span>−{discountPercent}%</span>
                      </div>
                    )}
                    {hasAddons && activeAddons.length > 0 && addonTotal > 0 && (
                      <div className="flex justify-between text-sm text-text-secondary">
                        <span>Adicionais disponíveis</span>
                        <span>+{formatBRL(addonTotal)}</span>
                      </div>
                    )}
                    {previewTotal !== null && (
                      <div className="flex justify-between text-sm font-semibold text-text-primary border-t border-border pt-1 mt-1">
                        <span>Total estimado</span>
                        <span className="text-primary">{formatBRL(previewTotal)}</span>
                      </div>
                    )}
                  </div>

                  {hasAddons && activeAddons.length > 0 && (
                    <div className="border-t border-border pt-3">
                      <p className="text-xs text-text-muted mb-2">Adicionais</p>
                      <div className="space-y-1">
                        {activeAddons.map((a, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-text-secondary">{a.name || '…'}</span>
                            <span className="text-text-primary">
                              {a.price_cents !== ''
                                ? formatBRL(Math.round(Number(a.price_cents) * 100))
                                : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
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
