import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import FeeSummaryModal from './FeeSummaryModal';

interface PaymentsInfoCardProps {
  country?: 'BR' | 'US';
  onGetStarted?: () => void;
}

export default function PaymentsInfoCard({ country = 'BR', onGetStarted }: PaymentsInfoCardProps) {
  const [showFees, setShowFees] = useState(false);

  const isBR = country === 'BR';

  return (
    <Card className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💳</span>
            <h3 className="text-lg font-semibold text-text-primary">
              {isBR ? 'Pagamentos via Stripe Connect' : 'Payments via Stripe Connect'}
            </h3>
          </div>
          <p className="text-sm text-text-secondary mb-3">
            {isBR
              ? 'Aceite pagamentos diretamente dos seus clientes. Taxas transparentes, repasse automático.'
              : 'Accept payments directly from your customers. Transparent fees, automatic payouts.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-surface-alt rounded-lg p-3">
              <p className="text-xs text-text-muted mb-1">
                {isBR ? 'Taxa da plataforma' : 'Platform fee'}
              </p>
              <p className="text-lg font-bold text-primary">1%</p>
            </div>
            <div className="bg-surface-alt rounded-lg p-3">
              <p className="text-xs text-text-muted mb-1">
                {isBR ? 'Cartão de crédito' : 'Credit card'}
              </p>
              <p className="text-lg font-bold text-text-primary">
                {isBR ? '3,99%' : '2.9%'}
              </p>
            </div>
            <div className="bg-surface-alt rounded-lg p-3">
              <p className="text-xs text-text-muted mb-1">
                {isBR ? 'PIX' : 'ACH'}
              </p>
              <p className="text-lg font-bold text-text-primary">
                {isBR ? '0,99%' : '0.8%'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <Button type="button" variant="primary" onClick={onGetStarted}>
          {isBR ? 'Configurar Pagamentos' : 'Set Up Payments'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setShowFees(true)}>
          {isBR ? 'Ver detalhes das taxas' : 'View fee details'}
        </Button>
      </div>

      <FeeSummaryModal
        open={showFees}
        onClose={() => setShowFees(false)}
        country={country}
      />
    </Card>
  );
}
