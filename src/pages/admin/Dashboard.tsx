import { TrendingUp, CalendarDays, Users, Home, DollarSign, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../hooks/useAppSelector';
import { StatCard, Card } from '../../components/ui/Card';
import { BookingStatusBadge } from '../../components/ui/Badge';
import { format, parseISO } from 'date-fns';

export function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';

  const bookings = useAppSelector((s) => s.booking.bookings);
  const chalets = useAppSelector((s) => s.chalets.chalets);
  const users = useAppSelector((s) => s.admin.users);

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.paymentStatus !== 'pending' ? b.totalAmount : 0), 0);
  const activeBookings = bookings.filter((b) => b.status === 'confirmed').length;
  const thisMonth = new Date().getMonth();
  const monthlyRevenue = bookings
    .filter((b) => new Date(b.createdAt).getMonth() === thisMonth && b.paymentStatus !== 'pending')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const recentBookings = [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('admin.total_revenue')}
          value={`${totalRevenue.toLocaleString()} KWD`}
          icon={<DollarSign size={20} />}
          color="gold"
        />
        <StatCard
          label={t('admin.monthly_revenue')}
          value={`${monthlyRevenue.toLocaleString()} KWD`}
          sub="This month"
          icon={<TrendingUp size={20} />}
          color="green"
        />
        <StatCard
          label={t('admin.total_bookings')}
          value={bookings.length}
          icon={<CalendarDays size={20} />}
          color="navy"
        />
        <StatCard
          label={t('admin.active_bookings')}
          value={activeBookings}
          icon={<BarChart3 size={20} />}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Chalets" value={chalets.length} icon={<Home size={20} />} color="gold" />
        <StatCard label="Available Now" value={chalets.filter((c) => c.isAvailable).length} icon={<Home size={20} />} color="green" />
        <StatCard label={t('admin.total_users')} value={users.filter((u) => u.roles === 'user').length} icon={<Users size={20} />} color="navy" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent bookings */}
        <Card padding="md">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Bookings</h2>
          {recentBookings.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No bookings yet</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => {
                const chalet = chalets.find((c) => c.id === b.chaletId);
                return (
                  <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{chalet?.name[lang] ?? 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{b.guestInfo.firstName} {b.guestInfo.lastName}</p>
                      <p className="text-xs text-gray-400">{format(parseISO(b.checkIn), 'dd MMM')} – {format(parseISO(b.checkOut), 'dd MMM yyyy')}</p>
                    </div>
                    <div className="text-end flex flex-col items-end gap-1.5">
                      <BookingStatusBadge status={b.status} />
                      <span className="text-sm font-semibold text-gray-900">{b.totalAmount.toLocaleString()} SAR</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Chalet occupancy */}
        <Card padding="md">
          <h2 className="font-semibold text-gray-900 mb-4">Chalet Status</h2>
          <div className="space-y-2.5">
            {chalets.slice(0, 8).map((chalet) => {
              const chaletBookings = bookings.filter((b) => b.chaletId === chalet.id && b.status === 'confirmed').length;
              return (
                <div key={chalet.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate flex-1">{chalet.name[lang]}</span>
                  <div className="flex items-center gap-2 flex-shrink-0 ms-2">
                    <span className="text-xs text-gray-400">{chaletBookings} bookings</span>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${chalet.isAvailable ? 'bg-green-500' : 'bg-red-400'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
