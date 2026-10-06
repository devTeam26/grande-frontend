import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Search, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { fetchAdminBookings, updateAdminBookingStatus } from '../../store/slices/bookingSlice';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function ManageBookings() {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const dispatch = useAppDispatch();

  const adminBookings = useAppSelector((s) => s.booking.adminBookings);
  const loading = useAppSelector((s) => s.booking.adminBookingsLoading);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    (dispatch as any)(fetchAdminBookings());
  }, [dispatch]);

  const filtered = adminBookings.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      b.bookingNumber?.toLowerCase().includes(q) ||
      b.guestEmail?.toLowerCase().includes(q) ||
      b.guestFirstName?.toLowerCase().includes(q) ||
      b.guestLastName?.toLowerCase().includes(q) ||
      b.chaletName?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || b.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  async function handleStatusChange(id: string, status: string) {
    setUpdatingId(id);
    const result = await updateAdminBookingStatus(id, status);
    if (result.success) {
      toast.success(lang === 'ar' ? 'تم تحديث الحالة' : 'Status updated');
      (dispatch as any)(fetchAdminBookings());
    } else {
      toast.error(result.message || 'Failed to update status');
    }
    setUpdatingId(null);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث عن حجز...' : 'Search bookings...'}
              className="w-full ps-9 pe-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
          >
            <option value="all">{lang === 'ar' ? 'جميع الحالات' : 'All Status'}</option>4
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (dispatch as any)(fetchAdminBookings())}
            isLoading={loading}
          >
            <RefreshCw size={14} />
            {lang === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
          <span className="text-sm text-gray-500">{sorted.length} {lang === 'ar' ? 'حجز' : 'bookings'}</span>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['#', lang === 'ar' ? 'الضيف' : 'Guest', lang === 'ar' ? 'الشاليه' : 'Chalet', lang === 'ar' ? 'التواريخ' : 'Dates', lang === 'ar' ? 'المبلغ' : 'Amount', lang === 'ar' ? 'الحالة' : 'Status', lang === 'ar' ? 'الإجراءات' : 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && adminBookings.length === 0 ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  {lang === 'ar' ? 'لا توجد حجوزات' : 'No bookings found'}
                </td></tr>
              ) : (
                sorted.map((b) => {
                  const s = b.status.toLowerCase();
                  const badgeClass = STATUS_COLORS[s] ?? 'bg-gray-100 text-gray-700';
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.bookingNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{b.guestFirstName} {b.guestLastName}</p>
                        <p className="text-xs text-gray-400">{b.guestEmail}</p>
                        <p className="text-xs text-gray-400">{b.guestPhone}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{b.chaletName ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {b.checkInDate && format(parseISO(b.checkInDate), 'dd MMM')} → {b.checkOutDate && format(parseISO(b.checkOutDate), 'dd MMM yy')}
                        <p className="text-xs text-gray-400">{b.nights} {lang === 'ar' ? 'ليالي' : 'nights'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{b.totalAmount?.toLocaleString()} KWD</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
                          {b.statusName || b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={b.status}
                          disabled={updatingId === b.id}
                          onChange={(e) => handleStatusChange(b.id, e.target.value)}
                          className="text-xs rounded-lg border border-gray-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold-400 disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
