import { addDays, eachDayOfInterval, parseISO, isWithinInterval, getDay, differenceInCalendarDays } from 'date-fns';
import type { Chalet, PricingRule, Promotion, PricingBreakdown } from '../types';
import { WEEKEND_DAYS, TAX_RATE, DEPOSIT_RATE, LOYALTY_POINTS_TO_KWD, MAX_LOYALTY_DISCOUNT_PERCENT } from './constants';

export function isWeekendDay(date: Date): boolean {
  return WEEKEND_DAYS.includes(getDay(date));
}

export function isPeakSeason(date: Date): boolean {
  const month = date.getMonth() + 1;
  // Saudi peak: summer (6-8), Eid season (variable – approximate Mar-Apr), National Day (Sep)
  return [6, 7, 8, 9].includes(month);
}

export function getNightlyPrice(chalet: Chalet, date: Date, rules: PricingRule[]): number {
  let price = chalet.basePrice;
  const activeRules = rules.filter((r) => r.isActive && (r.appliesTo === 'all' || (r.appliesTo as string[]).includes(chalet.type)));

  for (const rule of activeRules) {
    if (rule.type === 'weekend' && rule.daysOfWeek && rule.daysOfWeek.includes(getDay(date))) {
      price *= rule.multiplier;
    }
    if (rule.type === 'seasonal' && rule.startDate && rule.endDate) {
      const start = parseISO(rule.startDate);
      const end = parseISO(rule.endDate);
      if (isWithinInterval(date, { start, end })) price *= rule.multiplier;
    }
    if (rule.type === 'demand') {
      price *= rule.multiplier;
    }
  }
  return Math.round(price);
}

export function calculatePricing(
  chalet: Chalet,
  checkIn: Date,
  checkOut: Date,
  rules: PricingRule[],
  promo?: Promotion | null,
  loyaltyPointsToRedeem = 0,
): PricingBreakdown {
  const nights = differenceInCalendarDays(checkOut, checkIn);
  if (nights <= 0) throw new Error('Invalid date range');

  const days = eachDayOfInterval({ start: checkIn, end: addDays(checkOut, -1) });
  const base = chalet.basePrice;

  let subtotal = 0;
  let weekendExtra = 0;
  let seasonalExtra = 0;

  for (const day of days) {
    let nightly = base;
    let dayWeekend = 0;
    let daySeasonal = 0;

    for (const rule of rules.filter((r) => r.isActive && (r.appliesTo === 'all' || (r.appliesTo as string[]).includes(chalet.type)))) {
      if (rule.type === 'weekend' && rule.daysOfWeek?.includes(getDay(day))) {
        dayWeekend += base * (rule.multiplier - 1);
      }
      if (rule.type === 'seasonal' && rule.startDate && rule.endDate) {
        if (isWithinInterval(day, { start: parseISO(rule.startDate), end: parseISO(rule.endDate) })) {
          daySeasonal += base * (rule.multiplier - 1);
        }
      }
    }
    nightly += dayWeekend + daySeasonal;
    subtotal += nightly;
    weekendExtra += dayWeekend;
    seasonalExtra += daySeasonal;
  }

  let discount = 0;
  if (promo && promo.isActive) {
    const now = new Date();
    const from = parseISO(promo.validFrom);
    const to = parseISO(promo.validTo);
    if (isWithinInterval(now, { start: from, end: to }) && (!promo.minBookingAmount || subtotal >= promo.minBookingAmount)) {
      if (promo.type === 'percentage') {
        discount = subtotal * (promo.value / 100);
        if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
      } else {
        discount = promo.value;
      }
    }
  }

  const maxLoyaltyDiscount = subtotal * MAX_LOYALTY_DISCOUNT_PERCENT;
  const loyaltyDiscount = Math.min(loyaltyPointsToRedeem * LOYALTY_POINTS_TO_KWD, maxLoyaltyDiscount);

  const taxable = Math.max(0, subtotal - discount - loyaltyDiscount);
  const tax = Math.round(taxable * TAX_RATE);
  const total = Math.round(taxable + tax);
  const deposit = Math.round(total * DEPOSIT_RATE);

  return {
    nights,
    basePrice: base,
    subtotal: Math.round(subtotal),
    weekendSurcharge: Math.round(weekendExtra),
    seasonalSurcharge: Math.round(seasonalExtra),
    demandSurcharge: 0,
    discount: Math.round(discount),
    loyaltyDiscount: Math.round(loyaltyDiscount),
    tax,
    total,
    deposit,
    remaining: total - deposit,
    perNightAverage: Math.round(total / nights),
  };
}

export function getLoyaltyTier(points: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (points >= 10000) return 'platinum';
  if (points >= 5000) return 'gold';
  if (points >= 1000) return 'silver';
  return 'bronze';
}

export function pointsEarned(totalAmountSAR: number): number {
  return Math.floor(totalAmountSAR * 0.1);
}

export function getCancellationRefund(checkIn: Date, policy: string): { percent: number; label: string } {
  const daysUntil = differenceInCalendarDays(checkIn, new Date());
  if (policy === 'non_refundable') return { percent: 0, label: 'Non-refundable' };
  if (policy === 'flexible') {
    if (daysUntil >= 7) return { percent: 100, label: 'Full refund' };
    if (daysUntil >= 3) return { percent: 50, label: '50% refund' };
    return { percent: 0, label: 'No refund' };
  }
  if (policy === 'moderate') {
    if (daysUntil >= 7) return { percent: 100, label: 'Full refund' };
    if (daysUntil >= 3) return { percent: 50, label: '50% refund' };
    return { percent: 0, label: 'No refund' };
  }
  if (daysUntil >= 14) return { percent: 100, label: 'Full refund' };
  if (daysUntil >= 7) return { percent: 50, label: '50% refund' };
  return { percent: 0, label: 'No refund' };
}
