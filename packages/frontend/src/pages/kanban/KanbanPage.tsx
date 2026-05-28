import { useState, useEffect } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import Badge from '../../components/ui/Badge';
import { getQuotes } from '../../api/quotes';
import { getBookings, completeBooking } from '../../api/bookings';
import { listAdminPayments } from '../../api/payments';
import { apiClient } from '../../api/client';
import type { KanbanCard, KanbanStatus } from '../../types';
import type { ApiPayment } from '../../api/payments';

const COLUMNS: { id: KanbanStatus; label: string }[] = [
  { id: 'new_lead', label: 'Novo Lead' },
  { id: 'contacted', label: 'Contatado' },
  { id: 'quote_sent', label: 'Orçamento Enviado' },
  { id: 'pending_approval', label: 'Aguardando Aprovação' },
  { id: 'booking_confirmed', label: 'Agendamento Confirmado' },
  { id: 'completed', label: 'Concluído' },
  { id: 'cancelled', label: 'Cancelado' },
];

const STATUS_LABELS: Record<KanbanStatus, string> = {
  new_lead: 'Novo Lead',
  contacted: 'Contatado',
  quote_sent: 'Orçamento Enviado',
  pending_approval: 'Aguardando Aprovação',
  booking_confirmed: 'Agendamento Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const CARDS_PER_PAGE = 5;

function apiQuoteStatusToKanban(status: string): KanbanStatus {
  switch (status) {
    case 'draft': return 'new_lead';
    case 'sent': return 'quote_sent';
    case 'accepted': return 'booking_confirmed';
    case 'rejected':
    case 'expired': return 'cancelled';
    default: return 'new_lead';
  }
}

function apiBookingStatusToKanban(status: string): KanbanStatus {
  switch (status) {
    case 'pending_approval': return 'pending_approval';
    case 'confirmed':
    case 'rescheduled': return 'booking_confirmed';
    case 'completed': return 'completed';
    case 'cancelled': return 'cancelled';
    default: return 'booking_confirmed';
  }
}

function statusBadgeVariant(status: KanbanStatus) {
  if (status === 'completed') return 'success' as const;
  if (status === 'cancelled') return 'error' as const;
  if (status === 'booking_confirmed') return 'warning' as const;
  if (status === 'pending_approval') return 'warning' as const;
  return 'neutral' as const;
}

function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

interface KanbanCardItemProps { card: KanbanCard; paymentStatus?: string; paymentMode?: string }

function KanbanCardItem({ card, paymentStatus, paymentMode }: KanbanCardItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-surface-alt border rounded p-3 cursor-grab active:cursor-grabbing transition-opacity ${
        isDragging ? 'opacity-50' : 'opacity-100'
      } ${card.status === 'pending_approval' ? 'border-yellow-400/60 bg-yellow-400/5' : 'border-border'}`}
      data-testid={`kanban-card-${card.id}`}
    >
      {card.status === 'pending_approval' && (
        <p className="text-xs font-semibold text-yellow-600 mb-1">⏳ Aguardando aprovação</p>
      )}
      <p className="text-sm font-medium text-text-primary truncate">{card.clientName}</p>
      <p className="text-xs text-text-secondary mt-0.5 truncate">{card.serviceName}</p>
      {card.scheduledDate && (
        <p className="text-xs text-text-muted mt-1">
          {new Date(card.scheduledDate).toLocaleDateString('pt-BR')}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge variant={statusBadgeVariant(card.status)}>{STATUS_LABELS[card.status]}</Badge>
        {paymentMode === 'manual' && (
          <Badge variant="neutral">Manual</Badge>
        )}
        {paymentStatus === 'pending' && paymentMode === 'stripe' && (
          <Badge variant="warning">Aguardando pagamento</Badge>
        )}
        {paymentStatus === 'succeeded' && (
          <Badge variant="success">Pago</Badge>
        )}
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  column: { id: KanbanStatus; label: string };
  cards: KanbanCard[];
  paymentMap: Map<string, ApiPayment>;
}

function KanbanColumn({ column, cards, paymentMap }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [visibleCount, setVisibleCount] = useState(CARDS_PER_PAGE);

  const visibleCards = cards.slice(0, visibleCount);
  const hasMore = cards.length > visibleCount;

  return (
    <div className="flex flex-col min-w-[160px] shrink-0 lg:min-w-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide truncate pr-1">
          {column.label}
        </h3>
        <span className="text-xs text-text-muted bg-surface-alt px-1.5 py-0.5 rounded shrink-0">
          {cards.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 min-h-[100px] rounded-lg p-2 transition-colors ${
          isOver ? 'bg-primary/10 border border-primary/30' : 'bg-background border border-transparent'
        }`}
        data-testid={`kanban-column-${column.id}`}
      >
        {visibleCards.map((card) => {
          const bookingId = card.type === 'booking' ? card.id.replace('booking-', '') : undefined;
          const payment = bookingId ? paymentMap.get(bookingId) : undefined;
          return (
            <KanbanCardItem
              key={card.id}
              card={card}
              paymentStatus={payment?.status}
              paymentMode={payment?.payment_mode}
            />
          );
        })}
      </div>
      {hasMore && (
        <button
          onClick={() => setVisibleCount((n) => n + CARDS_PER_PAGE)}
          className="mt-2 text-xs text-primary hover:underline text-center py-1"
        >
          Ver Mais ({cards.length - visibleCount})
        </button>
      )}
    </div>
  );
}

export default function KanbanPage() {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [paymentMap, setPaymentMap] = useState<Map<string, ApiPayment>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    Promise.all([getQuotes(), getBookings(), listAdminPayments({ limit: 200 }).catch(() => ({ items: [], total: 0 }))])
      .then(([quotesResult, bookingsResult, paymentsResult]) => {
        const quoteCards: KanbanCard[] = quotesResult.items.map((q) => ({
          id: `quote-${q.id}`,
          type: 'quote',
          clientName: q.client_name ?? q.client_id.slice(0, 8) + '…',
          serviceName: q.service_name ?? formatBRL(q.estimated_total_cents),
          scheduledDate: q.valid_until,
          status: apiQuoteStatusToKanban(q.status),
        }));
        const bookingCards: KanbanCard[] = bookingsResult.items.map((b) => ({
          id: `booking-${b.id}`,
          type: 'booking',
          clientName: b.client_name ?? b.client_id.slice(0, 8) + '…',
          serviceName: b.service_name ?? b.service_id.slice(0, 8) + '…',
          scheduledDate: b.scheduled_start,
          status: apiBookingStatusToKanban(b.status),
        }));
        setCards([...quoteCards, ...bookingCards]);

        const pMap = new Map<string, ApiPayment>();
        for (const p of paymentsResult.items) {
          if (p.booking_id) pMap.set(p.booking_id, p);
        }
        setPaymentMap(pMap);
      })
      .catch(() => setError('Erro ao carregar dados do fluxo de trabalho.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const cardId = active.id as string;
    const newStatus = over.id as KanbanStatus;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.status === newStatus) return;

    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, status: newStatus } : c)),
    );

    try {
      const rawId = cardId.replace(/^(quote|booking)-/, '');
      if (card.type === 'quote') {
        let apiStatus: string | null = null;
        if (newStatus === 'cancelled') apiStatus = 'rejected';
        else if (newStatus === 'booking_confirmed') apiStatus = 'accepted';
        if (apiStatus) {
          await apiClient.put(`/quotes/${rawId}`, { status: apiStatus });
        }
      } else if (card.type === 'booking') {
        if (newStatus === 'completed') {
          await completeBooking(rawId);
        } else if (newStatus === 'cancelled') {
          await apiClient.put(`/bookings/${rawId}`, { status: 'cancelled' });
        }
      }
    } catch {
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, status: card.status } : c)),
      );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted">Carregando…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Fluxo de Trabalho</h1>

      {error && <p className="text-error text-sm mb-4">{error}</p>}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          className="flex gap-3 overflow-x-auto lg:grid lg:overflow-x-visible pb-4"
          style={{ gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(0, 1fr))` }}
          data-testid="kanban-board"
        >
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              cards={cards.filter((c) => c.status === column.id)}
              paymentMap={paymentMap}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
