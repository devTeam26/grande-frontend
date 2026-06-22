import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Users, Bed, Bath, Maximize2, ChevronLeft, ChevronRight, ExternalLink, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setSelectedChalet } from '../store/slices/chaletsSlice';
import { startBooking } from '../store/slices/bookingSlice';
import { ChaletTypeBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AMENITY_ICONS, CANCELLATION_POLICIES } from '../utils/constants';
import * as LucideIcons from 'lucide-react';
import { AvailabilityCalendar } from '../components/chalets/AvailabilityCalendar';
import { blockedDates as staticBlockedDates } from '../data/blockedDates';
import type { BlockedDate } from '../types';

export function ChaletDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const lang = i18n.language as 'en' | 'ar';

  const chalet = useAppSelector((s) => s.chalets.chalets.find((c) => c.id === id));
  const bookings = useAppSelector((s) => s.booking.bookings);
  const [galleryOpen, setGalleryOpen]   = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    if (id) dispatch(setSelectedChalet(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (!galleryOpen || !chalet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     setGalleryOpen(false);
      if (e.key === 'ArrowLeft')  setGalleryIndex((i) => (i - 1 + chalet.images.length) % chalet.images.length);
      if (e.key === 'ArrowRight') setGalleryIndex((i) => (i + 1) % chalet.images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [galleryOpen, chalet]);

  if (!chalet) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg">Chalet not found.</p>
        <Link to="/chalets"><Button className="mt-4" variant="outline">{t('common.back')}</Button></Link>
      </div>
    );
  }

  const masterBedrooms = chalet.bedrooms.filter((b) => b.type === 'master').length;
  const singleBedrooms = chalet.bedrooms.filter((b) => b.type === 'single').length;
  const cancelLabel = CANCELLATION_POLICIES[chalet.cancellationPolicy][lang];

  const allBlockedForChalet: BlockedDate[] = [
    ...staticBlockedDates,
    ...bookings
      .filter((b) => b.chaletId === chalet.id && b.status !== 'cancelled')
      .map((b) => ({ chaletId: b.chaletId, startDate: b.checkIn, endDate: b.checkOut, bookingId: b.id })),
  ];

  function handleBook() {
    dispatch(startBooking({ chaletId: chalet!.id }));
    navigate(`/booking/${chalet!.id}`);
  }

  const facilitiesData: Array<{
    icon: string;
    titleEn: string; titleAr: string;
    descEn?: string; descAr?: string;
    items: Array<{ en: string; ar: string; extra?: string }>;
    free?: boolean;
  }> = [
    { icon: 'Car',            titleEn: 'Parking',             titleAr: 'المواقف',
      descEn: 'Free private parking on site (no reservation needed).',
      descAr: 'موقف خاص مجاني في الموقع — لا يلزم حجز مسبق.', items: [] },
    { icon: 'Wifi',           titleEn: 'Internet',            titleAr: 'الإنترنت',
      descEn: 'WiFi is available in all areas and is free of charge.',
      descAr: 'الواي فاي متاح في جميع المناطق ومجاني تماماً.', items: [] },
    { icon: 'UtensilsCrossed',titleEn: 'Kitchen',             titleAr: 'المطبخ',
      items: [
        { en: 'Dining table', ar: 'طاولة طعام' }, { en: 'Coffee machine', ar: 'ماكينة قهوة' },
        { en: 'Kitchenware',  ar: 'أدوات مطبخ' }, { en: 'Kitchen',        ar: 'مطبخ' },
        { en: 'Microwave',    ar: 'ميكروويف' },    { en: 'Refrigerator',   ar: 'ثلاجة' },
        { en: 'Kitchenette',  ar: 'مطبخ صغير' },
      ] },
    { icon: 'Bed',            titleEn: 'Bedroom',             titleAr: 'غرفة النوم',
      items: [
        { en: 'Linen', ar: 'بياضات' }, { en: 'Wardrobe or closet', ar: 'خزانة ملابس' },
      ] },
    { icon: 'Droplets',       titleEn: 'Private bathroom',    titleAr: 'حمام خاص',
      items: [
        { en: 'Toilet paper', ar: 'ورق مرحاض' }, { en: 'Towels',            ar: 'مناشف' },
        { en: 'Additional toilet', ar: 'مرحاض إضافي' }, { en: 'Bath or shower', ar: 'حوض أو دش' },
        { en: 'Slippers',     ar: 'شباشب' },      { en: 'Shared toilet',     ar: 'مرحاض مشترك' },
        { en: 'Toilet',       ar: 'مرحاض' },      { en: 'Hairdryer',         ar: 'مجفف شعر' },
        { en: 'Bath',         ar: 'حوض استحمام' }, { en: 'Shower',            ar: 'دش' },
      ] },
    { icon: 'LayoutList',     titleEn: 'Living Area',         titleAr: 'غرفة المعيشة',
      items: [
        { en: 'Dining area', ar: 'منطقة طعام' }, { en: 'Sofa',         ar: 'أريكة' },
        { en: 'Fireplace',   ar: 'مدفأة' },       { en: 'Seating Area', ar: 'منطقة جلوس' },
      ] },
    { icon: 'Monitor',        titleEn: 'Media & Technology',  titleAr: 'الإعلام والتقنية',
      items: [
        { en: 'Streaming service (like Netflix)', ar: 'خدمة بث (مثل نتفليكس)' },
        { en: 'Flat-screen TV',   ar: 'تلفاز بشاشة مسطحة' },
        { en: 'Satellite channels', ar: 'قنوات فضائية' },
        { en: 'TV',               ar: 'تلفاز' },
      ] },
    { icon: 'Package',        titleEn: 'Room amenities',      titleAr: 'مرافق الغرفة',
      items: [
        { en: 'Socket near the bed', ar: 'مقبس كهربائي بجانب السرير' },
        { en: 'Sofa bed',            ar: 'أريكة سرير' },
        { en: 'Drying rack for clothing', ar: 'رف تجفيف ملابس' },
        { en: 'Fold-up bed',         ar: 'سرير قابل للطي' },
        { en: 'Clothes rack',        ar: 'علاقة ملابس' },
        { en: 'Carpeted',            ar: 'أرضية مكسوة بالسجاد' },
        { en: 'Ironing facilities',  ar: 'مرافق الكي' },
        { en: 'Iron',                ar: 'مكواة' },
      ] },
    { icon: 'User',           titleEn: 'Accessibility',       titleAr: 'إمكانية الوصول',
      items: [
        { en: 'Entire unit wheelchair accessible', ar: 'الوحدة بالكامل متاحة لكراسي المقعدين' },
        { en: 'Entire unit on ground floor',       ar: 'الوحدة بالكامل في الطابق الأرضي' },
      ] },
    { icon: 'TreePine',       titleEn: 'Outdoors',            titleAr: 'الخارج',
      items: [
        { en: 'Beachfront',        ar: 'واجهة شاطئية' }, { en: 'Private beach area', ar: 'منطقة شاطئ خاصة' },
        { en: 'Barbecue',          ar: 'شواء' },           { en: 'Private pool',       ar: 'مسبح خاص' },
        { en: 'BBQ facilities',    ar: 'مرافق الشواء' },   { en: 'Balcony',            ar: 'بلكونة' },
        { en: 'Terrace',           ar: 'شرفة' },           { en: 'Garden',             ar: 'حديقة' },
      ] },
    { icon: 'Waves',          titleEn: 'Indoor swimming pool', titleAr: 'مسبح داخلي', free: true,
      items: [
        { en: 'Open all year',              ar: 'مفتوح طوال العام' },
        { en: 'All ages welcome',           ar: 'مناسب لجميع الأعمار' },
        { en: 'Swimming pool toys',         ar: 'ألعاب مسبح' },
        { en: 'Pool/beach towels',          ar: 'مناشف المسبح/الشاطئ' },
        { en: 'Pool bar',                   ar: 'بار المسبح' },
        { en: 'Sun loungers or beach chairs', ar: 'كراسي شمس أو شاطئ' },
        { en: 'Sun umbrellas',              ar: 'مظلات شمس' },
      ] },
    { icon: 'Heart',          titleEn: 'Wellness',            titleAr: 'العافية',
      items: [{ en: 'Sun loungers or beach chairs', ar: 'كراسي شمس أو شاطئ' }] },
    { icon: 'Coffee',         titleEn: 'Food & Drink',        titleAr: 'الطعام والشراب',
      items: [
        { en: 'Grocery deliveries', ar: 'توصيل بقالة', extra: 'Additional charge' },
        { en: 'Snack bar',          ar: 'بار وجبات خفيفة' },
        { en: 'Room service',       ar: 'خدمة الغرف' },
        { en: 'Tea/Coffee maker',   ar: 'آلة شاي/قهوة' },
      ] },
    { icon: 'Activity',       titleEn: 'Activities',          titleAr: 'الأنشطة',
      items: [{ en: 'Beach', ar: 'شاطئ' }] },
    { icon: 'Eye',            titleEn: 'Outdoor & View',      titleAr: 'الخارج والإطلالة',
      items: [
        { en: 'Pool view',   ar: 'إطلالة على المسبح' },
        { en: 'Garden view', ar: 'إطلالة على الحديقة' },
        { en: 'View',        ar: 'إطلالة' },
      ] },
    { icon: 'Bell',           titleEn: 'Reception services',  titleAr: 'خدمات الاستقبال',
      items: [{ en: 'Invoice provided', ar: 'تُقدَّم فاتورة' }] },
    { icon: 'Settings',       titleEn: 'Miscellaneous',       titleAr: 'متفرقات',
      items: [
        { en: 'Air conditioning',   ar: 'تكييف هواء' }, { en: 'Heating',        ar: 'تدفئة' },
        { en: 'Lift',               ar: 'مصعد' },        { en: 'Family rooms',   ar: 'غرف عائلية' },
        { en: 'Non-smoking rooms',  ar: 'غرف لغير المدخنين' },
      ] },
    { icon: 'Shield',         titleEn: 'Safety & security',   titleAr: 'السلامة والأمن',
      items: [
        { en: 'Fire extinguishers',       ar: 'طفايات حريق' },
        { en: 'CCTV outside property',    ar: 'كاميرات خارج العقار' },
        { en: 'CCTV in common areas',     ar: 'كاميرات في المناطق المشتركة' },
        { en: 'Security alarm',           ar: 'نظام إنذار' },
        { en: '24-hour security',         ar: 'حراسة 24 ساعة' },
        { en: 'Safety deposit box',       ar: 'خزنة أمان' },
      ] },
    { icon: 'Globe',          titleEn: 'Languages spoken',    titleAr: 'اللغات المتحدثة',
      items: [
        { en: 'Arabic', ar: 'العربية' }, { en: 'English', ar: 'الإنجليزية' },
      ] },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/chalets" className="hover:text-gold-600 flex items-center gap-1">
          <ChevronLeft size={14} /> {t('nav.chalets')}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{chalet.name[lang]}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gallery grid */}
          <div data-aos="fade-up" className="relative rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 grid-rows-2 gap-1.5 h-[340px] sm:h-[440px]">
              {/* Large image — left half */}
              <button
                type="button"
                onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}
                className="col-span-2 row-span-2 overflow-hidden relative group focus:outline-none"
              >
                <img
                  src={chalet.images[0]}
                  alt={chalet.name[lang]}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </button>

              {/* 4 small images — right 2×2 */}
              {Array.from({ length: 4 }, (_, i) => {
                const img = chalet.images[(i + 1) % chalet.images.length];
                const isLast = i === 3;
                const remaining = chalet.images.length - 5;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setGalleryIndex((i + 1) % chalet.images.length); setGalleryOpen(true); }}
                    className="overflow-hidden relative group focus:outline-none"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {isLast && (
                      <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1 pointer-events-none">
                        <span className="text-white text-2xl font-bold">
                          +{remaining > 0 ? remaining : chalet.images.length - 1}
                        </span>
                        <span className="text-white/80 text-xs font-medium">
                          {lang === 'ar' ? 'كل الصور' : 'All photos'}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* View all button */}
            <button
              type="button"
              onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}
              className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-semibold px-3.5 py-2 rounded-xl shadow hover:bg-white transition-colors flex items-center gap-1.5"
            >
              <LucideIcons.LayoutGrid size={13} />
              {lang === 'ar' ? 'عرض كل الصور' : 'View all photos'}
            </button>
          </div>

          {/* Info */}
          <div>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ChaletTypeBadge type={chalet.type} />
                  {chalet.featured && <span className="text-xs bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full font-medium">★ Featured</span>}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{chalet.name[lang]}</h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-500">{chalet.location.address[lang]}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Star size={18} className="text-gold-500 fill-gold-500" />
                <span className="font-bold text-gray-900 text-xl">{chalet.rating.toFixed(1)}</span>
                <span className="text-gray-400 text-sm">({chalet.reviewCount} {t('common.reviews')})</span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 py-4 border-y border-gray-100 mb-4">
              {[
                { icon: Users, val: `${chalet.maxGuests} ${t('chalets.guests')}` },
                { icon: Bed, val: `${masterBedrooms + singleBedrooms} ${t('chalets.bedrooms')}` },
                { icon: Bath, val: `${chalet.bathrooms} ${t('chalets.bathrooms')}` },
                { icon: Maximize2, val: `${chalet.size} ${t('chalets.sqm')}` },
              ].map(({ icon: Icon, val }) => (
                <div key={val} className="flex items-center gap-1.5 text-sm text-gray-700">
                  <Icon size={15} className="text-gold-500" /> {val}
                </div>
              ))}
            </div>

            <p className="text-gray-600 leading-relaxed">{chalet.description[lang]}</p>
          </div>

          {/* Property highlights — exact items from screenshot */}
          <div data-aos="fade-up">
            <div className="flex flex-wrap gap-3">
              {[
                { icon: LucideIcons.Home,              label: 'Houses' },
                { icon: LucideIcons.UtensilsCrossed,   label: 'Kitchen' },
                { icon: LucideIcons.Building2,         label: 'City view' },
                { icon: LucideIcons.TreePine,          label: 'Garden' },
                { icon: LucideIcons.Waves,             label: 'Swimming pool' },
                { icon: LucideIcons.Flame,             label: 'BBQ facilities' },
                { icon: LucideIcons.Wifi,              label: 'Free WiFi' },
                { icon: LucideIcons.Umbrella,          label: 'Terrace' },
                { icon: LucideIcons.LayoutPanelLeft,   label: 'Balcony' },
                { icon: LucideIcons.Car,               label: 'Free parking' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 border border-gray-200 rounded-xl px-4 py-3 bg-white text-sm text-gray-700 font-medium min-w-[140px]"
                >
                  <Icon size={18} className="text-gray-500 flex-shrink-0" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Bedrooms */}
          <div data-aos="fade-up">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bedrooms</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {chalet.bedrooms.map((bed, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="font-medium text-sm text-gray-800 capitalize">
                    {bed.type === 'master' ? '👑 Master' : '🛏 Bedroom'} {i + 1}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {bed.beds} bed{bed.beds > 1 ? 's' : ''}{bed.hasEnsuite ? ' · Ensuite' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div data-aos="fade-up">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {chalet.amenities.map((amenityId) => {
                const iconName = AMENITY_ICONS[amenityId] ?? 'CheckCircle';
                const icons = LucideIcons as unknown as Record<string, React.FC<{ size?: number; className?: string }>>;
                const Icon = icons[iconName] ?? icons['CheckCircle'];
                const label = amenityId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <div key={amenityId} className="flex items-center gap-2 text-sm text-gray-700">
                    <Icon size={15} className="text-gold-500 flex-shrink-0" />
                    {label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Facilities of Grande Beach */}
          <div data-aos="fade-up">
            {/* Section header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {lang === 'ar' ? 'مرافق غراند بيتش' : 'Facilities of Grande Beach'}
                </h2>
                {/* <p className="text-sm text-gray-400 mt-0.5">
                  {lang === 'ar' ? 'مرافق رائعة! تقييم: 8.6' : 'Great facilities! Review score, 8.6'}
                </p> */}
              </div>
            </div>

            {/* Most popular strip */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {lang === 'ar' ? 'أبرز المرافق' : 'Most popular facilities'}
            </p>
            <div className="flex flex-wrap gap-2 mb-6 pb-5 border-b border-gray-100">
              {([
                { icon: 'Waves',     en: 'Indoor swimming pool', ar: 'مسبح داخلي' },
                { icon: 'Car',       en: 'Free parking',         ar: 'موقف مجاني' },
                { icon: 'Ban',       en: 'Non-smoking rooms',    ar: 'غرف لغير المدخنين' },
                { icon: 'Umbrella',  en: 'Beachfront',           ar: 'على الشاطئ' },
                { icon: 'Bell',      en: 'Room service',         ar: 'خدمة الغرف' },
                { icon: 'Wifi',      en: 'Free WiFi',            ar: 'واي فاي مجاني' },
                { icon: 'Users',     en: 'Family rooms',         ar: 'غرف عائلية' },
                { icon: 'Palmtree',  en: 'Private beach area',   ar: 'منطقة شاطئ خاصة' },
                { icon: 'BedDouble', en: 'Maid rooms',           ar: 'غرف خادمة' },
                { icon: 'Tv2',       en: 'Smart TV',             ar: 'تلفاز ذكي' },
                { icon: 'Play',      en: 'Netflix',              ar: 'نتفليكس' },
              ] as { icon: string; en: string; ar: string }[]).map(({ icon: ic, en, ar: arTxt }) => {
                const allIcons = LucideIcons as unknown as Record<string, React.FC<{ size?: number; className?: string }>>;
                const PopIcon = allIcons[ic] ?? allIcons['CheckCircle'];
                return (
                  <div key={en} className="flex items-center gap-1.5 bg-gold-50 border border-gold-200 text-gold-700 rounded-xl px-3 py-1.5 text-xs font-medium">
                    <PopIcon size={12} className="flex-shrink-0 text-gold-500" />
                    {lang === 'ar' ? arTxt : en}
                  </div>
                );
              })}
            </div>

            {/* Full facilities grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
              {facilitiesData.map(({ icon: ic, titleEn, titleAr, descEn, descAr, items, free }) => {
                const allIcons = LucideIcons as unknown as Record<string, React.FC<{ size?: number; className?: string }>>;
                const CatIcon  = allIcons[ic] ?? allIcons['CheckCircle'];
                const ChkIcon  = allIcons['Check'] as React.FC<{ size?: number; className?: string }>;
                return (
                  <div key={titleEn}>
                    <div className="flex items-center gap-2 mb-2">
                      <CatIcon size={15} className="text-gray-500 flex-shrink-0" />
                      <span className="font-bold text-sm text-gray-900">
                        {lang === 'ar' ? titleAr : titleEn}
                      </span>
                      {free && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold leading-none">
                          {lang === 'ar' ? 'مجاني!' : 'Free!'}
                        </span>
                      )}
                    </div>
                    {(descEn || descAr) && (
                      <p className="text-xs text-gray-500 ps-[23px] mb-1.5 leading-relaxed">
                        {lang === 'ar' ? descAr : descEn}
                      </p>
                    )}
                    {items.length > 0 && (
                      <ul className="ps-[23px] space-y-1">
                        {items.map((item) => (
                          <li key={item.en} className="flex items-start gap-1.5 text-xs text-gray-600">
                            <ChkIcon size={11} className="text-gold-500 mt-0.5 flex-shrink-0" />
                            <span>
                              {lang === 'ar' ? item.ar : item.en}
                              {item.extra && (
                                <span className="ms-1.5 text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded font-medium">
                                  {item.extra}
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cancellation policy */}
          <div data-aos="fade-up" className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
            <h2 className="font-semibold text-amber-800 mb-1">Cancellation Policy</h2>
            <p className="text-amber-700 text-sm">{cancelLabel}</p>
          </div>

          {/* External booking */}
          {(chalet.bookingComUrl || chalet.airbnbUrl) && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Also available on</h2>
              <div className="flex flex-wrap gap-3">
                {chalet.bookingComUrl && (
                  <a href={chalet.bookingComUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink size={14} /> {t('chalets.check_booking')}
                    </Button>
                  </a>
                )}
                {chalet.airbnbUrl && (
                  <a href={chalet.airbnbUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink size={14} /> {t('chalets.check_airbnb')}
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right column – booking card & map */}
        <div className="lg:col-span-1 space-y-4">
          {/* Availability calendar */}
          <div data-aos="fade-up">
            <AvailabilityCalendar chaletId={chalet.id} blockedDates={allBlockedForChalet} />
          </div>

          {/* Booking card */}
          <div data-aos="fade-up" className=" top-24 z-50 bg-white rounded-2xl border border-gray-200 shadow-md p-5 space-y-4">
            <div>
              <span className="text-3xl font-bold text-gold-600">{chalet.basePrice.toLocaleString()}</span>
              <span className="text-gray-400 text-sm"> {t('common.sar')} {t('common.per_night')}</span>
              <p className="text-xs text-gray-400 mt-0.5">Base price · weekend/seasonal rates apply</p>
            </div>
            <Button fullWidth size="lg" onClick={handleBook}>{t('chalets.book_now')}</Button>
            <p className="text-center text-xs text-gray-400">You won't be charged yet</p>

            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Type</span>
                <ChaletTypeBadge type={chalet.type} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Max guests</span>
                <span className="text-gray-800">{chalet.maxGuests}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Rating</span>
                <span className="flex items-center gap-1 text-gray-800">
                  <Star size={12} className="fill-gold-500 text-gold-500" /> {chalet.rating}
                </span>
              </div>
            </div>
          </div>

          {/* Map */}
          <div data-aos="fade-up" className="bg-white rounded-2xl border border-gray-200 shadow-md p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-2.5 flex items-center gap-1.5">
              <MapPin size={13} className="text-gold-500" /> Location
            </h2>
            <div className="rounded-xl overflow-hidden bg-gradient-to-br from-navy-50 to-blue-50 h-[160px] flex items-center justify-center border border-gray-100">
              <a
                href={`https://www.google.com/maps?q=${chalet.location.lat},${chalet.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 text-gray-400 hover:text-gold-600 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center group-hover:shadow-gold-200/60 group-hover:shadow-lg transition-all">
                  <MapPin size={18} className="text-gold-500" />
                </div>
                <span className="text-xs font-medium">View on Google Maps</span>
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-2">{chalet.location.address[lang]}</p>
          </div>

          {/* About this property */}
          <div data-aos="fade-up" className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-navy-800 to-navy-700 px-5 py-4">
              <h2 className="font-bold text-white text-sm flex items-center gap-2">
                <LucideIcons.Info size={13} className="text-gold-300" />
                {lang === 'ar' ? 'عن هذا العقار' : 'About this property'}
              </h2>
            </div>

            <div className="p-5 space-y-4">
              {([
                { icon: 'Waves',   title: 'Beachfront Living',          titleAr: 'الموقع الشاطئي',
                  text: 'Grande Beach offers a private beach area and direct beachfront access. Guests can relax on the terrace or enjoy the rooftop pool with stunning sea views.',
                  textAr: 'يوفر غراند بيتش منطقة شاطئ خاصة وإمكانية الوصول المباشر إلى الشاطئ، مع شرفة للاسترخاء ومسبح على السطح بإطلالات بحرية رائعة.' },
                { icon: 'BedDouble', title: 'Comfortable Accommodations', titleAr: 'إقامة مريحة',
                  text: 'Family rooms with private bathrooms, air-conditioning, and modern amenities. Each unit includes a kitchenette, balcony, and free WiFi.',
                  textAr: 'غرف عائلية بحمامات خاصة وتكييف هواء ومرافق حديثة، مع مطبخ صغير وبلكونة وواي فاي مجاني في كل وحدة.' },
                { icon: 'Dumbbell', title: 'Leisure Facilities',         titleAr: 'مرافق الترفيه',
                  text: 'Enjoy an indoor swimming pool, fitness centre, and barbecue facilities. Extras include a pool bar, lift, and free on-site private parking.',
                  textAr: 'استمتع بمسبح داخلي ومركز لياقة ومرافق شواء، بالإضافة إلى بار المسبح والمصعد وموقف سيارات خاص مجاني.' },
                { icon: 'Navigation', title: 'Convenient Location',      titleAr: 'موقع مميز',
                  text: 'Located 88 km from Kuwait International Airport with easy access to local attractions. Staff speak Arabic and English.',
                  textAr: 'على بُعد 88 كم من مطار الكويت الدولي مع سهولة الوصول إلى المعالم المحلية، والموظفون يتحدثون العربية والإنجليزية.' },
              ] as { icon: string; title: string; titleAr: string; text: string; textAr: string }[]).map(({ icon: ic, title, titleAr, text, textAr }, idx) => {
                const allIcons = LucideIcons as unknown as Record<string, React.FC<{ size?: number; className?: string }>>;
                const Ic = allIcons[ic] ?? allIcons['CheckCircle'];
                return (
                  <div key={title} data-aos="fade-up" data-aos-delay={idx * 70} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gold-50 border border-gold-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Ic size={13} className="text-gold-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 mb-0.5">{lang === 'ar' ? titleAr : title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{lang === 'ar' ? textAr : text}</p>
                    </div>
                  </div>
                );
              })}

              {/* Couple rating highlight */}
              <div className="mt-1 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-3 bg-pink-50 border border-pink-100 rounded-xl px-3.5 py-2.5">
                  <span className="text-xl flex-shrink-0">💑</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">
                      {lang === 'ar' ? 'الأزواج يحبون هذا العقار' : 'Couples love this property'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {lang === 'ar'
                        ? <>قيّموه بـ <span className="font-bold text-gold-600">8.7</span> لرحلة ثنائية</>
                        : <>Rated <span className="font-bold text-gold-600">8.7</span> for a two-person trip</>}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Gallery Modal ── */}
      {galleryOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
          onClick={() => setGalleryOpen(false)}
        >
          {/* Top bar */}
          <div className="absolute top-0 inset-x-0 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
            <span className="text-white/60 text-sm font-medium pointer-events-auto">
              {galleryIndex + 1} / {chalet.images.length}
            </span>
            <span className="text-white font-semibold text-sm truncate max-w-xs">{chalet.name[lang]}</span>
            <button
              type="button"
              onClick={() => setGalleryOpen(false)}
              className="text-white bg-white/10 hover:bg-white/25 p-2 rounded-full transition-colors pointer-events-auto"
            >
              <LucideIcons.X size={18} />
            </button>
          </div>

          {/* Main image */}
          <div
            className="relative max-w-5xl w-full px-14 sm:px-20"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={chalet.images[galleryIndex]}
              alt={chalet.name[lang]}
              className="w-full max-h-[72vh] object-contain rounded-xl"
            />
          </div>

          {/* Prev */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => (i - 1 + chalet.images.length) % chalet.images.length); }}
            className="absolute left-3 sm:left-5 text-white bg-white/10 hover:bg-white/25 p-3 rounded-full transition-colors"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => (i + 1) % chalet.images.length); }}
            className="absolute right-3 sm:right-5 text-white bg-white/10 hover:bg-white/25 p-3 rounded-full transition-colors"
          >
            <ChevronRight size={22} />
          </button>

          {/* Thumbnail strip */}
          <div
            className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] pb-1 px-2"
            onClick={(e) => e.stopPropagation()}
          >
            {chalet.images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGalleryIndex(i)}
                className={`flex-shrink-0 w-16 h-11 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  i === galleryIndex
                    ? 'border-white opacity-100 scale-105'
                    : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
