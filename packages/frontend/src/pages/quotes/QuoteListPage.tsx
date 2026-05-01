import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { listQuotes, sendQuote } from '../../api/quotes';
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

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listQuotes({ page, limit: PAGE_SIZE, status: statusFilter || undefined });
      setQuotes(result.items);
      setTotal(result.meta.total);
    } catch {
      setError('Failed to load quotes.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void fetchQuotes();
  }, [fetchQuotes]);

  async function handleSend(id: string) {
    setSending(id);
    try {
      await sendQuote(id);
      void fetchQuotes();
    } catch {
      setError('Failed to send quote.');
    } finally {
      setSending(null);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Quotes</h1>
        <Button onClick={() => navigate('/quotes/new')}>+ New Quote</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="expired">Expired</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && <p className="text-error text-sm mb-4" role="alert">{error}</p>}

      {/* Desktop table */}
      <div className="hidden sm:block bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full" aria-label="Quotes table">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Total</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Valid Until</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted text-sm">Loading…</td>
              </tr>
            ) : quotes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted text-sm">No quotes found.</td>
              </tr>
            ) : (
              quotes.map((quote) => (
                <tr key={quote.id} className="border-b border-border last:border-0 hover:bg-surface-alt transition-colors">
                  <td className="px-4 py-3 text-sm text-text-primary font-mono">{quote.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    <Badge variant={quoteBadgeVariant(quote.status)}>{quote.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: quote.currency }).format(quote.estimated_total_cents / 100)}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {new Date(quote.valid_until).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/quotes/${quote.id}`)}>
                      View
                    </Button>
                    {canSend && quote.status === 'draft' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={sending === quote.id}
                        onClick={() => handleSend(quote.id)}
                        aria-label={`Send quote ${quote.id}`}
                      >
                        Send
                      </Button>
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
          <p className="text-center text-text-muted text-sm py-8">Loading…</p>
        ) : quotes.length === 0 ? (
          <p className="text-center text-text-muted text-sm py-8">No quotes found.</p>
        ) : (
          quotes.map((quote) => (
            <div key={quote.id} className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-mono text-text-secondary">{quote.id.slice(0, 12)}…</p>
                  <p className="text-sm font-medium text-text-primary mt-0.5">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: quote.currency }).format(quote.estimated_total_cents / 100)}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Valid: {new Date(quote.valid_until).toLocaleDateString()}</p>
                </div>
                <Badge variant={quoteBadgeVariant(quote.status)}>{quote.status}</Badge>
              </div>
              <div className="mt-3 flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/quotes/${quote.id}`)}>
                  View
                </Button>
                {canSend && quote.status === 'draft' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={sending === quote.id}
                    onClick={() => handleSend(quote.id)}
                    aria-label={`Send quote ${quote.id}`}
                  >
                    Send
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-text-secondary">
            Page {page} of {totalPages} — {total} total
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
              ← Prev
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
