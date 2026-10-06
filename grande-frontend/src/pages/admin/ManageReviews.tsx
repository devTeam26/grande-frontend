import { useState, useEffect, useCallback } from 'react';
import {
  Star, CheckCircle, XCircle, Trash2, RefreshCw,
  Loader2, MessageSquare, Filter, ChevronLeft, ChevronRight, Building2,
  X, CalendarDays, Users, Hash, CreditCard, Phone, Mail, User,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

function getToken() { return localStorage.getItem('access_token') ?? ''; }

async function authFetch(url: string, init: RequestInit = {}) {
  const token = getToken();
  return fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers as Record<string, string> ?? {}),
    },
  });
}

async function safeJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try { return text ? (JSON.parse(text) as Record<string, unknown>) : {}; } catch { return {}; }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApiReview {
  id: string;
  chaletId: string;
  chaletName: string;
  bookingId: string;
  guestName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

interface PageMeta {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ── API ───────────────────────────────────────────────────────────────────────

async function apiFetchReviews(page: number, pageSize: number, pending?: boolean) {
  try {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (pending !== undefined) params.set('pending', String(pending));
    const res = await authFetch(`${API_BASE}/api/admin/reviews?${params}`);
    const json = await safeJson(res);
    const d = json.data as { items?: ApiReview[] } & PageMeta | undefined;
    return {
      items: d?.items ?? [],
      meta: { totalCount: d?.totalCount ?? 0, page: d?.page ?? 1, pageSize: d?.pageSize ?? pageSize, totalPages: d?.totalPages ?? 1, hasNextPage: d?.hasNextPage ?? false, hasPreviousPage: d?.hasPreviousPage ?? false },
    };
  } catch {
    return { items: [], meta: { totalCount: 0, page: 1, pageSize, totalPages: 1, hasNextPage: false, hasPreviousPage: false } };
  }
}

async function apiApproveReview(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/api/admin/reviews/${id}/approve`, { method: 'POST' });
    const json = await safeJson(res);
    return { success: res.ok && Boolean(json.success), message: json.message as string };
  } catch { return { success: false, message: 'Network error' }; }
}

async function apiRejectReview(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/api/admin/reviews/${id}/reject`, { method: 'POST' });
    const json = await safeJson(res);
    return { success: res.ok && Boolean(json.success), message: json.message as string };
  } catch { return { success: false, message: 'Network error' }; }
}

async function apiDeleteReview(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/api/admin/reviews/${id}`, { method: 'DELETE' });
    const json = await safeJson(res);
    return { success: res.ok, message: json.message as string };
  } catch { return { success: false, message: 'Network error' }; }
}

// ── Booking Detail ────────────────────────────────────────────────────────────

interface BookingDetail {
  id: string;
  bookingNumber: string;
  chaletName: string;
  chaletType: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestCount: number;
  totalAmount: number;
  baseAmount: number;
  taxAmount: number;
  status: string;
  statusName: string;
  specialRequests?: string;
  createdAt: string;
}

async function apiFetchBookingDetail(bookingId: string): Promise<BookingDetail | null> {
  try {
    const res = await authFetch(`${API_BASE}/api/admin/bookings/${bookingId}`);
    const json = await safeJson(res);
    return res.ok ? (json.data as BookingDetail) : null;
  } catch { return null; }
}

// ── Booking Detail Modal ──────────────────────────────────────────────────────

const BOOKING_STATUS_COLOR: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-700',
  confirmed:  'bg-emerald-100 text-emerald-700',
  cancelled:  'bg-red-100 text-red-700',
  completed:  'bg-blue-100 text-blue-700',
  checkedout: 'bg-purple-100 text-purple-700',
  rejected:   'bg-rose-100 text-rose-700',
};

function fmtDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return '—'; }
}

function BookingDetailModal({ bookingId, guestName, onClose }: {
  bookingId: string; guestName: string; onClose: () => void;
}) {
  const [data, setData]       = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetchBookingDetail(bookingId).then((d) => { setData(d); setLoading(false); });
  }, [bookingId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Booking Details</h2>
            <p className="text-xs text-gray-400 mt-0.5">Review by {guestName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !data ? (
            <div className="text-center py-16 text-gray-400">
              <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Could not load booking details</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Booking number + status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Hash size={14} className="text-gray-400" />
                  <span className="font-mono font-semibold text-gray-800">{data.bookingNumber}</span>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${BOOKING_STATUS_COLOR[data.status?.toLowerCase()] ?? 'bg-gray-100 text-gray-600'}`}>
                  {data.statusName || data.status}
                </span>
              </div>

              {/* Chalet */}
              <div className="bg-navy-50 rounded-2xl px-4 py-3.5 flex items-center gap-3">
                <Building2 size={18} className="text-navy-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-navy-800">{data.chaletName}</p>
                  <p className="text-xs text-navy-400 capitalize">{data.chaletType}</p>
                </div>
              </div>

              {/* Guest info */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Guest</p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2.5 text-sm text-gray-700">
                    <User size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="font-medium">{data.guestFirstName} {data.guestLastName}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Mail size={14} className="text-gray-400 flex-shrink-0" />
                    {data.guestEmail}
                  </div>
                  {data.guestPhone && (
                    <div className="flex items-center gap-2.5 text-sm text-gray-600">
                      <Phone size={14} className="text-gray-400 flex-shrink-0" />
                      {data.guestPhone}
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Stay</p>
                <div className="bg-gray-50 rounded-2xl px-4 py-3 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Check-in</p>
                    <p className="text-sm font-semibold text-gray-800">{fmtDate(data.checkInDate)}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <CalendarDays size={14} className="text-gold-400 mb-1" />
                    <p className="text-xs font-bold text-gray-700">{data.nights} nights</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Check-out</p>
                    <p className="text-sm font-semibold text-gray-800">{fmtDate(data.checkOutDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 px-1">
                  <Users size={12} className="text-gray-400" />
                  {data.guestCount} guests
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Payment</p>
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
                  {[
                    { label: 'Base amount', val: data.baseAmount },
                    { label: 'Tax',         val: data.taxAmount  },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className="text-gray-700 font-medium">{val?.toLocaleString() ?? 0} KWD</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-3 bg-navy-50">
                    <span className="text-sm font-bold text-navy-800 flex items-center gap-1.5">
                      <CreditCard size={13} /> Total
                    </span>
                    <span className="text-base font-bold text-gold-700">{data.totalAmount?.toLocaleString()} KWD</span>
                  </div>
                </div>
              </div>

              {/* Special requests */}
              {data.specialRequests && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Special Requests</p>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
                    {data.specialRequests}
                  </p>
                </div>
              )}

              {/* Created at */}
              <p className="text-xs text-gray-400 text-right">
                Booked on {fmtDate(data.createdAt)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Star Rating ───────────────────────────────────────────────────────────────

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          className={i <= value ? 'fill-gold-400 text-gold-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  );
}

// ── ReviewCard ────────────────────────────────────────────────────────────────

function ReviewCard({
  review, actionLoading, onApprove, onReject, onDelete, onDetail,
}: {
  review: ApiReview;
  actionLoading: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  onDetail: (bookingId: string, guestName: string) => void;
}) {
  const busy = actionLoading === review.id;

  return (
    <Card padding="none" className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Status strip */}
      <div className={`h-1 w-full ${review.isApproved ? 'bg-emerald-400' : 'bg-amber-400'}`} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-gold-700">{review.guestName.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{review.guestName}</p>
              <p className="text-xs text-gray-400">{format(parseISO(review.createdAt), 'MMM d, yyyy')}</p>
            </div>
          </div>
          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${review.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {review.isApproved ? 'Approved' : 'Pending'}
          </span>
        </div>

        {/* Chalet + rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Building2 size={12} className="text-gray-400" />
            <span className="truncate max-w-[140px]">{review.chaletName}</span>
          </div>
          <div className="flex items-center gap-2">
            <StarRating value={review.rating} />
            <span className="text-xs font-semibold text-gray-700">{review.rating}/5</span>
          </div>
        </div>

        {/* Comment */}
        {review.comment ? (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 bg-gray-50 rounded-xl px-3 py-2.5">
            {review.comment}
          </p>
        ) : (
          <p className="text-sm text-gray-300 italic px-3 py-2.5 bg-gray-50 rounded-xl">No comment provided</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
          <button
            onClick={() => onDetail(review.bookingId, review.guestName)}
            className="flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-navy-600 hover:bg-navy-50 border border-navy-200 transition-colors"
            title="View booking details"
          >
            <Hash size={12} />
          </button>
          {!review.isApproved && (
            <button
              onClick={() => onApprove(review.id)}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors disabled:opacity-50"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
              Approve
            </button>
          )}
          {review.isApproved && (
            <button
              onClick={() => onReject(review.id)}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-amber-600 hover:bg-amber-50 border border-amber-200 transition-colors disabled:opacity-50"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
              Unapprove
            </button>
          )}
          <button
            onClick={() => onDelete(review.id)}
            disabled={busy}
            className="flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-50 border border-red-100 transition-colors disabled:opacity-50"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </Card>
  );
}

// ── ManageReviews ─────────────────────────────────────────────────────────────

type FilterMode = 'all' | 'pending' | 'approved';

export function ManageReviews() {
  const [reviews, setReviews]       = useState<ApiReview[]>([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [meta, setMeta]             = useState<PageMeta>({ totalCount: 0, page: 1, pageSize: 20, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detailBooking, setDetailBooking] = useState<{ bookingId: string; guestName: string } | null>(null);

  const pendingParam: boolean | undefined =
    filterMode === 'pending' ? true : filterMode === 'approved' ? false : undefined;

  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiFetchReviews(page, 20, pendingParam);
    setReviews(r.items);
    setMeta(r.meta);
    setLoading(false);
  }, [page, pendingParam]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(id: string) {
    setActionLoading(id);
    const r = await apiApproveReview(id);
    setActionLoading(null);
    if (r.success) { toast.success('Review approved'); load(); }
    else toast.error(r.message || 'Failed');
  }

  async function handleReject(id: string) {
    setActionLoading(id);
    const r = await apiRejectReview(id);
    setActionLoading(null);
    if (r.success) { toast.success('Review unapproved'); load(); }
    else toast.error(r.message || 'Failed');
  }

  async function handleDelete(id: string) {
    setActionLoading(id);
    const r = await apiDeleteReview(id);
    setActionLoading(null);
    if (r.success) { toast.success('Review deleted'); load(); }
    else toast.error(r.message || 'Failed');
  }

  const pendingCount  = filterMode === 'all' ? reviews.filter((r) => !r.isApproved).length : undefined;
  const approvedCount = filterMode === 'all' ? reviews.filter((r) => r.isApproved).length  : undefined;

  return (
    <div className="space-y-5">

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-xl bg-gold-50 flex-shrink-0"><Star size={18} className="text-gold-500" /></div>
          <div>
            <p className="text-xs text-gray-400">Total Reviews</p>
            <p className="text-xl font-bold text-gray-900">{meta.totalCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-xl bg-amber-50 flex-shrink-0"><MessageSquare size={18} className="text-amber-500" /></div>
          <div>
            <p className="text-xs text-gray-400">This Page</p>
            <p className="text-xl font-bold text-gray-900">{reviews.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-xl bg-amber-50 flex-shrink-0"><MessageSquare size={18} className="text-amber-500" /></div>
          <div>
            <p className="text-xs text-gray-400">Pending</p>
            <p className="text-xl font-bold text-amber-600">
              {pendingCount ?? (filterMode === 'pending' ? meta.totalCount : '—')}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-xl bg-emerald-50 flex-shrink-0"><CheckCircle size={18} className="text-emerald-500" /></div>
          <div>
            <p className="text-xs text-gray-400">Approved</p>
            <p className="text-xl font-bold text-emerald-600">
              {approvedCount ?? (filterMode === 'approved' ? meta.totalCount : '—')}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {(['all', 'pending', 'approved'] as FilterMode[]).map((key) => (
            <button
              key={key}
              onClick={() => { setFilterMode(key); setPage(1); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filterMode === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {key === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              {key === 'approved' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              {key === 'all' && <Filter size={11} />}
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        <span className="text-sm text-gray-400">{meta.totalCount} total</span>

        <button
          onClick={() => load()}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 ms-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} padding="none" className="overflow-hidden">
              <div className="h-1 bg-gray-100" />
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-gray-100 rounded-full animate-pulse w-1/2" />
                    <div className="h-2.5 bg-gray-100 rounded-full animate-pulse w-1/3" />
                  </div>
                </div>
                <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-8 bg-gray-100 rounded-xl animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-base font-medium">No reviews found</p>
          <p className="text-sm mt-1 opacity-70">
            {filterMode !== 'all' ? `No ${filterMode} reviews` : 'Reviews will appear here once guests submit them'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              actionLoading={actionLoading}
              onApprove={handleApprove}
              onReject={handleReject}
              onDelete={handleDelete}
              onDetail={(bookingId, guestName) => setDetailBooking({ bookingId, guestName })}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={!meta.hasPreviousPage || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-sm text-gray-500 min-w-[100px] text-center">Page {page} of {meta.totalPages}</span>
          <button
            disabled={!meta.hasNextPage || loading}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Booking detail modal */}
      {detailBooking && (
        <BookingDetailModal
          bookingId={detailBooking.bookingId}
          guestName={detailBooking.guestName}
          onClose={() => setDetailBooking(null)}
        />
      )}

    </div>
  );
}
