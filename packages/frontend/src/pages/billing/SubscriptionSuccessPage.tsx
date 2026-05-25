import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMySubscription, type TenantSubscription } from '../../api/billing';
import SubscriptionStatusBadge from '../../components/billing/SubscriptionStatusBadge';

export default function SubscriptionSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [status, setStatus] = useState<'polling' | 'active' | 'timeout'>('polling');
  const navigate = useNavigate();
  const pollCount = useRef(0);
  const maxPolls = 10;

  useEffect(() => {
    if (!sessionId) {
      setStatus('timeout');
      return;
    }

    const interval = setInterval(async () => {
      try {
        const sub = await getMySubscription();
        if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
          setSubscription(sub);
          setStatus('active');
          clearInterval(interval);
        }
      } catch {
        /* ignore poll errors */
      }

      pollCount.current += 1;
      if (pollCount.current >= maxPolls) {
        clearInterval(interval);
        setStatus('timeout');
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-xl border border-border p-8 text-center">
        {status === 'polling' && (
          <>
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-text-primary mb-2">Processando sua assinatura…</h1>
            <p className="text-text-secondary text-sm">Aguarde enquanto confirmamos seu pagamento.</p>
          </>
        )}

        {status === 'active' && subscription && (
          <>
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-success text-3xl">✓</span>
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">Assinatura ativa!</h1>
            <p className="text-text-secondary text-sm mb-4">Bem-vindo ao plano da plataforma.</p>
            <div className="flex justify-center mb-6">
              <SubscriptionStatusBadge status={subscription.status} />
            </div>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="w-full h-11 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-all duration-200"
            >
              Ir para Configurações
            </button>
          </>
        )}

        {status === 'timeout' && (
          <>
            <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-warning text-3xl">!</span>
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">Pagamento em processamento</h1>
            <p className="text-text-secondary text-sm mb-6">
              O processamento está demorando mais que o esperado. Verifique sua assinatura em Configurações.
            </p>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="w-full h-11 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-all duration-200"
            >
              Ir para Configurações
            </button>
          </>
        )}
      </div>
    </div>
  );
}
