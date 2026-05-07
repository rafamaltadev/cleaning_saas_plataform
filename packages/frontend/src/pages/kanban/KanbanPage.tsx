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
import { apiClient } from '../../api/client';
import type { KanbanCard, KanbanStatus } from '../../types';

const COLUMNS: { id: KanbanStatus; label: string }[] = [
  { id: 'new_lead', label: 'Novo Lead' },
  { id: 'contacted', label: 'Contatado' },
  { id: 'quote_sent', label: 'Orçamento Enviado' },
  { id: 'booking_confirmed', label: 'Agendamento Confirmado' },
  { id: 'completed', label: 'Concluído' },
  { id: 'cancelled', label: 'Cancelado' },
];

const STATUS_LABELS: Record<KanbanStatus, string> = {
  new_lead: 'Novo Lead',
  contacted: 'Contatado',
  quote_sent: 'Orçamento Enviado',
  booking_confirmed: 'Agendamento Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

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
  return 'neutral' as const;
}

function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

interface KanbanCardProps {
  card: KanbanCard;
}

function KanbanCardItem({ card }: KanbanCardProps) {
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
      className={`bg-surface-alt border border-border rounded p-3 cursor-grab active:cursor-grabbing transition-opacity ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
      data-testid={`kanban-card-${card.id}`}
    >
      <p className="text-sm font-medium text-text-primary truncate">{card.clientName}</p>
      <p className="text-xs text-text-secondary mt-0.5 truncate">{card.serviceName}</p>
      {card.scheduledDate && (
        <p className="text-xs text-text-muted mt-1">
          {new Date(card.scheduledDate).toLocaleDateString('pt-BR')}
        </p>
      )}
      <div className="mt-2">
        <Badge variant={statusBadgeVariant(card.status)}>{STATUS_LABELS[card.status]}</Badge>
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  column: { id: KanbanStatus; label: string };
  cards: KanbanCard[];
}

function KanbanColumn({ column, cards }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col min-w-[200px] w-full lg:w-48 xl:w-56 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
          {column.label}
        </h3>
        <span className="text-xs text-text-muted bg-surface-alt px-1.5 py-0.5 rounded">
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
        {cards.map((card) => (
          <KanbanCardItem key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

export default function KanbanPage() {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    Promise.all([getQuotes(), getBookings()])
      .then(([quotesResult, bookingsResult]) => {
        const quoteCards: KanbanCard[] = quotesResult.items.map((q) => ({
          id: `quote-${q.id}`,
          type: 'quote',
          clientName: q.client_id.slice(0, 8) + '…',
          serviceName: formatBRL(q.estimated_total_cents),
          scheduledDate: q.valid_until,
          status: apiQuoteStatusToKanban(q.status),
        }));
        const bookingCards: KanbanCard[] = bookingsResult.items.map((b) => ({
          id: `booking-${b.id}`,
          type: 'booking',
          clientName: b.client_id.slice(0, 8) + '…',
          serviceName: b.service_id.slice(0, 8) + '…',
          scheduledDate: b.scheduled_start,
          status: apiBookingStatusToKanban(b.status),
        }));
        setCards([...quoteCards, ...bookingCards]);
      })
      .catch(() => setError('Erro ao carregar dados do kanban.'))
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
        <p className="text-text-muted">Carregando quadro…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Quadro Kanban</h1>

      {error && <p className="text-error text-sm mb-4">{error}</p>}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          className="flex gap-4 overflow-x-auto pb-4"
          data-testid="kanban-board"
        >
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              cards={cards.filter((c) => c.status === column.id)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
