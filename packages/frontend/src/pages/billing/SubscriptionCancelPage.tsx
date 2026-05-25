import { useNavigate } from 'react-router-dom';

export default function SubscriptionCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-xl border border-border p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center mx-auto mb-4">
          <span className="text-text-muted text-3xl">×</span>
        </div>
        <h1 className="text-xl font-bold text-text-primary mb-2">Assinatura não concluída</h1>
        <p className="text-text-secondary text-sm mb-6">
          Você cancelou o processo de assinatura. Nenhuma cobrança foi realizada.
          Você pode tentar novamente a qualquer momento.
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-full h-11 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-all duration-200"
          >
            Ver planos novamente
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full h-11 rounded-lg border border-border text-text-secondary text-sm font-medium hover:bg-surface-alt transition-all duration-200"
          >
            Voltar ao painel
          </button>
        </div>
      </div>
    </div>
  );
}
