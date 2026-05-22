import type { TimeSlot } from '../../api/publicBooking';

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedStart: string | null;
  onSlotSelect: (slot: TimeSlot) => void;
  loading: boolean;
  primaryColor?: string;
}

export default function TimeSlotGrid({
  slots,
  selectedStart,
  onSlotSelect,
  loading,
  primaryColor,
}: TimeSlotGridProps) {
  const primary = primaryColor ?? '#4F46E5';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-text-muted text-sm">Carregando horários…</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-text-muted text-sm text-center py-4">
        Nenhum horário disponível para este dia.
      </p>
    );
  }

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4 gap-2"
      data-testid="time-slot-grid"
    >
      {slots.map((slot) => {
        const isSelected = selectedStart === slot.start;
        const isAvailable = slot.available;

        return (
          <div key={slot.start} className="relative group">
            <button
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && onSlotSelect(slot)}
              aria-label={`${slot.start} – ${slot.end}${!isAvailable ? ' (Horário indisponível)' : ''}`}
              aria-pressed={isSelected}
              style={
                isSelected
                  ? { backgroundColor: primary, color: '#fff', borderColor: primary }
                  : isAvailable
                  ? { borderColor: primary, color: primary }
                  : undefined
              }
              className={[
                'w-full min-h-[44px] rounded-lg border text-sm font-medium transition-all px-2 py-2',
                isAvailable && !isSelected
                  ? 'border hover:opacity-80 cursor-pointer'
                  : '',
                isSelected
                  ? 'font-bold'
                  : '',
                !isAvailable
                  ? 'border-border text-text-muted cursor-not-allowed opacity-50'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {slot.start}
            </button>
            {!isAvailable && (
              <div
                role="tooltip"
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-surface-alt text-text-secondary text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 border border-border"
              >
                Horário indisponível
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
