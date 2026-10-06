import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Star, Quote, CheckCircle, Award, Loader2, MessageSquare, Home, PenLine, X, Bed, Bath, Users, DollarSign, ExternalLink, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { fetchChalets } from '../store/slices/chaletsSlice';
import { fetchMyBookings } from '../store/slices/bookingSlice';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApiReview {
  id: string;
  chaletId: string;
  chaletName: string;
  bookingId: string;
  guestName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

interface PageMeta {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ── API ───────────────────────────────────────────────────────────────────────


async function fetchChaletReviews(chaletId: string, page: number, pageSize: number) {
  try {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    const res = await fetch(`${API_BASE}/api/reviews/chalet/${chaletId}?${params}`);
    if (!res.ok) return null;
    const json = await res.json() as { data?: { reviews?: { items?: ApiReview[] } & PageMeta } };
    const d = json.data?.reviews;
    return {
      items: d?.items ?? [],
      meta: { totalCount: d?.totalCount ?? 0, page: d?.page ?? 1, pageSize: d?.pageSize ?? pageSize, totalPages: d?.totalPages ?? 1, hasNextPage: d?.hasNextPage ?? false, hasPreviousPage: d?.hasPreviousPage ?? false },
    };
  } catch { return null; }
}

async function submitReview(payload: { bookingId: string; rating: number; comment: string }) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const json = await res.json() as { success?: boolean; message?: string; errors?: string[] };
  return { ok: res.ok && Boolean(json.success), message: json.errors?.join(', ') || json.message || '' };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={size} className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)} className="focus:outline-none">
          <Star size={30} className={(hovered || value) >= s ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
        </button>
      ))}
    </div>
  );
}

function AvatarInitial({ name, size = 44 }: { name: string; size?: number }) {
  const colors = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-gold-100 text-gold-700', 'bg-purple-100 text-purple-700', 'bg-rose-100 text-rose-700'];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 ${colors[idx]}`} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function fmtDate(iso: string) {
  try { return format(parseISO(iso), 'MMM d, yyyy'); } catch { return ''; }
}

const cardVariants: Variants = {
  hidden:  { opacity: 0, y: 32 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.06 } }),
};

const TYPE_LABEL: Record<string, { en: string; ar: string; cls: string }> = {
  normal:   { en: 'Standard', ar: 'عادي',    cls: 'bg-sky-50 text-sky-700 border border-sky-200' },
  superior: { en: 'Superior', ar: 'سوبيريور', cls: 'bg-purple-50 text-purple-700 border border-purple-200' },
  vip:      { en: 'VIP',      ar: 'VIP',      cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
};

// ── Page ──────────────────────────────────────────────────────────────────────

type FilterMode = 'all' | 5 | 4 | 3 | 2 | 1;

export function Reviews() {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const dispatch = useAppDispatch();
  const chalets    = useAppSelector((s) => s.chalets.chalets);
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const myBookings = useAppSelector((s) => s.booking.myBookings);

  const [reviews, setReviews]           = useState<ApiReview[]>([]);
  const [meta, setMeta]                 = useState<PageMeta | null>(null);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<FilterMode>('all');
  const [chaletFilter, setChaletFilter] = useState<string>('all');

  // Write review modal
  const [showForm, setShowForm]     = useState(false);
  const [bookingId, setBookingId]   = useState('');
  const [rating, setRating]         = useState(0);
  const [comment, setComment]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (chalets.length === 0) (dispatch as any)(fetchChalets()); // eslint-disable-line @typescript-eslint/no-explicit-any
  }, [dispatch, chalets.length]);

  useEffect(() => {
    if (isAuthenticated && myBookings.length === 0) {
      (dispatch as any)(fetchMyBookings()); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }, [dispatch, isAuthenticated, myBookings.length]);

  async function load() {
    setLoading(true);
    if (chaletFilter !== 'all') {
      // Specific chalet selected
      const r = await fetchChaletReviews(chaletFilter, 1, 100);
      const items = r ? r.items : [];
      setReviews(filter === 'all' ? items : items.filter((i) => i.rating === (filter as number)));
      setMeta(r ? r.meta : null);
    } else {
      // No global GET /api/reviews endpoint — fetch per-chalet in parallel
      if (chalets.length === 0) { setLoading(false); return; }
      const results = await Promise.all(chalets.map((c) => fetchChaletReviews(c.id, 1, 100)));
      const all = results.filter(Boolean).flatMap((r) => r!.items);
      const filtered = filter === 'all' ? all : all.filter((i) => i.rating === (filter as number));
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews(filtered);
      setMeta({ totalCount: filtered.length, page: 1, pageSize: filtered.length, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
    }
    setLoading(false);
  }

  useEffect(() => {
    if (chaletFilter !== 'all' || chalets.length > 0) load();
  }, [filter, chaletFilter, chalets.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmitReview() {
    if (!bookingId) { toast.error(lang === 'ar' ? 'اختر حجزاً' : 'Select a booking'); return; }
    if (rating === 0) { toast.error(lang === 'ar' ? 'اختر تقييماً' : 'Select a rating'); return; }
    setSubmitting(true);
    try {
      const res = await submitReview({ bookingId, rating, comment });
      if (res.ok) {
        toast.success(lang === 'ar' ? 'تم إرسال تقييمك!' : 'Review submitted!');
        setShowForm(false);
        setBookingId(''); setRating(0); setComment('');
        load();
      } else {
        toast.error(res.message || (lang === 'ar' ? 'فشل الإرسال' : 'Submission failed'));
      }
    } catch {
      toast.error(lang === 'ar' ? 'خطأ في الشبكة' : 'Network error');
    } finally {
      setSubmitting(false);
    }
  }

  // Stats from real data only
  const totalCount  = meta?.totalCount ?? 0;
  const avgRating   = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;
  const recommend   = reviews.length ? Math.round((reviews.filter((r) => r.rating >= 4).length / reviews.length) * 100) : 0;
  const featured    = reviews.find((r) => r.comment && r.comment.length > 30) ?? reviews[0] ?? null;

  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    return { stars, count, percent: reviews.length ? Math.round((count / reviews.length) * 100) : 0 };
  });

  const reviewableBookings = myBookings.filter((b) => {
    const s = b.status.toLowerCase();
    return s === 'completed' || s === 'checkedout' || s === 'confirmed';
  });

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-navy-900 py-24 px-4 mb-9">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('/grand.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/90 via-navy-900/70 to-navy-900" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-gold-500/20 text-gold-300 text-sm font-semibold px-5 py-2 rounded-full mb-6 border border-gold-500/20">
              <Award size={14} />
              {lang === 'ar' ? 'تقييمات حقيقية من ضيوفنا' : 'Real Reviews from Our Guests'}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              {lang === 'ar' ? 'ماذا يقول ضيوفنا' : 'What Our Guests Say'}
            </h1>
            <p className="text-navy-300 text-lg mb-12 max-w-xl mx-auto">
              {lang === 'ar' ? 'تجارب حقيقية من ضيوف أقاموا في شاليهات غراند بيتش خيران' : 'Authentic experiences from guests who stayed at GrandeBeach Khairan'}
            </p>
          </motion.div>

          {/* Live stats from API */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="inline-flex flex-col sm:flex-row items-center gap-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl px-10 py-8">
            <div className="text-center">
              <p className="text-6xl font-bold text-white leading-none">
                {loading ? <span className="inline-block w-16 h-14 bg-white/10 rounded-xl animate-pulse" /> : avgRating > 0 ? avgRating.toFixed(1) : '—'}
              </p>
              <StarRow rating={Math.round(avgRating)} size={20} />
              <p className="text-navy-300 text-sm mt-2">{lang === 'ar' ? 'متوسط التقييم' : 'Average Rating'}</p>
            </div>
            <div className="hidden sm:block w-px h-16 bg-white/10" />
            <div className="flex gap-8 sm:gap-10 text-center">
              <div>
                <p className="text-3xl font-bold text-gold-400">{loading ? '…' : totalCount > 0 ? `${totalCount}` : '0'}</p>
                <p className="text-navy-300 text-xs mt-1">{lang === 'ar' ? 'إجمالي التقييمات' : 'Total Reviews'}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gold-400">{loading ? '…' : reviews.length > 0 ? `${recommend}%` : '—'}</p>
                <p className="text-navy-300 text-xs mt-1">{lang === 'ar' ? 'يوصون بنا' : 'Recommend Us'}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gold-400">{loading ? '…' : chalets.length > 0 ? chalets.length : '—'}</p>
                <p className="text-navy-300 text-xs mt-1">{lang === 'ar' ? 'شاليه' : 'Chalets'}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">

        {/* ── Featured review ── */}
        {!loading && featured && featured.comment && (
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="relative bg-navy-900 rounded-3xl overflow-hidden mt-10 mb-12 p-8 sm:p-12">
            <div className="absolute top-0 end-0 w-72 h-72 bg-gold-500/8 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 start-0 w-52 h-52 bg-gold-500/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            <Quote size={44} className="text-gold-500/25 mb-5" />
            <p className="text-white text-xl sm:text-2xl font-light leading-relaxed italic mb-8 max-w-3xl">
              "{featured.comment}"
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <AvatarInitial name={featured.guestName} size={52} />
              <div>
                <p className="text-white font-semibold">{featured.guestName}</p>
                <p className="text-gold-400 text-sm mt-0.5">{featured.chaletName} · {fmtDate(featured.createdAt)}</p>
                <StarRow rating={featured.rating} size={14} />
              </div>
              <div className="ms-auto flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/20 px-4 py-2 rounded-xl">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-emerald-300 text-sm font-medium">{lang === 'ar' ? 'ضيف موثّق' : 'Verified Guest'}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Sidebar + Grid ── */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <div className="w-full lg:w-72 flex-shrink-0 space-y-4">

            {/* Rating breakdown */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-5 text-base">{lang === 'ar' ? 'توزيع التقييمات' : 'Rating Breakdown'}</h3>
              {breakdown.map((row) => (
                <div key={row.stars} className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-semibold text-gray-600 w-3">{row.stars}</span>
                  <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${row.percent}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: 0.08 * (5 - row.stars) }}
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full"
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-7 text-right">{row.count}</span>
                </div>
              ))}
            </div>

            {/* Filter by chalet */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">{lang === 'ar' ? 'تصفية حسب الشاليه' : 'Filter by Chalet'}</h3>
              <div className="relative">
                <select
                  value={chaletFilter}
                  onChange={(e) => { setChaletFilter(e.target.value); }}
                  className="w-full appearance-none text-sm border border-gray-200 rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-white"
                >
                  <option value="all">{lang === 'ar' ? 'جميع الشاليهات' : 'All Chalets'}</option>
                  {chalets.map((c) => (
                    <option key={c.id} value={c.id}>{lang === 'ar' ? c.name.ar : c.name.en}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Write review CTA */}
            {isAuthenticated && user ? (
              <div className="bg-gradient-to-br from-navy-800 to-navy-900 rounded-2xl p-5 border border-navy-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-gold-500/20 flex items-center justify-center">
                    <PenLine size={15} className="text-gold-400" />
                  </div>
                  <p className="font-bold text-white text-sm">{lang === 'ar' ? 'شارك تجربتك' : 'Share Your Experience'}</p>
                </div>
                <p className="text-navy-300 text-xs mb-4 leading-relaxed">
                  {lang === 'ar' ? 'أقمت معنا؟ تقييمك يساعد الضيوف الآخرين.' : 'Stayed with us? Your review helps other guests.'}
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
                >
                  {lang === 'ar' ? 'كتابة تقييم' : 'Write a Review'}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
                <MessageSquare size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-600 text-sm font-medium mb-1">{lang === 'ar' ? 'سجّل دخولك للتقييم' : 'Sign in to leave a review'}</p>
                <Link to="/login" className="inline-block mt-2 px-4 py-2 bg-gold-500 text-white text-sm font-semibold rounded-xl hover:bg-gold-600 transition-colors">
                  {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                </Link>
              </div>
            )}
          </div>

          {/* Reviews grid */}
          <div className="flex-1 min-w-0">

            {/* Header + star filters */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{lang === 'ar' ? 'آراء الضيوف' : 'Guest Reviews'}</h2>
                {!loading && totalCount > 0 && (
                  <p className="text-sm text-gray-400 mt-0.5">
                    {lang === 'ar' ? `${reviews.length} من ${totalCount} تقييم` : `Showing ${reviews.length} of ${totalCount} reviews`}
                  </p>
                )}
              </div>
              {chaletFilter === 'all' && (
                <div className="flex gap-2 flex-wrap">
                  {(['all', 5, 4, 3, 2, 1] as FilterMode[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => { setFilter(f); }}
                      className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${filter === f ? 'bg-navy-900 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}
                    >
                      {f === 'all' ? (lang === 'ar' ? 'الكل' : 'All') : `${f} ★`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Skeleton */}
            {loading && reviews.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[1, 2, 3, 4, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="h-44 bg-gray-100 animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="h-3 bg-gray-100 rounded-full animate-pulse w-2/3" />
                          <div className="h-2.5 bg-gray-100 rounded-full animate-pulse w-1/3" />
                        </div>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full animate-pulse w-1/2" />
                      <div className="space-y-1.5">
                        <div className="h-2.5 bg-gray-100 rounded-full animate-pulse" />
                        <div className="h-2.5 bg-gray-100 rounded-full animate-pulse w-4/5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                  <MessageSquare size={28} className="text-gray-300" />
                </div>
                <p className="font-semibold text-gray-600 text-lg">{lang === 'ar' ? 'لا توجد تقييمات' : 'No reviews yet'}</p>
                <p className="text-sm text-gray-400 mt-1">{lang === 'ar' ? 'كن أول من يشارك تجربته' : 'Be the first to share your experience'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <AnimatePresence mode="popLayout">
                  {reviews.map((r, i) => {
                    const chalet = chalets.find((c) => c.id === r.chaletId || c.name.en.toLowerCase() === r.chaletName?.toLowerCase());
                    const img    = chalet?.images?.[0] ?? null;
                    const typeInfo = chalet ? TYPE_LABEL[chalet.type] : null;
                    const chaletDisplayName = chalet ? (lang === 'ar' ? chalet.name.ar : chalet.name.en) : r.chaletName;
                    const totalBeds = (chalet?.bedrooms.filter((b) => b.type === 'master').length ?? 0) + (chalet?.bedrooms.filter((b) => b.type === 'single').length ?? 0);

                    return (
                      <motion.div
                        key={r.id}
                        custom={i}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, scale: 0.95 }}
                        layout
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                      >
                        {/* Chalet section — clicking navigates to detail page */}
                        {img ? (
                          <Link to={chalet ? `/chalets/${chalet.id}` : '#'} className="block p-2 group">
                          <div className="relative h-44 overflow-hidden rounded-2xl">
                            <img src={img} alt={chaletDisplayName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                            <div className="absolute bottom-0 inset-x-0 px-4 py-3 flex items-end justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Home size={11} className="text-white/70 flex-shrink-0" />
                                  <span className="text-white text-xs font-bold truncate">{chaletDisplayName}</span>
                                </div>
                                {chalet && (
                                  <div className="flex items-center gap-2.5 text-white/75 text-[10px] flex-wrap">
                                    <span className="flex items-center gap-0.5"><Bed size={9} /> {totalBeds} {lang === 'ar' ? 'غرفة' : 'beds'}</span>
                                    <span className="flex items-center gap-0.5"><Bath size={9} /> {chalet.bathrooms}</span>
                                    <span className="flex items-center gap-0.5"><Users size={9} /> {chalet.maxGuests}</span>
                                    <span className="flex items-center gap-0.5"><DollarSign size={9} /> {chalet.basePrice} KWD</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                {typeInfo && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeInfo.cls}`}>
                                    {lang === 'ar' ? typeInfo.ar : typeInfo.en}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          </Link>
                        ) : (
                          /* No image — compact info bar */
                          <Link to={chalet ? `/chalets/${chalet.id}` : '#'} className="block bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100 px-4 py-3 flex items-center justify-between gap-2 hover:from-gray-100 hover:to-gray-150 transition-colors">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Home size={12} className="text-gray-400 flex-shrink-0" />
                                <span className="text-gray-800 text-xs font-bold truncate">{chaletDisplayName}</span>
                                {typeInfo && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${typeInfo.cls}`}>
                                    {lang === 'ar' ? typeInfo.ar : typeInfo.en}
                                  </span>
                                )}
                              </div>
                              {chalet && (
                                <div className="flex items-center gap-2 text-gray-400 text-[10px]">
                                  <span className="flex items-center gap-0.5"><Bed size={9} /> {totalBeds}</span>
                                  <span className="flex items-center gap-0.5"><Bath size={9} /> {chalet.bathrooms}</span>
                                  <span className="flex items-center gap-0.5"><Users size={9} /> {chalet.maxGuests}</span>
                                  <span className="flex items-center gap-0.5"><DollarSign size={9} /> {chalet.basePrice} KWD</span>
                                </div>
                              )}
                            </div>
                            {chalet && (
                              <span className="flex items-center gap-1 text-[11px] text-gold-600 font-semibold flex-shrink-0">
                                <ExternalLink size={11} /> {lang === 'ar' ? 'عرض' : 'View'}
                              </span>
                            )}
                          </Link>
                        )}

                        {/* Review content */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <AvatarInitial name={r.guestName} size={40} />
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 text-sm truncate">{r.guestName}</p>
                                <p className="text-gray-400 text-xs">{fmtDate(r.createdAt)}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                <CheckCircle size={10} />
                                <span>{lang === 'ar' ? 'موثّق' : 'Verified'}</span>
                              </div>
                              <span className="text-sm font-bold text-amber-500">{r.rating}.0 / 5</span>
                            </div>
                          </div>

                          <StarRow rating={r.rating} size={15} />

                          {r.comment ? (
                            <p className="text-gray-600 text-sm leading-relaxed mt-3">{r.comment}</p>
                          ) : (
                            <p className="text-gray-300 text-sm italic mt-3">{lang === 'ar' ? 'لا يوجد تعليق' : 'No comment'}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {!loading && reviews.length > 0 && (
              <p className="text-center text-xs text-gray-400 mt-8 pb-2">
                {lang === 'ar' ? `— ${reviews.length} تقييم —` : `— ${reviews.length} reviews —`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Write Review Modal ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-7"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowForm(false)} className="absolute top-4 end-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <X size={15} className="text-gray-600" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-gold-50 flex items-center justify-center">
                  <PenLine size={18} className="text-gold-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{lang === 'ar' ? 'كتابة تقييم' : 'Write a Review'}</h2>
                  <p className="text-xs text-gray-400">{lang === 'ar' ? 'شارك تجربتك مع الضيوف الآخرين' : 'Share your experience with other guests'}</p>
                </div>
              </div>

              {/* Booking selector */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">{lang === 'ar' ? 'اختر الحجز' : 'Select Booking'}</label>
                {reviewableBookings.length === 0 ? (
                  <p className="text-sm text-gray-400 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    {lang === 'ar' ? 'لا توجد حجوزات مكتملة للتقييم.' : 'No completed bookings available to review.'}
                  </p>
                ) : (
                  <div className="relative">
                    <select value={bookingId} onChange={(e) => setBookingId(e.target.value)}
                      className="w-full appearance-none text-sm border border-gray-200 rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-white">
                      <option value="">{lang === 'ar' ? '— اختر حجزاً —' : '— Choose a booking —'}</option>
                      {reviewableBookings.map((b) => (
                        <option key={b.id} value={b.id}>{b.chaletName} · #{b.bookingNumber}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Star rating */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">{lang === 'ar' ? 'التقييم' : 'Rating'}</label>
                <div className="flex items-center gap-3">
                  <StarPicker value={rating} onChange={setRating} />
                  {rating > 0 && <span className="text-sm font-bold text-amber-500">{rating}/5</span>}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">{lang === 'ar' ? 'تعليقك (اختياري)' : 'Comment (optional)'}</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder={lang === 'ar' ? 'شارك تجربتك بالتفصيل...' : 'Tell us about your stay...'}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>

              <button
                onClick={handleSubmitReview}
                disabled={submitting || reviewableBookings.length === 0}
                className="w-full bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {lang === 'ar' ? 'إرسال التقييم' : 'Submit Review'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
