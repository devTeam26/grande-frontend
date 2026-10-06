import { useTranslation } from 'react-i18next';
import { Users, RotateCcw, SlidersHorizontal, Calendar } from 'lucide-react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { setFilter, resetFilters } from '../../store/slices/chaletsSlice';
import type { ChaletFilters, ChaletType } from '../../types';

const TYPE_TABS: { value: ChaletType | 'all'; label: string; labelAr: string; color: string; active: string }[] = [
  { value: 'all',      label: 'All',      labelAr: 'الكل',      color: 'border-gray-200 text-gray-600 hover:border-gray-400',          active: 'bg-gray-900 border-gray-900 text-white' },
  { value: 'normal',   label: 'Standard', labelAr: 'ستاندرد',   color: 'border-blue-200 text-blue-700 hover:border-blue-400',           active: 'bg-blue-600 border-blue-600 text-white' },
  { value: 'superior', label: 'Superior', labelAr: 'سوبيريور',  color: 'border-gold-300 text-gold-700 hover:border-gold-500',           active: 'bg-gold-500 border-gold-500 text-white' },
  { value: 'vip',      label: 'VIP',      labelAr: 'في آي بي',  color: 'border-purple-200 text-purple-700 hover:border-purple-400',     active: 'bg-purple-600 border-purple-600 text-white' },
];

const MAX_PRICE = 10000;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function ChaletFilter() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.chalets.filters);

  function update<K extends keyof ChaletFilters>(key: K, value: ChaletFilters[K]) {
    dispatch(setFilter({ key, value }));
  }

  function handleCheckIn(val: string) {
    update('checkIn', val || null);
    // If checkout is before new checkin, clear it
    if (filters.checkOut && val && filters.checkOut <= val) {
      update('checkOut', null);
    }
  }

  function handleCheckOut(val: string) {
    update('checkOut', val || null);
  }

  const minCheckOut = filters.checkIn
    ? new Date(new Date(filters.checkIn).getTime() + 86400000).toISOString().slice(0, 10)
    : todayStr();

  return (
    <div className="space-y-4">
      {/* Type tabs */}
      <div className="flex flex-wrap gap-2">
        {TYPE_TABS.map((tab) => {
          const isActive = filters.type === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => update('type', tab.value)}
              className={`px-5 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-200 ${
                isActive ? tab.active : tab.color + ' bg-white'
              }`}
            >
              {isAr ? tab.labelAr : tab.label}
            </button>
          );
        })}
      </div>

      {/* Secondary filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-2 text-gray-500 flex-shrink-0">
          <SlidersHorizontal size={14} className="text-gold-500" />
          <span className="text-xs font-semibold text-gray-700">{isAr ? 'تصفية' : 'Filters'}</span>
        </div>

        {/* Guests */}
        <div className="flex items-center gap-2">
          <Users size={14} className="text-gray-400 flex-shrink-0" />
          <label className="text-xs font-medium text-gray-500 whitespace-nowrap">
            {isAr ? 'ضيوف' : 'Guests'}
          </label>
          <select
            value={filters.guests}
            onChange={(e) => update('guests', Number(e.target.value))}
            className="rounded-lg border border-gray-200 text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-white text-gray-700"
          >
            {[1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20].map((n) => (
              <option key={n} value={n}>{n}+</option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={14} className="text-gray-400 flex-shrink-0" />
          <label className="text-xs font-medium text-gray-500 whitespace-nowrap">
            {isAr ? 'الوصول' : 'Check-in'}
          </label>
          <input
            type="date"
            min={todayStr()}
            value={filters.checkIn ?? ''}
            onChange={(e) => handleCheckIn(e.target.value)}
            className="rounded-lg border border-gray-200 text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-white text-gray-700"
          />
          <span className="text-gray-300 text-xs">→</span>
          <label className="text-xs font-medium text-gray-500 whitespace-nowrap">
            {isAr ? 'المغادرة' : 'Check-out'}
          </label>
          <input
            type="date"
            min={minCheckOut}
            value={filters.checkOut ?? ''}
            onChange={(e) => handleCheckOut(e.target.value)}
            disabled={!filters.checkIn}
            className="rounded-lg border border-gray-200 text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-white text-gray-700 disabled:opacity-40"
          />
        </div>

        {/* Price range */}
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-gray-500 whitespace-nowrap flex-shrink-0">
            {isAr ? 'السعر' : 'Price'}{' '}
            <span className="text-gold-600 font-bold">
              {filters.minPrice > 0 ? `${filters.minPrice.toLocaleString()} – ` : ''}
              {filters.maxPrice < MAX_PRICE ? `${filters.maxPrice.toLocaleString()} SAR` : isAr ? 'أي سعر' : 'Any'}
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={MAX_PRICE}
            step={100}
            value={filters.maxPrice}
            onChange={(e) => {
              const val = Number(e.target.value);
              update('maxPrice', val);
              if (filters.minPrice > val) update('minPrice', 0);
            }}
            className="accent-gold-500 flex-1"
          />
        </div>

        {/* Sort */}
        <select
          value={filters.sortBy}
          onChange={(e) => update('sortBy', e.target.value as ChaletFilters['sortBy'])}
          className="rounded-lg border border-gray-200 text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-white text-gray-700 ms-auto"
        >
          <option value="featured">{isAr ? 'مميز' : 'Featured'}</option>
          <option value="price_asc">{isAr ? 'السعر: الأقل' : 'Price: Low → High'}</option>
          <option value="price_desc">{isAr ? 'السعر: الأعلى' : 'Price: High → Low'}</option>
          <option value="rating">{isAr ? 'التقييم' : 'Top Rated'}</option>
        </select>

        {/* Reset */}
        <button
          onClick={() => dispatch(resetFilters())}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gold-600 transition-colors flex-shrink-0"
        >
          <RotateCcw size={12} />
          {isAr ? 'إعادة' : 'Reset'}
        </button>
      </div>
    </div>
  );
}
