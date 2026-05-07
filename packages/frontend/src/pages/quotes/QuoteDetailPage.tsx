import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { getQuoteById, sendQuote, updateQuoteStatus } from '../../api/quotes';
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

  useEffect(() => {
    if (!id) return;
    getQuoteById(id)
      .then(setQuote)
      .catch(() => setError('Erro ao carregar orçamento.'))
      .finally(() => setLoading(false));
  }, [id]);

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

  if (loading) return <p className="text-text-muted text-sm">Carregando…</p>;
  if (error && !quote) return <p className="text-error text-sm">{error}</p>;
  if (!quote) return null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Detalhes do Orçamento</h1>
          <p className="text-text-secondary text-sm mt-1 font-mono">{quote.id}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant={quoteBadgeVariant(quote.status)}>
            {QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
          </Badge>
          {canSend && quote.status === 'draft' && (
            <Button variant="primary" loading={sending} onClick={handleSend} aria-label="Enviar orçamento">
              Enviar Orçamento
            </Button>
          )}
          {quote.status === 'sent' && (
            <>
              <Button
                variant="primary"
                loading={accepting}
                onClick={handleAccept}
                aria-label="Aceitar orçamento"
              >
                Aceitar Orçamento
              </Button>
              <Button
                variant="danger"
                loading={rejecting}
                onClick={handleReject}
                aria-label="Rejeitar orçamento"
              >
                Rejeitar Orçamento
              </Button>
            </>
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
                <Badge variant={quoteBadgeVariant(quote.status)}>
                  {QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
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

        <Card title="Identificadores">
          <dl className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">ID do Orçamento</dt>
              <dd className="text-xs font-mono text-text-primary break-all">{quote.id}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">ID do Cliente</dt>
              <dd className="text-xs font-mono text-text-primary break-all">{quote.client_id}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">ID do Serviço</dt>
              <dd className="text-xs font-mono text-text-primary break-all">{quote.service_id}</dd>
            </div>
            {quote.pricing_rule_id && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <dt className="text-sm text-text-secondary">ID da Regra de Preço</dt>
                <dd className="text-xs font-mono text-text-primary break-all">{quote.pricing_rule_id}</dd>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Criado por</dt>
              <dd className="text-xs font-mono text-text-primary break-all">{quote.created_by}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Criado em</dt>
              <dd className="text-sm text-text-primary">
                {new Date(quote.created_at).toLocaleString('pt-BR')}
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
