import { useState, useEffect, useRef } from 'react';
import {
  getConnectStatus,
  getConnectTerms,
  startOnboarding,
  updatePaymentConfig,
} from '../../../api/billingConnect';
import type { ConnectStatus, StripeTermsVersion } from '../../../api/billingConnect';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import TermsAcceptanceBlock from '../../../components/settings/TermsAcceptanceBlock';
import StripeConnectStatusCard from '../../../components/settings/StripeConnectStatusCard';
import PaymentModeRadio from '../../../components/settings/PaymentModeRadio';
import PaymentTimingToggle from '../../../components/settings/PaymentTimingToggle';
import PaymentsInfoCard from '../../../components/settings/PaymentsInfoCard';

type Step = 'info' | 'terms' | 'onboarding' | 'connected' | 'config';

export default function PaymentsSection() {
  const [step, setStep] = useState<Step>('info');
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [terms, setTerms] = useState<StripeTermsVersion | null>(null);
  const [_acceptedVersion, setAcceptedVersion] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [country] = useState<'BR' | 'US'>('BR');
  const [paymentMode, setPaymentMode] = useState('manual');
  const [paymentTiming, setPaymentTiming] = useState('prepaid');
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [error, setError] = useState('');
  const [configError, setConfigError] = useState('');
  const [configSaved, setConfigSaved] = useState(false);
  const isSubmittingRef = useRef(false);
  const isBR = country === 'BR';

  useEffect(() => {
    async function init() {
      try {
        const s = await getConnectStatus();
        setStatus(s);
        setPaymentMode(s.payment_mode);
        setPaymentTiming(s.payment_timing);

        if (s.connected) {
          setStep('connected');
        } else {
          setStep('info');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(isBR ? `Erro ao carregar status: ${msg}` : `Error loading status: ${msg}`);
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, [isBR]);

  async function loadTerms() {
    setError('');
    try {
      const t = await getConnectTerms({ country, language: isBR ? 'pt-BR' : 'en' });
      setTerms(t);
      setStep('terms');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(isBR ? `Erro ao carregar termos: ${msg}` : `Error loading terms: ${msg}`);
    }
  }

  async function handleStartOnboarding() {
    if (isSubmittingRef.current) return;
    if (!email) {
      setError(isBR ? 'Informe seu e-mail.' : 'Please provide your email.');
      return;
    }

    isSubmittingRef.current = true;
    setError('');
    setLoading(true);

    try {
      const { url } = await startOnboarding({ country, email });
      // Use sessionStorage for the Stripe URL — never localStorage per constraint
      sessionStorage.setItem('stripe_connect_onboarding_url', url);
      window.location.href = url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(isBR ? `Erro ao iniciar onboarding: ${msg}` : `Error starting onboarding: ${msg}`);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }

  async function handleSaveConfig() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSavingConfig(true);
    setConfigError('');
    setConfigSaved(false);

    try {
      await updatePaymentConfig({ payment_mode: paymentMode, payment_timing: paymentTiming });
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setConfigError(isBR ? `Erro ao salvar: ${msg}` : `Error saving: ${msg}`);
    } finally {
      setSavingConfig(false);
      isSubmittingRef.current = false;
    }
  }

  function handleDisconnected() {
    setStatus(null);
    setStep('info');
  }

  if (loading && step === 'info') {
    return <p className="text-text-muted text-sm">{isBR ? 'Carregando…' : 'Loading...'}</p>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-error/10 border border-error/20 rounded text-sm text-error" role="alert">
          {error}
        </div>
      )}

      {step === 'info' && (
        <>
          <PaymentsInfoCard country={country} onGetStarted={loadTerms} />
        </>
      )}

      {step === 'terms' && terms && (
        <Card title={isBR ? 'Termos de Serviço de Pagamentos' : 'Payment Services Terms'}>
          <TermsAcceptanceBlock
            terms={terms}
            isBR={isBR}
            onAccepted={(version) => {
              setAcceptedVersion(version);
              setStep('onboarding');
            }}
          />
        </Card>
      )}

      {step === 'onboarding' && (
        <Card title={isBR ? 'Conectar Conta Stripe' : 'Connect Stripe Account'}>
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded text-sm text-error mb-4" role="alert">
              {error}
            </div>
          )}

          <p className="text-sm text-text-secondary mb-4">
            {isBR
              ? 'Informe seu e-mail para criar ou conectar sua conta Stripe Express.'
              : 'Enter your email to create or connect your Stripe Express account.'}
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {isBR ? 'E-mail do negócio' : 'Business email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isBR ? 'seu@email.com' : 'your@email.com'}
                className="w-full h-10 px-3 rounded-lg bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                onClick={handleStartOnboarding}
                loading={loading}
                className="w-full sm:w-auto"
              >
                {isBR ? 'Continuar para Stripe' : 'Continue to Stripe'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep('terms')}
                className="w-full sm:w-auto"
              >
                {isBR ? 'Voltar' : 'Back'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {step === 'connected' && status && (
        <>
          <StripeConnectStatusCard
            status={status}
            onDisconnected={handleDisconnected}
            isBR={isBR}
          />

          <Card title={isBR ? 'Configurações de Cobrança' : 'Billing Configuration'}>
            {configError && (
              <div className="p-3 bg-error/10 border border-error/20 rounded text-sm text-error mb-4" role="alert">
                {configError}
              </div>
            )}
            {configSaved && (
              <div className="p-3 bg-success/10 border border-success/20 rounded text-sm text-success mb-4">
                {isBR ? 'Configurações salvas!' : 'Settings saved!'}
              </div>
            )}

            <div className="space-y-6">
              <PaymentModeRadio
                value={paymentMode}
                onChange={setPaymentMode}
                isBR={isBR}
              />
              <PaymentTimingToggle
                value={paymentTiming}
                onChange={setPaymentTiming}
                isBR={isBR}
              />
              <Button
                type="button"
                onClick={handleSaveConfig}
                loading={savingConfig}
              >
                {isBR ? 'Salvar Configurações' : 'Save Settings'}
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
