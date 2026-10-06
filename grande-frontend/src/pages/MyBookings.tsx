import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  CalendarDays, Users, Hash, Search, ChevronDown, ChevronUp,
  X, RefreshCw, Package, MessageSquare, Clock, CheckCircle,
  XCircle, AlertCircle, Home, Copy, Check, Send,
  Star, ShieldCheck, Loader2, Upload,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import {
  fetchMyBookings, fetchBookingById,
  fetchBookingByNumber, cancelUserBooking,
  type ApiBooking,
} from '../store/slices/bookingSlice';
import { fetchProfile } from '../store/slices/authSlice';
import { Button } from '../components/ui/Button';
import { WHATSAPP_NUMBER } from '../utils/constants';
import toast from 'react-hot-toast';

// ── API ────────────────────────────────────────────────────────────────────────

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

interface MyVerification {
  id: string; status: string; statusName: string;
  rejectionReason: string | null; submittedAt: string; reviewedAt: string | null;
}

async function apiGetMyVerification(): Promise<MyVerification | null> {
  try {
    const res = await authFetch(`${API_BASE}/api/Verification/my`);
    if (!res.ok) return null;
    const json = await res.json() as { data?: MyVerification };
    return json.data ?? null;
  } catch { return null; }
}

async function apiSubmitVerification(bookingId: string, idCard: File, photo: File, signatureData?: string) {
  try {
    const fd = new FormData();
    fd.append('IdCard', idCard);
    fd.append('Photo', photo);
    fd.append('BookingId', bookingId);
    if (signatureData) fd.append('SignatureData', signatureData);
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/Verification`, {
      method: 'POST',
      body: fd,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const json = await res.json() as { success?: boolean; message?: string };
    return { success: res.ok && Boolean(json.success), message: json.message };
  } catch { return { success: false, message: 'Network error' }; }
}

async function apiSubmitReview(bookingId: string, rating: number, comment: string) {
  try {
    const res = await authFetch(`${API_BASE}/api/reviews`, {
      method: 'POST',
      body: JSON.stringify({ bookingId, rating, comment }),
    });
    const json = await res.json() as { success?: boolean; message?: string };
    return { success: res.ok && Boolean(json.success), message: json.message };
  } catch { return { success: false, message: 'Network error' }; }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

type StatusKey = 'all' | 'upcoming' | 'past' | 'cancelled' | 'rejected';

function getStatusKey(status: string): StatusKey {
  const s = status.toLowerCase();
  if (s === 'confirmed' || s === 'pending') return 'upcoming';
  if (s === 'completed' || s === 'checkedout') return 'past';
  if (s === 'cancelled') return 'cancelled';
  if (s === 'rejected') return 'rejected';
  return 'upcoming';
}

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: React.FC<{ size?: number; className?: string }> }> = {
  pending:    { bg: 'bg-amber-100',   text: 'text-amber-700',   icon: Clock },
  confirmed:  { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
  cancelled:  { bg: 'bg-red-100',     text: 'text-red-700',     icon: XCircle },
  completed:  { bg: 'bg-blue-100',    text: 'text-blue-700',    icon: CheckCircle },
  checkedout: { bg: 'bg-purple-100',  text: 'text-purple-700',  icon: CheckCircle },
  rejected:   { bg: 'bg-rose-100',    text: 'text-rose-700',    icon: XCircle },
};

function statusStyle(status: string) {
  return STATUS_STYLE[status.toLowerCase()] ?? { bg: 'bg-gray-100', text: 'text-gray-700', icon: AlertCircle };
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return format(parseISO(iso), 'dd MMM yyyy'); } catch { return '—'; }
}

function buildCancelWhatsApp(booking: ApiBooking, reason: string): string {
  const msg =
`🇬🇧 *Cancellation Request*

Hello Grande Beach Al Khiran team,
I would like to request the cancellation of my booking.

📋 *Booking Details:*
• Booking No.: ${booking.bookingNumber}
• Chalet: ${booking.chaletName}
• Check-in: ${fmtDate(booking.checkInDate)}
• Check-out: ${fmtDate(booking.checkOutDate)}
• Nights: ${booking.nights}
• Guest: ${booking.guestFirstName} ${booking.guestLastName}
• Reason: ${reason}

───────────────────

🇸🇦 *طلب إلغاء حجز*

مرحباً فريق غراند بيتش الخيران،
أرغب في طلب إلغاء حجزي.

📋 *تفاصيل الحجز:*
• رقم الحجز: ${booking.bookingNumber}
• الشاليه: ${booking.chaletName}
• تاريخ الوصول: ${fmtDate(booking.checkInDate)}
• تاريخ المغادرة: ${fmtDate(booking.checkOutDate)}
• عدد الليالي: ${booking.nights}
• اسم الضيف: ${booking.guestFirstName} ${booking.guestLastName}
• السبب: ${reason}`;

  const phone = WHATSAPP_NUMBER.replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

// ── StarPicker ─────────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(i)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              size={30}
              className={i <= (hovered || value)
                ? 'fill-gold-400 text-gold-400 drop-shadow-sm'
                : 'text-gray-200 fill-gray-100'}
            />
          </button>
        ))}
      </div>
      {(hovered || value) > 0 && (
        <span className="text-sm font-medium text-gray-600">{labels[hovered || value]}</span>
      )}
    </div>
  );
}

// ── Bottom Sheet wrapper ───────────────────────────────────────────────────────

function BottomSheet({ onClose, zIndex = 50, children }: {
  onClose: () => void; zIndex?: number; children: React.ReactNode;
}) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        style={{ zIndex }}
        onClick={onClose}
      />
      <div
        className="fixed inset-x-0 bottom-0 flex justify-center"
        style={{ zIndex: zIndex + 1 }}
      >
        <div
          className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl"
          style={{ animation: 'slideUp 0.3s cubic-bezier(0.32,0.72,0,1)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ── ReviewModal ────────────────────────────────────────────────────────────────

function ReviewModal({ bookingId, chaletName, onClose, onSuccess }: {
  bookingId: string; chaletName: string; onClose: () => void; onSuccess: () => void;
}) {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (rating === 0) {
      toast.error(lang === 'ar' ? 'يرجى اختيار تقييم' : 'Please select a rating');
      return;
    }
    setSaving(true);
    const r = await apiSubmitReview(bookingId, rating, comment);
    setSaving(false);
    if (r.success) {
      toast.success(lang === 'ar' ? 'تم إرسال تقييمك بنجاح' : 'Review submitted successfully');
      onSuccess();
    } else {
      toast.error(r.message || 'Failed to submit review');
    }
  }

  return (
    <BottomSheet onClose={onClose} zIndex={500}>
      <div className="px-6 pb-8 pt-3 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {lang === 'ar' ? 'اترك تقييمك' : 'Leave a Review'}
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">{chaletName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Stars */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {lang === 'ar' ? 'التقييم' : 'Your Rating'} <span className="text-red-400">*</span>
          </p>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {lang === 'ar' ? 'تعليقك' : 'Comment'}
          </p>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={lang === 'ar' ? 'شاركنا تجربتك مع هذا الشاليه…' : 'Share your experience with this chalet…'}
            className="w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-gray-50 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 py-3 text-sm rounded-2xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={submit} disabled={saving || rating === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm rounded-2xl bg-gold-500 text-white hover:bg-gold-600 disabled:opacity-50 transition-colors font-semibold">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {lang === 'ar' ? 'إرسال التقييم' : 'Submit Review'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

// ── SignaturePad ───────────────────────────────────────────────────────────────

function SignaturePad({ onChange, lang }: { onChange: (data: string | null) => void; lang: 'en' | 'ar' }) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const drawing      = useRef(false);
  const lastPos      = useRef<{ x: number; y: number } | null>(null);
  const [hasSig, setHasSig] = useState(false);

  function getXY(e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const src  = 'touches' in e ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * (canvas.width  / rect.width),
      y: (src.clientY - rect.top)  * (canvas.height / rect.height),
    };
  }

  function onStart(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    drawing.current = true;
    const pos = getXY(e.nativeEvent, canvasRef.current!);
    lastPos.current = pos;
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 1, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
  }

  function onMove(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current || !lastPos.current) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;
    const pos    = getXY(e.nativeEvent, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth   = 2.2;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();
    lastPos.current = pos;
    setHasSig(true);
    onChange(canvas.toDataURL('image/png'));
  }

  function onEnd() {
    drawing.current = false;
    lastPos.current = null;
  }

  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <div className={`relative rounded-2xl overflow-hidden border-2 transition-colors ${hasSig ? 'border-gold-400 bg-amber-50/30' : 'border-dashed border-gray-200 bg-white'}`}>
        {/* Baseline */}
        <div className="absolute bottom-8 inset-x-6 border-b border-dashed border-gray-200 pointer-events-none" />
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className="w-full touch-none cursor-crosshair block"
          onMouseDown={onStart}
          onMouseMove={onMove}
          onMouseUp={onEnd}
          onMouseLeave={onEnd}
          onTouchStart={onStart}
          onTouchMove={onMove}
          onTouchEnd={onEnd}
        />
        {!hasSig && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-gray-300 select-none tracking-wide">
              {lang === 'ar' ? 'وقّع هنا...' : 'Sign here...'}
            </p>
          </div>
        )}
        {hasSig && (
          <div className="absolute top-2 end-2">
            <span className="text-[10px] bg-gold-100 text-gold-700 font-semibold px-2 py-0.5 rounded-full">
              {lang === 'ar' ? 'تم التوقيع ✓' : 'Signed ✓'}
            </span>
          </div>
        )}
      </div>
      {hasSig && (
        <button type="button" onClick={clear}
          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors">
          <X size={11} />
          {lang === 'ar' ? 'مسح التوقيع' : 'Clear signature'}
        </button>
      )}
    </div>
  );
}

// ── VerificationModal ──────────────────────────────────────────────────────────

function VerificationModal({ bookingId, onClose, onSuccess }: {
  bookingId: string; onClose: () => void; onSuccess: () => void;
}) {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const [idCard, setIdCard]         = useState<File | null>(null);
  const [photo, setPhoto]           = useState<File | null>(null);
  const [signatureData, setSigData] = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [idKey, setIdKey]           = useState(0);
  const [photoKey, setPhotoKey]     = useState(0);

  async function submit() {
    if (!idCard)       { toast.error(lang === 'ar' ? 'يرجى تحميل صورة الهوية' : 'Please upload your ID card'); return; }
    if (!photo)        { toast.error(lang === 'ar' ? 'يرجى تحميل صورتك الشخصية' : 'Please upload your selfie photo'); return; }
    if (!signatureData){ toast.error(lang === 'ar' ? 'يرجى إضافة توقيعك' : 'Please add your signature'); return; }
    setSaving(true);
    const r = await apiSubmitVerification(bookingId, idCard, photo, signatureData);
    setSaving(false);
    if (r.success) {
      toast.success(lang === 'ar' ? 'تم إرسال طلب التحقق بنجاح' : 'Verification submitted successfully');
      onSuccess();
    } else {
      toast.error(r.message || 'Failed to submit verification');
    }
  }

  const filePickerCls = 'block w-full text-sm text-gray-500 cursor-pointer file:me-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-navy-50 file:text-navy-700 hover:file:bg-navy-100 file:transition-colors';

  return (
    <BottomSheet onClose={onClose} zIndex={9000}>
      <div className="px-6 pb-8 pt-3 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-navy-50">
              <ShieldCheck size={20} className="text-navy-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {lang === 'ar' ? 'التحقق من الهوية' : 'Identity Verification'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {lang === 'ar' ? 'يرجى تحميل وثائق التحقق' : 'Upload your verification documents'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Info callout */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            {lang === 'ar'
              ? 'يُرجى تحميل صورة واضحة لبطاقة هويتك وصورة شخصية حديثة (سيلفي). ستتم مراجعتها خلال 24 ساعة.'
              : 'Upload a clear photo of your ID card and a recent selfie. Documents will be reviewed within 24 hours.'}
          </p>
        </div>

        {/* Upload fields */}
        <div className="grid grid-cols-2 gap-4">
          {/* ID Card */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {lang === 'ar' ? 'صورة الهوية' : 'ID Card'} <span className="text-red-400">*</span>
            </p>
            <div className={`rounded-2xl border-2 border-dashed p-3 transition-colors ${idCard ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
              <input key={idKey} type="file" accept="image/*"
                onChange={(e) => setIdCard(e.target.files?.[0] ?? null)}
                className={filePickerCls} />
              {idCard && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-emerald-700 truncate font-medium flex-1">{idCard.name}</span>
                  <button onClick={() => { setIdCard(null); setIdKey((k) => k + 1); }} className="text-emerald-400 hover:text-emerald-600 ms-1 flex-shrink-0"><X size={11} /></button>
                </div>
              )}
            </div>
          </div>

          {/* Selfie */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {lang === 'ar' ? 'صورة سيلفي' : 'Selfie'} <span className="text-red-400">*</span>
            </p>
            <div className={`rounded-2xl border-2 border-dashed p-3 transition-colors ${photo ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
              <input key={photoKey} type="file" accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                className={filePickerCls} />
              {photo && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-emerald-700 truncate font-medium flex-1">{photo.name}</span>
                  <button onClick={() => { setPhoto(null); setPhotoKey((k) => k + 1); }} className="text-emerald-400 hover:text-emerald-600 ms-1 flex-shrink-0"><X size={11} /></button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {lang === 'ar' ? 'التوقيع' : 'Signature'} <span className="text-red-400">*</span>
            </p>
            <span className="text-[10px] text-gray-400">
              {lang === 'ar' ? 'ارسم توقيعك بإصبعك أو الماوس' : 'Draw with your finger or mouse'}
            </span>
          </div>
          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-inner bg-white">
            <SignaturePad onChange={setSigData} lang={lang} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 py-3 text-sm rounded-2xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={submit} disabled={saving || !idCard || !photo || !signatureData}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm rounded-2xl bg-navy-700 text-white hover:bg-navy-800 disabled:opacity-50 transition-colors font-semibold">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {lang === 'ar' ? 'إرسال للمراجعة' : 'Submit for Review'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

// ── BookingCard ────────────────────────────────────────────────────────────────
interface CardProps {
  booking: ApiBooking;
  chaletImage?: string;
  lang: 'en' | 'ar';
  onRefresh: () => void;
  isUserVerified: boolean;
}

function BookingCard({ booking, chaletImage, lang, onRefresh, isUserVerified }: CardProps) {
  const dispatch = useAppDispatch();
  const [expanded, setExpanded]         = useState(false);
  const [detail, setDetail]             = useState<ApiBooking | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [cancelling, setCancelling]     = useState(false);
  const [showCancel, setShowCancel]     = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [copied, setCopied]             = useState(false);
  const [reviewOpen, setReviewOpen]     = useState(false);
  const [verifyOpen, setVerifyOpen]     = useState(false);

  const s = booking.status.toLowerCase();
  const canCancel   = s === 'pending' || s === 'confirmed';
  const isCompleted = s === 'completed' || s === 'checkedout';
  const canVerify   = s === 'pending' || s === 'confirmed';
  const { bg, text, icon: StatusIcon } = statusStyle(s);

  async function handleExpand() {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (!detail) {
      setLoadingDetail(true);
      try {
        const result = await (dispatch as any)(fetchBookingById(booking.id));
        if (result.payload) setDetail(result.payload as ApiBooking);
      } finally {
        setLoadingDetail(false);
      }
    }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) {
      toast.error(lang === 'ar' ? 'يرجى إدخال سبب الإلغاء' : 'Please enter a cancellation reason');
      return;
    }
    setCancelling(true);
    const result = await cancelUserBooking(booking.id, cancelReason);
    setCancelling(false);
    if (result.success) {
      toast.success(lang === 'ar' ? 'تم إلغاء الحجز بنجاح' : 'Booking cancelled successfully');
      setShowCancel(false);
      window.open(buildCancelWhatsApp(booking, cancelReason), '_blank');
      setCancelReason('');
      onRefresh();
    } else {
      toast.error(result.message || 'Failed to cancel booking');
    }
  }

  function copyNumber() {
    navigator.clipboard.writeText(booking.bookingNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const displayData = detail ?? booking;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* ── Main row ── */}
      <div className="flex gap-4 p-4 sm:p-5">
        {/* Image */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
          {chaletImage
            ? <img src={chaletImage} alt={booking.chaletName} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Home size={24} className="text-gray-300" /></div>}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{booking.chaletName}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Hash size={11} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-400 font-mono">{booking.bookingNumber}</span>
                <button type="button" onClick={copyNumber}
                  className="text-gray-300 hover:text-gold-500 transition-colors"
                  title={lang === 'ar' ? 'نسخ' : 'Copy'}>
                  {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                </button>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${bg} ${text}`}>
              <StatusIcon size={11} />
              {booking.statusName || booking.status}
            </span>
          </div>

          {/* Dates & guests */}
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <CalendarDays size={12} className="text-gold-400" />
              {fmtDate(booking.checkInDate)} → {fmtDate(booking.checkOutDate)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-gold-400" />
              {booking.nights} {lang === 'ar' ? 'ليالي' : 'nights'}
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} className="text-gold-400" />
              {booking.guestCount} {lang === 'ar' ? 'ضيوف' : 'guests'}
            </span>
          </div>

          {/* Amount & actions */}
          <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
            <div>
              <span className="text-lg font-bold text-gray-900">{booking.totalAmount.toLocaleString()}</span>
              <span className="text-xs text-gray-400 ms-1">KWD</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {canCancel && (
                <button type="button" onClick={() => setShowCancel((v) => !v)}
                  className="text-xs font-medium text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:border-red-400 transition-colors">
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              )}
              {isCompleted && (
                <button type="button" onClick={() => setReviewOpen(true)}
                  className="flex items-center gap-1 text-xs font-medium text-gold-600 hover:text-gold-700 px-3 py-1.5 rounded-lg border border-gold-200 hover:border-gold-400 transition-colors">
                  <Star size={11} className="fill-gold-400 text-gold-400" />
                  {lang === 'ar' ? 'تقييم' : 'Review'}
                </button>
              )}
              {isUserVerified ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <ShieldCheck size={11} className="fill-emerald-100" />
                  {lang === 'ar' ? 'موثّق ✓' : 'Verified ✓'}
                </span>
              ) : canVerify && (
                <button type="button" onClick={() => setVerifyOpen(true)}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:border-blue-400 transition-colors">
                  <ShieldCheck size={11} />
                  {lang === 'ar' ? 'توثيق' : 'Verify'}
                </button>
              )}
              <button type="button" onClick={handleExpand}
                className="flex items-center gap-1 text-xs font-medium text-navy-700 hover:text-gold-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gold-400 transition-colors">
                {lang === 'ar' ? 'التفاصيل' : 'Details'}
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cancel form ── */}
      {showCancel && (
        <div className="border-t border-red-100 bg-red-50 px-4 sm:px-5 py-4">
          <p className="text-sm font-medium text-red-700 mb-1">
            {lang === 'ar' ? 'سبب الإلغاء' : 'Cancellation reason'}
          </p>
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <Send size={11} />
            {lang === 'ar'
              ? 'سيتم فتح واتساب تلقائياً برسالة الإلغاء بعد التأكيد'
              : 'WhatsApp will open automatically with a cancellation message after confirming'}
          </p>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={2}
            placeholder={lang === 'ar' ? 'أخبرنا لماذا تريد الإلغاء...' : 'Tell us why you want to cancel...'}
            className="w-full text-sm border border-red-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
          />
          <div className="flex gap-2 mt-2 justify-end">
            <button type="button" onClick={() => { setShowCancel(false); setCancelReason(''); }}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg">
              {lang === 'ar' ? 'تراجع' : 'Go back'}
            </button>
            <Button size="sm" onClick={handleCancel} isLoading={cancelling}
              className="bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5">
              <Send size={12} />
              {lang === 'ar' ? 'تأكيد وإرسال واتساب' : 'Confirm & WhatsApp'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 sm:px-5 py-4 space-y-4">
          {loadingDetail ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* Price breakdown */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {lang === 'ar' ? 'تفاصيل السعر' : 'Price Breakdown'}
                </p>
                <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                  {[
                    { label: lang === 'ar' ? 'السعر الأساسي' : 'Base amount',  val: displayData.baseAmount },
                    { label: lang === 'ar' ? 'الإضافات' : 'Add-ons',           val: displayData.addOnsAmount },
                    { label: lang === 'ar' ? 'الضريبة' : 'Tax',                 val: displayData.taxAmount },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between text-sm px-4 py-2">
                      <span className="text-gray-500">{label}</span>
                      <span className="text-gray-800 font-medium">{val?.toLocaleString() ?? 0} KWD</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm px-4 py-2.5 bg-navy-50">
                    <span className="font-bold text-gray-900">{lang === 'ar' ? 'الإجمالي' : 'Total'}</span>
                    <span className="font-bold text-gold-700 text-base">{displayData.totalAmount?.toLocaleString()} KWD</span>
                  </div>
                </div>
              </div>

              {/* Add-ons */}
              {displayData.addOns?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Package size={12} /> {lang === 'ar' ? 'الإضافات المختارة' : 'Selected Add-ons'}
                  </p>
                  <div className="space-y-1.5">
                    {displayData.addOns.map((a) => (
                      <div key={a.addOnId} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-800">{a.name}</span>
                          <span className="text-gray-400 text-xs ms-2">× {a.quantity}</span>
                        </div>
                        <span className="text-gray-700 font-medium">{a.totalPrice?.toLocaleString()} KWD</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Special requests */}
              {displayData.specialRequests && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <MessageSquare size={12} /> {lang === 'ar' ? 'طلبات خاصة' : 'Special Requests'}
                  </p>
                  <p className="text-sm text-gray-600 bg-white border border-gray-100 rounded-xl px-4 py-2.5 leading-relaxed">
                    {displayData.specialRequests}
                  </p>
                </div>
              )}

              {/* Meta */}
              <div className="flex flex-wrap gap-4 text-xs text-gray-400 pt-1">
                <span>{lang === 'ar' ? 'المصدر:' : 'Source:'} <span className="text-gray-600">{displayData.source}</span></span>
                <span>{lang === 'ar' ? 'تاريخ الطلب:' : 'Created:'} <span className="text-gray-600">{fmtDate(displayData.createdAt)}</span></span>
                {displayData.cancellationReason && (
                  <span>{lang === 'ar' ? 'سبب الإلغاء:' : 'Cancellation reason:'} <span className="text-red-600">{displayData.cancellationReason}</span></span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {reviewOpen && (
        <ReviewModal
          bookingId={booking.id}
          chaletName={booking.chaletName}
          onClose={() => setReviewOpen(false)}
          onSuccess={() => setReviewOpen(false)}
        />
      )}
      {verifyOpen && (
        <VerificationModal
          bookingId={booking.id}
          onClose={() => setVerifyOpen(false)}
          onSuccess={() => setVerifyOpen(false)}
        />
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export function MyBookings() {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const dispatch = useAppDispatch();

  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const myBookings        = useAppSelector((s) => s.booking.myBookings);
  const myBookingsLoading = useAppSelector((s) => s.booking.myBookingsLoading);
  const myBookingsError   = useAppSelector((s) => s.booking.myBookingsError);
  const chalets           = useAppSelector((s) => s.chalets.chalets);

  const [tab, setTab]                   = useState<StatusKey>('all');
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchResult, setSearchResult] = useState<ApiBooking | null>(null);
  const [searching, setSearching]       = useState(false);
  const [searchError, setSearchError]   = useState('');
  const [verification, setVerification] = useState<MyVerification | null>(null);

  const isUserVerified = verification?.status === 'Approved';

  const load = useCallback(() => {
    (dispatch as any)(fetchProfile()).finally(() => {
      (dispatch as any)(fetchMyBookings());
    });
  }, [dispatch]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { apiGetMyVerification().then(setVerification); }, []);

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const filtered = myBookings.filter((b) => {
    if (tab === 'all') return true;
    return getStatusKey(b.status) === tab;
  });

  const counts = {
    all:       myBookings.length,
    upcoming:  myBookings.filter((b) => getStatusKey(b.status) === 'upcoming').length,
    past:      myBookings.filter((b) => getStatusKey(b.status) === 'past').length,
    cancelled: myBookings.filter((b) => getStatusKey(b.status) === 'cancelled').length,
    rejected:  myBookings.filter((b) => getStatusKey(b.status) === 'rejected').length,
  };

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchError('');
    setSearchResult(null);
    const result = await fetchBookingByNumber(q);
    setSearching(false);
    if (result.success && result.data) {
      setSearchResult(result.data);
    } else {
      setSearchError(result.message || (lang === 'ar' ? 'لم يُعثر على الحجز' : 'Booking not found'));
    }
  }

  const tabs: { key: StatusKey; labelEn: string; labelAr: string }[] = [
    { key: 'all',       labelEn: 'All',              labelAr: 'الكل' },
    { key: 'upcoming',  labelEn: 'Upcoming',         labelAr: 'القادمة' },
    { key: 'past',      labelEn: 'Past',             labelAr: 'السابقة' },
    { key: 'cancelled', labelEn: 'Cancelled by Me',  labelAr: 'ملغاة مني' },
    { key: 'rejected',  labelEn: 'Rejected',         labelAr: 'مرفوضة' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Page header ── */}
      <div className="mb-8" data-aos="fade-down">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {lang === 'ar' ? 'حجوزاتي' : 'My Bookings'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {lang === 'ar'
            ? `مرحباً ${user.firstName}، إليك سجل حجوزاتك`
            : `Welcome back, ${user.firstName}. Here are all your reservations.`}
        </p>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6" data-aos="fade-up">
        {[
          { label: lang === 'ar' ? 'إجمالي الحجوزات' : 'Total',          val: counts.all,       color: 'border-navy-200 bg-navy-50 text-navy-700' },
          { label: lang === 'ar' ? 'القادمة' : 'Upcoming',               val: counts.upcoming,  color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
          { label: lang === 'ar' ? 'السابقة' : 'Past',                   val: counts.past,      color: 'border-blue-200 bg-blue-50 text-blue-700' },
          { label: lang === 'ar' ? 'ملغاة مني' : 'Cancelled by Me',      val: counts.cancelled, color: 'border-red-200 bg-red-50 text-red-700' },
          { label: lang === 'ar' ? 'مرفوضة من الإدارة' : 'Rejected',     val: counts.rejected,  color: 'border-rose-200 bg-rose-50 text-rose-700' },
        ].map(({ label, val, color }) => (
          <div key={label} className={`rounded-2xl border px-4 py-3 ${color}`}>
            <p className="text-2xl font-bold">{myBookingsLoading ? '—' : val}</p>
            <p className="text-xs font-medium opacity-80 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Search by booking number ── */}
      <div className="mb-6" data-aos="fade-up">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchResult(null); setSearchError(''); }}
              placeholder={lang === 'ar' ? 'ابحث برقم الحجز…' : 'Search by booking number…'}
              className="w-full ps-9 pe-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-white"
            />
          </div>
          <Button type="submit" size="sm" isLoading={searching}>
            {lang === 'ar' ? 'بحث' : 'Search'}
          </Button>
          {(searchResult || searchError) && (
            <button type="button"
              onClick={() => { setSearchResult(null); setSearchError(''); setSearchQuery(''); }}
              className="p-2.5 rounded-xl border border-gray-200 hover:border-gray-400 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={15} />
            </button>
          )}
        </form>
        {searchError && (
          <p className="mt-2 text-sm text-red-500 flex items-center gap-1.5">
            <AlertCircle size={14} /> {searchError}
          </p>
        )}
        {searchResult && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {lang === 'ar' ? 'نتيجة البحث' : 'Search Result'}
            </p>
            <BookingCard
              booking={searchResult}
              chaletImage={chalets.find((c) => c.id === searchResult.chaletId)?.images?.[0]}
              lang={lang}
              onRefresh={load}
              isUserVerified={isUserVerified}
            />
          </div>
        )}
      </div>

      {/* ── Status tabs ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-5" data-aos="fade-up">
        {tabs.map(({ key, labelEn, labelAr }) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {lang === 'ar' ? labelAr : labelEn}
            {!myBookingsLoading && counts[key] > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                tab === key ? 'bg-navy-800 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Booking list ── */}
      {myBookingsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : myBookingsError ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <AlertCircle size={40} className="text-red-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">
            {lang === 'ar' ? 'تعذّر تحميل الحجوزات' : 'Could not load bookings'}
          </p>
          <Button variant="outline" onClick={load}>
            <RefreshCw size={14} className="me-1.5" />
            {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <CalendarDays size={44} className="text-gray-200 mx-auto mb-4" />
          <p className="font-semibold text-gray-700 mb-1">
            {lang === 'ar' ? 'لا توجد حجوزات' : 'No bookings found'}
          </p>
          <p className="text-gray-400 text-sm mb-6">
            {tab === 'all'       && (lang === 'ar' ? 'لم تقم بأي حجز بعد' : "You haven't made any bookings yet")}
            {tab === 'upcoming'  && (lang === 'ar' ? 'لا توجد حجوزات قادمة' : 'No upcoming bookings')}
            {tab === 'past'      && (lang === 'ar' ? 'لا توجد حجوزات سابقة' : 'No past bookings')}
            {tab === 'cancelled' && (lang === 'ar' ? 'لم تقم بإلغاء أي حجز' : "You haven't cancelled any bookings")}
            {tab === 'rejected'  && (lang === 'ar' ? 'لم يتم رفض أي حجز من الإدارة' : 'No bookings were rejected by the admin')}
          </p>
          <Link to="/chalets">
            <Button variant="outline">
              {lang === 'ar' ? 'تصفح الشاليهات' : 'Browse Chalets'}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <div key={b.id} data-aos="fade-up">
              <BookingCard
                booking={b}
                chaletImage={chalets.find((c) => c.id === b.chaletId)?.images?.[0]}
                lang={lang}
                onRefresh={load}
                isUserVerified={isUserVerified}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Refresh ── */}
      {!myBookingsLoading && myBookings.length > 0 && (
        <div className="mt-6 text-center">
          <button type="button" onClick={load}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gold-600 transition-colors">
            <RefreshCw size={12} />
            {lang === 'ar' ? 'تحديث القائمة' : 'Refresh list'}
          </button>
        </div>
      )}

    </div>
  );
}
