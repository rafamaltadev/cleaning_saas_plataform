import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { getQuoteById, updateQuoteStatus } from '../../api/quotes';
import { apiClient } from '../../api/client';
import type { ApiQuote } from '../../types';

const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  accepted: 'Aceito',
  expired: 'Expirado',
  rejected: 'Rejeitado',
};

export default function QuoteEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quote, setQuote] = useState<ApiQuote | null>(null);
  const [manualDiscount, setManualDiscount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getQuoteById(id)
      .then((q) => {
        setQuote(q);
        setManualDiscount(q.manual_discount_percent);
      })
      .catch(() => setError('Erro ao carregar orçamento.'))
      .finally(() => setLoadingData(false));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.put<{ data: ApiQuote }>(`/quotes/${id}`, {
        manual_discount_percent: manualDiscount,
      });
      void data;
      navigate('/quotes');
    } catch {
      setError('Erro ao salvar orçamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted text-sm">Carregando orçamento…</p>
      </div>
    );
  }

  if (error && !quote) {
    return <p className="text-error text-sm">{error}</p>;
  }

  if (!quote) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Editar Orçamento</h1>
        <p className="text-text-secondary text-sm mt-1 font-mono">{quote.id}</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4" aria-label="Editar orçamento">
        <Card title="Informações do Orçamento">
          <dl className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Status</dt>
              <dd className="text-sm text-text-primary">
                {QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Cliente</dt>
              <dd className="text-xs font-mono text-text-primary break-all">{quote.client_id}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Serviço</dt>
              <dd className="text-xs font-mono text-text-primary break-all">{quote.service_id}</dd>
            </div>
            {quote.pricing_rule_id && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <dt className="text-sm text-text-secondary">Regra de Preço</dt>
                <dd className="text-xs font-mono text-text-primary break-all">{quote.pricing_rule_id}</dd>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Total Estimado</dt>
              <dd className="text-sm font-semibold text-text-primary">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: quote.currency || 'BRL',
                }).format(quote.estimated_total_cents / 100)}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-sm text-text-secondary">Válido até</dt>
              <dd className="text-sm text-text-primary">
                {new Date(quote.valid_until).toLocaleDateString('pt-BR')}
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Editar Desconto">
          <Input
            label="Desconto manual (%)"
            type="number"
            value={String(manualDiscount)}
            onChange={(e) =>
              setManualDiscount(Math.min(100, Math.max(0, Number(e.target.value))))
            }
            placeholder="0"
          />
        </Card>

        {error && <p className="text-sm text-error" role="alert">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Salvar Alterações</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/quotes')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
