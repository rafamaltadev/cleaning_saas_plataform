import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { getBookingById } from '../../api/bookings';
import { getAvailableQuotes, getQuoteById } from '../../api/quotes';
import { apiClient } from '../../api/client';
import { formatCurrency } from '../../utils/pricing';
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
  const total = formatCurrency(q.estimated_total_cents, q.currency || 'BRL');
  const suffix = q.status === 'expired' ? ' — Expirado' : '';
  return `${name} — ${total}${suffix}`;
}

function durationText(start: string, end: string): string | null {
  if (!start || !end) return null;
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins <= 0) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
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
  const [useClientAddress, setUseClientAddress] = useState(true);
  const [serviceAddress, setServiceAddress] = useState('');
  const [observations, setObservations] = useState('');
  const [hasChangedStart, setHasChangedStart] = useState(false);

  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedQuote = quotes.find((q) => q.id === quoteId);
  const isExpiredQuote = selectedQuote?.status === 'expired';

  useEffect(() => {
    if (!id) return;
    Promise.all([getBookingById(id), getAvailableQuotes()])
      .then(async ([b, available]) => {
        setBooking(b);
        let allQuotes = available;
        if (b.quote_id && !available.find((q) => q.id === b.quote_id)) {
          try {
            const currentQuote = await getQuoteById(b.quote_id);
            allQuotes = [currentQuote, ...available];
          } catch {
            // keep just available quotes if current quote can't be fetched
          }
        }
        setQuotes(allQuotes);
        setQuoteId(b.quote_id);
        setScheduledStart(toDatetimeLocal(b.scheduled_start));
        setScheduledEnd(toDatetimeLocal(b.scheduled_end));
        setAssignedTeam(b.assigned_team ?? '');
        setUseClientAddress(b.use_client_address ?? true);
        setServiceAddress(b.service_address ?? '');
        setObservations(b.observations ?? '');
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
    if (isExpiredQuote) {
      setError('Selecione um orçamento válido antes de salvar.');
      return;
    }

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
        use_client_address: useClientAddress,
        service_address: !useClientAddress && serviceAddress.trim() ? serviceAddress.trim() : undefined,
        observations: observations.trim() || undefined,
      });
      navigate(`/bookings/${id}`);
    } catch (err) {
      const axiosErr = err as import('axios').AxiosError<{ error?: { message?: string | string[] }; message?: string | string[] }>;
      const raw = axiosErr.response?.data;
      const msg = raw?.error?.message ?? raw?.message;
      const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao salvar agendamento. Tente novamente.');
      setError(detail);
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

  const duration = durationText(scheduledStart, scheduledEnd);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Editar Agendamento</h1>
        <p className="text-text-secondary text-sm mt-1 font-mono">{booking.id}</p>
      </div>

      <form onSubmit={handleSubmit} aria-label="Editar agendamento">
        {error && <p className="text-sm text-error mb-4" role="alert">{error}</p>}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                </div>

                <Input
                  label="Equipe Responsável (opcional)"
                  value={assignedTeam}
                  onChange={(e) => setAssignedTeam(e.target.value)}
                  placeholder="Ex: Equipe Alpha"
                />
              </div>
            </Card>

            {/* Local do serviço */}
            <Card title="Local do Serviço">
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useClientAddress}
                    onChange={(e) => setUseClientAddress(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm text-text-primary">Usar endereço do cliente</span>
                </label>
                {!useClientAddress && (
                  <Input
                    label="Endereço do serviço"
                    value={serviceAddress}
                    onChange={(e) => setServiceAddress(e.target.value)}
                    placeholder="Rua, número, bairro, cidade"
                  />
                )}
              </div>
            </Card>

            {/* Observations */}
            <Card title="Observações">
              <div className="flex flex-col gap-1">
                <label htmlFor="observations" className="text-sm font-medium text-text-primary">
                  Observações para a equipe
                </label>
                <textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Informações adicionais sobre o agendamento…"
                  rows={3}
                  className="px-3 py-2 rounded bg-surface-alt border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 resize-none"
                />
              </div>
            </Card>

            <div className="flex gap-3 pb-6">
              <Button type="submit" loading={loading} disabled={isExpiredQuote}>
                Salvar Alterações
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate(`/bookings/${id}`)}>
                Cancelar
              </Button>
            </div>
          </div>

          {/* Right column: summary */}
          <div className="lg:w-72 shrink-0">
            <div className="sticky top-6">
              <Card title="Resumo">
                <div className="space-y-2">
                  {selectedQuote && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Cliente</span>
                        <span className="text-text-primary font-medium">
                          {selectedQuote.client_name ?? '—'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Serviço</span>
                        <span className="text-text-primary font-medium">
                          {selectedQuote.service_name ?? '—'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold border-t border-border pt-2 mt-1">
                        <span className="text-text-primary">Total do orçamento</span>
                        <span className="text-primary">
                          {formatCurrency(selectedQuote.estimated_total_cents, selectedQuote.currency || 'BRL')}
                        </span>
                      </div>
                    </div>
                  )}

                  {duration && (
                    <div className="border-t border-border pt-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Duração</span>
                        <span className="text-text-primary font-medium">{duration}</span>
                      </div>
                    </div>
                  )}

                  {scheduledStart && (
                    <div className="border-t border-border pt-2 text-xs text-text-secondary">
                      Início:{' '}
                      <span className="text-text-primary">
                        {new Date(scheduledStart).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  {!useClientAddress && serviceAddress.trim() && (
                    <div className="border-t border-border pt-2 text-xs text-text-secondary">
                      Local: <span className="text-text-primary">{serviceAddress}</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
