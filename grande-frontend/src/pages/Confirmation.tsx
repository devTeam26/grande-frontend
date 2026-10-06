import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Calendar, Users, CreditCard, MessageCircle, Star, Hash } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { fetchBookingById } from '../store/slices/bookingSlice';
import { Button } from '../components/ui/Button';
import { WHATSAPP_NUMBER } from '../utils/constants';

export function Confirmation() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const booking = useAppSelector((s) => s.booking.currentApiBooking);
  const chalet = useAppSelector((s) => s.chalets.chalets.find((c) => c.id === booking?.chaletId));

  // If the user refreshes, re-fetch the booking from the API
  useEffect(() => {
    if (bookingId && (!booking || booking.id !== bookingId)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (dispatch as any)(fetchBookingById(bookingId));
    }
  }, [bookingId, booking, dispatch]);

  if (!booking) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-xl w-3/4 mx-auto" />
          <div className="h-4 bg-gray-200 rounded-xl w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  const waMessage = encodeURIComponent(
    `Hello GrandeBeach Khairan! My booking number is ${booking.bookingNumber} for ${booking.chaletName}. Check-in: ${booking.checkInDate?.split('T')[0]}`
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('confirmation.title')}</h1>
        <p className="text-gray-500 mt-2">{t('confirmation.subtitle')}</p>
        <p className="text-xs text-gray-400 mt-1">{t('confirmation.check_email')}</p>
      </div>

      {/* Booking card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        {/* Chalet image + info */}
        <div className="flex items-center gap-4 p-5 border-b border-gray-100">
          {chalet?.images?.[0] && (
            <img src={chalet.images[0]} alt={booking.chaletName} className="w-20 h-16 rounded-xl object-cover flex-shrink-0" />
          )}
          <div>
            <h2 className="font-semibold text-gray-900">{booking.chaletName}</h2>
            <p className="text-sm text-gray-500 capitalize">{booking.chaletType}</p>
            {chalet && (
              <div className="flex items-center gap-1 mt-1">
                <Star size={12} className="fill-gold-500 text-gold-500" />
                <span className="text-xs text-gray-600">{chalet.rating}</span>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="p-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">{t('confirmation.booking_id')}</p>
            <div className="flex items-center gap-1">
              <Hash size={12} className="text-gold-500" />
              <p className="font-mono font-semibold text-gray-900">{booking.bookingNumber}</p>
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Status</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              booking.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
              booking.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {booking.statusName || booking.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-gold-500" />
            <div>
              <p className="text-gray-400 text-xs">Check-in</p>
              <p className="font-medium text-gray-900">
                {booking.checkInDate ? format(parseISO(booking.checkInDate), 'dd MMM yyyy') : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-gold-500" />
            <div>
              <p className="text-gray-400 text-xs">Check-out</p>
              <p className="font-medium text-gray-900">
                {booking.checkOutDate ? format(parseISO(booking.checkOutDate), 'dd MMM yyyy') : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users size={15} className="text-gold-500" />
            <div>
              <p className="text-gray-400 text-xs">Guests</p>
              <p className="font-medium text-gray-900">{booking.guestCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard size={15} className="text-gold-500" />
            <div>
              <p className="text-gray-400 text-xs">Payment</p>
              <p className="font-medium text-gray-900">{booking.paymentType}</p>
            </div>
          </div>
        </div>

        {/* Financial summary */}
        <div className="px-5 pb-5 space-y-2 text-sm border-t border-gray-100 pt-4">
          {booking.baseAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Base amount ({booking.nights} nights)</span>
              <span className="text-gray-700">{booking.baseAmount.toLocaleString()} KWD</span>
            </div>
          )}
          {booking.addOnsAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Add-ons</span>
              <span className="text-gray-700">{booking.addOnsAmount.toLocaleString()} KWD</span>
            </div>
          )}
          {(booking.discountAmount ?? 0) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>−{(booking.discountAmount ?? 0).toLocaleString()} KWD</span>
            </div>
          )}
          {booking.taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Tax</span>
              <span className="text-gray-700">{booking.taxAmount.toLocaleString()} KWD</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-100 pt-2">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-bold text-gray-900">{booking.totalAmount.toLocaleString()} KWD</span>
          </div>
          {booking.paymentType === 'Partial' && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">Paid now</span>
                <span className="text-green-700 font-medium">{(booking.paidAmount ?? 0).toLocaleString()} KWD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Due on arrival</span>
                <span className="text-gray-700">{(booking.remainingAmount ?? 0).toLocaleString()} KWD</span>
              </div>
            </>
          )}
          {(booking.loyaltyPointsEarned ?? 0) > 0 && (
            <div className="flex justify-between text-gold-600">
              <span>Loyalty points earned</span>
              <span className="font-medium">+{booking.loyaltyPointsEarned} pts</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button variant="secondary" fullWidth className="gap-2">
            <MessageCircle size={16} /> {t('confirmation.whatsapp_btn')}
          </Button>
        </a>
        <Link to="/profile" className="flex-1">
          <Button variant="outline" fullWidth>{t('confirmation.view_booking')}</Button>
        </Link>
        <Link to="/" className="flex-1">
          <Button variant="ghost" fullWidth>{t('confirmation.home_btn')}</Button>
        </Link>
      </div>
    </div>
  );
}
