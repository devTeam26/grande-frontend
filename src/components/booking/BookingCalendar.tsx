import { useState, useCallback, useMemo, memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isToday, isBefore, addMonths, subMonths, isSameDay, isWithinInterval,
  parseISO, startOfDay,
} from 'date-fns';
import type { BlockedDate } from '../../types';
import { cn } from '../../utils/cn';
import { WEEKEND_DAYS } from '../../utils/constants';

interface BookingCalendarProps {
  chaletId: string;
  blockedDates: BlockedDate[];
  checkIn: Date | null;
  checkOut: Date | null;
  onSelect: (checkIn: Date, checkOut: Date | null) => void;
}

function BookingCalendarComponent({ chaletId, blockedDates, checkIn, checkOut, onSelect }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = useMemo(() => startOfDay(new Date()), []);
  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);
  const days = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);

  // Pad to start on Sunday
  const startPad = monthStart.getDay();
  const paddedDays: (Date | null)[] = useMemo(() => [...Array(startPad).fill(null), ...days], [startPad, days]);

  const chaletBlockedDates = useMemo(() => 
    blockedDates.filter(bd => bd.chaletId === chaletId),
    [blockedDates, chaletId]
  );

  const isBlocked = useCallback((date: Date): boolean => {
    return chaletBlockedDates.some((bd) =>
      isWithinInterval(date, {
        start: parseISO(bd.startDate),
        end: parseISO(bd.endDate),
      })
    );
  }, [chaletBlockedDates]);

  const isDisabled = useCallback((date: Date): boolean => {
    return isBefore(date, today) || isBlocked(date);
  }, [today, isBlocked]);

  const isInRange = useCallback((date: Date): boolean => {
    if (!checkIn || !checkOut) return false;
    return isWithinInterval(date, { start: checkIn, end: checkOut }) && !isSameDay(date, checkIn) && !isSameDay(date, checkOut);
  }, [checkIn, checkOut]);

  const handleDayClick = useCallback((date: Date) => {
    if (isDisabled(date)) return;
    if (!checkIn || (checkIn && checkOut)) {
      onSelect(date, null);
    } else {
      if (isBefore(date, checkIn)) {
        onSelect(date, null);
      } else {
        onSelect(checkIn, date);
      }
    }
  }, [checkIn, checkOut, isDisabled, onSelect]);

  const isWeekend = useCallback((date: Date) => WEEKEND_DAYS.includes(date.getDay()), []);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <h3 className="font-semibold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h3>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className={cn('text-center text-xs font-medium py-1', [4, 5].includes(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(d)) && 'text-gold-600')}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {paddedDays.map((date, idx) => {
          if (!date) return <div key={`pad-${idx}`} />;

          const disabled = isDisabled(date);
          const blocked = isBlocked(date);
          const isStart = checkIn && isSameDay(date, checkIn);
          const isEnd = checkOut && isSameDay(date, checkOut);
          const inRange = isInRange(date);
          const weekend = isWeekend(date);
          const todayDay = isToday(date);

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => handleDayClick(date)}
              disabled={disabled}
              className={cn(
                'relative w-full aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-colors',
                !disabled && !isStart && !isEnd && 'hover:bg-gold-50 cursor-pointer',
                disabled && 'opacity-30 cursor-not-allowed line-through',
                blocked && 'bg-red-50 text-red-400',
                inRange && 'bg-gold-100 rounded-none',
                isStart && 'bg-gold-500 text-white rounded-lg rounded-e-none',
                isEnd && 'bg-gold-500 text-white rounded-lg rounded-s-none',
                todayDay && !isStart && !isEnd && 'ring-1 ring-gold-300',
                weekend && !disabled && !isStart && !isEnd && !inRange && 'text-gold-600',
              )}
            >
              <span>{format(date, 'd')}</span>
              {weekend && !disabled && !isStart && !isEnd && (
                <span className="text-[8px] text-gold-400 leading-none">+30%</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-gold-500" /> Selected
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-red-100" /> Booked
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="text-gold-600 font-bold text-[10px]">+30%</span> Weekend
        </span>
      </div>
    </div>
  );
}

export const BookingCalendar = memo(BookingCalendarComponent);
