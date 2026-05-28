import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function PaymentsInfoBRPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="text-sm text-text-muted hover:text-text-secondary transition-colors mb-4 flex items-center gap-1"
        >
          ← Voltar para Configurações
        </button>
        <h1 className="text-2xl font-bold text-text-primary">Pagamentos com Stripe</h1>
        <p className="text-text-secondary mt-1">
          Conecte sua conta Stripe para aceitar pagamentos diretamente dos seus clientes.
        </p>
      </div>

      <div className="space-y-4">
        <Card title="Como funciona">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <p className="text-sm font-medium text-text-primary">Aceite os termos</p>
                <p className="text-xs text-text-muted">Revise e aceite nossos termos de serviço de pagamentos.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <div>
                <p className="text-sm font-medium text-text-primary">Crie sua conta Stripe</p>
                <p className="text-xs text-text-muted">Será redirecionado para a Stripe para criar ou conectar sua conta Express.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <div>
                <p className="text-sm font-medium text-text-primary">Comece a receber</p>
                <p className="text-xs text-text-muted">Seus clientes poderão pagar com cartão ou PIX diretamente nos agendamentos.</p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Taxas transparentes">
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-text-secondary">Taxa da plataforma</span>
              <span className="text-sm font-semibold text-primary">1% por transação</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-text-secondary">Stripe — Cartão de crédito</span>
              <span className="text-sm font-semibold text-text-primary">3,99%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-text-secondary">Stripe — PIX</span>
              <span className="text-sm font-semibold text-text-primary">0,99%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-text-muted">Exemplo: R$ 100 no cartão</span>
              <span className="text-sm font-semibold text-success">R$ 95,02 líquido</span>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-3">
            * Taxas cobradas sobre o valor bruto de cada transação. O repasse acontece conforme o calendário da Stripe.
          </p>
        </Card>

        <Card title="Requisitos">
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-center gap-2">
              <span className="text-success">✓</span>
              CPF ou CNPJ válido
            </li>
            <li className="flex items-center gap-2">
              <span className="text-success">✓</span>
              Conta bancária no Brasil
            </li>
            <li className="flex items-center gap-2">
              <span className="text-success">✓</span>
              E-mail verificado
            </li>
          </ul>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="primary"
            className="w-full sm:w-auto"
            onClick={() => navigate('/settings?tab=payments')}
          >
            Configurar Pagamentos
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={() => navigate('/settings')}
          >
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
