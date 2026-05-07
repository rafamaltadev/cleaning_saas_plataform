import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { getBookingById } from '../../api/bookings';
import { listQuotes } from '../../api/quotes';
import { apiClient } from '../../api/client';
import type { ApiBooking, ApiQuote } from '../../types';

function toDatetimeLocal(isoString: string): string {
  const d = new Date(isoString);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

function nowDatetimeLocal(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

function quoteLabel(q: ApiQuote): string {
  const name = q.client_name ?? q.client_id.slice(0, 12) + '…';
  const total = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: q.currency || 'BRL' }).format(
    q.estimated_total_cents / 100,
  );
  const suffix = q.status === 'expired' ? ' — Expirado' : q.status === 'accepted' ? ' — Aceito' : '';
  return `${name} — ${total}${suffix}`;
}

export default function BookingEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [quotes, setQuotes] = useState<ApiQuote[]>([]);
  const [quoteId, setQuoteId] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [assignedTeam, setAssignedTeam] = useState('');
  const [hasChangedStart, setHasChangedStart] = useState(false);

  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedQuote = quotes.find((q) => q.id === quoteId);
  const isExpiredQuote = selectedQuote?.status === 'expired';

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getBookingById(id),
      listQuotes({ page: 1, limit: 100 }),
    ])
      .then(([b, quotesRes]) => {
        setBooking(b);
        setQuotes(quotesRes.items);
        setQuoteId(b.quote_id);
        setScheduledStart(toDatetimeLocal(b.scheduled_start));
        setScheduledEnd(toDatetimeLocal(b.scheduled_end));
        setAssignedTeam(b.assigned_team ?? '');
      })
      .catch(() => setError('Erro ao carregar agendamento.'))
      .finally(() => setLoadingData(false));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id || !scheduledStart || !scheduledEnd) {
      setError('Início e fim do agendamento são obrigatórios.');
      return;
    }
    if (isExpiredQuote) return;

    if (hasChangedStart) {
      const nowLocal = nowDatetimeLocal();
      if (scheduledStart < nowLocal) {
        setError('O início do agendamento deve ser a partir de agora.');
        return;
      }
    }
    if (scheduledEnd < scheduledStart) {
      setError('O término deve ser igual ou posterior ao início.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiClient.put(`/bookings/${id}`, {
        quote_id: (quoteId && quoteId !== booking?.quote_id) ? quoteId : undefined,
        scheduled_start: new Date(scheduledStart).toISOString(),
        scheduled_end: new Date(scheduledEnd).toISOString(),
        assigned_team: assignedTeam.trim() || undefined,
      });
      navigate(`/bookings/${id}`);
    } catch {
      setError('Erro ao salvar agendamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted text-sm">Carregando agendamento…</p>
      </div>
    );
  }

  if (error && !booking) {
    return <p className="text-error text-sm">{error}</p>;
  }

  if (!booking) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Editar Agendamento</h1>
        <p className="text-text-secondary text-sm mt-1 font-mono">{booking.id}</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4" aria-label="Editar agendamento">
        <Card title="Detalhes do Agendamento">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="quote-select">
                Orçamento
              </label>
              <select
                id="quote-select"
                value={quoteId}
                onChange={(e) => setQuoteId(e.target.value)}
                className="w-full h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Selecionar orçamento"
              >
                <option value="">Nenhum orçamento…</option>
                {quotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {quoteLabel(q)}
                  </option>
                ))}
              </select>
            </div>

            {isExpiredQuote && (
              <p className="text-sm text-warning bg-warning/10 border border-warning/30 rounded px-3 py-2" role="alert">
                Este orçamento está expirado. Edite a validade do orçamento antes de salvar o agendamento.
              </p>
            )}

            <Input
              label="Início do agendamento *"
              type="datetime-local"
              value={scheduledStart}
              min={nowDatetimeLocal()}
              onChange={(e) => { setScheduledStart(e.target.value); setHasChangedStart(true); }}
              required
            />

            <Input
              label="Término do agendamento *"
              type="datetime-local"
              value={scheduledEnd}
              min={scheduledStart || nowDatetimeLocal()}
              onChange={(e) => setScheduledEnd(e.target.value)}
              required
            />

            <Input
              label="Equipe Responsável (opcional)"
              value={assignedTeam}
              onChange={(e) => setAssignedTeam(e.target.value)}
              placeholder="Ex: Equipe Alpha"
            />
          </div>
        </Card>

        {error && <p className="text-sm text-error" role="alert">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" loading={loading} disabled={isExpiredQuote}>
            Salvar Alterações
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate(`/bookings/${id}`)}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
