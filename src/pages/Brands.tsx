import { useTranslation } from 'react-i18next';

export function Brands() {
  const { t } = useTranslation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('nav.brands')}</h1>
      <p className="text-gray-500">Our brand partners and collections coming soon.</p>
    </div>
  );
}
