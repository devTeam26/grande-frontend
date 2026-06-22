import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/useAppSelector';
import { selectFilteredChalets } from '../store/slices/chaletsSlice';
import { ChaletCard } from '../components/chalets/ChaletCard';
import { ChaletFilter } from '../components/chalets/ChaletFilter';

const UNIT_GROUPS = [
  {
    label: 'Standard',
    labelAr: 'ستاندرد',
    units: ['A1', 'A2', 'A3', 'A4'],
    color: 'bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-400',
    activeColor: 'bg-gray-700 text-white border-gray-700',
  },
  {
    label: 'Superior',
    labelAr: 'سوبيريور',
    units: ['B1', 'B2', 'B3', 'B4'],
    color: 'bg-gold-50 text-gold-700 border-gold-200 hover:border-gold-400',
    activeColor: 'bg-gold-500 text-white border-gold-500',
  },
  {
    label: 'VIP',
    labelAr: 'VIP',
    units: ['VIP 1', 'VIP 2'],
    color: 'bg-navy-50 text-navy-700 border-navy-200 hover:border-navy-400',
    activeColor: 'bg-navy-800 text-white border-navy-800',
  },
];

export function Chalets() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const filtered = useAppSelector(selectFilteredChalets);
  const [unitFilter, setUnitFilter] = useState<string | null>(null);

  const matchUnit = (name: string, unit: string) => {
    if (unit.startsWith('VIP')) return name.toLowerCase().includes(unit.toLowerCase());
    return name.toUpperCase().endsWith(unit.toUpperCase());
  };

  const displayed = unitFilter
    ? filtered.filter((c) => matchUnit(c.name.en, unitFilter))
    : filtered;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div data-aos="fade-down" className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('chalets.title')}</h1>
        <p className="text-gray-500 mt-2">{t('chalets.subtitle')}</p>
      </div>

      {/* Type + price filters */}
      <div data-aos="fade-up" className="mb-6">
        <ChaletFilter />
      </div>

      {/* Unit filter */}
      <div data-aos="fade-up" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          {isAr ? 'تصفية حسب الوحدة' : 'Filter by Unit'}
        </p>
        <div className="flex flex-wrap gap-4">
          {/* All button */}
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setUnitFilter(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                unitFilter === null
                  ? 'bg-navy-800 text-white border-navy-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
          </div>

          {/* Group buttons */}
          {UNIT_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400 font-medium hidden sm:block">
                {isAr ? group.labelAr : group.label}:
              </span>
              {group.units.map((unit) => (
                <button
                  key={unit}
                  onClick={() => setUnitFilter(unitFilter === unit ? null : unit)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                    unitFilter === unit ? group.activeColor : group.color
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-5">
        {displayed.length} {isAr ? 'وحدة متاحة' : 'properties found'}
        {unitFilter && (
          <span className="ms-2 inline-flex items-center gap-1 bg-navy-50 text-navy-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
            Grande {unitFilter}
            <button onClick={() => setUnitFilter(null)} className="ms-1 hover:text-red-500 text-lg leading-none">&times;</button>
          </span>
        )}
      </p>

      {/* Grid */}
      {displayed.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">{t('chalets.no_results')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {displayed.map((chalet, i) => {
              const dirs = [{ x: -60, y: 0 }, { x: 0, y: 50 }, { x: 60, y: 0 }];
              const { x, y } = dirs[i % 3];
              return (
                <motion.div
                  key={chalet.id}
                  layout
                  initial={{ opacity: 0, x, y }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, scale: 0.93 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <ChaletCard chalet={chalet} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
