import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { confirmBooking, setPaymentMethod } from '../store/slices/bookingSlice';
import { updateLoyaltyPoints } from '../store/slices/authSlice';
import { PaymentMethodSelector } from '../components/payment/PaymentMethod';
import { PricingSummary } from '../components/booking/PricingSummary';
import { Button } from '../components/ui/Button';
import { pointsEarned } from '../utils/pricing';
import type { Booking } from '../types';

export function Checkout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const lang = i18n.language as 'en' | 'ar';

  const draft = useAppSelector((s) => s.booking.draft);
  const chalet = useAppSelector((s) => s.chalets.chalets.find((c) => c.id === draft.chaletId));
  const { user } = useAppSelector((s) => s.auth);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!chalet || !draft.pricing || !draft.checkIn || !draft.checkOut) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">No booking in progress. Please start from a chalet page.</p>
        <Button className="mt-4" onClick={() => navigate('/chalets')}>Browse Chalets</Button>
      </div>
    );
  }

  const amountToPay = draft.paymentPlan === 'partial' ? draft.pricing.deposit : draft.pricing.total;

  function handlePay() {
    if (!draft.paymentMethod) { toast.error('Please select a payment method'); return; }

    setIsProcessing(true);
    setTimeout(() => {
      const bookingId = `BK-${Date.now()}`;
      const earned = pointsEarned(draft.pricing!.total);

      const booking: Booking = {
        id: bookingId,
        chaletId: draft.chaletId!,
        userId: user?.id,
        guestInfo: {
          firstName: draft.guestInfo.firstName ?? '',
          lastName: draft.guestInfo.lastName ?? '',
          email: draft.guestInfo.email ?? '',
          phone: draft.guestInfo.phone ?? '',
          specialRequests: draft.guestInfo.specialRequests,
        },
        checkIn: draft.checkIn!,
        checkOut: draft.checkOut!,
        guests: draft.guests,
        nights: draft.pricing!.nights,
        baseAmount: draft.pricing!.subtotal,
        discountAmount: draft.pricing!.discount + draft.pricing!.loyaltyDiscount,
        taxAmount: draft.pricing!.tax,
        totalAmount: draft.pricing!.total,
        depositAmount: draft.pricing!.deposit,
        remainingAmount: draft.pricing!.remaining,
        paymentPlan: draft.paymentPlan,
        paymentMethod: draft.paymentMethod!,
        paymentStatus: draft.paymentPlan === 'full' ? 'paid' : 'partial',
        status: 'confirmed',
        promoCode: draft.promoCode ?? undefined,
        loyaltyPointsUsed: draft.loyaltyPointsToRedeem,
        loyaltyPointsEarned: earned,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch(confirmBooking(booking));
      if (user) dispatch(updateLoyaltyPoints(earned));
      toast.success('Payment successful!');
      navigate(`/confirmation/${bookingId}`);
    }, 2000);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('payment.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment methods */}
        <div className="space-y-6">
          {/* Booking summary mini */}
          <div className="bg-gray-50 rounded-2xl p-4 text-sm">
            <p className="font-semibold text-gray-900 mb-1">{chalet.name[lang]}</p>
            <p className="text-gray-500">
              {draft.checkIn && format(parseISO(draft.checkIn), 'dd MMM')} →{' '}
              {draft.checkOut && format(parseISO(draft.checkOut), 'dd MMM yyyy')}
              {' · '}{draft.guests} guests
            </p>
          </div>

          <PaymentMethodSelector
            selected={draft.paymentMethod}
            onSelect={(m) => dispatch(setPaymentMethod(m))}
            amount={amountToPay}
          />

          <div className="bg-navy-50 rounded-xl p-4 text-sm">
            <p className="font-semibold text-navy-800 mb-1">Amount to pay now</p>
            <p className="text-3xl font-bold text-navy-900">{amountToPay.toLocaleString()} KWD</p>
            {draft.paymentPlan === 'partial' && (
              <p className="text-navy-500 text-xs mt-1">
                Remaining {draft.pricing.remaining.toLocaleString()} KWD due on arrival
              </p>
            )}
          </div>

          {user && (
            <p className="text-xs text-gold-600">
              ✨ You'll earn {pointsEarned(draft.pricing.total)} loyalty points for this booking
            </p>
          )}

          <Button
            fullWidth
            size="lg"
            onClick={handlePay}
            isLoading={isProcessing}
            disabled={!draft.paymentMethod || isProcessing}
          >
            {isProcessing ? t('payment.processing') : `${t('payment.pay_now')} – ${amountToPay.toLocaleString()} KWD`}
          </Button>
        </div>

        {/* Pricing summary */}
        <PricingSummary
          pricing={draft.pricing}
          paymentPlan={draft.paymentPlan}
          chaletName={chalet.name[lang]}
          checkIn={draft.checkIn ? format(parseISO(draft.checkIn), 'dd MMM') : ''}
          checkOut={draft.checkOut ? format(parseISO(draft.checkOut), 'dd MMM yyyy') : ''}
        />
      </div>
    </div>
  );
}
