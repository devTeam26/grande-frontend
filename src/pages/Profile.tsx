import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Award, Calendar } from 'lucide-react';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { cancelBooking } from '../store/slices/bookingSlice';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { BookingStatusBadge } from '../components/ui/Badge';
import { LOYALTY_TIERS } from '../utils/constants';
import toast from 'react-hot-toast';

export function Profile() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const lang = i18n.language as 'en' | 'ar';
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const bookings = useAppSelector((s) => s.booking.bookings.filter((b) => !user || b.userId === user.id || b.userId === undefined));
  const chalets = useAppSelector((s) => s.chalets.chalets);

  const [tab, setTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const tier = LOYALTY_TIERS[user.loyaltyTier];
  const tierColors = { bronze: 'text-orange-700 bg-orange-50', silver: 'text-gray-700 bg-gray-100', gold: 'text-gold-700 bg-gold-50', platinum: 'text-purple-700 bg-purple-50' };

  const filteredBookings = bookings.filter((b) => {
    if (tab === 'upcoming') return b.status === 'confirmed' || b.status === 'pending';
    if (tab === 'past') return b.status === 'completed';
    return b.status === 'cancelled';
  });

  function handleCancel(id: string) {
    if (confirm(t('common.confirm'))) {
      dispatch(cancelBooking(id));
      toast.success('Booking cancelled');
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('profile.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left – user card */}
        <div className="space-y-4">
          <Card padding="md">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gold-500 flex items-center justify-center text-white text-2xl font-bold mb-3">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <h2 className="font-semibold text-gray-900">{user.firstName} {user.lastName}</h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <span className={`mt-2 text-xs font-medium px-3 py-1 rounded-full ${tierColors[user.loyaltyTier]}`}>
                {tier.label[lang]}
              </span>
            </div>
          </Card>

          {/* Loyalty card */}
          <Card className="bg-gradient-to-br from-navy-800 to-navy-900 border-0 text-white" padding="md">
            <div className="flex items-center gap-2 mb-3">
              <Award size={18} className="text-gold-400" />
              <span className="font-semibold text-sm">{t('profile.loyalty_title')}</span>
            </div>
            <div className="text-3xl font-bold text-gold-400 mb-1">{user.loyaltyPoints.toLocaleString()}</div>
            <p className="text-navy-200 text-xs mb-3">{t('profile.points')}</p>

            {/* Progress to next tier */}
            {user.loyaltyTier !== 'platinum' && (
              <div>
                <div className="flex justify-between text-xs text-navy-300 mb-1">
                  <span>{tier.label[lang]}</span>
                  <span>{LOYALTY_TIERS[user.loyaltyTier === 'bronze' ? 'silver' : user.loyaltyTier === 'silver' ? 'gold' : 'platinum'].label[lang]}</span>
                </div>
                <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((user.loyaltyPoints - tier.min) / (tier.max - tier.min)) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-navy-400 mt-1">{Math.max(0, tier.max - user.loyaltyPoints + 1)} pts to next tier</p>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-navy-700 flex justify-between text-xs">
              <span className="text-navy-300">{t('profile.total_spent')}</span>
              <span className="text-white font-medium">{user.totalSpent.toLocaleString()} KWD</span>
            </div>
          </Card>
        </div>

        {/* Right – bookings */}
        <div className="lg:col-span-2">
          <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl">
            {(['upcoming', 'past', 'cancelled'] as const).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === tabKey ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t(`profile.${tabKey}`)}
              </button>
            ))}
          </div>

          {filteredBookings.length === 0 ? (
            <div className="text-center py-16">
              <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">{t('profile.no_bookings')}</p>
              <Link to="/chalets"><Button className="mt-4" variant="outline">Browse Chalets</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const chalet = chalets.find((c) => c.id === booking.chaletId);
                if (!chalet) return null;
                return (
                  <Card key={booking.id} padding="none" className="overflow-hidden">
                    <div className="flex gap-4 p-4">
                      <img src={chalet.images[0]} alt={chalet.name[lang]} className="w-20 h-16 rounded-xl object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{chalet.name[lang]}</h3>
                          <BookingStatusBadge status={booking.status} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Calendar size={11} />
                          {format(parseISO(booking.checkIn), 'dd MMM')} → {format(parseISO(booking.checkOut), 'dd MMM yyyy')}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-semibold text-gray-900">{booking.totalAmount.toLocaleString()} KWD</span>
                          {(booking.status === 'confirmed' || booking.status === 'pending') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(booking.id)}
                              className="text-red-600 hover:bg-red-50 text-xs"
                            >
                              {t('profile.cancel_booking')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
