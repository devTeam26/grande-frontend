import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { fetchChalets, selectFilteredChalets } from '../store/slices/chaletsSlice';
import { ChaletCard } from '../components/chalets/ChaletCard';
import { ChaletFilter } from '../components/chalets/ChaletFilter';
import type { Chalet } from '../types';

// Section config per type
const TYPE_SECTIONS: { type: Chalet['type']; label: string; labelAr: string; pill: string }[] = [
  { type: 'normal',   label: 'Standard', labelAr: 'ستاندرد',   pill: 'bg-blue-100 text-blue-700' },
  { type: 'superior', label: 'Superior', labelAr: 'سوبيريور',  pill: 'bg-gold-100 text-gold-700' },
  { type: 'vip',      label: 'VIP',      labelAr: 'في آي بي',  pill: 'bg-purple-100 text-purple-700' },
];

function ChaletGrid({ chalets }: { chalets: Chalet[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence mode="popLayout">
        {chalets.map((chalet, i) => (
          <motion.div
            key={chalet.id}
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93 }}
            transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3) }}
          >
            <ChaletCard chalet={chalet} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
          <div className="h-52 bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded-full w-3/4" />
            <div className="h-3 bg-gray-200 rounded-full w-1/2" />
            <div className="h-8 bg-gray-200 rounded-xl mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Chalets() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const dispatch = useAppDispatch();

  const filters   = useAppSelector((s) => s.chalets.filters);
  const filtered  = useAppSelector(selectFilteredChalets);
  const isLoading = useAppSelector((s) => s.chalets.isLoading);

  // Re-fetch whenever filter values that the API supports change
  useEffect(() => {
    dispatch(fetchChalets(filters));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.type, filters.guests, filters.minPrice, filters.maxPrice, filters.checkIn, filters.checkOut]);

  const showAll = filters.type === 'all';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div data-aos="fade-down" className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('chalets.title')}</h1>
        <p className="text-gray-500 mt-2">{t('chalets.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <ChaletFilter />
      </div>

      {isLoading ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">{t('chalets.no_results')}</p>
        </div>
      ) : showAll ? (
        // ── Grouped by type ──────────────────────────────────────────────────
        <div className="space-y-12">
          {TYPE_SECTIONS.map(({ type, label, labelAr, pill }) => {
            const group = filtered.filter((c) => c.type === type);
            if (group.length === 0) return null;
            return (
              <section key={type}>
                <div className="flex items-center gap-3 mb-5">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${pill}`}>
                    {isAr ? labelAr : label}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400">{group.length} {isAr ? 'وحدة' : 'units'}</span>
                </div>
                <ChaletGrid chalets={group} />
              </section>
            );
          })}
        </div>
      ) : (
        // ── Single type ──────────────────────────────────────────────────────
        <>
          <p className="text-sm text-gray-500 mb-5">
            {filtered.length} {isAr ? 'وحدة متاحة' : 'properties found'}
          </p>
          <ChaletGrid chalets={filtered} />
        </>
      )}
    </div>
  );
}
