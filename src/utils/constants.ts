export const WHATSAPP_NUMBER = '+96590976666';
export const GOOGLE_MAPS_EMBED_KEY = 'YOUR_GOOGLE_MAPS_KEY';
export const RESORT_LOCATION = { lat: 28.6553, lng: 48.3861 };
export const TAX_RATE = 0.15;
export const DEPOSIT_RATE = 0.30;
export const LOYALTY_POINTS_PER_KWD = 0.1;
export const LOYALTY_POINTS_TO_KWD = 0.5;
export const MAX_LOYALTY_DISCOUNT_PERCENT = 0.20;
export const WEEKEND_DAYS = [5, 6]; // Friday=5, Saturday=6 (Kuwait weekend)

export const LOYALTY_TIERS = {
  bronze:   { min: 0,     max: 999,   discount: 0,    label: { en: 'Bronze', ar: 'برونزي' } },
  silver:   { min: 1000,  max: 4999,  discount: 0.05, label: { en: 'Silver', ar: 'فضي' } },
  gold:     { min: 5000,  max: 9999,  discount: 0.08, label: { en: 'Gold',   ar: 'ذهبي' } },
  platinum: { min: 10000, max: Infinity, discount: 0.12, label: { en: 'Platinum', ar: 'بلاتيني' } },
} as const;

export const CANCELLATION_POLICIES = {
  flexible:       { en: 'Flexible – Free cancellation up to 7 days before check-in',    ar: 'مرن – إلغاء مجاني حتى 7 أيام قبل الوصول' },
  moderate:       { en: 'Moderate – 50% refund if cancelled 3–7 days before check-in',  ar: 'متوسط – استرداد 50% عند الإلغاء 3-7 أيام قبل الوصول' },
  strict:         { en: 'Strict – Non-refundable within 3 days of check-in',             ar: 'صارم – غير قابل للاسترداد خلال 3 أيام من الوصول' },
  non_refundable: { en: 'Non-Refundable – Discounted rate, no refund',                   ar: 'غير قابل للاسترداد – سعر مخفض، لا استرداد' },
} as const;

export const AMENITY_ICONS: Record<string, string> = {
  pool: 'Waves',
  wifi: 'Wifi',
  kitchen: 'UtensilsCrossed',
  bbq: 'Flame',
  gym: 'Dumbbell',
  cinema: 'Film',
  jacuzzi: 'Droplets',
  parking: 'Car',
  security: 'Shield',
  cleaning: 'Sparkles',
  breakfast: 'Coffee',
  garden: 'TreePine',
  playground: 'Gamepad2',
  ac: 'Wind',
  sea_view: 'Eye',
  mountain_view: 'Mountain',
};
