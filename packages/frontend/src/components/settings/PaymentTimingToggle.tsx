interface PaymentTimingToggleProps {
  value: string;
  onChange: (value: string) => void;
  isBR?: boolean;
}

export default function PaymentTimingToggle({ value, onChange, isBR = false }: PaymentTimingToggleProps) {
  const isPrepaid = value === 'prepaid';

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text-primary">
        {isBR ? 'Momento de Cobrança' : 'Payment Timing'}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={isPrepaid}
          onClick={() => onChange(isPrepaid ? 'postpaid' : 'prepaid')}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
            ${isPrepaid ? 'bg-primary' : 'bg-surface-alt border border-border'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200
              ${isPrepaid ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
        <div>
          <p className="text-sm font-medium text-text-primary">
            {isPrepaid
              ? (isBR ? 'Pré-pago' : 'Prepaid')
              : (isBR ? 'Pós-pago' : 'Postpaid')}
          </p>
          <p className="text-xs text-text-muted">
            {isPrepaid
              ? (isBR ? 'Cobrado antes da execução do serviço.' : 'Charged before service is performed.')
              : (isBR ? 'Cobrado após a execução do serviço.' : 'Charged after service is performed.')}
          </p>
        </div>
      </div>
    </div>
  );
}
