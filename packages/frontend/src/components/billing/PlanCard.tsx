import { useRef, useState } from 'react';
import type { SubscriptionPlan } from '../../api/billing';
import { createCheckout } from '../../api/billing';

interface Props {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  onChangePlan?: (planId: string) => void;
  mode?: 'checkout' | 'change';
}

const INTERVAL_LABELS: Record<string, { label: string; badge?: string }> = {
  month: { label: '/mês' },
  semiannual: { label: '/6 meses', badge: '10% off' },
  year: { label: '/ano', badge: '20% off' },
};

export default function PlanCard({ plan, isCurrentPlan = false, onChangePlan, mode = 'checkout' }: Props) {
  const isSubmittingRef = useRef(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const intervalConfig = INTERVAL_LABELS[plan.interval] ?? { label: '' };
  const priceFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: plan.currency,
  }).format(plan.amount_cents / 100);

  async function handleSubscribe() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true);
    setError('');

    try {
      if (mode === 'change' && onChangePlan) {
        onChangePlan(plan.id);
      } else {
        const origin = window.location.origin;
        const session = await createCheckout({
          plan_id: plan.id,
          success_url: `${origin}/settings/billing/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/settings/billing/cancel`,
        });
        window.location.href = session.checkout_url;
      }
    } catch (err) {
      const axiosErr = err as import('axios').AxiosError<{ error?: { message?: string | string[] }; message?: string | string[] }>;
      const raw = axiosErr.response?.data;
      const msg = raw?.error?.message ?? raw?.message;
      const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao iniciar assinatura. Tente novamente.');
      setError(detail);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }

  return (
    <div
      className={`flex flex-col rounded-xl border p-6 bg-surface transition-all duration-200 ${
        isCurrentPlan ? 'border-primary shadow-lg' : 'border-border hover:border-primary/50'
      }`}
      aria-label={`Plan ${plan.name}`}
    >
      {intervalConfig.badge && (
        <span className="inline-flex items-center self-start mb-3 px-2 py-0.5 rounded text-xs font-semibold bg-success/20 text-success">
          {intervalConfig.badge}
        </span>
      )}

      <h3 className="text-lg font-semibold text-text-primary mb-1">{plan.name}</h3>
      {plan.description && (
        <p className="text-sm text-text-secondary mb-4">{plan.description}</p>
      )}

      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-3xl font-bold text-text-primary">{priceFormatted}</span>
        <span className="text-sm text-text-muted">{intervalConfig.label}</span>
      </div>

      {error && (
        <p className="text-error text-sm mb-3" role="alert">{error}</p>
      )}

      {isCurrentPlan ? (
        <span className="mt-auto flex items-center justify-center h-11 rounded-lg bg-primary/10 text-primary text-sm font-medium">
          Plano atual
        </span>
      ) : (
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={loading}
          className="mt-auto h-11 min-h-[44px] w-full rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={`Assinar plano ${plan.name}`}
        >
          {loading ? 'Aguarde...' : mode === 'change' ? 'Mudar para este plano' : 'Assinar'}
        </button>
      )}
    </div>
  );
}
