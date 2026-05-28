import { useRef, useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import Button from '../ui/Button';

interface StripePaymentFormProps {
  amountCents: number;
  currency: string;
  onSuccess: (paymentIntentId: string) => void;
  successRedirectUrl: string;
}

function formatAmount(cents: number, currency: string): string {
  const locale = currency.toUpperCase() === 'BRL' ? 'pt-BR' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
}

export default function StripePaymentForm({
  amountCents,
  currency,
  onSuccess,
  successRedirectUrl,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(false);
  const isSubmittingRef = useRef(false);

  async function handleSubmit() {
    if (!stripe || !elements || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setError('');

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: successRedirectUrl,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        setError(result.error.message ?? 'Erro ao processar pagamento.');
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        onSuccess(result.paymentIntent.id);
      }
    } catch (err) {
      const axiosErr = err as import('axios').AxiosError<{ error?: { message?: string | string[] }; message?: string | string[] }>;
      const raw = axiosErr.response?.data;
      const msg = raw?.error?.message ?? raw?.message;
      const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro genérico. Tente novamente.');
      setError(detail);
    } finally {
      isSubmittingRef.current = false;
    }
  }

  return (
    <div>
      <form>
        {error && (
          <p className="text-sm text-error mb-4 p-3 bg-error/10 rounded-lg" role="alert">{error}</p>
        )}
        <PaymentElement
          onReady={() => setIsReady(true)}
          options={{
            layout: 'tabs',
          }}
        />
      </form>
      <Button
        type="button"
        variant="primary"
        className="w-full mt-6 h-12 text-base font-semibold"
        onClick={handleSubmit}
        disabled={!isReady || !stripe || !elements}
        aria-label={`Pagar ${formatAmount(amountCents, currency)}`}
      >
        Pagar {formatAmount(amountCents, currency)}
      </Button>
    </div>
  );
}
