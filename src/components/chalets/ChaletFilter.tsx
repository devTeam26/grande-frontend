import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { setFilter, resetFilters } from '../../store/slices/chaletsSlice';
import type { ChaletFilters, ChaletType } from '../../types';

export function ChaletFilter() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.chalets.filters);

  function update<K extends keyof ChaletFilters>(key: K, value: ChaletFilters[K]) {
    dispatch(setFilter({ key, value }));
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-gold-500" />
          <h3 className="font-semibold text-gray-900 text-sm">Filters</h3>
        </div>
        <button
          onClick={() => dispatch(resetFilters())}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gold-600 transition-colors"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
        {/* Type */}
        <div className="flex flex-col gap-1.5 min-w-[130px]">
          <label className="text-xs font-medium text-gray-600">{t('chalets.filter_type')}</label>
          <select
            value={filters.type}
            onChange={(e) => update('type', e.target.value as ChaletType | 'all')}
            className="rounded-lg border border-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-white"
          >
            <option value="all">{t('chalets.filter_all')}</option>
            <option value="normal">{t('chalets.filter_normal')}</option>
            <option value="superior">{t('chalets.filter_deluxe')}</option>
            <option value="vip">{t('chalets.filter_vip')}</option>
          </select>
        </div>

        {/* Guests */}
        <div className="flex flex-col gap-1.5 min-w-[100px]">
          <label className="text-xs font-medium text-gray-600">{t('chalets.filter_guests')}</label>
          <select
            value={filters.guests}
            onChange={(e) => update('guests', Number(e.target.value))}
            className="rounded-lg border border-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-white"
          >
            {[1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20].map((n) => (
              <option key={n} value={n}>{n}+</option>
            ))}
          </select>
        </div>

        {/* Max price */}
        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <label className="text-xs font-medium text-gray-600">
            {t('chalets.filter_price')}: up to {filters.maxPrice.toLocaleString()} KWD
          </label>
          <input
            type="range"
            min={500}
            max={5000}
            step={100}
            value={filters.maxPrice}
            onChange={(e) => update('maxPrice', Number(e.target.value))}
            className="accent-gold-500"
          />
        </div>

        {/* Sort */}
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <label className="text-xs font-medium text-gray-600">{t('chalets.filter_sort')}</label>
          <select
            value={filters.sortBy}
            onChange={(e) => update('sortBy', e.target.value as ChaletFilters['sortBy'])}
            className="rounded-lg border border-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-white"
          >
            <option value="featured">{t('chalets.sort_featured')}</option>
            <option value="price_asc">{t('chalets.sort_price_asc')}</option>
            <option value="price_desc">{t('chalets.sort_price_desc')}</option>
            <option value="rating">{t('chalets.sort_rating')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
