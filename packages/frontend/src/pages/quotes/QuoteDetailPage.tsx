import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { getQuoteById, sendQuote } from '../../api/quotes';
import { hasPermission } from '../../utils/permissions';
import { formatCurrency } from '../../utils/pricing';
import type { RootState } from '../../store';
import type { ApiQuote, ApiQuoteStatus } from '../../types';

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

  useEffect(() => {
    if (!id) return;
    getQuoteById(id)
      .then(setQuote)
      .catch(() => setError('Failed to load quote.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSend() {
    if (!id) return;
    setSending(true);
    try {
      const updated = await sendQuote(id);
      setQuote(updated);
    } catch {
      setError('Failed to send quote.');
    } finally {
      setSending(false);
    }
  }

  if (loading) return <p className="text-text-muted text-sm">Loading…</p>;
  if (error && !quote) return <p className="text-error text-sm">{error}</p>;
  if (!quote) return null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Quote Detail</h1>
          <p className="text-text-secondary text-sm mt-1 font-mono">{quote.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={quoteBadgeVariant(quote.status)}>{quote.status}</Badge>
          {canSend && quote.status === 'draft' && (
            <Button variant="primary" loading={sending} onClick={handleSend} aria-label="Send quote">
              Send Quote
            </Button>
          )}
          <Button variant="ghost" onClick={() => navigate('/quotes')}>Back</Button>
        </div>
      </div>

      {error && <p className="text-error text-sm mb-4" role="alert">{error}</p>}

      <div className="space-y-4 max-w-2xl">
        <Card title="Quote Information">
          <dl className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Status</dt>
              <dd><Badge variant={quoteBadgeVariant(quote.status)}>{quote.status}</Badge></dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Estimated Total</dt>
              <dd className="text-sm font-semibold text-text-primary">
                {formatCurrency(quote.estimated_total_cents, quote.currency)}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Currency</dt>
              <dd className="text-sm text-text-primary">{quote.currency}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Valid Until</dt>
              <dd className="text-sm text-text-primary">{new Date(quote.valid_until).toLocaleDateString()}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Manual Discount</dt>
              <dd className="text-sm text-text-primary">{quote.manual_discount_percent}%</dd>
            </div>
          </dl>
        </Card>

        <Card title="Reference IDs">
          <dl className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Quote ID</dt>
              <dd className="text-xs font-mono text-text-primary break-all">{quote.id}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Client ID</dt>
              <dd className="text-xs font-mono text-text-primary break-all">{quote.client_id}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Service ID</dt>
              <dd className="text-xs font-mono text-text-primary break-all">{quote.service_id}</dd>
            </div>
            {quote.pricing_rule_id && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <dt className="text-sm text-text-secondary">Pricing Rule ID</dt>
                <dd className="text-xs font-mono text-text-primary break-all">{quote.pricing_rule_id}</dd>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Created By</dt>
              <dd className="text-xs font-mono text-text-primary break-all">{quote.created_by}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Created At</dt>
              <dd className="text-sm text-text-primary">{new Date(quote.created_at).toLocaleString()}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
