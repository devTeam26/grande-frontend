import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isBefore, isToday, isWithinInterval, parseISO,
  startOfDay, addMonths, subMonths, getDay,
} from 'date-fns';
import { useTranslation } from 'react-i18next';
import type { BlockedDate } from '../../types';
import { WEEKEND_DAYS } from '../../utils/constants';
import { cn } from '../../utils/cn';

interface Props {
  chaletId: string;
  blockedDates: BlockedDate[];
}

const DAY_HEADERS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAY_HEADERS_AR = ['أح', 'إث', 'ث', 'أر', 'خ', 'ج', 'س'];

export function AvailabilityCalendar({ chaletId, blockedDates }: Props) {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';

  const [month, setMonth] = useState(new Date());
  const today = useMemo(() => startOfDay(new Date()), []);

  const monthStart = useMemo(() => startOfMonth(month), [month]);
  const monthEnd   = useMemo(() => endOfMonth(month),   [month]);
  const days       = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);
  const startPad   = monthStart.getDay();

  const filtered = useMemo(
    () => blockedDates.filter((bd) => bd.chaletId === chaletId),
    [blockedDates, chaletId],
  );

  const isBlocked = useCallback(
    (date: Date) =>
      filtered.some((bd) =>
        isWithinInterval(date, { start: parseISO(bd.startDate), end: parseISO(bd.endDate) }),
      ),
    [filtered],
  );

  const isPast    = useCallback((d: Date) => isBefore(d, today), [today]);
  const isWeekend = useCallback((d: Date) => WEEKEND_DAYS.includes(getDay(d)), []);

  const stats = useMemo(() => {
    const future = days.filter((d) => !isPast(d));
    const booked = future.filter((d) => isBlocked(d));
    return { total: future.length, booked: booked.length, available: future.length - booked.length };
  }, [days, isPast, isBlocked]);

  const dayHeaders = lang === 'ar' ? DAY_HEADERS_AR : DAY_HEADERS_EN;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy-800 to-navy-700 px-5 pt-4 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-white text-sm">
              {lang === 'ar' ? 'التقويم والإتاحة' : 'Availability Calendar'}
            </h2>
            <p className="text-navy-200 text-xs mt-0.5">
              {lang === 'ar'
                ? `${stats.available} يوم متاح هذا الشهر`
                : `${stats.available} days available this month`}
            </p>
          </div>
          {/* Availability pill */}
          <div className="flex flex-col gap-1 items-end">
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
              {stats.available} {lang === 'ar' ? 'متاح' : 'free'}
            </span>
            <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-medium">
              {stats.booked} {lang === 'ar' ? 'محجوز' : 'booked'}
            </span>
          </div>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2">
          <button
            type="button"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-white font-semibold text-sm">
            {format(month, 'MMMM yyyy')}
          </span>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1.5">
          {dayHeaders.map((d, i) => (
            <div
              key={i}
              className={cn(
                'text-center text-[10px] font-bold py-1',
                WEEKEND_DAYS.includes(i) ? 'text-gold-500' : 'text-gray-400',
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {[...Array(startPad).fill(null), ...days].map((date, idx) => {
            if (!date) return <div key={`p-${idx}`} />;

            const past    = isPast(date);
            const blocked = isBlocked(date);
            const todayDay = isToday(date);
            const weekend  = isWeekend(date);

            return (
              <div
                key={date.toISOString()}
                title={
                  blocked
                    ? (lang === 'ar' ? 'محجوز' : 'Booked')
                    : past
                    ? (lang === 'ar' ? 'منتهي' : 'Past')
                    : (lang === 'ar' ? 'متاح' : 'Available')
                }
                className={cn(
                  'aspect-square flex items-center justify-center rounded-md text-[11px] font-semibold select-none transition-colors',
                  // past
                  past && 'text-gray-300 bg-transparent',
                  // booked
                  !past && blocked && 'bg-red-100 text-red-400 line-through decoration-red-400',
                  // available weekend
                  !past && !blocked && weekend && !todayDay && 'bg-gold-50 text-gold-600',
                  // available weekday
                  !past && !blocked && !weekend && !todayDay && 'bg-emerald-50 text-emerald-700',
                  // today
                  todayDay && !blocked && 'ring-2 ring-gold-400 bg-gold-100 text-gold-800 font-bold',
                )}
              >
                {format(date, 'd')}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="w-3 h-3 rounded bg-emerald-100 flex-shrink-0" />
              {lang === 'ar' ? 'متاح' : 'Available'}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="w-3 h-3 rounded bg-red-100 flex-shrink-0" />
              {lang === 'ar' ? 'محجوز' : 'Booked'}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="w-3 h-3 rounded bg-gold-50 ring-1 ring-gold-200 flex-shrink-0" />
              {lang === 'ar' ? 'عطلة (+30%)' : 'Weekend (+30%)'}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="w-3 h-3 rounded ring-2 ring-gold-400 bg-gold-100 flex-shrink-0" />
              {lang === 'ar' ? 'اليوم' : 'Today'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
