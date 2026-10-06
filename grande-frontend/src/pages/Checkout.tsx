import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { Tag, Loader2, CheckCircle, X } from 'lucide-react';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setPaymentMethod, setCurrentApiBooking, clearDraft, applyPromo } from '../store/slices/bookingSlice';
import { submitBooking } from '../store/slices/bookingSlice';
import { updateLoyaltyPoints } from '../store/slices/authSlice';
import { PaymentMethodSelector } from '../components/payment/PaymentMethod';
import { PricingSummary } from '../components/booking/PricingSummary';
import { Button } from '../components/ui/Button';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

async function validatePromoCode(code: string): Promise<{ success: boolean; discount: number; message: string }> {
  try {
    const token = localStorage.getItem('access_token') ?? '';
    const res = await fetch(`${API_BASE}/api/Promotions/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ code }),
    });
    const json = await res.json() as { success?: boolean; message?: string; data?: { discountAmount?: number; discountPercentage?: number } };
    if (!res.ok || !json.success) return { success: false, discount: 0, message: json.message || 'Invalid promo code' };
    return { success: true, discount: json.data?.discountAmount ?? 0, message: json.message || 'Promo applied' };
  } catch { return { success: false, discount: 0, message: 'Network error' }; }
}
export function Checkout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const lang = i18n.language as 'en' | 'ar';

  const draft = useAppSelector((s) => s.booking.draft);
  const chalet = useAppSelector((s) => s.chalets.chalets.find((c) => c.id === draft.chaletId));
  const { user } = useAppSelector((s) => s.auth);
  const apiAddons = useAppSelector((s) => s.addons.items);
  const [isProcessing, setIsProcessing] = useState(false);
  const [promoInput, setPromoInput]     = useState(draft.promoCode ?? '');
  const [promoLoading, setPromoLoading] = useState(false);

  if (!chalet || !draft.pricing || !draft.checkIn || !draft.checkOut) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">No booking in progress. Please start from a chalet page.</p>
        <Button className="mt-4" onClick={() => navigate('/chalets')}>Browse Chalets</Button>
      </div>
    );
  }

  const nights = draft.pricing?.nights ?? 1;
  const resolvedAddons = apiAddons.map((a) => ({ id: a.id, en: a.name, ar: a.nameAr, price: a.isPerNight ? a.price * nights : a.price }));

  const selectedAddonLines = resolvedAddons
    .filter((a) => (draft.selectedAddons ?? []).includes(a.id))
    .map((a) => ({ name: lang === 'ar' ? a.ar : a.en, price: a.price }));

  const addonsTotal = selectedAddonLines.reduce((s, a) => s + a.price, 0);
  const grandTotal = draft.pricing.total + addonsTotal;
  const amountToPay = draft.paymentPlan === 'partial' ? Math.round(grandTotal * 0.3) : grandTotal;

  async function handleApplyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    const r = await validatePromoCode(code);
    setPromoLoading(false);
    if (r.success) {
      dispatch(applyPromo({ code, discount: r.discount }));
      toast.success(r.message);
    } else {
      toast.error(r.message);
    }
  }

  function handleRemovePromo() {
    dispatch(applyPromo({ code: '', discount: 0 }));
    setPromoInput('');
  }

  // Map frontend payment method → API provider name
  function mapProvider(m: string | null): string {
    if (!m) return 'Tap';
    return m.charAt(0).toUpperCase() + m.slice(1);
  }

  async function handlePay() {
    if (!draft.paymentMethod) { toast.error('Please select a payment method'); return; }
    if (!draft.guestInfo.firstName || !draft.guestInfo.email) {
      toast.error('Guest information is missing. Please go back and fill in your details.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await submitBooking({
        chaletId: draft.chaletId!,
        guestFirstName: draft.guestInfo.firstName ?? '',
        guestLastName: draft.guestInfo.lastName ?? '',
        guestEmail: draft.guestInfo.email ?? '',
        guestPhone: draft.guestInfo.phone ?? '',
        checkInDate: draft.checkIn!,
        checkOutDate: draft.checkOut!,
        guestCount: draft.guests,
        paymentType: draft.paymentPlan === 'full' ? 'Full' : 'Partial',
        preferredPaymentProvider: mapProvider(draft.paymentMethod),
        promotionCode: draft.promoCode ?? undefined,
        loyaltyPointsToRedeem: draft.loyaltyPointsToRedeem ?? 0,
        specialRequests: draft.guestInfo.specialRequests ?? '',
        addOns: (draft.selectedAddons ?? []).map((id) => ({ addOnId: id, quantity: 1 })),
      });

      if (!result.success || !result.data) {
        toast.error(result.message || 'Booking failed. Please try again.');
        return;
      }

      const apiBooking = result.data;
      dispatch(setCurrentApiBooking(apiBooking));
      dispatch(clearDraft());
      if (user && (apiBooking.loyaltyPointsEarned ?? 0) > 0) {
        dispatch(updateLoyaltyPoints(apiBooking.loyaltyPointsEarned ?? 0));
      }
      toast.success('Booking confirmed!');
      navigate(`/confirmation/${apiBooking.id}`);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('payment.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment methods */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-2xl p-4 text-sm">
            <p className="font-semibold text-gray-900 mb-1">{chalet.name[lang]}</p>
            <p className="text-gray-500">
              {draft.checkIn && format(parseISO(draft.checkIn), 'dd MMM')} →{' '}
              {draft.checkOut && format(parseISO(draft.checkOut), 'dd MMM yyyy')}
              {' · '}{draft.guests} guests
            </p>
          </div>

          {/* Promo code */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Tag size={14} className="text-gold-500" />
              {lang === 'ar' ? 'كود الخصم' : 'Promo Code'}
            </p>
            {draft.promoCode ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-700">{draft.promoCode}</span>
                  {(draft.promoDiscount ?? 0) > 0 && (
                    <span className="text-xs text-emerald-600">−{draft.promoDiscount} KWD</span>
                  )}
                </div>
                <button onClick={handleRemovePromo} className="text-emerald-400 hover:text-red-500 transition-colors">
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                  placeholder={lang === 'ar' ? 'أدخل كود الخصم…' : 'Enter promo code…'}
                  className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-white uppercase tracking-widest"
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={!promoInput.trim() || promoLoading}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-gold-500 text-white hover:bg-gold-600 disabled:opacity-50 transition-colors"
                >
                  {promoLoading ? <Loader2 size={14} className="animate-spin" /> : (lang === 'ar' ? 'تطبيق' : 'Apply')}
                </button>
              </div>
            )}
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
              ✨ You'll earn loyalty points for this booking
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
          addonLines={selectedAddonLines}
        />
      </div>
    </div>
  );
}
