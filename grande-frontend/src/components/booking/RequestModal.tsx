import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, Clock, Phone, Plus, Minus, Check } from 'lucide-react';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { fetchAddons } from '../../store/slices/addonsSlice';
import type { ApiAddon } from '../../store/slices/addonsSlice';
import { getPricePreview, submitBooking } from '../../store/slices/bookingSlice';
import type { PricePreviewResult } from '../../store/slices/bookingSlice';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chaletId: string;
  chaletName: string;
  initialAddons?: Record<string, number>;
}

type Step = 'form' | 'preview';

export function RequestModal({ isOpen, onClose, chaletId, chaletName, initialAddons = {} }: Props) {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const addons = useAppSelector((s) => s.addons.items);
  const addonsLoading = useAppSelector((s) => s.addons.isLoading);
  const addonsError = useAppSelector((s) => s.addons.error);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [step, setStep] = useState<Step>('form');
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [guests, setGuests] = useState(2);
  const [phone, setPhone] = useState(user?.phoneNumber ?? '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>(initialAddons);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [preview, setPreview] = useState<PricePreviewResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedAddons(initialAddons);
      if (addons.length === 0 && !addonsLoading) dispatch(fetchAddons() as any);
    }
  }, [isOpen]);

  function reset() {
    setStep('form');
    setCheckIn(today);
    setCheckOut(tomorrow);
    setGuests(2);
    setPhone(user?.phoneNumber ?? '');
    setSpecialRequests('');
    setSelectedAddons({});
    setPreview(null);
    onClose();
  }

  function nights() {
    const d = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000;
    return Math.max(1, Math.round(d));
  }

  function addonQty(id: string) { return selectedAddons[id] ?? 0; }

  function changeAddon(addon: ApiAddon, delta: number) {
    setSelectedAddons((prev) => {
      const next = { ...prev };
      const qty = Math.max(0, (next[addon.id] ?? 0) + delta);
      if (qty === 0) delete next[addon.id];
      else next[addon.id] = qty;
      return next;
    });
  }

  function buildAddOnsPayload(map: Record<string, number> = selectedAddons) {
    return Object.entries(map)
      .filter(([, qty]) => qty > 0)
      .map(([addOnId, quantity]) => ({ addOnId, quantity }));
  }

  async function recalculateWithAddons(newAddons: Record<string, number>) {
    if (!user) return;
    setLoadingPreview(true);
    try {
      const result = await getPricePreview({
        chaletId,
        guestFirstName: user.firstName,
        guestLastName: user.lastName,
        guestEmail: user.email,
        guestPhone: phone.trim(),
        checkInDate: new Date(checkIn).toISOString(),
        checkOutDate: new Date(checkOut).toISOString(),
        guestCount: guests,
        paymentType: 'Full',
        preferredPaymentProvider: 'Tap',
        specialRequests,
        addOns: buildAddOnsPayload(newAddons),
      });
      if (result.success && result.data) setPreview(result.data);
    } catch { /* silent */ } finally {
      setLoadingPreview(false);
    }
  }

  function changeAddonInPreview(addon: ApiAddon, delta: number) {
    setSelectedAddons((prev) => {
      const next = { ...prev };
      const qty = Math.max(0, (next[addon.id] ?? 0) + delta);
      if (qty === 0) delete next[addon.id];
      else next[addon.id] = qty;
      recalculateWithAddons(next);
      return next;
    });
  }

  async function handlePreview() {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      toast.error(lang === 'ar' ? 'تواريخ غير صحيحة' : 'Invalid dates');
      return;
    }
    if (!phone.trim()) {
      toast.error(lang === 'ar' ? 'رقم الهاتف مطلوب' : 'Phone number is required');
      return;
    }
    if (!user) return;
    setLoadingPreview(true);
    try {
      const result = await getPricePreview({
        chaletId,
        guestFirstName: user.firstName,
        guestLastName: user.lastName,
        guestEmail: user.email,
        guestPhone: phone.trim(),
        checkInDate: new Date(checkIn).toISOString(),
        checkOutDate: new Date(checkOut).toISOString(),
        guestCount: guests,
        paymentType: 'Full',
        preferredPaymentProvider: 'Tap',
        specialRequests,
        addOns: buildAddOnsPayload(),
      });
      if (result.success && result.data) {
        setPreview(result.data);
        setStep('preview');
      } else {
        toast.error(result.message || (lang === 'ar' ? 'تعذّر حساب السعر' : 'Could not get price'));
      }
    } catch {
      toast.error(lang === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleSubmit() {
    if (!isAuthenticated || !user) return;
    setLoadingSubmit(true);
    try {
      const result = await submitBooking({
        chaletId,
        guestFirstName: user.firstName,
        guestLastName: user.lastName,
        guestEmail: user.email,
        guestPhone: phone.trim(),
        checkInDate: new Date(checkIn).toISOString(),
        checkOutDate: new Date(checkOut).toISOString(),
        guestCount: guests,
        paymentType: 'Full',
        preferredPaymentProvider: 'Tap',
        specialRequests,
        loyaltyPointsToRedeem: 0,
        addOns: buildAddOnsPayload(),
      });
      if (result.success && result.data) {
        toast.success(lang === 'ar' ? `تم إرسال طلبك #${result.data.bookingNumber}` : `Request #${result.data.bookingNumber} submitted!`);
        reset();
        navigate('/profile');
      } else {
        const msg = result.message || (lang === 'ar' ? 'فشل الطلب' : 'Request failed');
        toast.error(msg, { duration: 6000 });
      }
    } catch {
      toast.error(lang === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
    } finally {
      setLoadingSubmit(false);
    }
  }

  /* ── Step badge indicator ─────────────────────────────────────────────── */
  function StepBadges() {
    const steps = [
      { key: 'form',    num: 1, en: 'Booking Details', ar: 'تفاصيل الحجز' },
      { key: 'preview', num: 2, en: 'Price & Confirm',  ar: 'السعر والتأكيد' },
    ] as const;

    return (
      <div className="flex items-center mb-6 select-none">
        {steps.map((s, idx) => {
          const isActive   = step === s.key;
          const isDone     = s.key === 'form' && step === 'preview';
          return (
            <div key={s.key} className="flex items-center flex-1">
              {/* badge + label */}
              <button
                type="button"
                disabled={s.key === 'preview' && !preview}
                onClick={() => s.key === 'form' && setStep('form')}
                className="flex items-center gap-2 group disabled:cursor-not-allowed"
              >
                <span className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors
                  ${isDone  ? 'bg-green-500 text-white' : ''}
                  ${isActive && !isDone ? 'bg-gold-600 text-white shadow-md shadow-gold-200' : ''}
                  ${!isActive && !isDone ? 'bg-gray-100 text-gray-400' : ''}
                `}>
                  {isDone ? <Check size={14} /> : s.num}
                </span>
                <span className={`text-xs font-semibold hidden sm:block ${isActive ? 'text-gold-700' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                  {lang === 'ar' ? s.ar : s.en}
                </span>
              </button>

              {/* connector line between steps */}
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 rounded-full transition-colors ${step === 'preview' ? 'bg-gold-400' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={reset} title={lang === 'ar' ? `حجز ${chaletName}` : `Book ${chaletName}`} size="md">
      {/* NOT LOGGED IN */}
      {!isAuthenticated ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-gold-50 flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-gold-500" />
          </div>
          <p className="text-gray-700 font-medium mb-1">
            {lang === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please sign in first'}
          </p>
          <p className="text-gray-400 text-sm mb-5">
            {lang === 'ar' ? 'تحتاج إلى حساب لإرسال طلب حجز' : 'You need an account to request a booking'}
          </p>
          <div className="flex gap-2">
            <Link to="/login" onClick={reset} className="flex-1">
              <Button fullWidth variant="outline">{lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</Button>
            </Link>
            <Link to="/register" onClick={reset} className="flex-1">
              <Button fullWidth>{lang === 'ar' ? 'إنشاء حساب' : 'Register'}</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <StepBadges />

          {/* ── STEP 1: BOOKING DETAILS ──────────────────────────────────── */}
          {step === 'form' && (
            <div className="space-y-4">
              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={lang === 'ar' ? 'تاريخ الوصول' : 'Check-in'}
                  type="date" value={checkIn} min={today}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
                <Input
                  label={lang === 'ar' ? 'تاريخ المغادرة' : 'Check-out'}
                  type="date" value={checkOut} min={checkIn || today}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  {lang === 'ar' ? 'رقم الهاتف' : 'Phone number'}
                </label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5">
                  <Phone size={15} className="text-gray-400 shrink-0" />
                  <input
                    type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: 96512345678+' : 'e.g. +96512345678'}
                    className="flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Guests stepper */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  {lang === 'ar' ? 'عدد الضيوف' : 'Guests'}
                </label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-2.5">
                  <Users size={15} className="text-gray-400" />
                  <button type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold transition-colors">−</button>
                  <span className="flex-1 text-center font-medium text-gray-900">{guests}</span>
                  <button type="button" onClick={() => setGuests((g) => g + 1)}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold transition-colors">+</button>
                </div>
              </div>

              {/* Add-ons */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  {lang === 'ar' ? 'الإضافات (اختياري)' : 'Add-ons (optional)'}
                </label>
                {addonsLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />)}
                  </div>
                ) : addons.length === 0 ? (
                  <p className="text-sm text-gray-400 py-1">{addonsError ?? (lang === 'ar' ? 'لا توجد إضافات متاحة' : 'No add-ons available')}</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {addons.map((addon) => {
                      const qty = addonQty(addon.id);
                      const addonName = lang === 'ar' && addon.nameAr ? addon.nameAr : addon.name;
                      const priceLabel = addon.isPerNight
                        ? (lang === 'ar' ? `${addon.price} KWD / ليلة` : `${addon.price} KWD / night`)
                        : `${addon.price} KWD`;
                      return (
                        <div key={addon.id}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors ${qty > 0 ? 'border-gold-400 bg-gold-50' : 'border-gray-200 bg-white'}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{addonName}</p>
                            <p className="text-xs text-gray-500">{priceLabel}</p>
                          </div>
                          <div className="flex items-center gap-2 ms-3 shrink-0">
                            {qty > 0 && (
                              <>
                                <button type="button" onClick={() => changeAddon(addon, -1)}
                                  className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors">
                                  <Minus size={12} />
                                </button>
                                <span className="text-sm font-semibold text-gold-700 w-5 text-center">{qty}</span>
                              </>
                            )}
                            <button type="button" onClick={() => changeAddon(addon, 1)}
                              className="w-6 h-6 rounded-full bg-gold-100 hover:bg-gold-200 flex items-center justify-center text-gold-700 transition-colors">
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Special requests */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  {lang === 'ar' ? 'طلبات خاصة (اختياري)' : 'Special requests (optional)'}
                </label>
                <textarea
                  value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
                  placeholder={lang === 'ar' ? 'أي طلبات أو ملاحظات...' : 'Any notes or preferences...'}
                />
              </div>

              <Button fullWidth onClick={handlePreview} isLoading={loadingPreview} size="lg">
                {loadingPreview
                  ? (lang === 'ar' ? 'جاري الحساب...' : 'Calculating...')
                  : (lang === 'ar' ? 'التالي: عرض السعر' : 'Next: Check Price')}
              </Button>
            </div>
          )}

          {/* ── STEP 2: PRICE & CONFIRM ───────────────────────────────────── */}
          {step === 'preview' && preview && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                {/* Summary row */}
                <div className="flex items-center gap-2 text-gray-500 mb-3">
                  <Calendar size={14} />
                  <span>{checkIn} → {checkOut} · {nights()} {lang === 'ar' ? 'ليالي' : 'nights'} · {guests} {lang === 'ar' ? 'ضيف' : 'guests'}</span>
                </div>

                {/* API breakdown lines */}
                {preview.breakdown.map((line, i) => (
                  <div key={i} className={`flex justify-between ${line.isDiscount ? 'text-green-600' : 'text-gray-700'}`}>
                    <span>{line.description}</span>
                    <span>{line.isDiscount ? '−' : ''}{line.amount.toLocaleString()} KWD</span>
                  </div>
                ))}

                {/* Add-ons section inside the card */}
                <div className="border-t border-dashed border-gray-200 pt-3 mt-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {lang === 'ar' ? 'الإضافات' : 'Add-ons'}
                    </p>
                    {loadingPreview && (
                      <span className="text-xs text-gold-600 animate-pulse">
                        {lang === 'ar' ? 'جاري التحديث...' : 'Updating price...'}
                      </span>
                    )}
                  </div>

                  {addonsLoading ? (
                    <div className="space-y-1.5">
                      {[1, 2].map((i) => <div key={i} className="h-10 rounded-lg bg-gray-200 animate-pulse" />)}
                    </div>
                  ) : addons.length === 0 ? (
                    <p className="text-xs text-gray-400">{lang === 'ar' ? 'لا توجد إضافات متاحة' : 'No add-ons available'}</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {addons.map((addon) => {
                        const qty = addonQty(addon.id);
                        const addonName = lang === 'ar' && addon.nameAr ? addon.nameAr : addon.name;
                        const priceLabel = addon.isPerNight
                          ? (lang === 'ar' ? `${addon.price} KWD / ليلة` : `${addon.price} KWD / night`)
                          : `${addon.price} KWD`;
                        return (
                          <div key={addon.id}
                            className={`flex items-center justify-between rounded-lg border px-2.5 py-2 transition-colors ${qty > 0 ? 'border-gold-300 bg-gold-50' : 'border-gray-200 bg-white'}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{addonName}</p>
                              <p className="text-[11px] text-gray-400">{priceLabel}</p>
                            </div>
                            <div className="flex items-center gap-1.5 ms-2 shrink-0">
                              {qty > 0 && (
                                <>
                                  <button type="button" onClick={() => changeAddonInPreview(addon, -1)} disabled={loadingPreview}
                                    className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors disabled:opacity-40">
                                    <Minus size={10} />
                                  </button>
                                  <span className="text-xs font-bold text-gold-700 w-4 text-center">{qty}</span>
                                </>
                              )}
                              <button type="button" onClick={() => changeAddonInPreview(addon, 1)} disabled={loadingPreview}
                                className="w-5 h-5 rounded-full bg-gold-100 hover:bg-gold-200 flex items-center justify-center text-gold-700 transition-colors disabled:opacity-40">
                                <Plus size={10} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Selected add-ons price lines */}
                  {addons.filter((a) => (selectedAddons[a.id] ?? 0) > 0).map((addon) => {
                    const qty = selectedAddons[addon.id];
                    const name = lang === 'ar' && addon.nameAr ? addon.nameAr : addon.name;
                    const lineTotal = addon.isPerNight ? addon.price * qty * nights() : addon.price * qty;
                    const qtyLabel = addon.isPerNight
                      ? `${qty} × ${nights()} ${lang === 'ar' ? 'ليالي' : 'nights'}`
                      : `× ${qty}`;
                    return (
                      <div key={addon.id} className="flex justify-between text-gray-600 text-xs py-0.5">
                        <span>{name} <span className="text-gray-400">{qtyLabel}</span></span>
                        <span className="font-medium text-gold-700">{lineTotal.toLocaleString()} KWD</span>
                      </div>
                    );
                  })}
                </div>

                {/* Tax */}
                {preview.taxAmount > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>{lang === 'ar' ? 'الضريبة' : 'Tax'}</span>
                    <span>{preview.taxAmount.toLocaleString()} KWD</span>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2 text-base">
                  <span>{lang === 'ar' ? 'المجموع' : 'Total'}</span>
                  <span>{preview.totalAmount.toLocaleString()} KWD</span>
                </div>

                {preview.loyaltyPointsToEarn > 0 && (
                  <p className="text-xs text-gold-600">✨ {lang === 'ar' ? 'ستكسب' : "You'll earn"} {preview.loyaltyPointsToEarn} {lang === 'ar' ? 'نقطة ولاء' : 'loyalty points'}</p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                <Clock size={12} className="inline me-1" />
                {lang === 'ar'
                  ? 'سيتم مراجعة طلبك وتأكيده من قِبَل الإدارة'
                  : 'Your request will be reviewed and confirmed by the team'}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('form')} className="flex-1">
                  {lang === 'ar' ? 'رجوع' : 'Back'}
                </Button>
                <Button onClick={handleSubmit} isLoading={loadingSubmit} className="flex-1">
                  {loadingSubmit
                    ? (lang === 'ar' ? 'جاري الإرسال...' : 'Submitting...')
                    : (lang === 'ar' ? 'تأكيد الطلب' : 'Confirm Request')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
