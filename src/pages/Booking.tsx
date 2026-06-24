import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setDates, setGuests, setGuestInfo, setPaymentPlan, setPricing, applyPromo, setLoyaltyRedeem, startBooking } from '../store/slices/bookingSlice';
import { BookingCalendar } from '../components/booking/BookingCalendar';
import { PricingSummary } from '../components/booking/PricingSummary';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { blockedDates } from '../data/blockedDates';
import { calculatePricing } from '../utils/pricing';
import { promotions } from '../data/promotions';
import type { Promotion } from '../types';

const guestSchema = z.object({
  firstName: z.string().min(2, 'Required'),
  lastName: z.string().min(2, 'Required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(9, 'Valid phone required'),
  specialRequests: z.string().optional(),
});
type GuestForm = z.infer<typeof guestSchema>;

export function Booking() {
  const { chaletId } = useParams<{ chaletId: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const lang = i18n.language as 'en' | 'ar';

  const chalet = useAppSelector((s) => s.chalets.chalets.find((c) => c.id === chaletId));
  const pricingRules = useAppSelector((s) => s.admin.pricingRules);
  const draft = useAppSelector((s) => s.booking.draft);
  const existingBookings = useAppSelector((s) => s.booking.bookings);
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);

  const sessionKey = `booking_dates_${chaletId}`;
  const savedDates = (() => { try { return JSON.parse(sessionStorage.getItem(sessionKey) ?? 'null'); } catch { return null; } })();

  const [checkIn, setCheckIn] = useState<Date | null>(
    draft.checkIn ? parseISO(draft.checkIn) : savedDates?.checkIn ? parseISO(savedDates.checkIn) : null
  );
  const [checkOut, setCheckOut] = useState<Date | null>(
    draft.checkOut ? parseISO(draft.checkOut) : savedDates?.checkOut ? parseISO(savedDates.checkOut) : null
  );
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [loyaltyToRedeem, setLoyaltyToRedeem] = useState(0);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<GuestForm>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      phone: user?.phoneNumber ?? '',
    },
  });

  useEffect(() => {
    if (chaletId) dispatch(startBooking({ chaletId }));
  }, [chaletId, dispatch]);

  // Restore dates from sessionStorage into Redux so pricing recalculates after refresh
  useEffect(() => {
    if (checkIn && checkOut) {
      dispatch(setDates({ checkIn: format(checkIn, 'yyyy-MM-dd'), checkOut: format(checkOut, 'yyyy-MM-dd') }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      setValue('firstName', user.firstName);
      setValue('lastName', user.lastName);
      setValue('email', user.email);
      setValue('phone', user.phoneNumber);
    }
  }, [isAuthenticated, user, setValue]);

  // Recalculate pricing whenever dates / promo / loyalty change
  useEffect(() => {
    if (!checkIn || !checkOut || !chalet) {
      dispatch(setPricing(null));
      return;
    }

    try {
      const pricing = calculatePricing(
        chalet,
        checkIn,
        checkOut,
        pricingRules,
        appliedPromo,
        loyaltyToRedeem
      );
      dispatch(setPricing(pricing));
    } catch {
      dispatch(setPricing(null));
    }
  }, [checkIn, checkOut, chalet, pricingRules, appliedPromo, loyaltyToRedeem, dispatch]);

  const handleCalendarSelect = useCallback((ci: Date, co: Date | null) => {
    setCheckIn(ci);
    setCheckOut(co);
    const ciStr = format(ci, 'yyyy-MM-dd');
    const coStr = co ? format(co, 'yyyy-MM-dd') : null;
    sessionStorage.setItem(sessionKey, JSON.stringify({ checkIn: ciStr, checkOut: coStr }));
    if (ci && co) {
      dispatch(setDates({ checkIn: ciStr, checkOut: coStr! }));
    }
  }, [dispatch, sessionKey]);

  const handleApplyPromo = useCallback(() => {
    const promo = promotions.find((p) => p.code === promoInput.toUpperCase() && p.isActive);
    if (promo) {
      setAppliedPromo(promo);
      dispatch(applyPromo({ code: promo.code, discount: 0 }));
      toast.success(t('booking.promo_applied'));
    } else {
      toast.error(t('booking.promo_invalid'));
    }
  }, [promoInput, dispatch, t]);

  const onSubmit = useCallback((data: GuestForm) => {
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }
    if (!draft.pricing) {
      toast.error('Unable to calculate pricing. Please try again.');
      return;
    }
    dispatch(setGuestInfo(data));
    dispatch(setDates({ checkIn: format(checkIn, 'yyyy-MM-dd'), checkOut: format(checkOut, 'yyyy-MM-dd') }));
    navigate('/checkout');
  }, [checkIn, checkOut, draft.pricing, dispatch, navigate]);

  if (!chalet) return <div className="text-center py-20"><p className="text-gray-500">Chalet not found.</p></div>;

  const allBlockedDates = [
    ...blockedDates,
    ...existingBookings
      .filter((b) => b.chaletId === chaletId && b.status !== 'cancelled')
      .map((b) => ({ chaletId: b.chaletId, startDate: b.checkIn, endDate: b.checkOut, bookingId: b.id })),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('booking.title')}</h1>
        <p className="text-gray-500 mt-1">{chalet.name[lang]}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4">{t('booking.select_dates')}</h2>
              <BookingCalendar
                chaletId={chalet.id}
                blockedDates={allBlockedDates}
                checkIn={checkIn}
                checkOut={checkOut}
                onSelect={handleCalendarSelect}
              />
              {checkIn && checkOut && (
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                  <span>Check-in: <strong>{format(checkIn, 'dd MMM yyyy')}</strong></span>
                  <span>→ Check-out: <strong>{format(checkOut, 'dd MMM yyyy')}</strong></span>
                </div>
              )}
            </div>

            {/* Guests */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4">{t('booking.guests_label')}</h2>
              <select
                value={draft.guests}
                onChange={(e) => dispatch(setGuests(Number(e.target.value)))}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 w-full sm:w-auto"
              >
                {Array.from({ length: chalet.maxGuests }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                ))}
              </select>
            </div>

            {/* Guest details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-5">{t('booking.guest_details')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={t('booking.first_name')} {...register('firstName')} error={errors.firstName?.message} />
                <Input label={t('booking.last_name')} {...register('lastName')} error={errors.lastName?.message} />
                <Input label={t('booking.email')} type="email" {...register('email')} error={errors.email?.message} />
                <Input label={t('booking.phone')} type="tel" {...register('phone')} error={errors.phone?.message} />
                <div className="sm:col-span-2">
                  <Textarea label={t('booking.special_requests')} rows={3} {...register('specialRequests')} placeholder="Any special requests…" />
                </div>
              </div>
            </div>

            {/* Payment plan */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4">{t('booking.payment_plan')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['full', 'partial'] as const).map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => dispatch(setPaymentPlan(plan))}
                    className={`p-4 rounded-xl border-2 text-start transition-all ${draft.paymentPlan === plan ? 'border-gold-500 bg-gold-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <p className="font-medium text-gray-900 text-sm">
                      {plan === 'full' ? t('booking.full_payment') : t('booking.partial_payment')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {plan === 'full' ? t('booking.full_payment_desc') : t('booking.partial_payment_desc')}
                    </p>
                    {draft.pricing && plan === 'partial' && (
                      <p className="text-xs font-semibold text-gold-600 mt-1">
                        Pay {(draft.pricing?.deposit ?? 0).toLocaleString()} KWD now
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Promo code */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4">{t('booking.promo_code')}</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="WELCOME20"
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 uppercase"
                />
                <Button type="button" variant="outline" onClick={handleApplyPromo}>{t('booking.apply_promo')}</Button>
              </div>
              {appliedPromo && (
                <p className="text-xs text-green-600 mt-2">✓ {appliedPromo.name[lang]} applied</p>
              )}
            </div>

            {/* Loyalty points */}
            {isAuthenticated && user && user.loyaltyPoints > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 mb-1">{t('booking.loyalty_points')}</h2>
                <p className="text-xs text-gray-500 mb-3">{t('booking.available_points')}: {user.loyaltyPoints}</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={user.loyaltyPoints}
                    step={100}
                    value={loyaltyToRedeem}
                    onChange={(e) => { const v = Number(e.target.value); setLoyaltyToRedeem(v); dispatch(setLoyaltyRedeem(v)); }}
                    className="flex-1 accent-gold-500"
                  />
                  <span className="text-sm font-medium text-gold-700 w-20 text-end">{loyaltyToRedeem} pts</span>
                </div>
                {loyaltyToRedeem > 0 && draft.pricing && (
                  <p className="text-xs text-green-600 mt-1">Saves {draft.pricing.loyaltyDiscount.toLocaleString()} KWD</p>
                )}
              </div>
            )}
          </div>

          {/* Right – summary */}
          <div className="space-y-4">
            {draft.pricing ? (
              <PricingSummary
                pricing={draft.pricing}
                paymentPlan={draft.paymentPlan}
                chaletName={chalet.name[lang]}
                checkIn={checkIn ? format(checkIn, 'dd MMM') : '—'}
                checkOut={checkOut ? format(checkOut, 'dd MMM yyyy') : '—'}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center text-sm text-gray-500">
                Select dates to see pricing
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={!draft.pricing || !checkIn || !checkOut}
            >
              {t('booking.proceed_payment')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
