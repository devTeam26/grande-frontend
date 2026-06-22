export type ChaletType = 'normal' | 'superior' | 'vip';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentMethod = 'tap' | 'deema' | 'taly';
export type PaymentPlan = 'full' | 'partial';
export type PaymentStatus = 'pending' | 'partial' | 'paid';
export type UserRole = 'super_admin' | 'manager' | 'staff' | 'user';
export type Language = 'en' | 'ar';
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type CancellationPolicy = 'flexible' | 'moderate' | 'strict' | 'non_refundable';
export type PricingRuleType = 'seasonal' | 'weekend' | 'demand' | 'last_minute' | 'early_bird';
export type DiscountType = 'percentage' | 'fixed';

export interface LocalizedString {
  en: string;
  ar: string;
}

export interface Bedroom {
  type: 'master' | 'single';
  beds: number;
  hasEnsuite: boolean;
}

export interface ChaletLocation {
  lat: number;
  lng: number;
  address: LocalizedString;
  region: LocalizedString;
}

export interface Chalet {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  type: ChaletType;
  basePrice: number;
  images: string[];
  bedrooms: Bedroom[];
  bathrooms: number;
  maxGuests: number;
  size: number;
  amenities: string[];
  location: ChaletLocation;
  cancellationPolicy: CancellationPolicy;
  bookingComUrl?: string;
  airbnbUrl?: string;
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
  featured: boolean;
}

export interface PricingRule {
  id: string;
  name: string;
  type: PricingRuleType;
  multiplier: number;
  startDate?: string;
  endDate?: string;
  daysOfWeek?: number[];
  minOccupancyPercent?: number;
  isActive: boolean;
  appliesTo: ChaletType[] | 'all';
}

export interface PricingBreakdown {
  nights: number;
  basePrice: number;
  subtotal: number;
  weekendSurcharge: number;
  seasonalSurcharge: number;
  demandSurcharge: number;
  discount: number;
  loyaltyDiscount: number;
  tax: number;
  total: number;
  deposit: number;
  remaining: number;
  perNightAverage: number;
}

export interface BlockedDate {
  chaletId: string;
  startDate: string;
  endDate: string;
  bookingId?: string;
  reason?: string;
}

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality?: string;
  idNumber?: string;
  specialRequests?: string;
}

export interface Booking {
  id: string;
  chaletId: string;
  userId?: string;
  guestInfo: GuestInfo;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  baseAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  paymentPlan: PaymentPlan;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  promoCode?: string;
  loyaltyPointsUsed: number;
  loyaltyPointsEarned: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  language: Language;
  notifications: {
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  loyaltyPoints: number;
  loyaltyTier: LoyaltyTier;
  totalSpent: number;
  bookingsCount: number;
  createdAt: string;
  preferences: UserPreferences;
  isActive: boolean;
}

export interface Promotion {
  id: string;
  code: string;
  name: LocalizedString;
  description: LocalizedString;
  type: DiscountType;
  value: number;
  minBookingAmount?: number;
  maxDiscount?: number;
  validFrom: string;
  validTo: string;
  usageLimit?: number;
  usageCount: number;
  applicableTo: ChaletType | 'all';
  isActive: boolean;
}

export interface ChaletFilters {
  type: ChaletType | 'all';
  minPrice: number;
  maxPrice: number;
  guests: number;
  checkIn: string | null;
  checkOut: string | null;
  amenities: string[];
  sortBy: 'price_asc' | 'price_desc' | 'rating' | 'featured';
}

export interface AdminStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalBookings: number;
  activeBookings: number;
  occupancyRate: number;
  totalUsers: number;
  newUsersThisMonth: number;
  avgBookingValue: number;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  bookings: number;
}
