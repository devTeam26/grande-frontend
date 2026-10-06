import { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isBefore, isToday, isWithinInterval, parseISO,
  startOfDay, addMonths, subMonths,
} from 'date-fns';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

// ── API shape ─────────────────────────────────────────────────────────────────
interface ApiPriceCalendarEntry {
  date: string;
  price: number;
  isAvailable: boolean;
  isWeekend: boolean;
}

interface ApiAvailabilityData {
  chaletId: string;
  blockedDates: { from: string; to: string }[];
  priceCalendar: ApiPriceCalendarEntry[];
}

// ── Day status ────────────────────────────────────────────────────────────────
type DayStatus = 'available' | 'pending' | 'booked';

interface DayInfo {
  status: DayStatus;
  price?: number;
  isWeekend?: boolean;
}

const DAY_HEADERS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAY_HEADERS_AR = ['أح', 'إث', 'ث', 'أر', 'خ', 'ج', 'س'];

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

function dateKey(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

export function AvailabilityCalendar({ chaletId }: { chaletId: string }) {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';

  const [month, setMonth]   = useState(new Date());
  const [data, setData]     = useState<ApiAvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => startOfDay(new Date()), []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chaletId) return;
    setLoading(true);
    const from = new Date().toISOString();
    const to   = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    fetch(`${API_BASE}/api/Chalets/${chaletId}/availability?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((json: { success?: boolean; data?: ApiAvailabilityData }) => {
        if (json.success && json.data) setData(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [chaletId]);

  // ── Build lookup maps ──────────────────────────────────────────────────────
  // priceMap: "yyyy-MM-dd" → entry from priceCalendar
  const priceMap = useMemo(() => {
    const map = new Map<string, ApiPriceCalendarEntry>();
    data?.priceCalendar.forEach((e) => {
      try { map.set(dateKey(parseISO(e.date)), e); } catch { /* skip */ }
    });
    return map;
  }, [data]);

  // blockedRanges parsed once
  const blockedRanges = useMemo(
    () =>
      (data?.blockedDates ?? []).map((b) => ({
        start: parseISO(b.from),
        end: parseISO(b.to),
      })),
    [data],
  );

  const getDayInfo = useCallback(
    (date: Date): DayInfo => {
      const entry = priceMap.get(dateKey(date));

      // In a confirmed-blocked range → Booked
      const isBlockedRange = blockedRanges.some((r) =>
        isWithinInterval(date, { start: r.start, end: r.end }),
      );
      if (isBlockedRange) {
        return { status: 'booked', price: entry?.price, isWeekend: entry?.isWeekend };
      }

      // priceCalendar says unavailable but not in a blocked range → Pending
      if (entry && !entry.isAvailable) {
        return { status: 'pending', price: entry.price, isWeekend: entry.isWeekend };
      }

      // Available
      return {
        status: 'available',
        price: entry?.price,
        isWeekend: entry?.isWeekend,
      };
    },
    [priceMap, blockedRanges],
  );

  // ── Calendar grid ──────────────────────────────────────────────────────────
  const monthStart = useMemo(() => startOfMonth(month), [month]);
  const monthEnd   = useMemo(() => endOfMonth(month),   [month]);
  const days       = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);
  const startPad   = monthStart.getDay();

  const isPast = useCallback((d: Date) => isBefore(d, today), [today]);

  const stats = useMemo(() => {
    const future = days.filter((d) => !isPast(d));
    const booked  = future.filter((d) => getDayInfo(d).status === 'booked').length;
    const pending = future.filter((d) => getDayInfo(d).status === 'pending').length;
    const available = future.length - booked - pending;
    return { available, pending, booked };
  }, [days, isPast, getDayInfo]);

  const dayHeaders = lang === 'ar' ? DAY_HEADERS_AR : DAY_HEADERS_EN;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-navy-800 to-navy-700 px-5 pt-4 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-white text-sm">
              {lang === 'ar' ? 'التقويم والإتاحة' : 'Availability Calendar'}
            </h2>
            <p className="text-navy-200 text-xs mt-0.5">
              {loading
                ? (lang === 'ar' ? 'جاري التحميل…' : 'Loading…')
                : lang === 'ar'
                ? `${stats.available} يوم متاح هذا الشهر`
                : `${stats.available} days available this month`}
            </p>
          </div>

          {!loading && (
            <div className="flex flex-col gap-1 items-end">
              <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                {stats.available} {lang === 'ar' ? 'متاح' : 'available'}
              </span>
              {stats.pending > 0 && (
                <span className="text-[10px] bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-bold">
                  {stats.pending} {lang === 'ar' ? 'معلق' : 'pending'}
                </span>
              )}
              {stats.booked > 0 && (
                <span className="text-[10px] bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-bold">
                  {stats.booked} {lang === 'ar' ? 'محجوز' : 'booked'}
                </span>
              )}
            </div>
          )}
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
          <span className="text-white font-semibold text-sm">{format(month, 'MMMM yyyy')}</span>
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
            <div key={i} className="text-center text-[10px] font-bold py-1 text-gray-400">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {loading
            ? Array.from({ length: 35 }, (_, i) => (
                <div key={i} className="aspect-square rounded-md bg-gray-100 animate-pulse" />
              ))
            : [...Array(startPad).fill(null), ...days].map((date, idx) => {
                if (!date) return <div key={`p-${idx}`} />;

                const past    = isPast(date);
                const todayDay = isToday(date);

                if (past) {
                  return (
                    <div
                      key={date.toISOString()}
                      className="aspect-square flex items-center justify-center rounded-md text-[11px] font-semibold text-gray-300 select-none"
                    >
                      {format(date, 'd')}
                    </div>
                  );
                }

                const { status, price, isWeekend } = getDayInfo(date);

                const tooltip =
                  status === 'booked'
                    ? (lang === 'ar' ? `محجوز${price ? ` – ${price} KWD` : ''}` : `Booked${price ? ` – ${price} KWD` : ''}`)
                    : status === 'pending'
                    ? (lang === 'ar' ? 'معلق – بانتظار التأكيد' : 'Pending – awaiting confirmation')
                    : price
                    ? (lang === 'ar' ? `متاح – ${price} KWD` : `Available – ${price} KWD`)
                    : (lang === 'ar' ? 'متاح' : 'Available');

                return (
                  <div
                    key={date.toISOString()}
                    title={tooltip}
                    className={cn(
                      'aspect-square flex flex-col items-center justify-center rounded-md select-none transition-all cursor-default',
                      // Booked
                      status === 'booked' && 'bg-red-200 text-red-800',
                      // Pending
                      status === 'pending' && 'bg-orange-200 text-orange-800',
                      // Available weekend
                      status === 'available' && isWeekend && !todayDay && 'bg-amber-200 text-amber-800',
                      // Available weekday
                      status === 'available' && !isWeekend && !todayDay && 'bg-emerald-200 text-emerald-800',
                      // Today
                      todayDay && status === 'available' && 'ring-2 ring-offset-1 ring-cyan-300 bg-teal-200 text-teal-800 font-bold',
                    )}
                  >
                    <span className={cn('text-[11px] font-bold leading-none', status === 'booked' && 'line-through decoration-red-500')}>
                      {format(date, 'd')}
                    </span>
                    {price !== undefined && price > 0 && status !== 'booked' && (
                      <span className="text-[8px] leading-none mt-0.5 opacity-80 font-semibold">{price}</span>
                    )}
                  </div>
                );
              })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <span className="flex items-center gap-2 text-[11px] text-gray-600 font-medium">
              <span className="w-4 h-4 rounded-md bg-emerald-200 flex-shrink-0" />
              {lang === 'ar' ? 'متاح' : 'Available'}
            </span>
            <span className="flex items-center gap-2 text-[11px] text-gray-600 font-medium">
              <span className="w-4 h-4 rounded-md bg-orange-200 flex-shrink-0" />
              {lang === 'ar' ? 'معلق' : 'Pending'}
            </span>
            <span className="flex items-center gap-2 text-[11px] text-gray-600 font-medium">
              <span className="w-4 h-4 rounded-md bg-red-200 flex-shrink-0" />
              {lang === 'ar' ? 'محجوز' : 'Booked'}
            </span>
            <span className="flex items-center gap-2 text-[11px] text-gray-600 font-medium">
              <span className="w-4 h-4 rounded-md bg-amber-200 flex-shrink-0" />
              {lang === 'ar' ? 'عطلة نهاية أسبوع' : 'Weekend'}
            </span>
            <span className="flex items-center gap-2 text-[11px] text-gray-600 font-medium">
              <span className="w-4 h-4 rounded-md bg-teal-200 ring-2 ring-cyan-300 flex-shrink-0" />
              {lang === 'ar' ? 'اليوم' : 'Today'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
