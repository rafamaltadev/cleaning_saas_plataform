import { useState, useRef } from 'react';
import type { StripeTermsVersion } from '../../api/billingConnect';
import { acceptConnectTerms } from '../../api/billingConnect';
import Button from '../ui/Button';

interface TermsAcceptanceBlockProps {
  terms: StripeTermsVersion;
  onAccepted: (version: string) => void;
  isBR?: boolean;
}

export default function TermsAcceptanceBlock({ terms, onAccepted, isBR = false }: TermsAcceptanceBlockProps) {
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  async function handleAccept() {
    if (isSubmittingRef.current) return;
    if (!checked) {
      setError(isBR ? 'Você deve aceitar os termos para continuar.' : 'You must accept the terms to continue.');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError('');

    try {
      await acceptConnectTerms(terms.version);
      onAccepted(terms.version);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(isBR ? `Erro ao aceitar termos: ${msg}` : `Error accepting terms: ${msg}`);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-error/10 border border-error/20 rounded text-sm text-error" role="alert">
          {error}
        </div>
      )}

      <div className="bg-surface-alt border border-border rounded-lg p-4 max-h-48 overflow-y-auto">
        <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono leading-relaxed">
          {terms.content}
        </pre>
      </div>

      <div className="text-xs text-text-muted space-y-1">
        <p>
          {isBR ? 'Versão:' : 'Version:'} <span className="text-text-secondary">{terms.version}</span>
        </p>
        <p>
          {isBR ? 'Taxa plataforma:' : 'Platform fee:'}{' '}
          <span className="text-text-secondary font-medium">{terms.platform_fee_percent}%</span>
        </p>
        <p>
          {isBR ? 'Taxa cartão Stripe:' : 'Stripe card fee:'}{' '}
          <span className="text-text-secondary font-medium">{terms.stripe_fee_card_percent}%</span>
        </p>
        {terms.stripe_fee_pix_percent != null && (
          <p>
            Taxa PIX Stripe:{' '}
            <span className="text-text-secondary font-medium">{terms.stripe_fee_pix_percent}%</span>
          </p>
        )}
        {terms.stripe_fee_ach_percent != null && (
          <p>
            Stripe ACH fee:{' '}
            <span className="text-text-secondary font-medium">{terms.stripe_fee_ach_percent}%</span>
          </p>
        )}
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-1 rounded border-border"
        />
        <span className="text-sm text-text-secondary">
          {isBR
            ? 'Li e aceito os Termos de Serviço de Pagamentos descritos acima.'
            : 'I have read and accept the Payment Services Terms of Service described above.'}
        </span>
      </label>

      <Button
        type="button"
        onClick={handleAccept}
        loading={loading}
        disabled={!checked}
        className="w-full sm:w-auto"
      >
        {isBR ? 'Aceitar e Continuar' : 'Accept & Continue'}
      </Button>
    </div>
  );
}
