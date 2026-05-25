import { useEffect, useRef, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import {
  adminGetPlans,
  adminCreatePlan,
  adminUpdatePlan,
  adminDeletePlan,
  type SubscriptionPlan,
} from '../../api/billing';

type FormData = {
  name: string;
  description: string;
  tier: string;
  interval: 'month' | 'semiannual' | 'year';
  interval_count: number;
  amount_cents: number;
  currency: 'BRL' | 'USD';
};

const defaultForm: FormData = {
  name: '',
  description: '',
  tier: 'basic',
  interval: 'month',
  interval_count: 1,
  amount_cents: 0,
  currency: 'BRL',
};

export default function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const isSubmittingRef = useRef(false);

  function loadPlans() {
    setLoading(true);
    adminGetPlans()
      .then(setPlans)
      .catch(() => setError('Erro ao carregar planos.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadPlans(); }, []);

  function openCreate() {
    setEditingPlan(null);
    setForm(defaultForm);
    setShowForm(true);
    setError('');
  }

  function openEdit(plan: SubscriptionPlan) {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      description: plan.description ?? '',
      tier: plan.tier,
      interval: plan.interval,
      interval_count: plan.interval_count,
      amount_cents: plan.amount_cents,
      currency: plan.currency as 'BRL' | 'USD',
    });
    setShowForm(true);
    setError('');
  }

  async function handleSubmit() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSaving(true);
    setError('');
    try {
      if (editingPlan) {
        await adminUpdatePlan(editingPlan.id, form);
      } else {
        await adminCreatePlan(form);
      }
      setShowForm(false);
      loadPlans();
    } catch (err) {
      const axiosErr = err as import('axios').AxiosError<{ error?: { message?: string | string[] }; message?: string | string[] }>;
      const raw = axiosErr.response?.data;
      const msg = raw?.error?.message ?? raw?.message;
      const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao salvar plano.');
      setError(detail);
    } finally {
      setSaving(false);
      isSubmittingRef.current = false;
    }
  }

  async function handleDelete(plan: SubscriptionPlan) {
    if (!window.confirm(`Excluir o plano "${plan.name}"? Isso desativará o plano.`)) return;
    try {
      await adminDeletePlan(plan.id);
      loadPlans();
    } catch {
      setError('Erro ao excluir plano.');
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Planos de Assinatura</h1>
        <Button type="button" onClick={openCreate}>+ Novo Plano</Button>
      </div>

      {error && <p className="text-error text-sm mb-4" role="alert">{error}</p>}

      {showForm && (
        <Card title={editingPlan ? 'Editar Plano' : 'Novo Plano'} className="mb-6">
          <form>
            {error && <p className="text-error text-sm mb-3" role="alert">{error}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Nome</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Tier</label>
                <input
                  type="text"
                  value={form.tier}
                  onChange={(e) => setForm({ ...form, tier: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Intervalo</label>
                <select
                  value={form.interval}
                  onChange={(e) => setForm({ ...form, interval: e.target.value as FormData['interval'] })}
                  className="w-full h-10 px-3 rounded-lg bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="month">Mensal</option>
                  <option value="semiannual">Semestral</option>
                  <option value="year">Anual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Valor (centavos)</label>
                <input
                  type="number"
                  value={form.amount_cents}
                  onChange={(e) => setForm({ ...form, amount_cents: parseInt(e.target.value) || 0 })}
                  min={1}
                  className="w-full h-10 px-3 rounded-lg bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Moeda</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value as FormData['currency'] })}
                  className="w-full h-10 px-3 rounded-lg bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button type="button" loading={saving} onClick={handleSubmit}>
                {editingPlan ? 'Salvar alterações' : 'Criar plano'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-text-muted text-sm">Carregando…</p>
      ) : plans.length === 0 ? (
        <p className="text-text-muted text-sm">Nenhum plano cadastrado.</p>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border bg-surface"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-text-primary">{plan.name}</p>
                  <Badge variant={plan.is_active ? 'success' : 'neutral'}>
                    {plan.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary">
                  {plan.tier} · {plan.interval} · {plan.currency}{' '}
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: plan.currency }).format(plan.amount_cents / 100)}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => openEdit(plan)}>Editar</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(plan)}>Excluir</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
