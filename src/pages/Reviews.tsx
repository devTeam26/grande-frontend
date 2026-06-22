import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Star, Quote, CheckCircle, ThumbsUp, Award, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FaGoogle, FaTripadvisor, FaAirbnb } from 'react-icons/fa';
import { SiBookingdotcom } from 'react-icons/si';

const REVIEWS = [
  {
    id: 1,
    name: 'Sarah Al-Mansouri',
    country: 'Kuwait',
    flag: '🇰🇼',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80',
    rating: 5,
    date: 'March 2025',
    title: 'Absolutely breathtaking experience!',
    text: 'The chalet exceeded every expectation. Waking up to the sound of waves with a private pool was pure luxury. The staff were incredibly attentive and made us feel like royalty. Will definitely return!',
    property: 'Grande VIP 1',
    platform: 'google',
    helpful: 42,
    verified: true,
    featured: true,
  },
  {
    id: 2,
    name: 'Ahmed Al-Rashidi',
    country: 'Kuwait',
    flag: '🇰🇼',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80',
    rating: 5,
    date: 'February 2025',
    title: 'Perfect family getaway',
    text: 'We brought the whole family and everyone had an amazing time. The kids loved the beach access and the adults enjoyed the spa. The property is exactly as shown — spotlessly clean and beautifully maintained.',
    property: 'Grande Standard A2',
    platform: 'booking',
    helpful: 38,
    verified: true,
    featured: false,
  },
  {
    id: 3,
    name: 'Layla Hassan',
    country: 'UAE',
    flag: '🇦🇪',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80',
    rating: 5,
    date: 'January 2025',
    title: 'Unmatched luxury & serenity',
    text: 'I travel extensively for work and this is hands down one of the most stunning properties I have ever stayed at. The sunset views from the infinity pool were unforgettable. The private chef made every meal special.',
    property: 'Grande VIP 2',
    platform: 'airbnb',
    helpful: 55,
    verified: true,
    featured: false,
  },
  {
    id: 4,
    name: 'Mohammed Al-Enezi',
    country: 'Kuwait',
    flag: '🇰🇼',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80',
    rating: 4,
    date: 'December 2024',
    title: 'Wonderful stay, highly recommend',
    text: 'Beautiful location right on the sea. The chalet was spacious and modern. Check-in was smooth and the team was very responsive. Only minor suggestion — the BBQ area could use an upgrade, but everything else was perfect.',
    property: 'Grande Superior B1',
    platform: 'tripadvisor',
    helpful: 29,
    verified: true,
    featured: false,
  },
  {
    id: 5,
    name: 'Fatima Al-Sabah',
    country: 'Kuwait',
    flag: '🇰🇼',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80',
    rating: 5,
    date: 'November 2024',
    title: 'A dream come true!',
    text: 'Celebrated our anniversary here and it was magical. The team had rose petals and candles set up when we arrived. The ocean view from every room is stunning. GrandeBeach truly understands luxury hospitality.',
    property: 'Grande Superior B4',
    platform: 'google',
    helpful: 61,
    verified: true,
    featured: false,
  },
  {
    id: 6,
    name: 'Omar Khalid',
    country: 'Bahrain',
    flag: '🇧🇭',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80',
    rating: 5,
    date: 'October 2024',
    title: 'Five stars is not enough!',
    text: 'I have stayed in luxury resorts around the world and GrandeBeach Khairan stands alongside the very best. The private beach is pristine, the interiors are magazine-worthy and the hospitality is genuinely warm.',
    property: 'Grande VIP 1',
    platform: 'booking',
    helpful: 74,
    verified: true,
    featured: false,
  },
];

const RATING_BREAKDOWN = [
  { stars: 5, count: 89, percent: 82 },
  { stars: 4, count: 14, percent: 13 },
  { stars: 3, count: 4, percent: 4 },
  { stars: 2, count: 1, percent: 1 },
  { stars: 1, count: 0, percent: 0 },
];

const PLATFORMS = [
  { name: 'Google', icon: FaGoogle, rating: '4.9', reviews: '312', color: '#4285F4', bg: '#EBF1FB' },
  { name: 'Booking.com', icon: SiBookingdotcom, rating: '9.4', reviews: '187', color: '#003580', bg: '#E6EDF7' },
  { name: 'Airbnb', icon: FaAirbnb, rating: '4.97', reviews: '98', color: '#FF5A5F', bg: '#FFF0F0' },
  { name: 'TripAdvisor', icon: FaTripadvisor, rating: '5.0', reviews: '64', color: '#34E0A1', bg: '#EAFAF5' },
];

const platformIcon = (p: string) => {
  switch (p) {
    case 'google': return <FaGoogle size={13} className="text-blue-500" />;
    case 'booking': return <SiBookingdotcom size={13} className="text-blue-800" />;
    case 'airbnb': return <FaAirbnb size={13} className="text-red-400" />;
    case 'tripadvisor': return <FaTripadvisor size={13} className="text-emerald-500" />;
    default: return null;
  }
};

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  );
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

export function Reviews() {
  useTranslation();
  const [filter, setFilter] = useState<'all' | 5 | 4>(  'all');
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const filtered = REVIEWS.filter((r) => filter === 'all' || r.rating === filter);
  const featured = REVIEWS.find((r) => r.featured)!;

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-navy-900 py-20 px-4">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=60')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/80 via-navy-900/60 to-navy-900/90" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-gold-500/20 text-gold-300 text-sm font-medium px-4 py-2 rounded-full mb-6">
              <Award size={14} /> Trusted by Thousands of Guests
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              What Our Guests Say
            </h1>
            <p className="text-navy-200 text-lg mb-10 max-w-xl mx-auto">
              Real experiences from real guests who stayed at GrandeBeach Khairan
            </p>
          </motion.div>

          {/* Big rating */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8"
          >
            <div className="text-center">
              <p className="text-7xl font-bold text-white leading-none">4.9</p>
              <StarRow rating={5} size={24} />
              <p className="text-navy-300 text-sm mt-2">Overall Rating</p>
            </div>
            <div className="hidden sm:block w-px h-20 bg-navy-600" />
            <div className="grid grid-cols-3 gap-6 text-center">
              {[
                { value: '661+', label: 'Total Reviews' },
                { value: '98%', label: 'Recommend Us' },
                { value: '5★', label: 'Avg. Stay Rating' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-gold-400">{s.value}</p>
                  <p className="text-navy-300 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Platform Scores ── */}
      <section className="max-w-5xl mx-auto px-4 mt-10 mb-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {PLATFORMS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
              className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center gap-2 hover:shadow-lg transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: p.bg }}>
                <p.icon size={22} style={{ color: p.color }} />
              </div>
              <p className="font-bold text-gray-900 text-xl">{p.rating}</p>
              <StarRow rating={5} size={12} />
              <p className="text-gray-400 text-xs">{p.reviews} reviews on {p.name}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

        {/* ── Featured Review ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative bg-navy-900 rounded-3xl overflow-hidden mb-14 p-8 sm:p-12"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <Quote size={48} className="text-gold-500/30 mb-4" />
          <p className="text-white text-xl sm:text-2xl font-light leading-relaxed italic mb-8 relative max-w-3xl">
            "{featured.text}"
          </p>
          <div className="flex items-center gap-4">
            <img src={featured.avatar} alt={featured.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-gold-400" />
            <div>
              <p className="text-white font-semibold">{featured.name} {featured.flag}</p>
              <p className="text-gold-400 text-sm">{featured.property} · {featured.date}</p>
              <StarRow rating={featured.rating} size={14} />
            </div>
            <div className="ms-auto hidden sm:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
              <CheckCircle size={15} className="text-emerald-400" />
              <span className="text-white text-sm">Verified Guest</span>
            </div>
          </div>
        </motion.div>

        {/* ── Rating Breakdown + Filters ── */}
        <div className="flex flex-col lg:flex-row gap-8 mb-10">
          <div className="bg-white rounded-2xl p-6 shadow-sm w-full lg:w-72 flex-shrink-0">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Rating Breakdown</h3>
            {RATING_BREAKDOWN.map((row) => (
              <div key={row.stars} className="flex items-center gap-3 mb-2.5">
                <span className="text-sm text-gray-500 w-4">{row.stars}</span>
                <Star size={13} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${row.percent}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.1 * (5 - row.stars) }}
                    className="h-full bg-amber-400 rounded-full"
                  />
                </div>
                <span className="text-xs text-gray-400 w-6">{row.count}</span>
              </div>
            ))}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Guest Reviews</h2>
              <div className="flex gap-2">
                {(['all', 5, 4] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      filter === f
                        ? 'bg-navy-800 text-white shadow'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-navy-300'
                    }`}
                  >
                    {f === 'all' ? 'All' : `${f} Stars`}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Review Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <AnimatePresence mode="popLayout">
                {filtered.map((r, i) => (
                  <motion.div
                    key={r.id}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                    onHoverStart={() => setHoveredId(r.id)}
                    onHoverEnd={() => setHoveredId(null)}
                    className={`bg-white rounded-2xl p-5 shadow-sm border transition-all duration-300 cursor-default ${
                      hoveredId === r.id ? 'shadow-lg border-gold-300 -translate-y-1' : 'border-gray-100'
                    }`}
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={r.avatar} alt={r.name}
                            className="w-11 h-11 rounded-full object-cover border-2 border-gray-100" />
                          <span className="absolute -bottom-0.5 -right-0.5 text-sm leading-none">{r.flag}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                          <p className="text-gray-400 text-xs">{r.country} · {r.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                        {platformIcon(r.platform)}
                      </div>
                    </div>

                    <StarRow rating={r.rating} size={14} />

                    <h4 className="font-semibold text-gray-900 mt-2 mb-1 text-sm">{r.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{r.text}</p>

                    {/* Card footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Globe size={12} />
                        <span className="text-gold-600 font-medium">{r.property}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {r.verified && (
                          <div className="flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle size={11} />
                            <span>Verified</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <ThumbsUp size={11} />
                          <span>{r.helpful}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-gold-500 to-amber-500 rounded-3xl p-10 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-3">Share Your Experience</h2>
          <p className="text-amber-100 mb-6 max-w-md mx-auto">
            Stayed with us? We'd love to hear your story. Your review helps other guests discover their perfect stay.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {PLATFORMS.map((p) => (
              <a
                key={p.name}
                href="#"
                className="flex items-center gap-2 bg-white/90 hover:bg-white text-gray-800 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <p.icon size={16} style={{ color: p.color }} />
                Review on {p.name}
              </a>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
