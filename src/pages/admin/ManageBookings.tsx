import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { updateBookingStatus } from '../../store/slices/bookingSlice';
import { BookingStatusBadge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import type { BookingStatus } from '../../types';
import toast from 'react-hot-toast';

export function ManageBookings() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const lang = i18n.language as 'en' | 'ar';

  const bookings = useAppSelector((s) => s.booking.bookings);
  const chalets = useAppSelector((s) => s.chalets.chalets);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');

  const filtered = bookings.filter((b) => {
    const matchSearch = search === '' ||
      b.id.includes(search) ||
      b.guestInfo.email.toLowerCase().includes(search.toLowerCase()) ||
      b.guestInfo.firstName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function handleStatusChange(id: string, status: BookingStatus) {
    dispatch(updateBookingStatus({ id, status }));
    toast.success('Status updated');
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
              placeholder={t('admin.search_placeholder')}
              className="w-full ps-9 pe-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'all')}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span className="text-sm text-gray-500">{sorted.length} bookings</span>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Booking ID', 'Guest', 'Chalet', 'Dates', 'Amount', 'Payment', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No bookings found</td></tr>
              ) : (
                sorted.map((b) => {
                  const chalet = chalets.find((c) => c.id === b.chaletId);
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{b.guestInfo.firstName} {b.guestInfo.lastName}</p>
                        <p className="text-xs text-gray-500">{b.guestInfo.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{chalet?.name[lang] ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {format(parseISO(b.checkIn), 'dd MMM')} → {format(parseISO(b.checkOut), 'dd MMM yy')}
                        <p className="text-xs text-gray-400">{b.nights} nights</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{b.totalAmount.toLocaleString()} KWD</p>
                        <p className="text-xs text-gray-400 capitalize">{b.paymentPlan} pay</p>
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-600">{b.paymentMethod}</td>
                      <td className="px-4 py-3"><BookingStatusBadge status={b.status} /></td>
                      <td className="px-4 py-3">
                        <select
                          value={b.status}
                          onChange={(e) => handleStatusChange(b.id, e.target.value as BookingStatus)}
                          className="text-xs rounded-lg border border-gray-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold-400"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
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
