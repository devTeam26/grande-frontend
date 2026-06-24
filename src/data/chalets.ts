import p01 from '../assets/IMG_20260615_131431641_HDR.jpg';
import p02 from '../assets/IMG_20260615_133901366_HDR_AE.jpg';
import p03 from '../assets/IMG_20260615_134043284_HDR_AE.jpg';
import p04 from '../assets/IMG_20260615_134713430_HDR_AE.jpg';
import p05 from '../assets/IMG_20260615_134736296_HDR_AE.jpg';
import p06 from '../assets/IMG_20260615_134830697_HDR_AE.jpg';
import p07 from '../assets/IMG_20260615_134838251_HDR_AE.jpg';
import p08 from '../assets/IMG_20260615_140302440_HDR_AE.jpg';
import p09 from '../assets/IMG_20260615_140351513_HDR_AE.jpg';
import p10 from '../assets/IMG_20260615_140506680_HDR_AE.jpg';
import p11 from '../assets/IMG_20260615_141907855_HDR_AE.jpg';
import p12 from '../assets/IMG_20260615_142034414_HDR_AE.jpg';
import p13 from '../assets/IMG_20260615_142513190_HDR_AE.jpg';
import p14 from '../assets/IMG_20260615_142613388_AEee.jpg';
import p15 from '../assets/IMG_20260615_142620294_AE.jpg';
import p16 from '../assets/IMG_20260615_142701336_HDR_AE.jpg';
import p17 from '../assets/IMG_20260615_142832737_HDR_AE.jpg';
import p18 from '../assets/IMG_20260615_143435850_HDR_AE.jpg';
import p19 from '../assets/IMG_20260615_143526917_HDR_AE.jpg';
import p20 from '../assets/IMG_20260615_143756774_HDR_AE.jpg';
import p21 from '../assets/IMG_20260615_143832117_AE.jpg';
import p22 from '../assets/IMG_20260615_143906030_HDR_AE.jpg';
import p23 from '../assets/IMG_20260615_144243981_HDR_AE.jpg';
import p24 from '../assets/IMG_20260615_144605495_HDR_AE.jpg';
import p25 from '../assets/IMG_20260615_144805928_HDR_AE.jpg';
import p26 from '../assets/IMG_20260615_144819154_HDR_AE.jpg';
import p27 from '../assets/_A1A7962.jpg';
import p28 from '../assets/_A1A7988.jpg';
import p29 from '../assets/_A1A7991.jpg';
import p30 from '../assets/_A1A8001.jpg';
import p31 from '../assets/_A1A8031.jpg';
import p32 from '../assets/_A1A8041.jpg';
import p33 from '../assets/_A1A8045.jpg';
import p34 from '../assets/_A1A8046.jpg';
import p35 from '../assets/_A1A8091.jpg';
import p36 from '../assets/_A1A8102.jpg';
import p37 from '../assets/_A1A8104.jpg';
import p38 from '../assets/_A1A8112.jpg';
import p39 from '../assets/_A1A8119.jpg';
import p40 from '../assets/_A1A8124.jpg';
import p41 from '../assets/_A1A8126.jpg';
import p42 from '../assets/_A1A8167.jpg';
import p43 from '../assets/1.jpg';
import p44 from '../assets/2.jpg';
import p45 from '../assets/5A1A8007.jpg';
import p46 from '../assets/5A1A8022.jpg';
import type { Chalet } from '../types';

export const chalets: Chalet[] = [
  // ─── NORMAL (4) ───────────────────────────────────────────────
  {
    id: 'c01',
    name: { en: 'Grande Standard A1', ar: 'غراند ستاندرد A1' },
    description: {
      en: 'A serene chalet surrounded by lush greenery, offering a peaceful retreat for families. Equipped with modern amenities and a private garden.',
      ar: 'شاليه هادئ محاط بالخضرة الكثيفة، يوفر ملاذاً مريحاً للعائلات. مجهز بوسائل الراحة الحديثة وحديقة خاصة.',
    },
    type: 'normal',
    basePrice: 350,
    images: [p01, p02, p03, p04, p05, p06],
    bedrooms: [
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: false },
      { type: 'single', beds: 2, hasEnsuite: false },
      { type: 'single', beds: 2, hasEnsuite: false },
      { type: 'single', beds: 2, hasEnsuite: false },
    ],
    bathrooms: 4,
    maxGuests: 12,
    size: 280,
    amenities: ['pool', 'wifi', 'kitchen', 'bbq', 'parking', 'ac', 'garden'],
    location: {
      lat: 28.6553, lng: 48.3861,
      address: { en: 'GrandeBeach Khairan, Kuwait', ar: 'غراند بيتش خيران، الكويت' },
      region: { en: 'Al Khiran', ar: 'خيران' },
    },
    cancellationPolicy: 'flexible',
    bookingComUrl: 'https://www.booking.com',
    airbnbUrl: 'https://www.airbnb.com',
    isAvailable: true,
    rating: 4.3,
    reviewCount: 47,
    featured: false,
  },
  {
    id: 'c02',
    name: { en: 'Grande Standard A2', ar: 'غراند ستاندرد A2' },
    description: {
      en: 'A classic chalet with traditional touches blended with modern comfort. Perfect for a family gathering.',
      ar: 'شاليه كلاسيكي يجمع بين اللمسات الأصيلة والراحة الحديثة. مثالي لتجمعات العائلة.',
    },
    type: 'normal',
    basePrice: 350,
    images: [p07, p08, p09, p10, p11, p12],
    bedrooms: [
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'single', beds: 2, hasEnsuite: false },
      { type: 'single', beds: 2, hasEnsuite: false },
      { type: 'single', beds: 2, hasEnsuite: false },
    ],
    bathrooms: 4,
    maxGuests: 14,
    size: 300,
    amenities: ['pool', 'wifi', 'kitchen', 'bbq', 'parking', 'ac', 'security'],
    location: {
      lat: 28.6580, lng: 48.3890,
      address: { en: 'GrandeBeach Khairan, Kuwait', ar: 'غراند بيتش خيران، الكويت' },
      region: { en: 'Al Khiran', ar: 'خيران' },
    },
    cancellationPolicy: 'moderate',
    bookingComUrl: 'https://www.booking.com',
    airbnbUrl: 'https://www.airbnb.com',
    isAvailable: true,
    rating: 4.1,
    reviewCount: 38,
    featured: false,
  },
  {
    id: 'c03',
    name: { en: 'Grande Standard A3', ar: 'غراند ستاندرد A3' },
    description: {
      en: 'Tranquility at its finest. This chalet offers a quiet escape with panoramic views and a spacious private terrace.',
      ar: 'الهدوء في أبهى صوره. يوفر هذا الشاليه ملاذاً هادئاً مع إطلالات بانورامية وشرفة خاصة فسيحة.',
    },
    type: 'normal',
    basePrice: 350,
    images: [p13, p14, p15, p16, p17, p18],
    bedrooms: [
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: false },
      { type: 'single', beds: 2, hasEnsuite: false },
      { type: 'single', beds: 2, hasEnsuite: false },
      { type: 'single', beds: 2, hasEnsuite: false },
    ],
    bathrooms: 3,
    maxGuests: 12,
    size: 260,
    amenities: ['wifi', 'kitchen', 'bbq', 'parking', 'ac', 'garden'],
    location: {
      lat: 28.6520, lng: 48.3840,
      address: { en: 'GrandeBeach Khairan, Kuwait', ar: 'غراند بيتش خيران، الكويت' },
      region: { en: 'Al Khiran', ar: 'خيران' },
    },
    cancellationPolicy: 'flexible',
    isAvailable: true,
    rating: 4.2,
    reviewCount: 29,
    featured: false,
  },
  {
    id: 'c04',
    name: { en: 'Grande Standard A4', ar: 'غراند ستاندرد A4' },
    description: {
      en: 'A bright and airy chalet with clean interiors and a private pool. Ideal for families seeking simple luxury.',
      ar: 'شاليه مضيء وهوائي بديكورات نظيفة ومسبح خاص. مثالي للعائلات الباحثة عن الفخامة البسيطة.',
    },
    type: 'normal',
    basePrice: 350,
    images: [p19, p20, p21, p22, p23, p24],
    bedrooms: [
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: false },
      { type: 'single', beds: 2, hasEnsuite: false },
      { type: 'single', beds: 2, hasEnsuite: false },
      { type: 'single', beds: 2, hasEnsuite: false },
    ],
    bathrooms: 4,
    maxGuests: 12,
    size: 270,
    amenities: ['pool', 'wifi', 'kitchen', 'parking', 'ac', 'cleaning'],
    location: {
      lat: 28.6540, lng: 48.3850,
      address: { en: 'GrandeBeach Khairan, Kuwait', ar: 'غراند بيتش خيران، الكويت' },
      region: { en: 'Al Khiran', ar: 'خيران' },
    },
    cancellationPolicy: 'moderate',
    isAvailable: true,
    rating: 4.4,
    reviewCount: 51,
    featured: true,
  },

  // ─── SUPERIOR (4) ───────────────────────────────────────────────
  {
    id: 'c06',
    name: { en: 'Grande Superior B1', ar: 'غراند سوبيريور B1' },
    description: {
      en: 'A stunning superior chalet with wave-inspired design, infinity pool, and premium furnishings throughout.',
      ar: 'شاليه سوبيريور رائع بتصميم مستوحى من الأمواج، مسبح لا نهائي، وأثاث فاخر في كل مكان.',
    },
    type: 'superior',
    basePrice: 500,
    images: [p25, p26, p27, p28, p29, p30],
    bedrooms: [
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'single', beds: 2, hasEnsuite: false },
      { type: 'single', beds: 2, hasEnsuite: false },
      { type: 'single', beds: 2, hasEnsuite: false },
    ],
    bathrooms: 5,
    maxGuests: 16,
    size: 420,
    amenities: ['pool', 'wifi', 'kitchen', 'bbq', 'parking', 'ac', 'gym', 'cinema', 'security', 'cleaning'],
    location: {
      lat: 28.6600, lng: 48.3920,
      address: { en: 'GrandeBeach Khairan, Kuwait', ar: 'غراند بيتش خيران، الكويت' },
      region: { en: 'Al Khiran', ar: 'خيران' },
    },
    cancellationPolicy: 'moderate',
    bookingComUrl: 'https://www.booking.com',
    airbnbUrl: 'https://www.airbnb.com',
    isAvailable: true,
    rating: 4.6,
    reviewCount: 82,
    featured: true,
  },
  {
    id: 'c07',
    name: { en: 'Grande Superior B2', ar: 'غراند سوبيريور B2' },
    description: {
      en: 'Set within lush gardens, this superior chalet combines natural beauty with premium amenities for an extraordinary stay.',
      ar: 'يقع داخل حدائق غنّاء، يجمع هذا الشاليه السوبيريور بين الجمال الطبيعي والمرافق الفاخرة لإقامة استثنائية.',
    },
    type: 'superior',
    basePrice: 500,
    images: [p31, p32, p33, p34, p35, p36],
    bedrooms: [
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'single', beds: 2, hasEnsuite: true },
      { type: 'single', beds: 2, hasEnsuite: false },
      { type: 'single', beds: 2, hasEnsuite: false },
    ],
    bathrooms: 5,
    maxGuests: 16,
    size: 450,
    amenities: ['pool', 'wifi', 'kitchen', 'bbq', 'parking', 'ac', 'gym', 'jacuzzi', 'security', 'garden', 'cleaning'],
    location: {
      lat: 28.6570, lng: 48.3930,
      address: { en: 'GrandeBeach Khairan, Kuwait', ar: 'غراند بيتش خيران، الكويت' },
      region: { en: 'Al Khiran', ar: 'خيران' },
    },
    cancellationPolicy: 'moderate',
    bookingComUrl: 'https://www.booking.com',
    airbnbUrl: 'https://www.airbnb.com',
    isAvailable: true,
    rating: 4.7,
    reviewCount: 95,
    featured: true,
  },
  {
    id: 'c08',
    name: { en: 'Grande Superior B3', ar: 'غراند سوبيريور B3' },
    description: {
      en: 'A moonlit retreat with rooftop terrace and stargazing deck. Premium superior experience under the Kuwait sky.',
      ar: 'ملاذ مضيء بضوء القمر مع شرفة على السطح ومنصة لمراقبة النجوم. تجربة سوبيريور فاخرة تحت سماء الكويت.',
    },
    type: 'superior',
    basePrice: 500,
    images: [p37, p38, p39, p40, p41, p42],
    bedrooms: [
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'single', beds: 2, hasEnsuite: false },
      { type: 'single', beds: 2, hasEnsuite: false },
      { type: 'single', beds: 2, hasEnsuite: false },
    ],
    bathrooms: 5,
    maxGuests: 14,
    size: 400,
    amenities: ['pool', 'wifi', 'kitchen', 'bbq', 'parking', 'ac', 'cinema', 'security', 'cleaning', 'breakfast'],
    location: {
      lat: 28.6620, lng: 48.3950,
      address: { en: 'GrandeBeach Khairan, Kuwait', ar: 'غراند بيتش خيران، الكويت' },
      region: { en: 'Al Khiran', ar: 'خيران' },
    },
    cancellationPolicy: 'strict',
    bookingComUrl: 'https://www.booking.com',
    isAvailable: true,
    rating: 4.8,
    reviewCount: 110,
    featured: false,
  },
  {
    id: 'c09',
    name: { en: 'Grande Superior B4', ar: 'غراند سوبيريور B4' },
    description: {
      en: 'Brilliant interiors with floor-to-ceiling windows, a heated pool, and a private home theater experience.',
      ar: 'ديكورات داخلية رائعة مع نوافذ من الأرض إلى السقف، مسبح مدفأ، وتجربة سينما منزلية خاصة.',
    },
    type: 'superior',
    basePrice: 500,
    images: [p43, p44, p45, p46, p01, p02],
    bedrooms: [
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'single', beds: 2, hasEnsuite: true },
      { type: 'single', beds: 2, hasEnsuite: false },
      { type: 'single', beds: 2, hasEnsuite: false },
    ],
    bathrooms: 6,
    maxGuests: 16,
    size: 480,
    amenities: ['pool', 'wifi', 'kitchen', 'bbq', 'parking', 'ac', 'gym', 'cinema', 'jacuzzi', 'security', 'cleaning'],
    location: {
      lat: 28.6490, lng: 48.3870,
      address: { en: 'GrandeBeach Khairan, Kuwait', ar: 'غراند بيتش خيران، الكويت' },
      region: { en: 'Al Khiran', ar: 'خيران' },
    },
    cancellationPolicy: 'moderate',
    bookingComUrl: 'https://www.booking.com',
    airbnbUrl: 'https://www.airbnb.com',
    isAvailable: true,
    rating: 4.9,
    reviewCount: 134,
    featured: true,
  },

  // ─── VIP (2) ──────────────────────────────────────────────────
  {
    id: 'c11',
    name: { en: 'Grande VIP 1', ar: 'غراند VIP 1' },
    description: {
      en: 'The pinnacle of luxury. A royal villa with grand interiors, dual infinity pools, private chef service, and 360° views.',
      ar: 'قمة الفخامة. فيلا ملكية بديكورات فاخرة ومسبحين لا نهائيين وخدمة طاهٍ خاص وإطلالات 360 درجة.',
    },
    type: 'vip',
    basePrice: 750,
    images: [p03, p04, p05, p06, p07, p08],
    bedrooms: [
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'single', beds: 2, hasEnsuite: true },
      { type: 'single', beds: 2, hasEnsuite: true },
      { type: 'single', beds: 2, hasEnsuite: false },
    ],
    bathrooms: 7,
    maxGuests: 18,
    size: 700,
    amenities: ['pool', 'wifi', 'kitchen', 'bbq', 'parking', 'ac', 'gym', 'cinema', 'jacuzzi', 'security', 'cleaning', 'breakfast', 'garden'],
    location: {
      lat: 28.6650, lng: 48.3980,
      address: { en: 'GrandeBeach Khairan – VIP Wing, Kuwait', ar: 'غراند بيتش خيران – الجناح الملكي، الكويت' },
      region: { en: 'Al Khiran', ar: 'خيران' },
    },
    cancellationPolicy: 'strict',
    bookingComUrl: 'https://www.booking.com',
    airbnbUrl: 'https://www.airbnb.com',
    isAvailable: true,
    rating: 5.0,
    reviewCount: 42,
    featured: true,
  },
  {
    id: 'c12',
    name: { en: 'Grande VIP 2', ar: 'غراند VIP 2' },
    description: {
      en: 'Our signature villa. Grand architecture, gold accents throughout, exclusive butler service, and a private spa retreat.',
      ar: 'فيلتنا المميزة. معمار رائع بلمسات ذهبية وخدمة باتلر حصرية وملجأ سبا خاص.',
    },
    type: 'vip',
    basePrice: 750,
    images: [p09, p10, p11, p12, p13, p14],
    bedrooms: [
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'master', beds: 1, hasEnsuite: true },
      { type: 'single', beds: 2, hasEnsuite: true },
      { type: 'single', beds: 2, hasEnsuite: true },
      { type: 'single', beds: 2, hasEnsuite: true },
    ],
    bathrooms: 8,
    maxGuests: 20,
    size: 800,
    amenities: ['pool', 'wifi', 'kitchen', 'bbq', 'parking', 'ac', 'gym', 'cinema', 'jacuzzi', 'security', 'cleaning', 'breakfast', 'garden', 'playground'],
    location: {
      lat: 28.6670, lng: 48.4000,
      address: { en: 'GrandeBeach Khairan – VIP Wing, Kuwait', ar: 'غراند بيتش خيران – الجناح الملكي، الكويت' },
      region: { en: 'Al Khiran', ar: 'خيران' },
    },
    cancellationPolicy: 'strict',
    bookingComUrl: 'https://www.booking.com',
    airbnbUrl: 'https://www.airbnb.com',
    isAvailable: true,
    rating: 5.0,
    reviewCount: 28,
    featured: true,
  },
];

export default chalets;
