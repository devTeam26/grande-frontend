import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Star, Shield, Clock, Award, ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/useAppSelector';
import { ChaletCard } from '../components/chalets/ChaletCard';
import { Button } from '../components/ui/Button';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setFilter } from '../store/slices/chaletsSlice';
import type { ChaletType } from '../types';

type TabCard = {
  nameEn: string; nameAr: string;
  descEn: string; descAr: string;
  detailEn: string; detailAr: string;
  img: string; imgs: string[];
  mt: boolean;
};

const TAB_ITEMS: Record<'dining' | 'activities' | 'kuwait', TabCard[]> = {
  dining: [
    {
      nameEn: 'Pool Bar', nameAr: 'بار المسبح', mt: false,
      descEn: 'Cool refreshments and light bites by the pool — the perfect midday escape.',
      descAr: 'مشروبات منعشة ووجبات خفيفة بجانب المسبح.',
      detailEn: 'Unwind at our poolside bar where handcrafted cocktails, fresh juices and light bites are served throughout the day. Lounge on a sun chair, dip your feet in the water and let the Gulf breeze carry your worries away. Open daily 10 AM – 10 PM.',
      detailAr: 'استرخِ في بارنا بجانب المسبح حيث تُقدَّم الكوكتيلات المصنوعة يدوياً والعصائر الطازجة والوجبات الخفيفة طوال اليوم. مفتوح يومياً من 10 ص حتى 10 م.',
      img: 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg?auto=compress&cs=tinysrgb&w=600',
      imgs: [
        'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/2397274/pexels-photo-2397274.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/1484516/pexels-photo-1484516.jpeg?auto=compress&cs=tinysrgb&w=900',
      ],
    },
    {
      nameEn: 'Beach Café', nameAr: 'كافيه الشاطئ', mt: true,
      descEn: 'Sip your morning coffee with a panoramic Gulf view and soft sea breeze.',
      descAr: 'احتسِ قهوة صباحك مع إطلالة بانورامية على الخليج.',
      detailEn: 'Start your morning at the Beach Café with premium arabica coffee, fresh pastries and light breakfast options — all with a panoramic Arabian Gulf view. Whether you prefer a quiet corner or a beach-facing seat, every sip is a luxury. Open daily from 7 AM.',
      detailAr: 'ابدأ صباحك في كافيه الشاطئ مع قهوة عربية فاخرة ومعجنات طازجة وخيارات إفطار خفيفة مع إطلالة على الخليج. مفتوح يومياً من الساعة 7 صباحاً.',
      img: 'https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=600',
      imgs: [
        'https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=900',
      ],
    },
    {
      nameEn: 'Rooftop Dining', nameAr: 'طعام على السطح', mt: false,
      descEn: 'Elevated cuisine and cocktails overlooking the Gulf at sunset.',
      descAr: 'مأكولات راقية بإطلالة على الخليج عند الغروب.',
      detailEn: 'Dine under the stars at our signature rooftop restaurant, where international and Kuwaiti cuisine meets breathtaking Gulf views. A curated cocktail menu accompanies every dish. Reservations recommended. Open evenings 7 PM – midnight.',
      detailAr: 'تناول العشاء تحت النجوم في مطعمنا على السطح حيث تلتقي المطبخ الدولي والكويتي بإطلالات خلابة على الخليج. يُنصح بالحجز المسبق. مفتوح مساءً من 7 م حتى منتصف الليل.',
      img: 'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=600',
      imgs: [
        'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/1581554/pexels-photo-1581554.jpeg?auto=compress&cs=tinysrgb&w=900',
      ],
    },
    {
      nameEn: 'Family BBQ', nameAr: 'شواء عائلي', mt: true,
      descEn: 'Weekend BBQ nights bring families together under open skies.',
      descAr: 'ليالي الشواء تجمع العائلات تحت سماء مفتوحة.',
      detailEn: 'Friday and Saturday evenings come alive with our family BBQ nights — fresh grills, mezze spreads and live Arabic music in a relaxed outdoor setting. A beloved Grande Beach tradition. From 6 PM every weekend.',
      detailAr: 'تحيا ليالي الجمعة والسبت مع ليالي الشواء العائلية — مشويات طازجة ومزة غنية وموسيقى عربية في أجواء خارجية مريحة. من الساعة 6 مساءً كل نهاية أسبوع.',
      img: 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=600',
      imgs: [
        'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/533360/pexels-photo-533360.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/1580138/pexels-photo-1580138.jpeg?auto=compress&cs=tinysrgb&w=900',
      ],
    },
  ],
  activities: [
    {
      nameEn: 'Swimming Pool', nameAr: 'مسبح خاص', mt: false,
      descEn: 'Open year-round, heated and maintained for guests of all ages.',
      descAr: 'مفتوح طوال العام، مدفأ لجميع الأعمار.',
      detailEn: 'Our resort pools are open 365 days a year, maintained at the perfect temperature year-round. Children\'s shallow sections, sun loungers and towel service are all included. Pool hours: 8 AM – 10 PM daily.',
      detailAr: 'مسابح منتجعنا مفتوحة 365 يوماً في السنة وتُحافَظ على درجة الحرارة المثالية. تشمل أقسام للأطفال وكراسي الشمس وخدمة المناشف. ساعات المسبح: 8 ص – 10 م يومياً.',
      img: 'https://images.pexels.com/photos/261101/pexels-photo-261101.jpeg?auto=compress&cs=tinysrgb&w=600',
      imgs: [
        'https://images.pexels.com/photos/261101/pexels-photo-261101.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/1179018/pexels-photo-1179018.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/2440021/pexels-photo-2440021.jpeg?auto=compress&cs=tinysrgb&w=900',
      ],
    },
    {
      nameEn: 'Beach Volleyball', nameAr: 'كرة الشاطئ', mt: true,
      descEn: 'Friendly matches on pristine sand courts right on the waterfront.',
      descAr: 'مباريات ودية على ملاعب رمل نظيفة على الشاطئ.',
      detailEn: 'Challenge friends and family to a match on our dedicated beachfront volleyball courts. Equipment is available free of charge at the activities desk. Organised tournaments are held every Friday morning — all skill levels welcome.',
      detailAr: 'تحدَّ أصدقاءك وعائلتك في ملاعب كرة الشاطئ المخصصة على الواجهة البحرية. المعدات متاحة مجاناً من مكتب الأنشطة. تُقام بطولات كل جمعة صباحاً لجميع المستويات.',
      img: 'https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg?auto=compress&cs=tinysrgb&w=600',
      imgs: [
        'https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/1181743/pexels-photo-1181743.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/1003268/pexels-photo-1003268.jpeg?auto=compress&cs=tinysrgb&w=900',
      ],
    },
    {
      nameEn: 'Water Sports', nameAr: 'رياضات مائية', mt: false,
      descEn: 'Jet skiing, kayaking and paddleboarding on the Arabian Gulf.',
      descAr: 'تزلج مائي وكياك في مياه الخليج العربي الدافئة.',
      detailEn: 'Ride the waves of the Arabian Gulf with our range of water sports — from jet skis to kayaks and stand-up paddleboards. Certified instructors are available for beginners. Equipment rental charged per hour from the beach hut.',
      detailAr: 'ركب أمواج الخليج العربي مع مجموعتنا من الرياضات المائية — من الجت سكي إلى الكياك وألواح التجديف. مدربون معتمدون للمبتدئين. التأجير بالساعة من كوخ الشاطئ.',
      img: 'https://images.pexels.com/photos/1654693/pexels-photo-1654693.jpeg?auto=compress&cs=tinysrgb&w=600',
      imgs: [
        'https://images.pexels.com/photos/1654693/pexels-photo-1654693.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/1076097/pexels-photo-1076097.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/2547565/pexels-photo-2547565.jpeg?auto=compress&cs=tinysrgb&w=900',
      ],
    },
    {
      nameEn: 'Fitness Centre', nameAr: 'مركز اللياقة', mt: true,
      descEn: 'A fully equipped gym with sea views to keep you energized.',
      descAr: 'صالة رياضية متكاملة بإطلالة على البحر.',
      detailEn: 'Stay in peak condition at our fully equipped fitness centre featuring state-of-the-art cardio machines, free weights and resistance equipment — all with panoramic sea views. Personal training sessions available on request. Open 6 AM – 11 PM daily.',
      detailAr: 'ابقَ في أفضل حالاتك في مركز اللياقة المجهز بالكامل بأحدث أجهزة الكارديو والأثقال الحرة ومعدات المقاومة مع إطلالات بحرية. جلسات التدريب الشخصي متاحة عند الطلب. مفتوح 6 ص – 11 م يومياً.',
      img: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=600',
      imgs: [
        'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/3076516/pexels-photo-3076516.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=900',
      ],
    },
  ],
  kuwait: [
    {
      nameEn: 'Kuwait Towers', nameAr: 'أبراج الكويت', mt: false,
      descEn: 'The iconic symbol of modern Kuwait rising above the Gulf coast.',
      descAr: 'الرمز الشهير لكويت الحديثة يرتفع فوق ساحل الخليج.',
      detailEn: 'Rising majestically above Kuwait Bay, the Kuwait Towers are the most recognisable landmark in the country. The main tower houses a revolving observation deck and restaurant offering 360° views of the city and the Gulf. Just 88 km from Grande Beach Khairan.',
      detailAr: 'ترتفع أبراج الكويت بشموخ فوق خليج الكويت وهي المعلم الأكثر شهرة في البلاد. تضم البرج الرئيسي منصة مراقبة دوارة ومطعماً يوفر إطلالات 360 درجة على المدينة والخليج. على بُعد 88 كم من غراند بيتش خيران.',
      img: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600',
      imgs: [
        'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/3694733/pexels-photo-3694733.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/2161467/pexels-photo-2161467.jpeg?auto=compress&cs=tinysrgb&w=900',
      ],
    },
    {
      nameEn: 'Scientific Center', nameAr: 'المركز العلمي', mt: true,
      descEn: "The Middle East's largest aquarium and world-class IMAX experience.",
      descAr: 'أكبر أكواريوم في الشرق الأوسط وتجربة IMAX عالمية.',
      detailEn: "Kuwait's Scientific Center is home to the largest aquarium in the Middle East, a natural history museum and an IMAX theatre. Discover marine life from the Arabian Gulf up close. Open Sun–Thu 9 AM–9 PM, Fri–Sat 2–10 PM.",
      detailAr: 'يضم المركز العلمي الكويتي أكبر أكواريوم في الشرق الأوسط ومتحفاً للتاريخ الطبيعي ومسرح IMAX. مفتوح أحد–خميس 9 ص–9 م، جمعة–سبت 2–10 م.',
      img: 'https://images.pexels.com/photos/1298601/pexels-photo-1298601.jpeg?auto=compress&cs=tinysrgb&w=600',
      imgs: [
        'https://images.pexels.com/photos/1298601/pexels-photo-1298601.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/2280547/pexels-photo-2280547.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/3156482/pexels-photo-3156482.jpeg?auto=compress&cs=tinysrgb&w=900',
      ],
    },
    {
      nameEn: 'Al Mubarakiya Souq', nameAr: 'سوق المباركية', mt: false,
      descEn: "Kuwait's oldest marketplace — rich with spices, handicrafts and heritage.",
      descAr: 'أقدم أسواق الكويت، يزخر بالتوابل والحرف والموروث الأصيل.',
      detailEn: "Al Mubarakiya is Kuwait City's oldest market, dating back over a century. Wander through alleys lined with spice sellers, traditional jewellery, handwoven textiles, dates and local sweets. Open 8 AM–1 PM and 4–10 PM.",
      detailAr: 'سوق المباركية هو أقدم وأعرق أسواق الكويت. تجول في أزقته المليئة بالتوابل والمجوهرات التقليدية والأقمشة المنسوجة يدوياً والحلويات المحلية. مفتوح 8 ص–1 م و4–10 م.',
      img: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=600',
      imgs: [
        'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/2519844/pexels-photo-2519844.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/4449068/pexels-photo-4449068.jpeg?auto=compress&cs=tinysrgb&w=900',
      ],
    },
    {
      nameEn: 'Al Kout Mall', nameAr: 'مول الكوت', mt: true,
      descEn: 'Waterfront shopping and dining just 20 minutes from Grande Beach Khairan.',
      descAr: 'تسوق وطعام على الواجهة البحرية على بُعد 20 دقيقة فقط.',
      detailEn: "Al Kout Mall is one of Kuwait's premier waterfront shopping destinations, featuring over 200 retail stores, a multiplex cinema, and a marina-side promenade lined with international restaurants. Located in Fahaheel, just 20 minutes from Grande Beach.",
      detailAr: 'مول الكوت هو أحد أبرز وجهات التسوق على الواجهة البحرية في الكويت، ويضم أكثر من 200 متجر وسينما متعددة القاعات وكورنيش المارينا. يقع في الفحيحيل على بُعد 20 دقيقة من غراند بيتش.',
      img: 'https://images.pexels.com/photos/1995842/pexels-photo-1995842.jpeg?auto=compress&cs=tinysrgb&w=600',
      imgs: [
        'https://images.pexels.com/photos/1995842/pexels-photo-1995842.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/1995842/pexels-photo-1995842.jpeg?auto=compress&cs=tinysrgb&w=900',
        'https://images.pexels.com/photos/1995842/pexels-photo-1995842.jpeg?auto=compress&cs=tinysrgb&w=900',
      ],
    },
  ],
};

export function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const lang = i18n.language as 'en' | 'ar';

  const chalets = useAppSelector((s) => s.chalets.chalets);

  const [typeFilter, setTypeFilter] = useState<'all' | ChaletType>('all');
  const [unitFilter, setUnitFilter] = useState<string | null>(null);

  const INVENTORY = [
    { unit: 'A1', type: 'normal'   as ChaletType, id: 'c01', price: 350 },
    { unit: 'A2', type: 'normal'   as ChaletType, id: 'c02', price: 350 },
    { unit: 'A3', type: 'normal'   as ChaletType, id: 'c03', price: 350 },
    { unit: 'A4', type: 'normal'   as ChaletType, id: 'c04', price: 350 },
    { unit: 'B1', type: 'superior' as ChaletType, id: 'c06', price: 500 },
    { unit: 'B2', type: 'superior' as ChaletType, id: 'c07', price: 500 },
    { unit: 'B3', type: 'superior' as ChaletType, id: 'c08', price: 500 },
    { unit: 'B4', type: 'superior' as ChaletType, id: 'c09', price: 500 },
    { unit: 'VIP 1', type: 'vip'   as ChaletType, id: 'c11', price: 750 },
    { unit: 'VIP 2', type: 'vip'   as ChaletType, id: 'c12', price: 750 },
  ];

  const filteredInventory = typeFilter === 'all'
    ? INVENTORY
    : INVENTORY.filter((u) => u.type === typeFilter);

  const displayChalets = (() => {
    if (unitFilter) return chalets.filter((c) => c.id === INVENTORY.find((u) => u.unit === unitFilter)?.id);
    if (typeFilter !== 'all') return chalets.filter((c) => c.type === typeFilter);
    return chalets.filter((c) => c.featured).slice(0, 6);
  })();

  function handleUnitClick(unit: string) {
    if (unitFilter === unit) { setUnitFilter(null); return; }
    setUnitFilter(unit);
    setTypeFilter('all');
  }

  function handleTypeClick(key: 'all' | ChaletType) {
    setTypeFilter(key);
    setUnitFilter(null);
  }

  const [searchCheckIn, setSearchCheckIn] = useState('');
  const [searchCheckOut, setSearchCheckOut] = useState('');
  const [searchGuests, setSearchGuests] = useState('2');
  const [sliderIdx, setSliderIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'dining' | 'activities' | 'kuwait'>('dining');
  const [modalCard, setModalCard] = useState<TabCard | null>(null);
  const [modalPhotoIdx, setModalPhotoIdx] = useState(0);
  const diningRef      = useRef<HTMLDivElement>(null);
  const activitiesRef  = useRef<HTMLDivElement>(null);
  const kuwaitRef      = useRef<HTMLDivElement>(null);

  function scrollTab(dir: 'left' | 'right') {
    const el = (activeTab === 'dining' ? diningRef : activeTab === 'activities' ? activitiesRef : kuwaitRef).current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -285 : 285, behavior: 'smooth' });
  }
  const slides = chalets.slice(0, 6);

  function handleSearch() {
    if (searchCheckIn) dispatch(setFilter({ key: 'checkIn', value: searchCheckIn }));
    if (searchCheckOut) dispatch(setFilter({ key: 'checkOut', value: searchCheckOut }));
    if (searchGuests) dispatch(setFilter({ key: 'guests', value: Number(searchGuests) }));
    navigate('/chalets');
  }

  const features = [
    { icon: Shield, title: { en: 'Secure Booking', ar: 'حجز آمن' }, desc: { en: '100% secure payments with Tap, Deema & Taly', ar: 'مدفوعات آمنة 100% عبر Tap وDeema وTaly' } },
    { icon: Clock, title: { en: 'Flexible Cancellation', ar: 'إلغاء مرن' }, desc: { en: 'Free cancellation up to 7 days before check-in', ar: 'إلغاء مجاني حتى 7 أيام قبل الوصول' } },
    { icon: Award, title: { en: 'Loyalty Rewards', ar: 'مكافآت الولاء' }, desc: { en: 'Earn points with every stay, redeem for discounts', ar: 'اكسب نقاطاً مع كل إقامة وتحويلها لخصومات' } },
    { icon: Star, title: { en: 'Premium Quality', ar: 'جودة متميزة' }, desc: { en: 'Hand-picked luxury chalets with 5-star service', ar: 'شاليهات فاخرة مختارة بعناية مع خدمة 5 نجوم' } },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[720px] flex flex-col items-center justify-center overflow-hidden bg-black">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/IMG_7006.MP4"
          poster="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

        {/* Centered title */}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 bg-gold-500/20 text-gold-300 text-sm font-medium px-4 py-2 rounded-full mb-6">
              <MapPin size={14} /> GrandeBeach Khairan, Kuwait
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">
              {t('home.hero_title')}
            </h1>
            <p className="text-white/80 text-lg leading-relaxed max-w-2xl mx-auto">
              {t('home.hero_subtitle')}
            </p>
          </motion.div>
        </div>

        {/* Search bar – bottom center */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: 'easeOut' }}
          className="absolute bottom-8 left-0 right-0 px-4 z-10"
        >
          <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur rounded-2xl p-4 shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">{t('home.hero_search_checkin')}</label>
                <input
                  type="date"
                  value={searchCheckIn}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSearchCheckIn(e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">{t('home.hero_search_checkout')}</label>
                <input
                  type="date"
                  value={searchCheckOut}
                  min={searchCheckIn || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSearchCheckOut(e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">{t('home.hero_search_guests')}</label>
                <select
                  value={searchGuests}
                  onChange={(e) => setSearchGuests(e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                >
                  {[1,2,4,6,8,10,12,14,16,18,20].map((n) => (
                    <option key={n} value={n}>{n}+ {t('chalets.guests')}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button onClick={handleSearch} fullWidth size="lg" className="gap-2">
              <Search size={18} />
              {t('home.hero_search_btn')}
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Stats bar */}
      <div data-aos="fade-up" className="bg-gold-500 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { value: '10', label: { en: 'Chalets & Resorts', ar: 'شاليه وفيلا' } },
              { value: '500+', label: { en: 'Happy Guests', ar: 'ضيف سعيد' } },
              { value: '4.8', label: { en: 'Average Rating', ar: 'متوسط التقييم' } },
              { value: '3', label: { en: 'Payment Options', ar: 'خيار دفع' } },
            ].map((s) => (
              <div key={s.value} className="text-white">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-gold-100 text-sm">{s.label[lang]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured chalets */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{t('home.featured_title')}</h2>
            <p className="text-gray-500 mt-2">{t('home.featured_subtitle')}</p>
          </div>
          <Link to="/chalets" className="hidden sm:flex items-center gap-1 text-gold-600 hover:text-gold-700 font-medium text-sm">
            {lang === 'ar' ? 'عرض الكل' : 'View All'} <ChevronRight size={16} />
          </Link>
        </div>

        {/* ── Inventory panel ── */}
        <div data-aos="fade-up" className="bg-white rounded-3xl border border-gray-100 shadow-md p-6 mb-10">
          {/* Panel header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {lang === 'ar' ? 'استعرض الوحدات' : 'Browse Units'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {lang === 'ar' ? 'اختر وحدة لعرض تفاصيلها' : 'Select a unit to view its details'}
              </p>
            </div>

            {/* Type filter pills */}
            <div className="flex items-center gap-1.5 bg-gray-100 rounded-full p-1 self-start sm:self-auto">
              {([
                { key: 'all',      label: lang === 'ar' ? 'الكل' : 'All' },
                { key: 'normal',   label: lang === 'ar' ? 'قياسي' : 'Standard' },
                { key: 'superior', label: lang === 'ar' ? 'سوبيريور' : 'Superior' },
                { key: 'vip',      label: 'VIP' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTypeClick(key)}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                    typeFilter === key && !unitFilter
                      ? 'text-gold-600 shadow-sm'
                      : 'text-gray-500 hover:text-gold-600 hover:shadow-sm'
                  }`}
                >
                  {typeFilter === key && !unitFilter && (
                    <motion.span
                      layoutId="home-type-pill"
                      className="absolute inset-0 rounded-full bg-navy-800"
                      style={{ zIndex: -1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Unit chips */}
          <AnimatePresence mode="popLayout">
            <div className="space-y-4">
              {/* Standard row */}
              {filteredInventory.some((u) => u.type === 'normal') && (
                <motion.div
                  key="standard-row"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    {lang === 'ar' ? 'ستاندرد' : 'Standard'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {filteredInventory.filter((u) => u.type === 'normal').map((u) => {
                      const chalet = chalets.find((c) => c.id === u.id);
                      const active = unitFilter === u.unit;
                      return (
                        <button
                          key={u.unit}
                          type="button"
                          onClick={() => handleUnitClick(u.unit)}
                          className={`group flex flex-col items-center justify-center w-[88px] h-[80px] rounded-2xl border-2 transition-all duration-200 ${
                            active
                              ? 'bg-gray-800 border-gray-800 shadow-lg shadow-gray-200'
                              : 'bg-gray-50 border-gray-200 hover:border-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          <span className={`text-xl font-black tracking-tight ${active ? 'text-white' : 'text-gray-700'}`}>{u.unit}</span>
                          <span className={`text-[10px] font-medium mt-0.5 ${active ? 'text-gray-300' : 'text-gray-400'}`}>{u.price} KWD</span>
                          <span className={`text-[9px] mt-0.5 flex items-center gap-0.5 ${active ? 'text-emerald-300' : 'text-emerald-500'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                            {chalet?.isAvailable ? (lang === 'ar' ? 'متاح' : 'Avail') : (lang === 'ar' ? 'محجوز' : 'Booked')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Superior row */}
              {filteredInventory.some((u) => u.type === 'superior') && (
                <motion.div
                  key="superior-row"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, delay: 0.05 }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gold-500 mb-2">
                    {lang === 'ar' ? 'سوبيريور' : 'Superior'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {filteredInventory.filter((u) => u.type === 'superior').map((u) => {
                      const chalet = chalets.find((c) => c.id === u.id);
                      const active = unitFilter === u.unit;
                      return (
                        <button
                          key={u.unit}
                          type="button"
                          onClick={() => handleUnitClick(u.unit)}
                          className={`group flex flex-col items-center justify-center w-[88px] h-[80px] rounded-2xl border-2 transition-all duration-200 ${
                            active
                              ? 'bg-gold-500 border-gold-500 shadow-lg shadow-gold-100'
                              : 'bg-gold-50 border-gold-200 hover:border-gold-400 hover:bg-gold-100'
                          }`}
                        >
                          <span className={`text-xl font-black tracking-tight ${active ? 'text-white' : 'text-gold-700'}`}>{u.unit}</span>
                          <span className={`text-[10px] font-medium mt-0.5 ${active ? 'text-gold-100' : 'text-gold-500'}`}>{u.price} KWD</span>
                          <span className={`text-[9px] mt-0.5 flex items-center gap-0.5 ${active ? 'text-emerald-200' : 'text-emerald-500'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                            {chalet?.isAvailable ? (lang === 'ar' ? 'متاح' : 'Avail') : (lang === 'ar' ? 'محجوز' : 'Booked')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* VIP row */}
              {filteredInventory.some((u) => u.type === 'vip') && (
                <motion.div
                  key="vip-row"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, delay: 0.1 }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-navy-600 mb-2">VIP</p>
                  <div className="flex flex-wrap gap-2">
                    {filteredInventory.filter((u) => u.type === 'vip').map((u) => {
                      const chalet = chalets.find((c) => c.id === u.id);
                      const active = unitFilter === u.unit;
                      return (
                        <button
                          key={u.unit}
                          type="button"
                          onClick={() => handleUnitClick(u.unit)}
                          className={`group flex flex-col items-center justify-center w-[88px] h-[80px] rounded-2xl border-2 transition-all duration-200 ${
                            active
                              ? 'bg-navy-800 border-navy-800 shadow-lg shadow-navy-100'
                              : 'bg-navy-50 border-navy-200 hover:border-navy-400 hover:bg-navy-100'
                          }`}
                        >
                          <span className={`text-sm font-black tracking-tight leading-none ${active ? 'text-white' : 'text-navy-700'}`}>{u.unit}</span>
                          <span className={`text-[10px] font-medium mt-0.5 ${active ? 'text-navy-200' : 'text-navy-500'}`}>{u.price} KWD</span>
                          <span className={`text-[9px] mt-0.5 flex items-center gap-0.5 ${active ? 'text-emerald-300' : 'text-emerald-500'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                            {chalet?.isAvailable ? (lang === 'ar' ? 'متاح' : 'Avail') : (lang === 'ar' ? 'محجوز' : 'Booked')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          </AnimatePresence>

          {/* Active filter indicator */}
          {(unitFilter || typeFilter !== 'all') && (
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {unitFilter
                  ? (lang === 'ar' ? `عرض الوحدة: ${unitFilter}` : `Showing unit: ${unitFilter}`)
                  : (lang === 'ar' ? `عرض: ${typeFilter === 'normal' ? 'ستاندرد' : typeFilter === 'superior' ? 'سوبيريور' : 'VIP'}` : `Showing: ${typeFilter}`)}
              </p>
              <button
                type="button"
                onClick={() => { setUnitFilter(null); setTypeFilter('all'); }}
                className="text-xs text-gold-600 hover:text-gold-700 font-medium flex items-center gap-1"
              >
                {lang === 'ar' ? 'مسح الفلتر' : 'Clear filter'} ×
              </button>
            </div>
          )}
        </div>



        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {displayChalets.map((chalet, i) => {
              const directions = [
                { x: -80, y: 0 },
                { x: 0,   y: 60 },
                { x: 80,  y: 0 },
              ];
              const { x, y } = directions[i % 3];
              return (
                <motion.div
                  key={chalet.id}
                  layout
                  initial={{ opacity: 0, x, y }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                >
                  <ChaletCard chalet={chalet} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link to="/chalets">
            <Button variant="outline">{t('home.cta_btn')}</Button>
          </Link>
        </div>
      </section>

      {/* ── Chalet Showcase Slider ── */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="text-center mb-10 px-4">
          <p className="text-gold-500 text-[11px] font-bold tracking-[0.35em] uppercase mb-3">
            {lang === 'ar' ? 'مجموعتنا' : 'Our Collection'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {lang === 'ar' ? 'اكتشف إقامتك المثالية' : 'Discover Your Perfect Stay'}
          </h2>
          <p className="text-gray-400 mt-2 text-sm">
            {lang === 'ar' ? 'انقر على بطاقة للتصفح' : 'Click any card to explore'}
          </p>
        </div>

        {/* Slider track */}
        <div className="relative flex items-center justify-center" style={{ height: 510 }}>
          <AnimatePresence>
            {slides.map((slide, i) => {
              const offset = i - sliderIdx;
              const absOff = Math.abs(offset);
              if (absOff > 2) return null;
              const isCenter = offset === 0;
              return (
                <motion.div
                  key={slide.id}
                  initial={{ x: offset * 250, opacity: 0, scale: 0.65 }}
                  animate={{
                    x: offset * 250,
                    scale: isCenter ? 1 : Math.max(0.72, 1 - absOff * 0.14),
                    opacity: isCenter ? 1 : Math.max(0.38, 1 - absOff * 0.25),
                    zIndex: isCenter ? 20 : 10 - absOff,
                  }}
                  exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                  className="absolute"
                  onClick={() => !isCenter && setSliderIdx(i)}
                  style={{ cursor: isCenter ? 'default' : 'pointer' }}
                >
                  {isCenter ? (
                    <div className="w-[272px]">
                      <div className="rounded-t-2xl overflow-hidden shadow-2xl">
                        <img
                          src={slide.images[0]}
                          alt={slide.name[lang]}
                          className="w-full h-[200px] object-cover"
                        />
                      </div>
                      <div className="bg-white rounded-b-2xl shadow-2xl p-5 text-center">
                        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-[0.15em] mb-1.5">
                          {slide.name[lang]}
                        </h3>
                        <div className="w-8 h-[1.5px] bg-gray-300 mx-auto mb-3" />
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-4">
                          {slide.description[lang]}
                        </p>
                        <div className="flex gap-2">
                          <Link to={`/booking/${slide.id}`} className="flex-1">
                            <Button fullWidth size="sm">
                              {lang === 'ar' ? 'احجز' : 'Book Now'}
                            </Button>
                          </Link>
                          <Link to={`/chalets/${slide.id}`} className="flex-1">
                            <Button fullWidth size="sm" variant="outline">
                              {lang === 'ar' ? 'تفاصيل' : 'Details'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-[210px] select-none">
                      <div className="rounded-2xl overflow-hidden shadow-lg">
                        <img
                          src={slide.images[0]}
                          alt={slide.name[lang]}
                          className="w-full h-[310px] object-cover"
                        />
                      </div>
                      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-600 mt-3">
                        {slide.name[lang]}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-5 mt-4 px-4">
          <button
            type="button"
            onClick={() => setSliderIdx((v) => Math.max(0, v - 1))}
            disabled={sliderIdx === 0}
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-gray-800 w-12 text-center">
            {sliderIdx + 1} / {slides.length}
          </span>
          <button
            type="button"
            onClick={() => setSliderIdx((v) => Math.min(slides.length - 1, v + 1))}
            disabled={sliderIdx === slides.length - 1}
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* ── Kuwait Parallax ── */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1600')",
            backgroundAttachment: 'fixed',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-black/72" />
        <motion.div
          className="relative text-center px-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        >
          <p className="text-gold-300 text-[11px] font-bold tracking-[0.45em] uppercase mb-6">
            Kuwait · Al Khiran · Arabian Gulf
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            {lang === 'ar' ? (
              <>حيث يلتقي الصحراء<br />بالبحر</>
            ) : (
              <>Where the Desert<br />Meets the Sea</>
            )}
          </h2>
          <p className="text-white/75 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            {lang === 'ar'
              ? 'نستقبلك في واحة رفاهية على ساحل الكويت الجنوبي، حيث تلتقي المياه الفيروزية بالرمال الذهبية في أجواء تجمع بين الطبيعة الخلابة والخدمة الفاخرة.'
              : "Nestled along Kuwait's pristine southern coastline, Grande Beach Khairan is a sanctuary where turquoise waters meet golden sands — a haven of luxury on the Arabian Gulf."}
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-8 flex flex-wrap gap-3 justify-center"
          >
            {([
              { en: '30 km Coastline', ar: '30 كم ساحل' },
              { en: 'Private Beach',   ar: 'شاطئ خاص' },
              { en: 'Crystal Waters',  ar: 'مياه شفافة' },
              { en: 'Luxury Villas',   ar: 'فيلات فاخرة' },
            ] as { en: string; ar: string }[]).map((item) => (
              <span
                key={item.en}
                className="border border-white/30 bg-white/10 backdrop-blur-sm text-white/90 text-xs px-4 py-1.5 rounded-full font-medium"
              >
                {lang === 'ar' ? item.ar : item.en}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Kuwait Experience Tiles ── */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3">
          {([
            {
              img: 'https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg?auto=compress&cs=tinysrgb&w=800',
              titleEn: 'Private Beach',   titleAr: 'شاطئ خاص',
              descEn: 'Your own slice of paradise. Soft sands, crystalline Gulf waters and uninterrupted horizon views — exclusively for Grande Beach guests.',
              descAr: 'قطعتك الخاصة من الجنة. رمال ناعمة ومياه خليجية صافية وأفق لا نهاية له — حصرياً لضيوف غراند بيتش.',
              emoji: '🏖',
            },
            {
              img: 'https://images.pexels.com/photos/2048865/pexels-photo-2048865.jpeg?auto=compress&cs=tinysrgb&w=800',
              titleEn: 'Luxury Chalets',  titleAr: 'شاليهات فاخرة',
              descEn: 'From intimate Standard units to palatial VIP villas, each chalet blends Kuwaiti elegance with modern comfort.',
              descAr: 'من الوحدات القياسية إلى فيلات VIP، كل شاليه يجمع بين الأناقة الكويتية والراحة الحديثة.',
              emoji: '🏡',
            },
            {
              img: 'https://images.pexels.com/photos/635279/pexels-photo-635279.jpeg?auto=compress&cs=tinysrgb&w=800',
              titleEn: 'Khairan Sunsets', titleAr: 'غروب خيران',
              descEn: 'Golden hues melt into the Arabian Gulf every evening at Khairan — a spectacle that never grows old.',
              descAr: 'الألوان الذهبية تذوب في الخليج العربي كل مساء في خيران — مشهد لا يُمل أبداً.',
              emoji: '🌅',
            },
          ] as { img: string; titleEn: string; titleAr: string; descEn: string; descAr: string; emoji: string }[]).map(
            ({ img, titleEn, titleAr, descEn, descAr, emoji }) => (
              <div key={titleEn} className="relative h-[460px] overflow-hidden group cursor-pointer">
                <img
                  src={img}
                  alt={lang === 'ar' ? titleAr : titleEn}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent group-hover:via-black/40 transition-all duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <p className="text-2xl mb-2">{emoji}</p>
                  <h3 className="text-white text-2xl font-bold leading-tight">
                    {lang === 'ar' ? titleAr : titleEn}
                  </h3>
                  <p className="text-white text-sm leading-relaxed mt-2 opacity-0 group-hover:opacity-90 translate-y-3 group-hover:translate-y-0 transition-all duration-500">
                    {lang === 'ar' ? descAr : descEn}
                  </p>
                  <div className="h-0.5 w-0 group-hover:w-10 bg-gold-400 transition-all duration-500 mt-3" />
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      {/* ── Dining & Experiences ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-gold-500 text-[11px] font-bold tracking-[0.35em] uppercase mb-3">
              {lang === 'ar' ? 'اكتشف المزيد' : 'Discover More'}
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
              {lang === 'ar' ? 'المطاعم والتجارب' : 'Dining & Experiences'}
            </h2>
          </div>

          {/* Tab nav */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 mb-12 border-b border-gray-100">
            {([
              { key: 'dining',     labelEn: 'Dining (4)',     labelAr: 'المطاعم (4)' },
              { key: 'activities', labelEn: 'Activities (4)', labelAr: 'الأنشطة (4)' },
              { key: 'kuwait',     labelEn: 'Kuwait (4)',     labelAr: 'الكويت (4)' },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 text-xs font-bold tracking-[0.18em] uppercase border-b-2 -mb-px transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'text-gray-900 border-gray-900'
                    : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                {lang === 'ar' ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ── Dining ── */}
            {activeTab === 'dining' && (
              <motion.div
                key="dining"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.35 }}
                className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start"
              >
                <div className="lg:col-span-1">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                    {lang === 'ar' ? 'المطاعم والمقاهي' : 'Restaurants & Bars'}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {lang === 'ar'
                      ? 'من بار المسبح على الشاطئ إلى العشاء الفاخر تحت النجوم، يقدم غراند بيتش رحلة طهي بين النكهات الكويتية والعالمية.'
                      : 'From our beachfront pool bar to elegant dining under the stars, Grande Beach offers a culinary journey through Kuwaiti and international flavours.'}
                  </p>
                </div>
                <div ref={diningRef} className="lg:col-span-3 flex gap-5 overflow-x-auto pb-1 scroll-smooth snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
                  {TAB_ITEMS.dining.map(({ nameEn, nameAr, descEn, descAr, img, imgs, detailEn, detailAr }, i) => (
                    <motion.div
                      key={nameEn}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex-shrink-0 w-[265px] snap-start"
                    >
                      <div className="rounded-2xl overflow-hidden mb-3 aspect-[4/3] bg-gray-100">
                        <img src={img} alt={lang === 'ar' ? nameAr : nameEn} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm mb-1">{lang === 'ar' ? nameAr : nameEn}</h4>
                      <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{lang === 'ar' ? descAr : descEn}</p>
                      <button
                        type="button"
                        onClick={() => { setModalCard({ nameEn, nameAr, descEn, descAr, img, imgs, detailEn, detailAr, mt: false }); setModalPhotoIdx(0); }}
                        className="text-[11px] text-gray-700 underline underline-offset-2 mt-1.5 inline-block hover:text-gold-600 transition-colors"
                      >
                        {lang === 'ar' ? 'عرض المزيد' : 'See More'}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Activities ── */}
            {activeTab === 'activities' && (
              <motion.div
                key="activities"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.35 }}
                className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start"
              >
                <div className="lg:col-span-1">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                    {lang === 'ar' ? 'أنشطة المنتجع' : 'Resort Activities'}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {lang === 'ar'
                      ? 'من الرياضات المائية على الخليج إلى الاسترخاء بجانب المسبح وكرة الشاطئ — كل لحظة في غراند بيتش لا تُنسى.'
                      : 'Dive into endless adventures — from water sports on the Gulf to poolside relaxation and beach volleyball. Every moment is unforgettable.'}
                  </p>
                </div>
                <div ref={activitiesRef} className="lg:col-span-3 flex gap-5 overflow-x-auto pb-1 scroll-smooth snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
                  {TAB_ITEMS.activities.map(({ nameEn, nameAr, descEn, descAr, img, imgs, detailEn, detailAr }, i) => (
                    <motion.div
                      key={nameEn}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex-shrink-0 w-[265px] snap-start"
                    >
                      <div className="rounded-2xl overflow-hidden mb-3 aspect-[4/3] bg-gray-100">
                        <img src={img} alt={lang === 'ar' ? nameAr : nameEn} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm mb-1">{lang === 'ar' ? nameAr : nameEn}</h4>
                      <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{lang === 'ar' ? descAr : descEn}</p>
                      <button
                        type="button"
                        onClick={() => { setModalCard({ nameEn, nameAr, descEn, descAr, img, imgs, detailEn, detailAr, mt: false }); setModalPhotoIdx(0); }}
                        className="text-[11px] text-gray-700 underline underline-offset-2 mt-1.5 inline-block hover:text-gold-600 transition-colors"
                      >
                        {lang === 'ar' ? 'عرض المزيد' : 'See More'}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Kuwait ── */}
            {activeTab === 'kuwait' && (
              <motion.div
                key="kuwait"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.35 }}
                className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start"
              >
                <div className="lg:col-span-1">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                    {lang === 'ar' ? 'استكشف الكويت' : 'Explore Kuwait'}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {lang === 'ar'
                      ? 'على بُعد قيادة قصيرة من غراند بيتش، تستقبلك الكويت العاصمة بمعالمها الشهيرة وأسواقها التقليدية وثقافتها الأصيلة.'
                      : "Just a short drive from Grande Beach, Kuwait City is a vibrant metropolis where ancient heritage meets ultra-modern skylines. Discover souqs, towers and culture."}
                  </p>
                </div>
                <div ref={kuwaitRef} className="lg:col-span-3 flex gap-5 overflow-x-auto pb-1 scroll-smooth snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
                  {TAB_ITEMS.kuwait.map(({ nameEn, nameAr, descEn, descAr, img, imgs, detailEn, detailAr }, i) => (
                    <motion.div
                      key={nameEn}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex-shrink-0 w-[265px] snap-start"
                    >
                      <div className="rounded-2xl overflow-hidden mb-3 aspect-[4/3] bg-gray-100">
                        <img src={img} alt={lang === 'ar' ? nameAr : nameEn} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm mb-1">{lang === 'ar' ? nameAr : nameEn}</h4>
                      <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{lang === 'ar' ? descAr : descEn}</p>
                      <button
                        type="button"
                        onClick={() => { setModalCard({ nameEn, nameAr, descEn, descAr, img, imgs, detailEn, detailAr, mt: false }); setModalPhotoIdx(0); }}
                        className="text-[11px] text-gray-700 underline underline-offset-2 mt-1.5 inline-block hover:text-gold-600 transition-colors"
                      >
                        {lang === 'ar' ? 'عرض المزيد' : 'See More'}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll arrows */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => scrollTab('left')}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollTab('right')}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section data-aos="fade-up" className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{t('home.why_title')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title.en} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gold-50 flex items-center justify-center mx-auto mb-4">
                  <Icon className="text-gold-500" size={22} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title[lang]}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc[lang]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Signature Quote ── */}
      <section className="relative py-28 overflow-hidden flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1600')",
            backgroundAttachment: 'fixed',
          }}
        />
        <div className="absolute inset-0 bg-white/82" />
        <motion.div
          className="relative max-w-5xl mx-auto px-8 sm:px-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <p className="text-8xl text-gray-200 font-serif leading-none select-none -mb-4">"</p>
          <p className="text-3xl sm:text-4xl lg:text-5xl font-serif italic text-gray-800 leading-[1.4]">
            {lang === 'ar'
              ? 'حيث تلتقي المياه الفيروزية للخليج العربي بدفء الضيافة الكويتية — كل إقامة تصبح ذكرى لا تُنسى إلى الأبد.'
              : 'Where the turquoise waters of the Arabian Gulf meet the warmth of Kuwaiti hospitality — every stay becomes a memory to treasure forever.'}
          </p>
          <p className="text-8xl text-gray-200 font-serif leading-none select-none -mt-6 text-end">"</p>
          <div className="flex items-center justify-center gap-4 -mt-2">
            <div className="h-px w-14 bg-gray-300" />
            <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-gray-500">
              Grande Beach · Khairan, Kuwait
            </p>
            <div className="h-px w-14 bg-gray-300" />
          </div>
        </motion.div>
      </section>

      {/* CTA banner */}
      <section data-aos="fade-up" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-navy-800 rounded-3xl overflow-hidden relative text-center py-16 px-8">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=60')", backgroundSize: 'cover' }} />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white mb-4">{t('home.cta_title')}</h2>
            <p className="text-navy-200 mb-8 text-lg">{t('home.cta_subtitle')}</p>
            <Link to="/chalets">
              <Button size="lg">{t('home.cta_btn')}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Card Detail Modal ── */}
      <AnimatePresence>
        {modalCard && (
          <motion.div
            key="card-modal"
            className="fixed inset-0 z-[400] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalCard(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Photo gallery */}
              <div className="relative h-[230px] bg-gray-900">
                <img
                  src={modalCard.imgs[modalPhotoIdx]}
                  alt={lang === 'ar' ? modalCard.nameAr : modalCard.nameEn}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                {/* Close */}
                <button
                  type="button"
                  onClick={() => setModalCard(null)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow transition-colors"
                >
                  <X size={15} className="text-gray-700" />
                </button>

                {/* Prev photo */}
                <button
                  type="button"
                  onClick={() => setModalPhotoIdx((p) => (p - 1 + modalCard.imgs.length) % modalCard.imgs.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-colors"
                >
                  <ChevronLeft size={15} className="text-gray-700" />
                </button>

                {/* Next photo */}
                <button
                  type="button"
                  onClick={() => setModalPhotoIdx((p) => (p + 1) % modalCard.imgs.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-colors"
                >
                  <ChevronRight size={15} className="text-gray-700" />
                </button>

                {/* Dot indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {modalCard.imgs.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setModalPhotoIdx(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${i === modalPhotoIdx ? 'bg-white scale-125' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[55vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {lang === 'ar' ? modalCard.nameAr : modalCard.nameEn}
                </h3>
                <div className="w-8 h-[2px] bg-gold-400 mb-4" />
                <p className="text-gray-500 text-sm leading-relaxed">
                  {lang === 'ar' ? modalCard.detailAr : modalCard.detailEn}
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 pb-5">
                <button
                  type="button"
                  onClick={() => setModalCard(null)}
                  className="w-full h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-400 transition-colors"
                >
                  {lang === 'ar' ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
