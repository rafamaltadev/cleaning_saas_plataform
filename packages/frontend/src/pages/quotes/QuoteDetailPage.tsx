import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { getQuoteById, sendQuote, updateQuoteStatus, updateQuote } from '../../api/quotes';
import { hasPermission } from '../../utils/permissions';
import { formatCurrency } from '../../utils/pricing';
import type { RootState } from '../../store';
import type { ApiQuote, ApiQuoteStatus } from '../../types';

const QUOTE_STATUS_LABELS: Record<ApiQuoteStatus, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  accepted: 'Aceito',
  rejected: 'Rejeitado',
  expired: 'Expirado',
};

function quoteBadgeVariant(status: ApiQuoteStatus) {
  switch (status) {
    case 'accepted': return 'success' as const;
    case 'sent': return 'warning' as const;
    case 'expired':
    case 'rejected': return 'error' as const;
    default: return 'neutral' as const;
  }
}

function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const canSend = hasPermission(user?.role, 'quotes.send');

  const [quote, setQuote] = useState<ApiQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [newValidUntil, setNewValidUntil] = useState('');
  const [reactivating, setReactivating] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (!id) return;
    getQuoteById(id)
      .then(setQuote)
      .catch(() => setError('Erro ao carregar orçamento.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!showReactivateModal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowReactivateModal(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showReactivateModal]);

  const isExpiredVisually = quote !== null
    && quote.status === 'sent'
    && new Date(quote.valid_until) < new Date();

  async function handleSend() {
    if (!id) return;
    setSending(true);
    try {
      const updated = await sendQuote(id);
      setQuote(updated);
    } catch {
      setError('Erro ao enviar orçamento.');
    } finally {
      setSending(false);
    }
  }

  async function handleAccept() {
    if (!id) return;
    setAccepting(true);
    try {
      const updated = await updateQuoteStatus(id, 'accepted');
      setQuote(updated);
    } catch {
      setError('Erro ao aceitar orçamento.');
    } finally {
      setAccepting(false);
    }
  }

  async function handleReject() {
    if (!id) return;
    setRejecting(true);
    try {
      const updated = await updateQuoteStatus(id, 'rejected');
      setQuote(updated);
    } catch {
      setError('Erro ao rejeitar orçamento.');
    } finally {
      setRejecting(false);
    }
  }

  async function handleRevertToSent() {
    if (!id) return;
    setReverting(true);
    try {
      const updated = await updateQuote(id, { status: 'sent' });
      setQuote(updated);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: unknown } } };
      const msg = e?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Erro ao reverter orçamento.');
    } finally {
      setReverting(false);
    }
  }

  async function handleReactivate() {
    if (!id || !newValidUntil) return;
    setReactivating(true);
    setModalError('');
    try {
      const updated = await updateQuote(id, {
        status: 'sent',
        valid_until: new Date(newValidUntil).toISOString(),
      });
      setQuote(updated);
      setShowReactivateModal(false);
      setNewValidUntil('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: unknown } } };
      const msg = e?.response?.data?.message;
      setModalError(typeof msg === 'string' ? msg : 'Erro ao reativar orçamento.');
    } finally {
      setReactivating(false);
    }
  }

  if (loading) return <p className="text-text-muted text-sm">Carregando…</p>;
  if (error && !quote) return <p className="text-error text-sm">{error}</p>;
  if (!quote) return null;

  const showReactivate = quote.status === 'expired' || isExpiredVisually;
  const showReopen = quote.status === 'rejected';
  const showAcceptReject = quote.status === 'sent' && !isExpiredVisually;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Detalhes do Orçamento</h1>
          <p className="text-text-secondary text-sm mt-1 font-mono">{quote.id}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant={isExpiredVisually ? 'error' : quoteBadgeVariant(quote.status)}>
            {isExpiredVisually ? 'Expirado' : (QUOTE_STATUS_LABELS[quote.status] ?? quote.status)}
          </Badge>
          {canSend && quote.status === 'draft' && (
            <Button variant="primary" loading={sending} onClick={handleSend} aria-label="Enviar orçamento">
              Enviar Orçamento
            </Button>
          )}
          {showAcceptReject && (
            <>
              <Button variant="primary" loading={accepting} onClick={handleAccept} aria-label="Aceitar orçamento">
                Aceitar Orçamento
              </Button>
              <Button variant="danger" loading={rejecting} onClick={handleReject} aria-label="Rejeitar orçamento">
                Rejeitar Orçamento
              </Button>
            </>
          )}
          {showReactivate && (
            <Button
              variant="primary"
              onClick={() => { setModalError(''); setShowReactivateModal(true); }}
              aria-label="Reativar orçamento"
            >
              Reativar Orçamento
            </Button>
          )}
          {showReopen && (
            <Button
              variant="secondary"
              onClick={() => { setModalError(''); setShowReactivateModal(true); }}
              aria-label="Reabrir orçamento"
            >
              Reabrir Orçamento
            </Button>
          )}
          {quote.status === 'accepted' && (
            <Button variant="secondary" loading={reverting} onClick={handleRevertToSent} aria-label="Reverter para enviado">
              Reverter para Enviado
            </Button>
          )}
          <Button variant="ghost" onClick={() => navigate('/quotes')}>Voltar</Button>
        </div>
      </div>

      {error && <p className="text-error text-sm mb-4" role="alert">{error}</p>}

      <div className="space-y-4 max-w-2xl">
        <Card title="Informações do Orçamento">
          <dl className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Status</dt>
              <dd>
                <Badge variant={isExpiredVisually ? 'error' : quoteBadgeVariant(quote.status)}>
                  {isExpiredVisually ? 'Expirado' : (QUOTE_STATUS_LABELS[quote.status] ?? quote.status)}
                </Badge>
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Total Estimado</dt>
              <dd className="text-sm font-semibold text-text-primary">
                {formatCurrency(quote.estimated_total_cents, quote.currency)}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Moeda</dt>
              <dd className="text-sm text-text-primary">{quote.currency}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Válido até</dt>
              <dd className="text-sm text-text-primary">
                {new Date(quote.valid_until).toLocaleDateString('pt-BR')}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Desconto Manual</dt>
              <dd className="text-sm text-text-primary">{quote.manual_discount_percent}%</dd>
            </div>
          </dl>
        </Card>

        <Card title="Detalhes do Serviço">
          <dl className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Serviço</dt>
              <dd className="text-sm text-text-primary break-all">
                {quote.service_name ?? <span className="font-mono text-xs">{quote.service_id}</span>}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Valor total</dt>
              <dd className="text-sm font-semibold text-text-primary">
                {formatCurrency(quote.estimated_total_cents, quote.currency)}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Moeda</dt>
              <dd className="text-sm text-text-primary">{quote.currency}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Válido até</dt>
              <dd className="text-sm text-text-primary">
                {new Date(quote.valid_until).toLocaleDateString('pt-BR')}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Desconto</dt>
              <dd className="text-sm text-text-primary">{quote.manual_discount_percent}%</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Local do serviço</dt>
              <dd className="text-sm text-text-primary">
                {quote.use_client_address === false && quote.service_address
                  ? quote.service_address
                  : 'Endereço do cliente'}
              </dd>
            </div>
            {quote.observations && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <dt className="text-sm text-text-secondary">Observações</dt>
                <dd className="text-sm text-text-primary">{quote.observations}</dd>
              </div>
            )}
            {quote.service_date && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <dt className="text-sm text-text-secondary">Data do serviço</dt>
                <dd className="text-sm text-text-primary">
                  {new Date(quote.service_date).toLocaleDateString('pt-BR')}
                </dd>
              </div>
            )}
            {quote.addons && quote.addons.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <dt className="text-sm text-text-secondary">Adicionais</dt>
                <dd className="text-sm text-text-primary">
                  <ul className="space-y-0.5">
                    {quote.addons.map((addon) => (
                      <li key={addon.id}>
                        {addon.name} — {formatCurrency(addon.price_cents, quote.currency)}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-text-muted mt-1">
                    Total adicionais:{' '}
                    {formatCurrency(
                      quote.addons.reduce((sum, a) => sum + a.price_cents, 0),
                      quote.currency,
                    )}
                  </p>
                </dd>
              </div>
            )}
          </dl>
        </Card>
      </div>

      {showReactivateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowReactivateModal(false)}
          aria-modal="true"
          role="dialog"
          aria-labelledby="reactivate-modal-title"
        >
          <div
            className="bg-surface rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="reactivate-modal-title" className="text-lg font-semibold text-text-primary mb-2">
              Reativar Orçamento
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              Informe uma nova data de validade para reativar este orçamento.
            </p>
            <div className="mb-4">
              <label htmlFor="new-valid-until" className="block text-sm font-medium text-text-primary mb-1">
                Nova data de validade *
              </label>
              <input
                id="new-valid-until"
                type="date"
                value={newValidUntil}
                min={todayDate()}
                onChange={(e) => setNewValidUntil(e.target.value)}
                className="w-full h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {modalError && (
              <p className="text-sm text-error mb-3" role="alert">{modalError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowReactivateModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                loading={reactivating}
                disabled={!newValidUntil}
                onClick={handleReactivate}
              >
                Reativar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
