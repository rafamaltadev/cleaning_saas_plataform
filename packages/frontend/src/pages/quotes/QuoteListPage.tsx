import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { listQuotes, sendQuote, deleteQuote, updateQuoteStatus } from '../../api/quotes';
import { hasPermission } from '../../utils/permissions';
import type { RootState } from '../../store';
import type { ApiQuote, ApiQuoteStatus } from '../../types';

const PAGE_SIZE = 20;

function quoteBadgeVariant(status: ApiQuoteStatus) {
  switch (status) {
    case 'accepted': return 'success' as const;
    case 'sent': return 'warning' as const;
    case 'expired':
    case 'rejected': return 'error' as const;
    default: return 'neutral' as const;
  }
}

const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  accepted: 'Aceito',
  expired: 'Expirado',
  rejected: 'Rejeitado',
};

export default function QuoteListPage() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const canSend = hasPermission(user?.role, 'quotes.send');

  const [quotes, setQuotes] = useState<ApiQuote[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    listQuotes({ page, limit: PAGE_SIZE, status: statusFilter || undefined })
      .then((result) => {
        if (cancelled) return;
        setQuotes(result.items ?? []);
        setTotal(result.meta?.total ?? 0);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Erro ao carregar orçamentos.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page, statusFilter, refreshKey]);

  async function handleSend(id: string) {
    setSending(id);
    try {
      await sendQuote(id);
      setRefreshKey((k) => k + 1);
    } catch {
      setError('Erro ao enviar orçamento.');
    } finally {
      setSending(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Excluir este orçamento? Esta ação não pode ser desfeita.')) return;
    try {
      await deleteQuote(id);
      setRefreshKey((k) => k + 1);
    } catch {
      setError('Erro ao excluir orçamento. Tente novamente.');
    }
  }

  async function handleAccept(id: string) {
    setAccepting(id);
    try {
      await updateQuoteStatus(id, 'accepted');
      setRefreshKey((k) => k + 1);
    } catch {
      setError('Erro ao aceitar orçamento.');
    } finally {
      setAccepting(null);
    }
  }

  async function handleReject(id: string) {
    setRejecting(id);
    try {
      await updateQuoteStatus(id, 'rejected');
      setRefreshKey((k) => k + 1);
    } catch {
      setError('Erro ao rejeitar orçamento.');
    } finally {
      setRejecting(null);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Orçamentos</h1>
        <Button onClick={() => navigate('/quotes/new')}>+ Novo Orçamento</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filter by status"
        >
          <option value="">Todos os status</option>
          <option value="draft">Rascunho</option>
          <option value="sent">Enviado</option>
          <option value="accepted">Aceito</option>
          <option value="expired">Expirado</option>
          <option value="rejected">Rejeitado</option>
        </select>
      </div>

      {error && <p className="text-error text-sm mb-4" role="alert">{error}</p>}

      {/* Desktop table */}
      <div className="hidden sm:block bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full" aria-label="Quotes table">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Total</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Válido até</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted text-sm">Carregando…</td>
              </tr>
            ) : quotes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted text-sm">Nenhum orçamento encontrado.</td>
              </tr>
            ) : (
              quotes.map((quote) => (
                <tr key={quote.id} className="border-b border-border last:border-0 hover:bg-surface-alt transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm text-text-primary">{quote.client_name ?? quote.client_id.slice(0, 8) + '…'}</p>
                    {quote.service_name && <p className="text-xs text-text-muted mt-0.5">{quote.service_name}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={quoteBadgeVariant(quote.status)}>{QUOTE_STATUS_LABELS[quote.status] ?? quote.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: quote.currency || 'BRL' }).format(quote.estimated_total_cents / 100)}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {new Date(quote.valid_until).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/quotes/${quote.id}`)}>
                      Ver
                    </Button>
                    {quote.status === 'draft' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/quotes/${quote.id}/edit`)}>
                          Editar
                        </Button>
                        {canSend && (
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={sending === quote.id}
                            onClick={() => handleSend(quote.id)}
                            aria-label={`Enviar orçamento ${quote.id}`}
                          >
                            Enviar
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => void handleDelete(quote.id)}
                          aria-label={`Excluir orçamento ${quote.id}`}
                        >
                          Excluir
                        </Button>
                      </>
                    )}
                    {quote.status === 'sent' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/quotes/${quote.id}/edit`)}>
                          Editar
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          loading={accepting === quote.id}
                          onClick={() => handleAccept(quote.id)}
                          aria-label={`Aceitar orçamento ${quote.id}`}
                        >
                          Aceitar
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={rejecting === quote.id}
                          onClick={() => handleReject(quote.id)}
                          aria-label={`Rejeitar orçamento ${quote.id}`}
                        >
                          Rejeitar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => void handleDelete(quote.id)}
                          aria-label={`Excluir orçamento ${quote.id}`}
                        >
                          Excluir
                        </Button>
                      </>
                    )}
                    {(quote.status === 'accepted' || quote.status === 'rejected') && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/quotes/${quote.id}/edit`)}>
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => void handleDelete(quote.id)}
                          aria-label={`Excluir orçamento ${quote.id}`}
                        >
                          Excluir
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <p className="text-center text-text-muted text-sm py-8">Carregando…</p>
        ) : quotes.length === 0 ? (
          <p className="text-center text-text-muted text-sm py-8">Nenhum orçamento encontrado.</p>
        ) : (
          quotes.map((quote) => (
            <div key={quote.id} className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-text-primary">{quote.client_name ?? quote.client_id.slice(0, 12) + '…'}</p>
                  {quote.service_name && <p className="text-xs text-text-muted mt-0.5">{quote.service_name}</p>}
                  <p className="text-sm text-text-primary mt-0.5">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: quote.currency || 'BRL' }).format(quote.estimated_total_cents / 100)}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Válido: {new Date(quote.valid_until).toLocaleDateString()}</p>
                </div>
                <Badge variant={quoteBadgeVariant(quote.status)}>{QUOTE_STATUS_LABELS[quote.status] ?? quote.status}</Badge>
              </div>
              <div className="mt-3 flex gap-2 justify-end flex-wrap">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/quotes/${quote.id}`)}>
                  Ver
                </Button>
                {quote.status === 'draft' && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/quotes/${quote.id}/edit`)}>
                      Editar
                    </Button>
                    {canSend && (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={sending === quote.id}
                        onClick={() => handleSend(quote.id)}
                        aria-label={`Enviar orçamento ${quote.id}`}
                      >
                        Enviar
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => void handleDelete(quote.id)}
                      aria-label={`Excluir orçamento ${quote.id}`}
                    >
                      Excluir
                    </Button>
                  </>
                )}
                {quote.status === 'sent' && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/quotes/${quote.id}/edit`)}>
                      Editar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={accepting === quote.id}
                      onClick={() => handleAccept(quote.id)}
                      aria-label={`Aceitar orçamento ${quote.id}`}
                    >
                      Aceitar
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={rejecting === quote.id}
                      onClick={() => handleReject(quote.id)}
                      aria-label={`Rejeitar orçamento ${quote.id}`}
                    >
                      Rejeitar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => void handleDelete(quote.id)}
                      aria-label={`Excluir orçamento ${quote.id}`}
                    >
                      Excluir
                    </Button>
                  </>
                )}
                {(quote.status === 'accepted' || quote.status === 'rejected') && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/quotes/${quote.id}/edit`)}>
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => void handleDelete(quote.id)}
                      aria-label={`Excluir orçamento ${quote.id}`}
                    >
                      Excluir
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-text-secondary">
            Página {page} de {totalPages} — {total} no total
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Página anterior">
              ← Anterior
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Próxima página">
              Próximo →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
