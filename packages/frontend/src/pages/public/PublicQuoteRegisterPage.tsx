import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { loadDraft, clearDraft, type QuoteDraft } from '../../utils/publicQuoteDraft';
import { savePublicSession } from '../../utils/publicSession';
import { getPublicBranding, type PublicBranding } from '../../api/publicTenant';
import {
  registerPublicUser,
  loginPublicUser,
  createPublicQuote,
  type AuthTokens,
} from '../../api/publicAuth';
import Input from '../../components/ui/Input';
import PasswordStrengthIndicator from '../../components/public/PasswordStrengthIndicator';
import SocialLoginButtons from '../../components/public/SocialLoginButtons';

type Tab = 'register' | 'login';

function formatCents(cents?: number, currency?: string): string {
  if (cents == null) return '—';
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: currency ?? 'BRL',
    minimumFractionDigits: 2,
  });
}

export default function PublicQuoteRegisterPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [draft, setDraft] = useState<QuoteDraft | null>(null);
  const [branding, setBranding] = useState<PublicBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('register');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  // Login form — email shared across tab switch
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const sessionExpired = searchParams.get('sessionExpired') === '1';

  // Phase 1 patterns
  const isSubmittingRef = useRef(false);
  const [error, setError] = useState('');

  // Success modal
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(null);
  const faviconInjectedRef = useRef(false);

  // On mount: validate draft, load branding, handle OAuth callback token
  useEffect(() => {
    if (!tenantSlug) return;

    // Handle OAuth redirect with token in URL
    const oauthToken = searchParams.get('oauth_token');
    const oauthError = searchParams.get('oauth_error');

    if (oauthError) {
      setError('Erro no login social. Por favor, tente novamente.');
    }

    const loaded = loadDraft(tenantSlug);
    if (!loaded) {
      if (sessionExpired) {
        // Session expired after quote was already submitted — show login tab with notice
        setTab('login');
        getPublicBranding(tenantSlug).catch(() => null).then((b) => {
          setBranding(b);
          setLoading(false);
        });
        return;
      }
      navigate(`/t/${tenantSlug}/orcamento`, { replace: true });
      return;
    }
    setDraft(loaded);
    setRegName(loaded.name ?? '');
    setRegEmail(loaded.email ?? '');
    setRegPhone(loaded.phone ?? '');
    setLoginEmail(loaded.email ?? '');

    getPublicBranding(tenantSlug).catch(() => null).then((b) => {
      setBranding(b);
      setLoading(false);
    });

    // If returning from OAuth, auto-submit quote
    if (oauthToken && loaded) {
      savePublicSession(tenantSlug, oauthToken);
      void submitQuoteWithToken(oauthToken, loaded, tenantSlug);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug]);

  // Apply tenant branding: primary color CSS var + favicon
  useEffect(() => {
    if (!branding) return;
    const color = branding.primary_color;
    if (color) {
      document.documentElement.style.setProperty('--color-primary-override', color);
    }
    if (branding.favicon_url && !faviconInjectedRef.current) {
      faviconInjectedRef.current = true;
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = branding.favicon_url;
      link.id = 'tenant-favicon-cadastro';
      document.head.appendChild(link);
    }
    return () => {
      document.documentElement.style.removeProperty('--color-primary-override');
      const existing = document.getElementById('tenant-favicon-cadastro');
      if (existing) existing.remove();
      faviconInjectedRef.current = false;
    };
  }, [branding]);

  // Sync tab email so user doesn't have to retype
  const handleTabSwitch = (newTab: Tab) => {
    if (newTab === 'login') setLoginEmail(regEmail || loginEmail);
    if (newTab === 'register') setRegEmail(loginEmail || regEmail);
    setError('');
    setTab(newTab);
  };

  const submitQuoteWithToken = async (
    accessToken: string,
    currentDraft: QuoteDraft,
    slug: string,
  ) => {
    try {
      const result = await createPublicQuote(slug, accessToken, {
        service_id: currentDraft.serviceId,
        area_sqm: currentDraft.area_sqm,
        duration_hours: currentDraft.duration_hours,
        addon_ids: currentDraft.addon_ids?.length ? currentDraft.addon_ids : undefined,
        address: currentDraft.address,
        city: currentDraft.city,
        state: currentDraft.state,
        postal_code: currentDraft.postal_code,
        observations: currentDraft.observations || undefined,
        estimated_total_cents: currentDraft.estimated_total_cents,
      });
      clearDraft(slug);
      setCreatedQuoteId(result.id);
      setShowSuccess(true);
    } catch (err) {
      const axiosErr = err as import('axios').AxiosError<{ error?: { message?: string | string[] }; message?: string | string[] }>;
      const raw = axiosErr.response?.data;
      const msg = raw?.error?.message ?? raw?.message;
      const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao enviar orçamento. Tente novamente.');
      setError(detail);
    }
  };

  const handleAuthAndSubmit = async (tokens: AuthTokens) => {
    if (!draft || !tenantSlug) return;
    savePublicSession(tenantSlug, tokens.accessToken);
    await submitQuoteWithToken(tokens.accessToken, draft, tenantSlug);
  };

  const handleRegisterSubmit = () => {
    if (isSubmittingRef.current) return;

    if (!regName.trim()) { setError('Informe seu nome.'); return; }
    if (!regEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) { setError('Informe um e-mail válido.'); return; }
    if (!regPassword) { setError('Informe uma senha.'); return; }
    if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(regPassword)) {
      setError('A senha deve ter no mínimo 8 caracteres, uma letra e um número.');
      return;
    }
    if (regPassword !== regConfirm) { setError('As senhas não conferem.'); return; }
    if (!regPhone.trim()) { setError('Informe seu telefone.'); return; }

    isSubmittingRef.current = true;
    setError('');

    registerPublicUser(tenantSlug!, {
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      confirmPassword: regConfirm,
      phone: regPhone.trim(),
    })
      .then(handleAuthAndSubmit)
      .catch((err) => {
        const axiosErr = err as import('axios').AxiosError<{ error?: { message?: string | string[] }; message?: string | string[] }>;
        const raw = axiosErr.response?.data;
        const msg = raw?.error?.message ?? raw?.message;
        const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao criar conta. Tente novamente.');
        setError(detail);
      })
      .finally(() => { isSubmittingRef.current = false; });
  };

  const handleLoginSubmit = () => {
    if (isSubmittingRef.current) return;

    if (!loginEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) { setError('Informe um e-mail válido.'); return; }
    if (!loginPassword) { setError('Informe a senha.'); return; }

    isSubmittingRef.current = true;
    setError('');

    loginPublicUser(tenantSlug!, { email: loginEmail.trim().toLowerCase(), password: loginPassword })
      .then(handleAuthAndSubmit)
      .catch((err) => {
        const axiosErr = err as import('axios').AxiosError<{ error?: { message?: string | string[] }; message?: string | string[] }>;
        const raw = axiosErr.response?.data;
        const msg = raw?.error?.message ?? raw?.message;
        const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Credenciais inválidas. Tente novamente.');
        setError(detail);
      })
      .finally(() => { isSubmittingRef.current = false; });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Carregando…</p>
      </div>
    );
  }

  const primaryColor = branding?.primary_color ?? '#4F46E5';

  return (
    <div
      className="min-h-screen bg-gray-50 pb-8"
      style={{ '--color-primary-override': primaryColor } as React.CSSProperties}
      data-testid="register-page"
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          {branding?.logo_url ? (
            <img src={branding.logo_url} alt={`Logo ${branding.name}`} className="h-10 w-auto object-contain" />
          ) : (
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {branding?.name ? branding.name.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <span className="font-semibold text-gray-900 text-lg truncate">{branding?.name}</span>
          <Link
            to={`/t/${tenantSlug}/orcamento`}
            className="ml-auto text-sm text-gray-500 hover:text-gray-700 transition-colors shrink-0"
          >
            ← Voltar
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Page title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Criar conta e enviar orçamento</h1>
        <p className="text-gray-600 text-sm mb-6">
          Ao criar a conta, seu orçamento será enviado para análise da empresa. Você receberá a confirmação por e-mail.
        </p>

        {sessionExpired && (
          <div
            role="alert"
            className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm"
            data-testid="session-expired-notice"
          >
            Sua sessão expirou. Faça login novamente para continuar.
          </div>
        )}

        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 lg:items-start">
          {/* Main form area */}
          <div>
            {/* Tabs */}
            <div className="flex rounded-lg border border-gray-200 bg-gray-100 p-1 mb-6 w-full" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'register'}
                onClick={() => handleTabSwitch('register')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  tab === 'register'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                data-testid="tab-register"
                style={{ minHeight: '44px' }}
              >
                Criar conta
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'login'}
                onClick={() => handleTabSwitch('login')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  tab === 'login'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                data-testid="tab-login"
                style={{ minHeight: '44px' }}
              >
                Já tenho conta
              </button>
            </div>

            {/* Form panel */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {tab === 'register' ? (
                <form aria-label="Criar conta" noValidate>
                  {/* Error at top — Phase 1 pattern */}
                  {error && (
                    <div
                      role="alert"
                      className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                      data-testid="form-error"
                    >
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nome completo <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="reg-name"
                        type="text"
                        value={regName}
                        onChange={(e) => { setRegName(e.target.value); setError(''); }}
                        placeholder="Seu nome completo"
                        variant="public"
                        className="w-full"
                        data-testid="reg-name"
                      />
                    </div>

                    <div>
                      <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
                        E-mail <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="reg-email"
                        type="email"
                        value={regEmail}
                        onChange={(e) => { setRegEmail(e.target.value); setError(''); }}
                        placeholder="seu@email.com"
                        variant="public"
                        className="w-full"
                        data-testid="reg-email"
                      />
                    </div>

                    <div>
                      <label htmlFor="reg-phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="reg-phone"
                        type="tel"
                        value={regPhone}
                        onChange={(e) => { setRegPhone(e.target.value); setError(''); }}
                        placeholder="(11) 99999-9999"
                        variant="public"
                        className="w-full"
                        data-testid="reg-phone"
                      />
                    </div>

                    <div>
                      <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Senha <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="reg-password"
                        type="password"
                        value={regPassword}
                        onChange={(e) => { setRegPassword(e.target.value); setError(''); }}
                        placeholder="Mínimo 8 caracteres"
                        variant="public"
                        className="w-full"
                        data-testid="reg-password"
                      />
                      <PasswordStrengthIndicator password={regPassword} />
                    </div>

                    <div>
                      <label htmlFor="reg-confirm" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar senha <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="reg-confirm"
                        type="password"
                        value={regConfirm}
                        onChange={(e) => { setRegConfirm(e.target.value); setError(''); }}
                        placeholder="Repita a senha"
                        variant="public"
                        className="w-full"
                        data-testid="reg-confirm"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleRegisterSubmit}
                      className="w-full h-11 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: primaryColor, minHeight: '44px' }}
                      data-testid="register-submit"
                    >
                      Criar conta e enviar orçamento
                    </button>

                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-xs text-gray-400">
                        <span className="bg-white px-3">ou continue com</span>
                      </div>
                    </div>

                    <SocialLoginButtons tenantSlug={tenantSlug!} primaryColor={primaryColor} />
                  </div>
                </form>
              ) : (
                <form aria-label="Entrar com conta existente" noValidate>
                  {/* Error at top — Phase 1 pattern */}
                  {error && (
                    <div
                      role="alert"
                      className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                      data-testid="form-error"
                    >
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
                        E-mail <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => { setLoginEmail(e.target.value); setError(''); }}
                        placeholder="seu@email.com"
                        variant="public"
                        className="w-full"
                        data-testid="login-email"
                      />
                    </div>

                    <div>
                      <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Senha <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => { setLoginPassword(e.target.value); setError(''); }}
                        placeholder="Sua senha"
                        variant="public"
                        className="w-full"
                        data-testid="login-password"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleLoginSubmit}
                      className="w-full h-11 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: primaryColor, minHeight: '44px' }}
                      data-testid="login-submit"
                    >
                      Entrar e enviar orçamento
                    </button>

                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-xs text-gray-400">
                        <span className="bg-white px-3">ou continue com</span>
                      </div>
                    </div>

                    <SocialLoginButtons tenantSlug={tenantSlug!} primaryColor={primaryColor} />
                  </div>
                </form>
              )}
            </div>

            {/* Notice */}
            <p className="mt-4 text-xs text-gray-500 leading-relaxed">
              Ao criar a conta, seu orçamento será enviado para análise da empresa. Você receberá a confirmação por e-mail.
            </p>
          </div>

          {/* Quote summary card — sticky on desktop, shows below on mobile */}
          <div
            className="mt-6 lg:mt-0 lg:sticky lg:top-4"
            data-testid="quote-summary-card"
          >
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Resumo do orçamento</h2>

              {draft ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Serviço</span>
                    <span className="font-medium text-gray-900 text-right max-w-[160px] truncate">
                      {draft.serviceName}
                    </span>
                  </div>

                  {draft.area_sqm != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Área</span>
                      <span className="font-medium text-gray-900">{draft.area_sqm} m²</span>
                    </div>
                  )}

                  {draft.duration_hours != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duração</span>
                      <span className="font-medium text-gray-900">{draft.duration_hours}h</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-500">Local</span>
                    <span className="font-medium text-gray-900 text-right max-w-[160px]">
                      {draft.city} - {draft.state}
                    </span>
                  </div>

                  <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <span className="text-gray-700 font-medium">Estimativa</span>
                    <span className="font-bold text-gray-900">
                      {formatCents(draft.estimated_total_cents, draft.currency)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed">
                    Valor sujeito a confirmação após análise da empresa.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Nenhum rascunho encontrado.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success modal */}
      {showSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Orçamento enviado"
          data-testid="success-modal"
        >
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke={primaryColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
              Orçamento enviado com sucesso!
            </h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              Aguarde a confirmação da empresa para agendar o serviço.
            </p>

            <div className="space-y-3">
              <Link
                to={`/t/${tenantSlug}/orcamento/agendar${createdQuoteId ? `?quoteId=${createdQuoteId}` : ''}`}
                className="block w-full h-11 rounded-lg text-white font-semibold text-sm text-center flex items-center justify-center transition-opacity hover:opacity-90"
                style={{ backgroundColor: primaryColor, minHeight: '44px' }}
                data-testid="schedule-cta"
              >
                Agendar serviço
              </Link>
              <Link
                to={`/t/${tenantSlug}`}
                className="block w-full h-11 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm text-center flex items-center justify-center transition-colors hover:bg-gray-50"
                style={{ minHeight: '44px' }}
                data-testid="back-home-cta"
              >
                Voltar ao início
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
