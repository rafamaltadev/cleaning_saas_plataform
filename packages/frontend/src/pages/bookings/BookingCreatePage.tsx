import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { createBooking } from '../../api/bookings';
import { listQuotes } from '../../api/quotes';
import type { ApiQuote, ApiBooking } from '../../types';

function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
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

export default function BookingCreatePage() {
  const navigate = useNavigate();
  const idempotencyKey = useRef(generateIdempotencyKey());

  const [quotes, setQuotes] = useState<ApiQuote[]>([]);
  const [quoteId, setQuoteId] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [assignedTeam, setAssignedTeam] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedQuote = quotes.find((q) => q.id === quoteId);
  const isExpiredQuote = selectedQuote?.status === 'expired';

  useEffect(() => {
    listQuotes({ page: 1, limit: 100 })
      .then((res) => setQuotes(res.items))
      .catch(() => setError('Erro ao carregar orçamentos.'));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!quoteId || !scheduledStart || !scheduledEnd) {
      setError('Orçamento, início e fim do agendamento são obrigatórios.');
      return;
    }
    if (!selectedQuote) {
      setError('Orçamento selecionado não encontrado.');
      return;
    }
    if (isExpiredQuote) return;

    setLoading(true);
    setError('');
    try {
      const created: ApiBooking = await createBooking({
        quote_id: quoteId,
        client_id: selectedQuote.client_id,
        service_id: selectedQuote.service_id,
        scheduled_start: new Date(scheduledStart).toISOString(),
        scheduled_end: new Date(scheduledEnd).toISOString(),
        assigned_team: assignedTeam.trim() || undefined,
        idempotency_key: idempotencyKey.current,
      });
      navigate(`/bookings/${created.id}`);
    } catch {
      setError('Erro ao criar agendamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Novo Agendamento</h1>
        <p className="text-text-secondary text-sm mt-1">Agendar a partir de um orçamento aceito</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4" aria-label="Criar agendamento">
        <Card title="Detalhes do Agendamento">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="quote-select">
                Orçamento <span className="text-error">*</span>
              </label>
              <select
                id="quote-select"
                value={quoteId}
                onChange={(e) => setQuoteId(e.target.value)}
                className="w-full h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Selecionar orçamento"
                required
              >
                <option value="">Selecione um orçamento…</option>
                {quotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {quoteLabel(q)}
                  </option>
                ))}
              </select>
            </div>

            {isExpiredQuote && (
              <p className="text-sm text-warning bg-warning/10 border border-warning/30 rounded px-3 py-2" role="alert">
                Este orçamento está expirado. Edite a validade do orçamento antes de criar o agendamento.
              </p>
            )}

            <Input
              label="Início do agendamento"
              type="datetime-local"
              value={scheduledStart}
              min={nowDatetimeLocal()}
              onChange={(e) => setScheduledStart(e.target.value)}
              required
            />

            <Input
              label="Fim do agendamento"
              type="datetime-local"
              value={scheduledEnd}
              min={scheduledStart || nowDatetimeLocal()}
              onChange={(e) => setScheduledEnd(e.target.value)}
              required
            />

            <Input
              label="Equipe responsável (opcional)"
              value={assignedTeam}
              onChange={(e) => setAssignedTeam(e.target.value)}
              placeholder="Ex: Equipe Alpha"
            />
          </div>
        </Card>

        {error && <p className="text-sm text-error" role="alert">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" loading={loading} disabled={isExpiredQuote}>
            Criar Agendamento
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/bookings')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
