import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// ─── Pricing data (exact as specified — DO NOT modify) ──────────────────────

const BRL_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'R$ 59,90',
    period: '/mês',
    description: 'Ideal para quem está começando',
    features: ['Uso individual', 'Página pública + agendamento', 'Gestão básica'],
    badge: null,
    highlighted: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 'R$ 249,90',
    period: '/ 6 meses',
    description: 'Para organizar e crescer',
    features: ['Até 3 membros na equipe', 'Agenda completa', 'Gestão de leads'],
    badge: 'Mais Popular',
    highlighted: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 'R$ 399,90',
    period: '/ ano',
    description: 'Para escalar sua operação',
    features: ['Até 10 membros na equipe', 'Acesso completo à plataforma', 'Suporte prioritário'],
    badge: 'Melhor Custo',
    highlighted: false,
  },
];

const USD_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$19.90',
    period: '/month',
    description: 'For getting started',
    features: ['Single user', 'Public page + scheduling', 'Basic management'],
    badge: null,
    highlighted: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$79.90',
    period: '/ 6 months',
    description: 'For growing operations',
    features: ['Up to 3 team members', 'Full scheduling', 'Lead management'],
    badge: 'Most Popular',
    highlighted: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '$149.90',
    period: '/ year',
    description: 'For scaling',
    features: ['Up to 10 team members', 'Full platform access', 'Priority support'],
    badge: 'Best Value',
    highlighted: false,
  },
];

// ─── Simulation steps ────────────────────────────────────────────────────────

const SIMULATION_STEPS = [
  {
    step: 1,
    title: 'Orçamento criado e enviado',
    description: 'Maria Silva recebeu um orçamento de R$ 249,00 para limpeza residencial',
    detail: 'Enviado por e-mail · Válido por 7 dias',
    accent: '#4F46E5',
    statusLabel: 'Enviado',
  },
  {
    step: 2,
    title: 'Agendamento confirmado',
    description: 'Maria aceitou o orçamento. Serviço agendado para 15/05 às 09:00',
    detail: 'Equipe notificada · Calendário atualizado',
    accent: '#22C55E',
    statusLabel: 'Confirmado',
  },
  {
    step: 3,
    title: 'Notificação enviada automaticamente',
    description: 'Confirmação enviada para equipe e cliente sem nenhuma ação manual',
    detail: 'E-mail + SMS enviados · Registro salvo',
    accent: '#0EA5E9',
    statusLabel: 'Notificado',
  },
];

// ─── Shared helpers ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-3 inline-block rounded-full border border-[#4F46E5]/40 bg-[#4F46E5]/10 px-3 py-1 text-xs font-medium text-[#4F46E5]">
      {children}
    </span>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

function LandingHeader() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-16 border-b border-[#2D3748] bg-[#0B0F19]/90 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <span className="text-lg font-bold text-[#F9FAFB]">
          Clean<span className="text-[#4F46E5]">SaaS</span>
        </span>
        <Link
          to="/login"
          data-testid="login-link"
          className="rounded-lg border border-[#2D3748] px-4 py-2 text-sm font-medium text-[#F9FAFB] transition-all duration-200 hover:border-[#4F46E5] hover:text-[#4F46E5]"
        >
          Entrar
        </Link>
      </div>
    </header>
  );
}

// ─── Section 1: Hero ─────────────────────────────────────────────────────────

function DashboardMockup() {
  return (
    <div className="w-full rounded-xl border border-[#2D3748] bg-[#111827] p-4 shadow-lg">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
        <div className="ml-2 h-3 w-28 rounded bg-[#1F2937]" />
      </div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          { value: 'R$ 12.400', label: 'receita' },
          { value: '24', label: 'agendamentos' },
          { value: '8', label: 'clientes' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg bg-[#1F2937] p-2 text-center">
            <div className="text-sm font-semibold text-[#F9FAFB]">{item.value}</div>
            <div className="text-[10px] text-[#6B7280]">{item.label}</div>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {[
          { name: 'Maria Silva', status: 'Confirmado', color: '#22C55E' },
          { name: 'João Santos', status: 'Pendente', color: '#F59E0B' },
          { name: 'Ana Lima', status: 'Enviado', color: '#0EA5E9' },
        ].map((row) => (
          <div key={row.name} className="flex items-center justify-between rounded-lg bg-[#1F2937] px-3 py-1.5">
            <span className="text-xs text-[#9CA3AF]">{row.name}</span>
            <span className="text-[10px] font-medium" style={{ color: row.color }}>
              {row.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroSection() {
  const handleDemoClick = () => {
    document.getElementById('simulation')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      data-testid="hero-section"
      className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#4F46E5]/5 to-transparent" />
      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="mb-5 text-4xl font-bold leading-tight text-[#F9FAFB] sm:text-5xl">
              Chega de cliente perdido.{' '}
              <span className="text-[#4F46E5]">Gerencie tudo do seu celular.</span>
            </h1>
            <p className="mb-8 max-w-lg text-lg text-[#9CA3AF] lg:max-w-none">
              O sistema completo para empresas de limpeza — orçamentos, agendamentos e equipe em um único lugar. Sem planilha, sem confusão.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                to="/login"
                data-testid="hero-cta-primary"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#4F46E5] px-6 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#4338CA]"
              >
                Começar Grátis
              </Link>
              <button
                onClick={handleDemoClick}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-[#2D3748] px-6 text-sm font-medium text-[#F9FAFB] transition-all duration-200 hover:border-[#4F46E5] hover:text-[#4F46E5]"
              >
                Ver Demonstração
              </button>
            </div>
          </div>
          <div className="w-full max-w-sm flex-1 lg:max-w-none">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 2: Social Proof ─────────────────────────────────────────────────

function SocialProofSection() {
  const metrics = [
    { value: '1.200+', label: 'agendamentos gerenciados' },
    { value: '98%', label: 'taxa de satisfação' },
    { value: '4h/sem', label: 'economizadas por operação' },
  ];

  return (
    <section className="border-y border-[#2D3748] bg-[#111827] py-12">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {metrics.map((m) => (
            <div key={m.label} className="text-center">
              <div className="mb-1 text-3xl font-bold text-[#4F46E5]">{m.value}</div>
              <div className="text-sm text-[#9CA3AF]">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 3: Problem → Solution ───────────────────────────────────────────

function ProblemSolutionSection() {
  const items = [
    {
      problem: 'Leads que somem sem resposta',
      solution: 'Cada lead vira um orçamento em minutos — e você nunca perde um cliente por falta de agilidade.',
    },
    {
      problem: 'Operação desorganizada e manual',
      solution: 'Centralize agendamentos, clientes e equipe em um único lugar. Sem planilha, sem confusão.',
    },
    {
      problem: 'Tempo demais em administração',
      solution: 'Automatize confirmações, notificações e relatórios. Foque no serviço, não no burocrático.',
    },
  ];

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="mb-12 text-center">
          <SectionLabel>Problemas que você conhece</SectionLabel>
          <h2 className="text-3xl font-bold text-[#F9FAFB]">
            Por que tantas empresas de limpeza travam?
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-[#2D3748] bg-[#111827] p-6">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#EF4444]/10 text-sm font-bold text-[#EF4444]">
                {i + 1}
              </div>
              <h3 className="mb-3 font-semibold text-[#F9FAFB]">{item.problem}</h3>
              <div className="mb-3 h-px bg-[#2D3748]" />
              <p className="text-sm leading-relaxed text-[#9CA3AF]">{item.solution}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 4: Features ─────────────────────────────────────────────────────

function FeaturesSection() {
  const features = [
    {
      title: 'Comunicação automatizada',
      description: 'Orçamentos, confirmações e lembretes enviados automaticamente. Sem esforço manual.',
    },
    {
      title: 'Orçamentos e agendamentos integrados',
      description: 'Crie um orçamento e converta em agendamento com um clique. Tudo rastreado e registrado.',
    },
    {
      title: 'Gestão de equipe simplificada',
      description: 'Atribua serviços, gerencie disponibilidade e acompanhe sua equipe em tempo real.',
    },
    {
      title: 'Relatórios e operação centralizada',
      description: 'Visualize receita, conversão e desempenho em um dashboard claro e objetivo.',
    },
  ];

  return (
    <section className="bg-[#111827] py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="mb-12 text-center">
          <SectionLabel>Funcionalidades</SectionLabel>
          <h2 className="text-3xl font-bold text-[#F9FAFB]">Tudo que você precisa para crescer</h2>
          <p className="mt-3 text-[#9CA3AF]">Focado em resultados, não em complexidade.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map((f, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-xl border border-[#2D3748] bg-[#0B0F19] p-6 transition-all duration-200 hover:border-[#4F46E5]/40"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#4F46E5]/10">
                <div className="h-3 w-3 rounded-sm bg-[#4F46E5]" />
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-[#F9FAFB]">{f.title}</h3>
                <p className="text-sm leading-relaxed text-[#9CA3AF]">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 5: How It Works ─────────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Crie sua conta e configure seus serviços',
      description: 'Cadastre sua empresa, defina os serviços que você oferece e configure seus preços.',
    },
    {
      number: '02',
      title: 'Envie orçamentos e confirme agendamentos',
      description: 'Crie orçamentos em segundos e converta em agendamentos com um clique.',
    },
    {
      number: '03',
      title: 'Gerencie sua equipe e acompanhe tudo em tempo real',
      description: 'Atribua serviços, monitore execução e veja sua operação completa no dashboard.',
    },
  ];

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="mb-12 text-center">
          <SectionLabel>Como funciona</SectionLabel>
          <h2 className="text-3xl font-bold text-[#F9FAFB]">Simples de começar, poderoso para escalar</h2>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.number} className="relative text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#4F46E5] bg-[#4F46E5]/10">
                <span className="text-lg font-bold text-[#4F46E5]">{s.number}</span>
              </div>
              <h3 className="mb-2 font-semibold text-[#F9FAFB]">{s.title}</h3>
              <p className="text-sm leading-relaxed text-[#9CA3AF]">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 6: Benefits ─────────────────────────────────────────────────────

function BenefitsSection() {
  const benefits = [
    {
      title: 'Economize horas de trabalho manual toda semana',
      description: 'Automação de ponta a ponta — da confirmação ao relatório. Horas devolvidas para você focar no crescimento.',
    },
    {
      title: 'Nunca mais perca um lead ou um agendamento',
      description: 'Cada contato registrado, cada compromisso notificado. Zero buracos na sua operação.',
    },
    {
      title: 'Administre toda a operação pelo celular',
      description: 'Interface mobile-first. Gerencie clientes, equipe e agenda de qualquer lugar, a qualquer hora.',
    },
  ];

  return (
    <section className="bg-[#111827] py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="mb-12 text-center">
          <SectionLabel>Diferenciais</SectionLabel>
          <h2 className="text-3xl font-bold text-[#F9FAFB]">Por que escolher a CleanSaaS?</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {benefits.map((b, i) => (
            <div key={i} className="rounded-xl border border-[#2D3748] bg-[#0B0F19] p-6">
              <div className="mb-3 h-1 w-8 rounded-full bg-[#4F46E5]" />
              <h3 className="mb-2 font-semibold text-[#F9FAFB]">{b.title}</h3>
              <p className="text-sm leading-relaxed text-[#9CA3AF]">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 7: Pricing ──────────────────────────────────────────────────────

function PricingSection() {
  const isLocalePtBR = navigator.language === 'pt-BR';
  const [currency, setCurrency] = useState<'BRL' | 'USD'>(isLocalePtBR ? 'BRL' : 'USD');

  const plans = currency === 'BRL' ? BRL_PLANS : USD_PLANS;

  return (
    <section data-testid="pricing-section" className="py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="mb-12 text-center">
          <SectionLabel>Planos</SectionLabel>
          <h2 className="mb-3 text-3xl font-bold text-[#F9FAFB]">
            Investimento que se paga em semanas
          </h2>
          <p className="text-[#9CA3AF]">
            Sem taxa de setup. Cancele quando quiser.
          </p>

          {!isLocalePtBR && (
            <div className="mt-5 inline-flex rounded-lg border border-[#2D3748] bg-[#111827] p-1">
              <button
                data-testid="currency-toggle-brl"
                onClick={() => setCurrency('BRL')}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                  currency === 'BRL'
                    ? 'bg-[#4F46E5] text-white'
                    : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
                }`}
              >
                BRL
              </button>
              <button
                data-testid="currency-toggle-usd"
                onClick={() => setCurrency('USD')}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                  currency === 'USD'
                    ? 'bg-[#4F46E5] text-white'
                    : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
                }`}
              >
                USD
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              data-testid={`pricing-card-${plan.id}`}
              className={`relative flex flex-col rounded-xl border p-6 transition-all duration-200 ${
                plan.highlighted
                  ? 'scale-[1.03] border-[#4F46E5] bg-[#4F46E5]/5 shadow-lg shadow-[#4F46E5]/10'
                  : 'border-[#2D3748] bg-[#111827]'
              }`}
            >
              {plan.badge && (
                <div
                  data-testid={plan.id === 'growth' ? 'most-popular-badge' : 'best-value-badge'}
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-semibold ${
                    plan.highlighted
                      ? 'bg-[#4F46E5] text-white'
                      : 'bg-[#F59E0B] text-[#0B0F19]'
                  }`}
                >
                  {plan.badge}
                </div>
              )}

              <div className="mb-4">
                <h3 className="mb-1 text-lg font-bold text-[#F9FAFB]">{plan.name}</h3>
                <p className="text-sm text-[#9CA3AF]">{plan.description}</p>
              </div>

              <div className="mb-5">
                <span className="text-3xl font-bold text-[#F9FAFB]">{plan.price}</span>
                <span className="text-sm text-[#6B7280]">{plan.period}</span>
              </div>

              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                    <span className="text-[#22C55E]">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/login"
                data-testid={`pricing-cta-${plan.id}`}
                className={`inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-all duration-200 ${
                  plan.highlighted
                    ? 'bg-[#4F46E5] text-white hover:bg-[#4338CA]'
                    : 'border border-[#2D3748] text-[#F9FAFB] hover:border-[#4F46E5] hover:text-[#4F46E5]'
                }`}
              >
                Começar Grátis
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-[#6B7280]">
          Cancele quando quiser &middot; Sem cartão de crédito obrigatório
        </p>
      </div>
    </section>
  );
}

// ─── Section 8: Live Simulation ──────────────────────────────────────────────

function SimulationSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const advanceStep = () => {
      setVisible(false);
      setTimeout(() => {
        setActiveStep((prev) => (prev + 1) % SIMULATION_STEPS.length);
        setProgress(0);
        setVisible(true);
      }, 300);
    };

    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 60);

    intervalRef.current = setInterval(advanceStep, 3200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  const current = SIMULATION_STEPS[activeStep];

  return (
    <section
      id="simulation"
      data-testid="simulation-section"
      className="bg-[#111827] py-16 sm:py-24"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="mb-12 text-center">
          <SectionLabel>Veja em ação</SectionLabel>
          <h2 className="text-3xl font-bold text-[#F9FAFB]">
            Da solicitação ao serviço, sem esforço
          </h2>
          <p className="mt-3 text-[#9CA3AF]">Tudo acontece automaticamente na plataforma.</p>
        </div>

        <div className="mx-auto max-w-2xl">
          {/* Step indicators */}
          <div className="mb-8 flex items-center justify-center gap-3">
            {SIMULATION_STEPS.map((s, i) => (
              <button
                key={s.step}
                onClick={() => {
                  setVisible(false);
                  setTimeout(() => { setActiveStep(i); setProgress(0); setVisible(true); }, 200);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeStep ? 'w-8 bg-[#4F46E5]' : 'w-2 bg-[#2D3748]'
                }`}
                aria-label={`Etapa ${s.step}`}
              />
            ))}
          </div>

          {/* Simulation card */}
          <div
            className="rounded-xl border border-[#2D3748] bg-[#0B0F19] p-6 transition-opacity duration-300"
            style={{ opacity: visible ? 1 : 0 }}
          >
            {/* Progress bar */}
            <div className="mb-5 h-1 w-full overflow-hidden rounded-full bg-[#1F2937]">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{ width: `${progress}%`, backgroundColor: current.accent }}
              />
            </div>

            {/* Step label */}
            <div className="mb-3 flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: `${current.accent}20`, color: current.accent }}
              >
                Etapa {current.step} de {SIMULATION_STEPS.length}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: `${current.accent}20`, color: current.accent }}
              >
                {current.statusLabel}
              </span>
            </div>

            {/* Content */}
            <h3 className="mb-2 text-lg font-semibold text-[#F9FAFB]">{current.title}</h3>
            <p className="mb-3 text-sm text-[#9CA3AF]">{current.description}</p>
            <p className="text-xs text-[#6B7280]">{current.detail}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 9: Final CTA ─────────────────────────────────────────────────────

function FinalCTASection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="rounded-2xl border border-[#4F46E5]/20 bg-gradient-to-br from-[#4F46E5]/10 to-[#0EA5E9]/5 p-10 text-center sm:p-16">
          <h2 className="mb-4 text-3xl font-bold text-[#F9FAFB] sm:text-4xl">
            Pronto para transformar sua empresa de limpeza?
          </h2>
          <p className="mb-8 text-lg text-[#9CA3AF]">
            Comece agora e veja os resultados na primeira semana.
          </p>
          <Link
            to="/login"
            data-testid="final-cta-primary"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-[#4F46E5] px-8 text-base font-semibold text-white transition-all duration-200 hover:bg-[#4338CA]"
          >
            Começar Grátis
          </Link>
          <p className="mt-4 text-sm text-[#6B7280]">
            Sem cartão de crédito &middot; Cancele quando quiser
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div
      data-testid="landing-page"
      className="min-h-screen bg-[#0B0F19] font-['Inter',sans-serif] text-[#F9FAFB]"
    >
      <LandingHeader />
      <main className="pt-16">
        <HeroSection />
        <SocialProofSection />
        <ProblemSolutionSection />
        <FeaturesSection />
        <HowItWorksSection />
        <BenefitsSection />
        <PricingSection />
        <SimulationSection />
        <FinalCTASection />
      </main>
    </div>
  );
}
