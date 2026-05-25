import { useEffect, useRef, useState } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import SubscriptionStatusBadge from '../../../components/billing/SubscriptionStatusBadge';
import PlanCard from '../../../components/billing/PlanCard';
import {
  getMySubscription,
  getPlans,
  cancelSubscription,
  changePlan,
  openPortal,
  type SubscriptionPlan,
  type TenantSubscription,
} from '../../../api/billing';

type View = 'overview' | 'change-plan' | 'cancel-confirm';

export default function BillingSection() {
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('overview');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    Promise.all([getMySubscription(), getPlans()])
      .then(([sub, planList]) => {
        setSubscription(sub);
        setPlans(planList);
      })
      .catch(() => setError('Erro ao carregar informações de cobrança.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleCancelSubscription() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setCancelLoading(true);
    setError('');
    try {
      const updated = await cancelSubscription({ at_period_end: true });
      setSubscription(updated);
      setView('overview');
    } catch (err) {
      const axiosErr = err as import('axios').AxiosError<{ error?: { message?: string | string[] }; message?: string | string[] }>;
      const raw = axiosErr.response?.data;
      const msg = raw?.error?.message ?? raw?.message;
      const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao cancelar assinatura.');
      setError(detail);
    } finally {
      setCancelLoading(false);
      isSubmittingRef.current = false;
    }
  }

  async function handleChangePlan(planId: string) {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setError('');
    try {
      const updated = await changePlan(planId);
      setSubscription(updated);
      setView('overview');
    } catch (err) {
      const axiosErr = err as import('axios').AxiosError<{ error?: { message?: string | string[] }; message?: string | string[] }>;
      const raw = axiosErr.response?.data;
      const msg = raw?.error?.message ?? raw?.message;
      const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao mudar plano.');
      setError(detail);
    } finally {
      isSubmittingRef.current = false;
    }
  }

  async function handleOpenPortal() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setPortalLoading(true);
    setError('');
    try {
      const { url } = await openPortal(window.location.href);
      window.location.href = url;
    } catch (err) {
      const axiosErr = err as import('axios').AxiosError<{ error?: { message?: string | string[] }; message?: string | string[] }>;
      const raw = axiosErr.response?.data;
      const msg = raw?.error?.message ?? raw?.message;
      const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao abrir portal.');
      setError(detail);
    } finally {
      setPortalLoading(false);
      isSubmittingRef.current = false;
    }
  }

  if (loading) return <p className="text-text-muted text-sm">Carregando…</p>;

  return (
    <div className="space-y-6">
      {error && <p className="text-error text-sm" role="alert">{error}</p>}

      {view === 'overview' && (
        <>
          {subscription ? (
            <Card title="Plano e Cobrança">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-text-secondary">Status</p>
                    <SubscriptionStatusBadge status={subscription.status} />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Próxima cobrança</p>
                    <p className="text-sm font-medium text-text-primary">
                      {new Date(subscription.current_period_end).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Valor</p>
                    <p className="text-sm font-medium text-text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        subscription.grandfathered_price_cents / 100,
                      )}
                    </p>
                  </div>
                </div>

                {subscription.cancel_at_period_end && (
                  <p className="text-sm text-warning">
                    Assinatura será cancelada em{' '}
                    {new Date(subscription.current_period_end).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}. Você mantém acesso até essa data.
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleOpenPortal}
                    disabled={portalLoading}
                  >
                    {portalLoading ? 'Abrindo...' : 'Histórico de pagamentos'}
                  </Button>
                  {!subscription.cancel_at_period_end && subscription.status === 'active' && (
                    <>
                      <Button type="button" variant="ghost" onClick={() => setView('change-plan')}>
                        Mudar plano
                      </Button>
                      <Button type="button" variant="danger" onClick={() => setView('cancel-confirm')}>
                        Cancelar assinatura
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card title="Plano e Cobrança">
              <p className="text-sm text-text-secondary mb-4">
                Você ainda não possui uma assinatura ativa. Escolha um plano abaixo para começar.
              </p>
            </Card>
          )}

          {(!subscription || subscription.status !== 'active') && (
            <div>
              <h3 className="text-base font-semibold text-text-primary mb-4">Planos disponíveis</h3>
              <PlansGrid plans={plans} currentPlanId={null} mode="checkout" />
            </div>
          )}
        </>
      )}

      {view === 'change-plan' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Button type="button" variant="ghost" size="sm" onClick={() => setView('overview')}>
              ← Voltar
            </Button>
            <h3 className="text-base font-semibold text-text-primary">Mudar plano</h3>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Ao mudar de plano, o valor será calculado proporcionalmente (proration).
          </p>
          <PlansGrid
            plans={plans}
            currentPlanId={subscription?.plan_id ?? null}
            mode="change"
            onChangePlan={handleChangePlan}
          />
        </div>
      )}

      {view === 'cancel-confirm' && (
        <Card title="Cancelar Assinatura">
          <p className="text-sm text-text-secondary mb-4">
            Tem certeza que deseja cancelar? Você manterá acesso até{' '}
            <strong className="text-text-primary">
              {subscription ? new Date(subscription.current_period_end).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'}
            </strong>.
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="danger" loading={cancelLoading} onClick={handleCancelSubscription}>
              Confirmar cancelamento
            </Button>
            <Button type="button" variant="ghost" onClick={() => setView('overview')}>
              Manter assinatura
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function PlansGrid({
  plans,
  currentPlanId,
  mode,
  onChangePlan,
}: {
  plans: SubscriptionPlan[];
  currentPlanId: string | null;
  mode: 'checkout' | 'change';
  onChangePlan?: (planId: string) => void;
}) {
  if (plans.length === 0) {
    return <p className="text-sm text-text-muted">Nenhum plano disponível.</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isCurrentPlan={plan.id === currentPlanId}
          mode={mode}
          onChangePlan={onChangePlan}
        />
      ))}
    </div>
  );
}
