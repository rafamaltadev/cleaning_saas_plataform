import { useState, useCallback } from 'react';

interface AvailabilityCalendarProps {
  availableDates: Set<string>;
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  onMonthChange?: (year: number, month: number) => void;
  primaryColor?: string;
}

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function todayStr(): string {
  const now = new Date();
  return toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function AvailabilityCalendar({
  availableDates,
  selectedDate,
  onDateSelect,
  onMonthChange,
  primaryColor,
}: AvailabilityCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const primary = primaryColor ?? '#4F46E5';

  const prevMonth = useCallback(() => {
    let newYear = viewYear;
    let newMonth: number;
    if (viewMonth === 0) {
      newMonth = 11;
      newYear = viewYear - 1;
      setViewMonth(11);
      setViewYear(newYear);
    } else {
      newMonth = viewMonth - 1;
      setViewMonth(newMonth);
    }
    onMonthChange?.(newYear, newMonth);
  }, [viewMonth, viewYear, onMonthChange]);

  const nextMonth = useCallback(() => {
    let newYear = viewYear;
    let newMonth: number;
    if (viewMonth === 11) {
      newMonth = 0;
      newYear = viewYear + 1;
      setViewMonth(0);
      setViewYear(newYear);
    } else {
      newMonth = viewMonth + 1;
      setViewMonth(newMonth);
    }
    onMonthChange?.(newYear, newMonth);
  }, [viewMonth, viewYear, onMonthChange]);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayIso = todayStr();

  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  return (
    <div className="w-full" data-testid="availability-calendar">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          disabled={!canGoPrev}
          aria-label="Mês anterior"
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors text-xl"
        >
          ‹
        </button>
        <span className="text-base font-bold text-gray-900">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="Próximo mês"
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 transition-colors text-xl"
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} />;
          }
          const dateStr = toDateStr(viewYear, viewMonth, day);
          const isToday = dateStr === todayIso;
          const isSelected = dateStr === selectedDate;
          const isPast = dateStr < todayIso;
          const isAvailable = availableDates.has(dateStr);
          const isDisabled = isPast || !isAvailable;
          const isHovered = hoveredDay === dateStr;

          const cellClass = (() => {
            const base = 'w-9 h-9 rounded-full mx-auto flex items-center justify-center text-sm font-medium transition-all';
            if (isDisabled) return `${base} text-gray-300 cursor-not-allowed`;
            if (isSelected) return `${base} font-bold`;
            return `${base} text-gray-900 cursor-pointer`;
          })();

          const inlineStyle = (() => {
            if (isSelected) return { backgroundColor: primary, color: '#fff' };
            if (isToday && !isDisabled) return { backgroundColor: primary, color: '#fff' };
            if (isHovered && !isDisabled) return { backgroundColor: primary + '20' };
            return undefined;
          })();

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && onDateSelect(dateStr)}
              onMouseEnter={() => !isDisabled && setHoveredDay(dateStr)}
              onMouseLeave={() => setHoveredDay(null)}
              aria-label={`${day} de ${MONTHS[viewMonth]}`}
              aria-pressed={isSelected}
              style={inlineStyle}
              className={cellClass}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
