import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, ShieldX, Clock, CheckCircle, XCircle, RefreshCw,
  Loader2, X, Eye, User, Mail, Phone, Calendar, AlertCircle,
  ChevronLeft, ChevronRight, ImageIcon, Filter, Download,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

function getToken() { return localStorage.getItem('access_token') ?? ''; }

function authHeaders(token?: string) {
  const t = token ?? getToken();
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

let _refreshInFlight: Promise<string | null> | null = null;
async function refreshToken(): Promise<string | null> {
  if (_refreshInFlight) return _refreshInFlight;
  const rt = localStorage.getItem('refresh_token');
  if (!rt) return null;
  _refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/Auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (json.success && json.data?.accessToken) {
        localStorage.setItem('access_token', json.data.accessToken);
        if (json.data.refreshToken) localStorage.setItem('refresh_token', json.data.refreshToken);
        return json.data.accessToken as string;
      }
      return null;
    } catch { return null; }
    finally { _refreshInFlight = null; }
  })();
  return _refreshInFlight;
}

async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  let res = await fetch(url, { ...init, headers: authHeaders() });
  if (res.status === 401) {
    const newToken = await refreshToken();
    if (newToken) res = await fetch(url, { ...init, headers: authHeaders(newToken) });
  }
  return res;
}

async function downloadPdf(verificationId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/verification/${verificationId}/pdf`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) { toast.error('Failed to download PDF'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-${verificationId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch { toast.error('Download failed'); }
}

async function safeJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try { return text ? (JSON.parse(text) as Record<string, unknown>) : {}; } catch { return {}; }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApiVerification {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  idCardUrl: string;
  photoUrl: string;
  signatureUrl: string | null;
  status: string;
  statusName: string;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  bookingId: string | null;
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

async function apiFetchVerifications(page: number, pageSize: number, status?: string) {
  try {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.set('status', status);
    const res = await authFetch(`${API_BASE}/api/admin/verification?${params}`);
    const json = await safeJson(res);
    const d = json.data as ({ items?: ApiVerification[] } & PageMeta) | undefined;
    return {
      items: d?.items ?? [],
      meta: { totalCount: d?.totalCount ?? 0, page: d?.page ?? 1, pageSize: d?.pageSize ?? pageSize, totalPages: d?.totalPages ?? 1, hasNextPage: d?.hasNextPage ?? false, hasPreviousPage: d?.hasPreviousPage ?? false },
    };
  } catch {
    return { items: [], meta: { totalCount: 0, page: 1, pageSize, totalPages: 1, hasNextPage: false, hasPreviousPage: false } };
  }
}

async function apiFetchVerificationByUser(userId: string): Promise<ApiVerification | null> {
  try {
    const res = await authFetch(`${API_BASE}/api/admin/verification/${userId}`);
    const json = await safeJson(res);
    return res.ok ? (json.data as ApiVerification) : null;
  } catch { return null; }
}

async function apiReviewVerification(verificationId: string, approve: boolean, rejectionReason?: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/api/admin/verification/${verificationId}/review`, {
      method: 'POST',
      body: JSON.stringify({ approve, rejectionReason: rejectionReason ?? '' }),
    });
    const json = await safeJson(res);
    return { success: res.ok, message: json.message as string };
  } catch { return { success: false, message: 'Network error' }; }
}

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; strip: string; icon: typeof Clock }> = {
  Pending:  { label: 'Pending',  color: 'bg-amber-100 text-amber-700',   strip: 'bg-amber-400',   icon: Clock },
  Approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', strip: 'bg-emerald-400', icon: ShieldCheck },
  Rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700',       strip: 'bg-red-400',     icon: ShieldX },
};

function statusConfig(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, color: 'bg-gray-100 text-gray-600', strip: 'bg-gray-300', icon: Clock };
}

// ── Image Lightbox ────────────────────────────────────────────────────────────

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 end-0 p-2 text-white hover:text-gray-300 transition-colors"
        >
          <X size={20} />
        </button>
        <img src={url} alt="Document" className="w-full rounded-2xl object-contain max-h-[80vh]" />
      </div>
    </div>
  );
}

// ── Reject Modal ──────────────────────────────────────────────────────────────

function RejectModal({ verificationId, onClose, onSuccess }: { verificationId: string; onClose: () => void; onSuccess: () => void }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!reason.trim()) { toast.error('Rejection reason is required'); return; }
    setSaving(true);
    const r = await apiReviewVerification(verificationId, false, reason.trim());
    setSaving(false);
    if (r.success) { toast.success('Verification rejected'); onSuccess(); }
    else toast.error(r.message || 'Failed');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 flex-shrink-0"><AlertCircle size={20} className="text-red-500" /></div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Reject Verification</h3>
            <p className="text-xs text-gray-400 mt-0.5">Provide a reason that will be shown to the customer.</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Rejection Reason <span className="text-red-400">*</span></label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. ID card is blurry, please resubmit a clear photo…"
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white resize-none"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors font-medium">
            {saving && <Loader2 size={13} className="animate-spin" />} Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({ userId, onClose, onAction }: { userId: string; onClose: () => void; onAction: () => void }) {
  const [data, setData]         = useState<ApiVerification | null>(null);
  const [loading, setLoading]   = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);

  useEffect(() => {
    apiFetchVerificationByUser(userId).then((v) => { setData(v); setLoading(false); });
  }, [userId]);

  async function approve() {
    if (!data) return;
    setActionBusy(true);
    const r = await apiReviewVerification(data.id, true);
    setActionBusy(false);
    if (r.success) { toast.success('Verification approved'); onAction(); onClose(); }
    else toast.error(r.message || 'Failed');
  }

  const sc = data ? statusConfig(data.status) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Verification Details</h2>
          <div className="flex items-center gap-1">
            {data && (
              <button
                onClick={() => downloadPdf(data.id)}
                title="Download PDF"
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <Download size={16} />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-gold-500" />
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Could not load details</div>
        ) : (
          <>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Status */}
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${sc?.color}`}>
                {sc && <sc.icon size={16} />}
                {data.statusName || data.status}
                {data.reviewedAt && (
                  <span className="ms-auto text-xs opacity-70">
                    Reviewed {format(parseISO(data.reviewedAt), 'MMM d, yyyy')}
                  </span>
                )}
              </div>

              {/* Customer info */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2.5 text-sm text-gray-700">
                    <User size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="font-medium">{data.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Mail size={14} className="text-gray-400 flex-shrink-0" />
                    {data.customerEmail}
                  </div>
                  {data.customerPhone && (
                    <div className="flex items-center gap-2.5 text-sm text-gray-600">
                      <Phone size={14} className="text-gray-400 flex-shrink-0" />
                      {data.customerPhone}
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-sm text-gray-500">
                    <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                    Submitted {format(parseISO(data.submittedAt), 'MMM d, yyyy · HH:mm')}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Documents</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* ID Card */}
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-400 font-medium">ID Card</p>
                    {data.idCardUrl ? (
                      <button
                        onClick={() => setLightbox(data.idCardUrl)}
                        className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-gray-100 bg-gray-50 hover:ring-2 hover:ring-gold-400 transition-all group"
                      >
                        <img src={data.idCardUrl} alt="ID Card" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-full aspect-[4/3] rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                        <ImageIcon size={24} />
                      </div>
                    )}
                  </div>
                  {/* Photo */}
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-400 font-medium">Selfie Photo</p>
                    {data.photoUrl ? (
                      <button
                        onClick={() => setLightbox(data.photoUrl)}
                        className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-gray-100 bg-gray-50 hover:ring-2 hover:ring-gold-400 transition-all group"
                      >
                        <img src={data.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-full aspect-[4/3] rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                        <ImageIcon size={24} />
                      </div>
                    )}
                  </div>
                </div>
                {/* Signature */}
                {data.signatureUrl && (
                  <div className="space-y-1.5 col-span-2">
                    <p className="text-xs text-gray-400 font-medium">Signature</p>
                    <button
                      onClick={() => setLightbox(data.signatureUrl!)}
                      className="relative w-full h-24 rounded-xl overflow-hidden border border-gray-100 bg-white hover:ring-2 hover:ring-gold-400 transition-all group flex items-center justify-center"
                    >
                      <img src={data.signatureUrl} alt="Signature" className="max-h-full max-w-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <Eye size={20} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-gray-400">Click an image to view full size</p>
              </div>

              {/* Rejection reason */}
              {data.rejectionReason && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 space-y-1">
                  <p className="text-xs font-semibold text-red-600">Rejection Reason</p>
                  <p className="text-sm text-red-700">{data.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {data.status === 'Pending' && (
              <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={() => setRejectId(data.id)}
                  disabled={actionBusy}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <XCircle size={15} /> Reject
                </button>
                <button
                  onClick={approve}
                  disabled={actionBusy}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                >
                  {actionBusy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                  Approve
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
      {rejectId && (
        <RejectModal
          verificationId={rejectId}
          onClose={() => setRejectId(null)}
          onSuccess={() => { setRejectId(null); onAction(); onClose(); }}
        />
      )}
    </div>
  );
}

// ── VerificationCard ──────────────────────────────────────────────────────────

function VerificationCard({
  item, actionLoading, onView, onApprove, onReject,
}: {
  item: ApiVerification;
  actionLoading: string | null;
  onView: (userId: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const sc = statusConfig(item.status);
  const busy = actionLoading === item.id;

  return (
    <Card padding="none" className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Status strip */}
      <div className={`h-1 w-full ${sc.strip}`} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0 border border-navy-200">
              <span className="text-sm font-bold text-navy-700">
                {item.customerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{item.customerName}</p>
              <p className="text-xs text-gray-400 truncate max-w-[150px]">{item.customerEmail}</p>
            </div>
          </div>
          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 flex items-center gap-1 ${sc.color}`}>
            <sc.icon size={10} />
            {item.statusName || item.status}
          </span>
        </div>

        {/* Document thumbnails */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">ID Card</p>
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
              {item.idCardUrl
                ? <img src={item.idCardUrl} alt="ID" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={18} /></div>}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Selfie</p>
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
              {item.photoUrl
                ? <img src={item.photoUrl} alt="Selfie" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={18} /></div>}
            </div>
          </div>
        </div>

        {/* Rejection reason */}
        {item.rejectionReason && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 leading-relaxed line-clamp-2">
            <span className="font-semibold">Reason: </span>{item.rejectionReason}
          </div>
        )}

        {/* Date */}
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <Calendar size={11} />
          {format(parseISO(item.submittedAt), 'MMM d, yyyy · HH:mm')}
        </p>

        {/* Action row */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
          <button
            onClick={() => onView(item.userId)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-100 transition-colors"
          >
            <Eye size={11} /> Details
          </button>
          {item.status === 'Pending' && (
            <>
              <button
                onClick={() => onApprove(item.id)}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors disabled:opacity-50"
              >
                {busy ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                Approve
              </button>
              <button
                onClick={() => onReject(item.id)}
                disabled={busy}
                className="flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-50 border border-red-100 transition-colors disabled:opacity-50"
              >
                <XCircle size={11} />
              </button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── ManageVerification ────────────────────────────────────────────────────────

type FilterStatus = 'All' | 'Pending' | 'Approved' | 'Rejected';

export function ManageVerification() {
  const [items, setItems]           = useState<ApiVerification[]>([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
  const [meta, setMeta]             = useState({ totalCount: 0, page: 1, pageSize: 20, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detailUserId, setDetailUserId]   = useState<string | null>(null);
  const [rejectId, setRejectId]           = useState<string | null>(null);

  const statusParam = filterStatus === 'All' ? undefined : filterStatus;

  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiFetchVerifications(page, 20, statusParam);
    setItems(r.items);
    setMeta(r.meta);
    setLoading(false);
  }, [page, statusParam]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(id: string) {
    setActionLoading(id);
    const r = await apiReviewVerification(id, true);
    setActionLoading(null);
    if (r.success) { toast.success('Verification approved'); load(); }
    else toast.error(r.message || 'Failed');
  }

  const totalPending  = filterStatus === 'All'      ? items.filter((i) => i.status === 'Pending').length  : undefined;
  const totalApproved = filterStatus === 'All'      ? items.filter((i) => i.status === 'Approved').length : undefined;
  const totalRejected = filterStatus === 'All'      ? items.filter((i) => i.status === 'Rejected').length : undefined;

  return (
    <div className="space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',    value: meta.totalCount, color: 'bg-blue-50',    icon: ShieldCheck, iconCls: 'text-blue-500' },
          { label: 'Pending',  value: filterStatus === 'Pending'  ? meta.totalCount : (totalPending  ?? '—'), color: 'bg-amber-50',   icon: Clock,      iconCls: 'text-amber-500' },
          { label: 'Approved', value: filterStatus === 'Approved' ? meta.totalCount : (totalApproved ?? '—'), color: 'bg-emerald-50', icon: CheckCircle, iconCls: 'text-emerald-500' },
          { label: 'Rejected', value: filterStatus === 'Rejected' ? meta.totalCount : (totalRejected ?? '—'), color: 'bg-red-50',     icon: ShieldX,    iconCls: 'text-red-400' },
        ].map(({ label, value, color, icon: Icon, iconCls }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${color}`}>
              <Icon size={18} className={iconCls} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {(['All', 'Pending', 'Approved', 'Rejected'] as FilterStatus[]).map((key) => (
            <button
              key={key}
              onClick={() => { setFilterStatus(key); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {key === 'All'      && <Filter size={10} />}
              {key === 'Pending'  && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              {key === 'Approved' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              {key === 'Rejected' && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
              {key}
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
                  <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-gray-100 rounded-full animate-pulse w-2/3" />
                    <div className="h-2.5 bg-gray-100 rounded-full animate-pulse w-1/2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="aspect-video bg-gray-100 rounded-lg animate-pulse" />
                  <div className="aspect-video bg-gray-100 rounded-lg animate-pulse" />
                </div>
                <div className="h-8 bg-gray-100 rounded-xl animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ShieldCheck size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-base font-medium">No verification requests</p>
          <p className="text-sm mt-1 opacity-70">
            {filterStatus !== 'All' ? `No ${filterStatus.toLowerCase()} requests` : 'Verification requests will appear here'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <VerificationCard
              key={item.id}
              item={item}
              actionLoading={actionLoading}
              onView={(uid) => setDetailUserId(uid)}
              onApprove={handleApprove}
              onReject={(id) => setRejectId(id)}
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

      {/* Modals */}
      {detailUserId && (
        <DetailModal
          userId={detailUserId}
          onClose={() => setDetailUserId(null)}
          onAction={() => { setDetailUserId(null); load(); }}
        />
      )}
      {rejectId && (
        <RejectModal
          verificationId={rejectId}
          onClose={() => setRejectId(null)}
          onSuccess={() => { setRejectId(null); load(); }}
        />
      )}
    </div>
  );
}
