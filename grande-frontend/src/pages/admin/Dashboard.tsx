import { useEffect } from 'react';
import { TrendingUp, CalendarDays, Users, Home, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { fetchAdminDashboard } from '../../store/slices/adminSlice';
import { fetchAdminBookings } from '../../store/slices/bookingSlice';
import { StatCard, Card } from '../../components/ui/Card';

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function AdminDashboard() {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const dispatch = useAppDispatch();

  const stats        = useAppSelector((s) => s.admin.dashboardStats);
  const statsLoading = useAppSelector((s) => s.admin.dashboardLoading);
  const allBookings  = useAppSelector((s) => s.booking.adminBookings);
  const chalets      = useAppSelector((s) => s.chalets.chalets);

  const recentBookings = allBookings
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  useEffect(() => {
    (dispatch as any)(fetchAdminDashboard());
    (dispatch as any)(fetchAdminBookings());
  }, [dispatch]);

  function stat(val: number | undefined) {
    return statsLoading && val === undefined ? '—' : (val ?? 0).toLocaleString();
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={lang === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
          value={`${stat(stats?.totalRevenue)} KWD`}
          icon={<DollarSign size={20} />}
          color="gold"
        />
        <StatCard
          label={lang === 'ar' ? 'إيرادات الشهر' : 'This Month'}
          value={`${stat(stats?.revenueThisMonth)} KWD`}
          sub={lang === 'ar' ? `هذا الأسبوع: ${stat(stats?.revenueThisWeek)} KWD` : `Week: ${stat(stats?.revenueThisWeek)} KWD`}
          icon={<TrendingUp size={20} />}
          color="green"
        />
        <StatCard
          label={lang === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings'}
          value={stat(stats?.totalBookings)}
          sub={lang === 'ar' ? `اليوم: ${stat(stats?.bookingsToday)}` : `Today: ${stat(stats?.bookingsToday)}`}
          icon={<CalendarDays size={20} />}
          color="navy"
        />
        <StatCard
          label={lang === 'ar' ? 'طلبات معلقة' : 'Pending Requests'}
          value={stat(stats?.pendingBookings)}
          sub={lang === 'ar' ? `مؤكد: ${stat(stats?.confirmedBookings)}` : `Confirmed: ${stat(stats?.confirmedBookings)}`}
          icon={<Clock size={20} />}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={lang === 'ar' ? 'الشاليهات النشطة' : 'Active Chalets'} value={`${stat(stats?.activeChalets)} / ${stat(stats?.totalChalets)}`} icon={<Home size={20} />} color="gold" />
        <StatCard label={lang === 'ar' ? 'نسبة الإشغال' : 'Occupancy Rate'} value={`${stats?.occupancyRate?.toFixed(1) ?? '—'}%`} icon={<CheckCircle size={20} />} color="green" />
        <StatCard label={lang === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'} value={stat(stats?.totalUsers)} sub={lang === 'ar' ? `جديد: ${stat(stats?.newUsersThisMonth)}` : `New: ${stat(stats?.newUsersThisMonth)}`} icon={<Users size={20} />} color="navy" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent bookings */}
        <Card padding="md">
          <h2 className="font-semibold text-gray-900 mb-4">{lang === 'ar' ? 'أحدث الطلبات' : 'Recent Requests'}</h2>
          {recentBookings.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">{lang === 'ar' ? 'لا توجد حجوزات بعد' : 'No bookings yet'}</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => {
                const s = b.status.toLowerCase();
                const badge = STATUS_COLORS[s] ?? 'bg-gray-100 text-gray-700';
                return (
                  <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{b.chaletName ?? '—'}</p>
                      <p className="text-xs text-gray-500">{b.guestFirstName} {b.guestLastName}</p>
                      <p className="text-xs text-gray-400">
                        {b.checkInDate && format(parseISO(b.checkInDate), 'dd MMM')} – {b.checkOutDate && format(parseISO(b.checkOutDate), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div className="text-end flex flex-col items-end gap-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge}`}>
                        {b.statusName || b.status}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{b.totalAmount?.toLocaleString()} KWD</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Bookings by status */}
        <Card padding="md">
          <h2 className="font-semibold text-gray-900 mb-4">{lang === 'ar' ? 'الحجوزات حسب الحالة' : 'Bookings by Status'}</h2>
          {stats?.bookingsByStatus?.length ? (
            <div className="space-y-3">
              {stats.bookingsByStatus.map((item) => {
                const s = item.status.toLowerCase();
                const badge = STATUS_COLORS[s] ?? 'bg-gray-100 text-gray-700';
                const pct = stats.totalBookings > 0 ? Math.round((item.count / stats.totalBookings) * 100) : 0;
                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge}`}>{item.status}</span>
                      <span className="font-medium text-gray-900">{item.count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gold-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2.5">
              {chalets.slice(0, 6).map((chalet) => (
                <div key={chalet.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate flex-1">{chalet.name[lang]}</span>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ms-2 ${chalet.isAvailable ? 'bg-green-500' : 'bg-red-400'}`} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
