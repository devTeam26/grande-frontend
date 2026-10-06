import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Users, Bed, Bath, ChevronLeft, ChevronRight, ExternalLink, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setSelectedChalet, fetchChaletById } from '../store/slices/chaletsSlice';
import { ChaletTypeBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AMENITY_ICONS, WHATSAPP_NUMBER } from '../utils/constants';
import * as LucideIcons from 'lucide-react';
import { AvailabilityCalendar } from '../components/chalets/AvailabilityCalendar';
import { RequestModal } from '../components/booking/RequestModal';
import { format, parseISO } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

// ── Guest Reviews ─────────────────────────────────────────────────────────────

interface GuestReview {
  id: string; guestName: string; rating: number; comment: string; createdAt: string;
}

function StarRow({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  );
}

function ReviewsSection({ chaletId }: { chaletId: string }) {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const [reviews, setReviews] = useState<GuestReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalCount: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
  const [googleUrl, setGoogleUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reviews/chalet/${chaletId}?page=${page}&pageSize=6`);
      const json = await res.json() as Record<string, unknown>;
      const data = json.data as {
        reviews?: { items?: GuestReview[]; totalCount?: number; totalPages?: number; hasNextPage?: boolean; hasPreviousPage?: boolean };
        googleReviewUrl?: string;
      } | undefined;
      setReviews(data?.reviews?.items ?? []);
      setMeta({
        totalCount: data?.reviews?.totalCount ?? 0,
        totalPages: data?.reviews?.totalPages ?? 1,
        hasNextPage: data?.reviews?.hasNextPage ?? false,
        hasPreviousPage: data?.reviews?.hasPreviousPage ?? false,
      });
      setGoogleUrl(data?.googleReviewUrl ?? null);
    } catch { /* ignore */ }
    setLoading(false);
  }, [chaletId, page]);

  useEffect(() => { load(); }, [load]);

  const avg = reviews.length
    ? +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    return { stars, pct: reviews.length ? Math.round((count / reviews.length) * 100) : 0 };
  });

  return (
    <div data-aos="fade-up" className="space-y-6">

      {/* Section header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900">
          {lang === 'ar' ? 'تقييمات الضيوف' : 'Guest Reviews'}
          {meta.totalCount > 0 && (
            <span className="ms-2 text-sm font-normal text-gray-400">({meta.totalCount})</span>
          )}
        </h2>
        {googleUrl && (
          <a href={googleUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-xl px-3.5 py-2 transition-colors shadow-sm">
            <Star size={11} className="fill-white text-white" />
            {lang === 'ar' ? 'تقييم على Google' : 'Review on Google'}
            <ExternalLink size={11} />
          </a>
        )}
      </div>

      {/* Rating summary + breakdown (shown only when there are reviews) */}
      {!loading && reviews.length > 0 && (
        <div className="flex gap-6 bg-gray-50 rounded-2xl p-5 border border-gray-100">
          {/* Big avg */}
          <div className="flex flex-col items-center justify-center flex-shrink-0 min-w-[80px]">
            <p className="text-5xl font-bold text-gray-900 leading-none">{avg}</p>
            <StarRow value={Math.round(avg)} size={16} />
            <p className="text-xs text-gray-400 mt-1.5">{meta.totalCount} {lang === 'ar' ? 'تقييم' : 'reviews'}</p>
          </div>
          <div className="w-px bg-gray-200 flex-shrink-0" />
          {/* Breakdown bars */}
          <div className="flex-1 space-y-1.5">
            {breakdown.map(({ stars, pct }) => (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-3">{stars}</span>
                <Star size={11} className="fill-amber-400 text-amber-400 flex-shrink-0" />
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-gray-400 w-6 text-right">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-4 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-gray-200 rounded-full w-1/2" />
                  <div className="h-2.5 bg-gray-200 rounded-full w-1/3" />
                </div>
              </div>
              <div className="h-12 bg-gray-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-14 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Star size={36} className="mx-auto mb-3 text-gray-200 fill-gray-100" />
          <p className="font-semibold text-gray-500 text-sm">
            {lang === 'ar' ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {lang === 'ar' ? 'كن أول من يقيّم هذا الشاليه' : 'Be the first to review this chalet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              {/* Card header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-sm font-bold text-white">{r.guestName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{r.guestName}</p>
                  <p className="text-xs text-gray-400">{format(parseISO(r.createdAt), 'MMM d, yyyy')}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <StarRow value={r.rating} size={13} />
                  <p className="text-[11px] font-bold text-amber-500 mt-0.5">{r.rating}/5</p>
                </div>
              </div>
              {/* Comment */}
              {r.comment ? (
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 bg-gray-50 rounded-xl px-3 py-2.5">
                  {r.comment}
                </p>
              ) : (
                <p className="text-xs text-gray-300 italic bg-gray-50 rounded-xl px-3 py-2.5">
                  {lang === 'ar' ? 'لم يتم إضافة تعليق' : 'No comment provided'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={!meta.hasPreviousPage || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <ChevronLeft size={14} /> {lang === 'ar' ? 'السابق' : 'Prev'}
          </button>
          <span className="text-sm text-gray-500 min-w-[80px] text-center">
            {page} / {meta.totalPages}
          </span>
          <button disabled={!meta.hasNextPage || loading} onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            {lang === 'ar' ? 'التالي' : 'Next'} <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export function ChaletDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const lang = i18n.language as 'en' | 'ar';

  const chalet = useAppSelector((s) => s.chalets.chalets.find((c) => c.id === id));
  const [galleryOpen, setGalleryOpen]   = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [requestOpen, setRequestOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    dispatch(setSelectedChalet(id));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (dispatch as any)(fetchChaletById(id));
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

  function handleBook() {
    setRequestOpen(true);
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
            {chalet.images.length === 0 ? (
              /* No images — full placeholder */
              <div className="h-[340px] sm:h-[440px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-2xl">
                <Bed size={56} className="text-gray-300" />
              </div>
            ) : (
              <div className={`grid gap-1.5 h-[340px] sm:h-[440px] ${chalet.images.length > 1 ? 'grid-cols-4 grid-rows-2' : ''}`}>
                {/* Large image — left half (or full if only one) */}
                <button
                  type="button"
                  onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}
                  className={`overflow-hidden relative group focus:outline-none ${chalet.images.length > 1 ? 'col-span-2 row-span-2' : 'col-span-4 row-span-2'}`}
                >
                  <img
                    src={chalet.images[0]}
                    alt={chalet.name[lang]}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </button>

                {/* Up to 4 small images — right 2×2 */}
                {chalet.images.length > 1 && Array.from({ length: 4 }, (_, i) => {
                  const imgIndex = i + 1;
                  if (imgIndex >= chalet.images.length && chalet.images.length <= 2) return null;
                  const img = chalet.images[imgIndex % (chalet.images.length || 1)];
                  const isLast = i === 3;
                  const remaining = chalet.images.length - 5;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setGalleryIndex(imgIndex % chalet.images.length); setGalleryOpen(true); }}
                      className="overflow-hidden relative group focus:outline-none"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {isLast && chalet.images.length > 5 && (
                        <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1 pointer-events-none">
                          <span className="text-white text-2xl font-bold">+{remaining}</span>
                          <span className="text-white/80 text-xs font-medium">
                            {lang === 'ar' ? 'كل الصور' : 'All photos'}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* View all button */}
            {chalet.images.length > 0 && (
              <button
                type="button"
                onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}
                className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-semibold px-3.5 py-2 rounded-xl shadow hover:bg-white transition-colors flex items-center gap-1.5"
              >
                <LucideIcons.LayoutGrid size={13} />
                {lang === 'ar' ? `عرض كل الصور (${chalet.images.length})` : `View all photos (${chalet.images.length})`}
              </button>
            )}
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
                { icon: LucideIcons.Sunset,            label: 'Beach view' },
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

          {/* Cancellation Policy + WhatsApp */}
          <div data-aos="fade-up" className="flex items-center justify-between gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <LucideIcons.ShieldCheck size={15} className="text-gray-400 flex-shrink-0" />
              {lang === 'ar' ? 'سياسة الإلغاء' : 'Cancellation Policy'}
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(lang === 'ar' ? `مرحباً، أود الاستفسار عن سياسة الإلغاء للشاليه: ${chalet.name.ar}` : `Hello, I'd like to ask about the cancellation policy for: ${chalet.name.en}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bc5a] text-white text-xs font-semibold transition-colors flex-shrink-0"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          </div>

          {/* Guest Reviews */}
          <ReviewsSection chaletId={chalet.id} />

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
            <AvailabilityCalendar chaletId={chalet.id} />
          </div>

          {/* Booking card */}
          <div data-aos="fade-up" className="top-24 z-50 bg-white rounded-2xl border border-gray-200 shadow-md p-5 space-y-4">
            <div>
              <span className="text-3xl font-bold text-gold-600">{chalet.basePrice.toLocaleString()}</span>
              <span className="text-gray-400 text-sm"> {t('common.sar')} {t('common.per_night')}</span>
              <p className="text-xs text-gray-400 mt-0.5">Base price · weekend/seasonal rates apply</p>
            </div>

            <Button fullWidth size="lg" onClick={handleBook}>{t('chalets.book_now')}</Button>

            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Type</span>
                <ChaletTypeBadge type={chalet.type} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Max guests</span>
                <span className="text-gray-800">{chalet.maxGuests}</span>
              </div>
              {chalet.weekendPrice && chalet.weekendPrice !== chalet.basePrice && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{lang === 'ar' ? 'سعر عطلة نهاية الأسبوع' : 'Weekend price'}</span>
                  <span className="text-gray-800">{chalet.weekendPrice.toLocaleString()} {t('common.sar')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Rating</span>
                <span className="flex items-center gap-1 text-gray-800">
                  <Star size={12} className="fill-gold-500 text-gold-500" /> {chalet.rating}
                </span>
              </div>
            </div>
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
      {galleryOpen && chalet.images.length > 0 && (
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

      <RequestModal
        isOpen={requestOpen}
        onClose={() => setRequestOpen(false)}
        chaletId={id ?? ''}
        chaletName={chalet?.name[lang] ?? ''}
        initialAddons={{}}
      />
    </div>
  );
}
