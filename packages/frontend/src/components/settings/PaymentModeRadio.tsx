interface PaymentModeRadioProps {
  value: string;
  onChange: (value: string) => void;
  isBR?: boolean;
}

const OPTIONS = [
  {
    value: 'manual',
    labelBR: 'Manual',
    labelEN: 'Manual',
    descBR: 'Você cobra os clientes manualmente via fatura.',
    descEN: 'You charge clients manually via invoice.',
  },
  {
    value: 'automatic',
    labelBR: 'Automático',
    labelEN: 'Automatic',
    descBR: 'Pagamentos processados automaticamente via Stripe.',
    descEN: 'Payments processed automatically via Stripe.',
  },
];

export default function PaymentModeRadio({ value, onChange, isBR = false }: PaymentModeRadioProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text-primary">
        {isBR ? 'Modo de Cobrança' : 'Payment Mode'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`
              flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200
              ${value === opt.value
                ? 'border-primary bg-primary/10'
                : 'border-border bg-surface-alt hover:border-primary/50'
              }
            `}
          >
            <input
              type="radio"
              name="payment_mode"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="mt-1"
            />
            <div>
              <p className="text-sm font-medium text-text-primary">
                {isBR ? opt.labelBR : opt.labelEN}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {isBR ? opt.descBR : opt.descEN}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
