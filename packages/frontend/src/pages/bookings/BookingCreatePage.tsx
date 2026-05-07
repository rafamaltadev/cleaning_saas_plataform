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

  useEffect(() => {
    listQuotes({ page: 1, limit: 100, status: 'accepted' })
      .then((res) => setQuotes(res.items))
      .catch(() => setError('Erro ao carregar orçamentos aceitos.'));
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
                Orçamento aceito <span className="text-error">*</span>
              </label>
              <select
                id="quote-select"
                value={quoteId}
                onChange={(e) => setQuoteId(e.target.value)}
                className="w-full h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Selecionar orçamento"
                required
              >
                <option value="">Selecione um orçamento aceito…</option>
                {quotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.id.slice(0, 12)}… — {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: q.currency || 'BRL' }).format(q.estimated_total_cents / 100)}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Início do agendamento"
              type="datetime-local"
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
              required
            />

            <Input
              label="Fim do agendamento"
              type="datetime-local"
              value={scheduledEnd}
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
          <Button type="submit" loading={loading}>Criar Agendamento</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/bookings')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
