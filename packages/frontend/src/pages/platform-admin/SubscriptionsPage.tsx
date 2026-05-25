import { useEffect, useState } from 'react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { adminGetSubscriptions, type TenantSubscription } from '../../api/billing';
import SubscriptionStatusBadge from '../../components/billing/SubscriptionStatusBadge';

const STATUS_OPTIONS = ['', 'active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid'];

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  function load() {
    setLoading(true);
    adminGetSubscriptions(statusFilter ? { status: statusFilter } : undefined)
      .then(setSubscriptions)
      .catch(() => setError('Erro ao carregar assinaturas.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [statusFilter]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Assinaturas de Tenants</h1>
      </div>

      {error && <p className="text-error text-sm mb-4" role="alert">{error}</p>}

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`h-8 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
              statusFilter === s
                ? 'bg-primary text-white'
                : 'bg-surface-alt text-text-secondary hover:text-text-primary border border-border'
            }`}
          >
            {s || 'Todos'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-text-muted text-sm">Carregando…</p>
      ) : subscriptions.length === 0 ? (
        <p className="text-text-muted text-sm">Nenhuma assinatura encontrada.</p>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border bg-surface"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs text-text-muted font-mono truncate">{sub.tenant_id}</p>
                  <SubscriptionStatusBadge status={sub.status} />
                  {sub.cancel_at_period_end && (
                    <Badge variant="warning">Cancela no fim</Badge>
                  )}
                </div>
                <p className="text-xs text-text-secondary">
                  Período: {new Date(sub.current_period_start).toLocaleDateString('pt-BR')}{' '}
                  → {new Date(sub.current_period_end).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  Stripe: {sub.stripe_subscription_id}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-text-primary">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    sub.grandfathered_price_cents / 100,
                  )}
                </p>
                {sub.discount_ratio != null && sub.discount_ratio > 0 && (
                  <p className="text-xs text-success">
                    {(sub.discount_ratio * 100).toFixed(0)}% de desconto preservado
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
