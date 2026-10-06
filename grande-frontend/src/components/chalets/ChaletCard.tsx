import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Users, Bed, Bath } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Chalet } from '../../types';
import { ChaletTypeBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { RequestModal } from '../booking/RequestModal';
import { cn } from '../../utils/cn';

interface ChaletCardProps {
  chalet: Chalet;
  className?: string;
}

export function ChaletCard({ chalet, className }: ChaletCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const name = chalet.name[lang];
  const masterBedrooms = chalet.bedrooms.filter((b) => b.type === 'master').length;
  const singleBedrooms = chalet.bedrooms.filter((b) => b.type === 'single').length;
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <>
      <Link
        to={`/chalets/${chalet.id}`}
        className={cn('block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer', className)}
      >
        {/* Main image */}
        <div className="relative overflow-hidden aspect-[4/3] bg-gray-100">
          {chalet.images[0] ? (
            <img
              src={chalet.images[0]}
              alt={name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Bed size={40} className="text-gray-300" />
            </div>
          )}
          <div className="absolute top-3 start-3">
            <ChaletTypeBadge type={chalet.type} />
          </div>
          {chalet.featured && (
            <div className="absolute top-3 end-3 bg-gold-500 text-white text-xs font-medium px-2 py-1 rounded-full">
              ★ Featured
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {chalet.images.length > 1 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {chalet.images.slice(1, 4).map((img, index) => (
              <div key={index} className="overflow-hidden rounded-xl bg-gray-100 border border-gray-200">
                <img src={img} alt={`${name} preview ${index + 2}`} className="w-full h-24 object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex flex-col flex-1 p-4 gap-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-1">{name}</h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star size={13} className="text-gold-500 fill-gold-500" />
              <span className="text-sm font-medium text-gray-700">{chalet.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({chalet.reviewCount})</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed line-clamp-1">{chalet.location.region[lang]}</p>

          <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
            <span className="flex items-center gap-1"><Users size={12} /> {chalet.maxGuests} {t('chalets.guests')}</span>
            <span className="flex items-center gap-1"><Bed size={12} /> {masterBedrooms + singleBedrooms} {t('chalets.bedrooms')}</span>
            <span className="flex items-center gap-1"><Bath size={12} /> {chalet.bathrooms} {t('chalets.bathrooms')}</span>
          </div>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
            <div>
              <span className="text-gold-600 font-bold text-lg">{chalet.basePrice.toLocaleString()}</span>
              <span className="text-gray-400 text-sm"> {t('common.sar')}{t('chalets.per_night')}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">{t('chalets.view_details')}</Button>
              <Button size="sm" onClick={(e) => { e.preventDefault(); setRequestOpen(true); }}>
                {t('chalets.book_now')}
              </Button>
            </div>
          </div>
        </div>
      </Link>

      <RequestModal
        isOpen={requestOpen}
        onClose={() => setRequestOpen(false)}
        chaletId={chalet.id}
        chaletName={name}
      />
    </>
  );
}
