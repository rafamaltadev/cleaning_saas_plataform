import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import { renderWithProviders, authenticatedState } from './utils';
import KanbanPage from '../pages/kanban/KanbanPage';

type DragEndHandler = (event: { active: { id: string; data: { current: { card: { type: string; status: string } } } }; over: { id: string } | null }) => void;

let capturedOnDragEnd: DragEndHandler | null = null;

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  return {
    ...actual,
    DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: DragEndHandler }) => {
      capturedOnDragEnd = onDragEnd;
      return <>{children}</>;
    },
    useDraggable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => undefined,
      transform: null,
      isDragging: false,
    }),
    useDroppable: () => ({
      setNodeRef: () => undefined,
      isOver: false,
    }),
  };
});

vi.mock('../api/quotes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/quotes')>();
  return { ...actual, updateQuoteStatus: vi.fn().mockResolvedValue({ id: 'q-1', status: 'contacted' }) };
});

vi.mock('../api/bookings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/bookings')>();
  return { ...actual, updateBookingStatus: vi.fn().mockResolvedValue({ id: 'b-1', status: 'completed' }) };
});

describe('KanbanPage', () => {
  it('renders all columns with correct cards mapped by status', async () => {
    capturedOnDragEnd = null;
    renderWithProviders(<KanbanPage />, { preloadedState: authenticatedState });

    await waitFor(() => {
      expect(screen.getByTestId('kanban-column-new_lead')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-column-contacted')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-column-booking_confirmed')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-column-completed')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-column-cancelled')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('kanban-card-quote-q-1')).toBeInTheDocument();
      expect(screen.getByTestId('kanban-card-booking-b-1')).toBeInTheDocument();
    });
  });

  it('dragging a quote card between columns triggers the correct API update', async () => {
    capturedOnDragEnd = null;
    renderWithProviders(<KanbanPage />, { preloadedState: authenticatedState });

    await waitFor(() => screen.getByTestId('kanban-card-quote-q-1'));

    const { updateQuoteStatus } = await import('../api/quotes');

    await act(async () => {
      capturedOnDragEnd!({
        active: {
          id: 'quote-q-1',
          data: { current: { card: { type: 'quote', status: 'new_lead' } } },
        },
        over: { id: 'contacted' },
      });
    });

    await waitFor(() => {
      expect(updateQuoteStatus).toHaveBeenCalledWith('q-1', 'contacted');
    });
  });
});
