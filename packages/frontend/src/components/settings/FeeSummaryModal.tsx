import Modal from '../ui/Modal';

interface FeeSummaryModalProps {
  open: boolean;
  onClose: () => void;
  country?: 'BR' | 'US';
}

export default function FeeSummaryModal({ open, onClose, country = 'BR' }: FeeSummaryModalProps) {
  const isBR = country === 'BR';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isBR ? 'Detalhes das Taxas' : 'Fee Details'}
    >
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          {isBR
            ? 'As taxas são cobradas sobre cada transação processada.'
            : 'Fees are charged on each processed transaction.'}
        </p>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-text-secondary">
              {isBR ? 'Taxa da plataforma' : 'Platform fee'}
            </span>
            <span className="text-sm font-semibold text-text-primary">1%</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-text-secondary">
              {isBR ? 'Stripe — Cartão de crédito' : 'Stripe — Credit card'}
            </span>
            <span className="text-sm font-semibold text-text-primary">
              {isBR ? '3,99%' : '2.9%'}
            </span>
          </div>

          {isBR ? (
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-text-secondary">Stripe — PIX</span>
              <span className="text-sm font-semibold text-text-primary">0,99%</span>
            </div>
          ) : (
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-text-secondary">Stripe — ACH Transfer</span>
              <span className="text-sm font-semibold text-text-primary">0.8%</span>
            </div>
          )}

          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-text-primary">
              {isBR ? 'Exemplo (R$ 100 no cartão)' : 'Example ($100 by card)'}
            </span>
            <span className="text-sm font-semibold text-primary">
              {isBR ? 'R$ 95,02 líquido' : '$96.10 net'}
            </span>
          </div>
        </div>

        <p className="text-xs text-text-muted">
          {isBR
            ? '* Taxas da Stripe são cobradas por ela. A taxa da plataforma é separada.'
            : '* Stripe fees are charged by Stripe. Platform fee is separate.'}
        </p>
      </div>
    </Modal>
  );
}
