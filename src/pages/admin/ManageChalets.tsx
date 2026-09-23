import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Edit3, Trash2, RefreshCw, Building2, Package,
  X, Loader2, Star, BedDouble, Bath, Users,
  AlertCircle, Search, ToggleLeft, ToggleRight, ImageIcon, DollarSign,
} from 'lucide-react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchChalets } from '../../store/slices/chaletsSlice';
import { Card } from '../../components/ui/Card';
import toast from 'react-hot-toast';

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

interface ApiImage { id: string; url: string; altText: string; isPrimary: boolean; sortOrder: number; }

interface AdminChalet {
  id: string; name: string; nameAr: string; description: string; descriptionAr: string;
  type: string; typeName: string; masterBedrooms: number; singleBedrooms: number;
  bedsPerSingleBedroom: number; bathrooms: number; hasServantRoom: boolean; maxGuests: number;
  basePrice: number; weekendPrice: number; location: string; latitude: number; longitude: number;
  googleMapsUrl: string; googleReviewUrl: string; isActive: boolean; averageRating: number;
  totalReviews: number; images: ApiImage[];
  amenities: { id: string; name: string; nameAr: string; icon: string }[];
}

interface ApiAddon {
  id: string; name: string; nameAr: string; description: string; descriptionAr: string;
  price: number; isPerNight: boolean; icon: string;
}

interface ChaletForm {
  name: string; nameAr: string; description: string; descriptionAr: string; type: string;
  masterBedrooms: number; singleBedrooms: number; bedsPerSingleBedroom: number;
  bathrooms: number; hasServantRoom: boolean; maxGuests: number;
  basePrice: number; weekendPrice: number; location: string;
  latitude: number; longitude: number; googleMapsUrl: string; googleReviewUrl: string;
  cancellationPolicyId: string; isActive: boolean;
  amenities: { name: string; nameAr: string; icon: string }[];
}

interface AddonForm {
  name: string; nameAr: string; description: string; descriptionAr: string;
  price: number; isPerNight: boolean; icon: string;
}

// ── API ───────────────────────────────────────────────────────────────────────

async function apiGetChalet(id: string): Promise<AdminChalet | null> {
  try {
    const res = await authFetch(`${API_BASE}/api/admin/chalets/${id}`);
    const json = await safeJson(res);
    return res.ok ? (json.data as AdminChalet) : null;
  } catch { return null; }
}

function buildBody(f: ChaletForm) {
  return {
    name: f.name, nameAr: f.nameAr, description: f.description, descriptionAr: f.descriptionAr,
    type: f.type, masterBedrooms: f.masterBedrooms, singleBedrooms: f.singleBedrooms,
    bedsPerSingleBedroom: f.bedsPerSingleBedroom, bathrooms: f.bathrooms,
    hasServantRoom: f.hasServantRoom, maxGuests: f.maxGuests, basePrice: f.basePrice,
    weekendPrice: f.weekendPrice, location: f.location, latitude: f.latitude,
    longitude: f.longitude, googleMapsUrl: f.googleMapsUrl, googleReviewUrl: f.googleReviewUrl,
    ...(f.cancellationPolicyId ? { cancellationPolicyId: f.cancellationPolicyId } : {}),
    amenityNames: f.amenities.map((a) => a.name),
    amenityNamesAr: f.amenities.map((a) => a.nameAr),
    amenityIcons: f.amenities.map((a) => a.icon),
  };
}

async function apiCreateChalet(f: ChaletForm): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/api/admin/chalets`, { method: 'POST', body: JSON.stringify(buildBody(f)) });
    const json = await safeJson(res);
    return { success: res.ok && Boolean(json.success), message: json.message as string };
  } catch { return { success: false, message: 'Network error' }; }
}

async function apiUpdateChalet(id: string, f: ChaletForm): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/api/admin/chalets/${id}`, { method: 'PUT', body: JSON.stringify({ ...buildBody(f), isActive: f.isActive }) });
    const json = await safeJson(res);
    return { success: res.ok && Boolean(json.success), message: json.message as string };
  } catch { return { success: false, message: 'Network error' }; }
}

async function apiDeleteChalet(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/api/admin/chalets/${id}`, { method: 'DELETE' });
    const json = await safeJson(res);
    return { success: res.ok, message: json.message as string };
  } catch { return { success: false, message: 'Network error' }; }
}

async function apiUploadImage(chaletId: string, file: File, isPrimary: boolean): Promise<{ success: boolean; message?: string }> {
  try {
    const fd = new FormData();
    fd.append('File', file);
    fd.append('IsPrimary', isPrimary ? 'true' : 'false');
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/admin/chalets/${chaletId}/images`, {
      method: 'POST',
      body: fd,
      // NOTE: do NOT set Content-Type here — browser must set it with multipart boundary
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const json = await safeJson(res);
    if (!res.ok) return { success: false, message: (json.message as string | undefined) ?? `Upload failed (${res.status})` };
    return { success: true, message: json.message as string | undefined };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

async function apiDeleteImage(chaletId: string, imageId: string): Promise<{ success: boolean }> {
  try {
    const res = await authFetch(`${API_BASE}/api/admin/chalets/${chaletId}/images/${imageId}`, { method: 'DELETE' });
    return { success: res.ok };
  } catch { return { success: false }; }
}

async function apiSetPrimaryImage(chaletId: string, imageId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/api/admin/chalets/${chaletId}/images/${imageId}/set-primary`, { method: 'PATCH' });
    const json = await safeJson(res);
    return { success: res.ok, message: json.message as string };
  } catch { return { success: false, message: 'Network error' }; }
}

async function apiUpdatePrice(chaletId: string, basePrice: number, weekendPrice: number): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/api/admin/chalets/${chaletId}/price`, { method: 'PATCH', body: JSON.stringify({ basePrice, weekendPrice }) });
    const json = await safeJson(res);
    return { success: res.ok, message: json.message as string };
  } catch { return { success: false, message: 'Network error' }; }
}

async function apiFetchAddons(page = 1, pageSize = 20) {
  try {
    const res = await authFetch(`${API_BASE}/api/admin/chalets/addons?page=${page}&pageSize=${pageSize}`);
    const json = await safeJson(res);
    const d = json.data as { items?: ApiAddon[]; totalCount?: number; totalPages?: number; hasNextPage?: boolean; hasPreviousPage?: boolean } | undefined;
    return { items: d?.items ?? [], totalCount: d?.totalCount ?? 0, totalPages: d?.totalPages ?? 1, hasNextPage: d?.hasNextPage ?? false, hasPreviousPage: d?.hasPreviousPage ?? false };
  } catch { return { items: [], totalCount: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false }; }
}

async function apiCreateAddon(f: AddonForm): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/api/admin/chalets/addons`, { method: 'POST', body: JSON.stringify(f) });
    const json = await safeJson(res);
    return { success: res.ok && Boolean(json.success), message: json.message as string };
  } catch { return { success: false, message: 'Network error' }; }
}

async function apiUpdateAddon(id: string, f: AddonForm): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/api/admin/chalets/addons/${id}`, { method: 'PUT', body: JSON.stringify(f) });
    const json = await safeJson(res);
    return { success: res.ok && Boolean(json.success), message: json.message as string };
  } catch { return { success: false, message: 'Network error' }; }
}

async function apiDeleteAddon(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/api/admin/chalets/addons/${id}`, { method: 'DELETE' });
    const json = await safeJson(res);
    return { success: res.ok, message: json.message as string };
  } catch { return { success: false, message: 'Network error' }; }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const defaultForm: ChaletForm = {
  name: '', nameAr: '', description: '', descriptionAr: '', type: 'Standard',
  masterBedrooms: 1, singleBedrooms: 0, bedsPerSingleBedroom: 1, bathrooms: 1,
  hasServantRoom: false, maxGuests: 4, basePrice: 0, weekendPrice: 0,
  location: 'Al Khiran, Kuwait', latitude: 28.6, longitude: 48.3,
  googleMapsUrl: '', googleReviewUrl: '', cancellationPolicyId: '', isActive: true, amenities: [],
};

const defaultAddon: AddonForm = { name: '', nameAr: '', description: '', descriptionAr: '', price: 0, isPerNight: false, icon: '' };

const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-white';

const TYPE_BADGE: Record<string, string> = {
  normal:   'bg-sky-100 text-sky-700',
  superior: 'bg-purple-100 text-purple-700',
  vip:      'bg-amber-100 text-amber-700',
};

// ── Small helpers ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-1.5">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-medium text-gray-600">{label}{required && <span className="text-red-400 ms-0.5">*</span>}</label>}
      {children}
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onClose, loading }: { message: string; onConfirm: () => void; onClose: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 flex-shrink-0"><AlertCircle size={20} className="text-red-500" /></div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Confirm Delete</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors font-medium">
            {loading && <Loader2 size={13} className="animate-spin" />} Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PriceModal ────────────────────────────────────────────────────────────────

function PriceModal({ chaletId, chaletName, currentBase, currentWeekend, onClose, onSuccess }: {
  chaletId: string; chaletName: string; currentBase: number; currentWeekend: number;
  onClose: () => void; onSuccess: () => void;
}) {
  const [basePrice, setBasePrice] = useState(currentBase);
  const [weekendPrice, setWeekendPrice] = useState(currentWeekend);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (basePrice <= 0) { toast.error('Base price must be greater than 0'); return; }
    setSaving(true);
    const r = await apiUpdatePrice(chaletId, basePrice, weekendPrice);
    setSaving(false);
    if (r.success) { toast.success('Price updated'); onSuccess(); }
    else toast.error(r.message || 'Failed to update price');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Update Price</h3>
            <p className="text-xs text-gray-400 mt-0.5">{chaletName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <Field label="Base Price / Night (KWD)" required>
            <input
              type="number" min="0" step="0.001"
              value={basePrice}
              onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
          </Field>
          <Field label="Weekend Price / Night (KWD)">
            <input
              type="number" min="0" step="0.001"
              value={weekendPrice}
              onChange={(e) => setWeekendPrice(parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-xl bg-gold-500 text-white hover:bg-gold-600 disabled:opacity-50 transition-colors font-medium">
            {saving && <Loader2 size={13} className="animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ImageManager ──────────────────────────────────────────────────────────────

function ImageManager({ chaletId, chaletName, onClose }: { chaletId: string; chaletName: string; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages]         = useState<ApiImage[]>([]);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'primary'; id: string } | null>(null);

  useEffect(() => {
    if (!pendingFile) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  useEffect(() => {
    apiGetChalet(chaletId).then((data) => {
      setImages(data?.images ?? []);
      setLoading(false);
    });
  }, [chaletId]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setPendingFile(file);
  }

  async function handleUpload() {
    if (!pendingFile) return;
    setUploading(true);
    const r = await apiUploadImage(chaletId, pendingFile, false);
    setUploading(false);
    if (r.success) {
      toast.success('Image uploaded');
      setPendingFile(null);
      apiGetChalet(chaletId).then((data) => { if (data) setImages(data.images ?? []); });
    } else {
      toast.error(r.message || 'Upload failed');
    }
  }

  async function handleDelete(imageId: string) {
    setDeletingId(imageId);
    const r = await apiDeleteImage(chaletId, imageId);
    setDeletingId(null);
    setConfirmAction(null);
    if (r.success) {
      toast.success('Image deleted');
      setImages((prev) => prev.filter((i) => i.id !== imageId));
    } else {
      toast.error('Failed to delete image');
    }
  }

  async function handleSetPrimary(imageId: string) {
    setSettingPrimaryId(imageId);
    const r = await apiSetPrimaryImage(chaletId, imageId);
    setSettingPrimaryId(null);
    setConfirmAction(null);
    if (r.success) {
      toast.success('Primary image set');
      apiGetChalet(chaletId).then((data) => { if (data) setImages(data.images ?? []); });
    } else {
      toast.error('Failed to set primary image');
    }
  }

  const isCdn = (url: string) => url.includes('digitaloceanspaces.com');

  // Only show CDN images — filter out any local/legacy URLs
  const sorted = [...images]
    .filter((img) => isCdn(img.url))
    .sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return a.sortOrder - b.sortOrder;
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">Manage Images</h2>
            <p className="text-xs text-gray-400 mt-0.5">{chaletName} · {sorted.length} CDN photo{sorted.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* ── Gallery grid ── */}
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => <div key={i} className="aspect-video rounded-xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : sorted.length === 0 && !pendingFile ? (
            <div
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 py-14 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 cursor-pointer hover:border-gold-400 hover:text-gold-500 hover:bg-gold-50/30 transition-colors"
            >
              <ImageIcon size={36} className="opacity-40" />
              <p className="text-sm font-medium">No CDN images yet — click to add the first one</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {sorted.map((img) => (
                <div key={img.id} className="relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50 group shadow-sm">

                  <img src={img.url} alt="" className="w-full aspect-video object-cover" />

                  {/* CDN badge — bottom left */}
                  <span className="absolute bottom-1.5 start-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                    ✓ CDN
                  </span>

                  {/* Primary badge / Set primary — top left */}
                  {img.isPrimary ? (
                    <span className="absolute top-1.5 start-1.5 bg-gold-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                      <Star size={8} className="fill-white" /> Primary
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmAction({ type: 'primary', id: img.id })}
                      disabled={!!settingPrimaryId}
                      className="absolute top-1.5 start-1.5 hidden group-hover:flex items-center gap-1 px-2 py-0.5 bg-white/90 rounded-full text-[10px] font-semibold text-gray-600 shadow hover:bg-gold-50 hover:text-gold-600 disabled:opacity-50 transition-colors"
                    >
                      <Star size={9} /> Set Primary
                    </button>
                  )}

                  {/* Delete — top right */}
                  <button
                    onClick={() => setConfirmAction({ type: 'delete', id: img.id })}
                    disabled={deletingId === img.id}
                    className="absolute top-1.5 end-1.5 hidden group-hover:flex p-1.5 bg-white rounded-full text-red-500 shadow hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    <X size={11} />
                  </button>

                </div>
              ))}

              {/* Add photo slot */}
              <button
                onClick={() => fileRef.current?.click()}
                className="aspect-video rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gold-400 hover:text-gold-500 hover:bg-gold-50/30 transition-colors"
              >
                <Plus size={24} />
                <span className="text-xs font-semibold">Add Photo</span>
              </button>
            </div>
          )}

          {/* ── Preview + Upload (appears only when file is chosen) ── */}
          {previewUrl && pendingFile && (
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 shadow-sm">
              <div className="relative">
                <img src={previewUrl} alt="Preview" className="w-full max-h-56 object-cover" />
                <span className="absolute top-2 start-2 bg-navy-800 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  Preview
                </span>
                <button
                  onClick={() => setPendingFile(null)}
                  className="absolute top-2 end-2 p-1.5 bg-white/90 rounded-full text-gray-500 hover:text-red-500 shadow transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{pendingFile.name}</p>
                  <p className="text-xs text-gray-400">{(pendingFile.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 text-white text-sm font-semibold hover:bg-gold-600 disabled:opacity-60 transition-colors"
                >
                  {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <>Upload Image</>}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Hidden file input */}
        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileChange} />

      </div>

      {/* ── Confirm Delete ── */}
      {confirmAction?.type === 'delete' && (
        <ConfirmModal
          message="Delete this image? This cannot be undone."
          onConfirm={() => handleDelete(confirmAction.id)}
          onClose={() => setConfirmAction(null)}
          loading={deletingId === confirmAction.id}
        />
      )}

      {/* ── Confirm Set Primary ── */}
      {confirmAction?.type === 'primary' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-gold-50 flex-shrink-0"><Star size={20} className="text-gold-500" /></div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Set as Primary Image</h3>
                <p className="text-sm text-gray-500 mt-1">This image will be shown as the main photo for this chalet.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)} className="flex-1 px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={() => handleSetPrimary(confirmAction.id)}
                disabled={!!settingPrimaryId}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-xl bg-gold-500 text-white hover:bg-gold-600 disabled:opacity-50 transition-colors font-medium"
              >
                {settingPrimaryId ? <Loader2 size={13} className="animate-spin" /> : <Star size={13} />} Set Primary
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── ChaletFormModal ───────────────────────────────────────────────────────────

function ChaletFormModal({ editId, onClose, onSuccess }: { editId: string | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<ChaletForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!editId) { setForm(defaultForm); return; }
    setFetching(true);
    apiGetChalet(editId).then((data) => {
      if (data) {
        setForm({
          name: data.name, nameAr: data.nameAr, description: data.description,
          descriptionAr: data.descriptionAr, type: data.type,
          masterBedrooms: data.masterBedrooms, singleBedrooms: data.singleBedrooms,
          bedsPerSingleBedroom: data.bedsPerSingleBedroom, bathrooms: data.bathrooms,
          hasServantRoom: data.hasServantRoom, maxGuests: data.maxGuests,
          basePrice: data.basePrice, weekendPrice: data.weekendPrice,
          location: data.location, latitude: data.latitude, longitude: data.longitude,
          googleMapsUrl: data.googleMapsUrl ?? '', googleReviewUrl: data.googleReviewUrl ?? '',
          cancellationPolicyId: '', isActive: data.isActive,
          amenities: data.amenities.map((a) => ({ name: a.name, nameAr: a.nameAr, icon: a.icon })),
        });
      }
      setFetching(false);
    });
  }, [editId]);

  function set<K extends keyof ChaletForm>(k: K, v: ChaletForm[K]) { setForm((f) => ({ ...f, [k]: v })); }
  function num(k: keyof ChaletForm, raw: string) { set(k as keyof ChaletForm, (raw === '' ? 0 : parseFloat(raw)) as ChaletForm[typeof k]); }

  async function submit() {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    const r = editId ? await apiUpdateChalet(editId, form) : await apiCreateChalet(form);
    setSaving(false);
    if (r.success) { toast.success(editId ? 'Chalet updated' : 'Chalet created'); onSuccess(); }
    else toast.error(r.message || 'Failed');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">{editId ? 'Edit Chalet' : 'Create New Chalet'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-gold-500" /></div>
        ) : (
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
            <Section title="Basic Information">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name (EN)" required><input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="Chalet name" /></Field>
                <Field label="Name (AR)"><input value={form.nameAr} onChange={(e) => set('nameAr', e.target.value)} className={inputCls} placeholder="اسم الشاليه" dir="rtl" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Description (EN)"><textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} className={inputCls + ' resize-none'} placeholder="Description…" /></Field>
                <Field label="Description (AR)"><textarea rows={3} value={form.descriptionAr} onChange={(e) => set('descriptionAr', e.target.value)} className={inputCls + ' resize-none'} placeholder="الوصف…" dir="rtl" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type">
                  <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputCls}>
                    <option value="Standard">Standard</option>
                    <option value="Superior">Superior</option>
                    <option value="VIP">VIP</option>
                  </select>
                </Field>
                {editId && (
                  <Field label="Status">
                    <button type="button" onClick={() => set('isActive', !form.isActive)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${form.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {form.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      {form.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </Field>
                )}
              </div>
            </Section>

            <Section title="Rooms & Capacity">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Master Bedrooms"><input type="number" min="0" value={form.masterBedrooms} onChange={(e) => num('masterBedrooms', e.target.value)} className={inputCls} /></Field>
                <Field label="Single Bedrooms"><input type="number" min="0" value={form.singleBedrooms} onChange={(e) => num('singleBedrooms', e.target.value)} className={inputCls} /></Field>
                <Field label="Beds / Single Room"><input type="number" min="1" value={form.bedsPerSingleBedroom} onChange={(e) => num('bedsPerSingleBedroom', e.target.value)} className={inputCls} /></Field>
                <Field label="Bathrooms"><input type="number" min="0" value={form.bathrooms} onChange={(e) => num('bathrooms', e.target.value)} className={inputCls} /></Field>
                <Field label="Max Guests"><input type="number" min="1" value={form.maxGuests} onChange={(e) => num('maxGuests', e.target.value)} className={inputCls} /></Field>
                <Field label="Servant Room">
                  <button type="button" onClick={() => set('hasServantRoom', !form.hasServantRoom)}
                    className={`mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${form.hasServantRoom ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {form.hasServantRoom ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                    {form.hasServantRoom ? 'Yes' : 'No'}
                  </button>
                </Field>
              </div>
            </Section>

            <Section title="Pricing (KWD)">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Base Price / Night" required><input type="number" min="0" step="0.001" value={form.basePrice} onChange={(e) => num('basePrice', e.target.value)} className={inputCls} /></Field>
                <Field label="Weekend Price / Night"><input type="number" min="0" step="0.001" value={form.weekendPrice} onChange={(e) => num('weekendPrice', e.target.value)} className={inputCls} /></Field>
              </div>
            </Section>

            <Section title="Location">
              <Field label="Address"><input value={form.location} onChange={(e) => set('location', e.target.value)} className={inputCls} placeholder="Al Khiran, Kuwait" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude"><input type="number" step="any" value={form.latitude} onChange={(e) => num('latitude', e.target.value)} className={inputCls} /></Field>
                <Field label="Longitude"><input type="number" step="any" value={form.longitude} onChange={(e) => num('longitude', e.target.value)} className={inputCls} /></Field>
              </div>
              <Field label="Google Maps URL"><input value={form.googleMapsUrl} onChange={(e) => set('googleMapsUrl', e.target.value)} className={inputCls} placeholder="https://maps.google.com/…" /></Field>
              <Field label="Google Review URL"><input value={form.googleReviewUrl} onChange={(e) => set('googleReviewUrl', e.target.value)} className={inputCls} placeholder="https://g.co/kgs/…" /></Field>
            </Section>

            <Section title="Amenities">
              {form.amenities.map((a, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                  <Field label={i === 0 ? 'Name (EN)' : undefined}>
                    <input value={a.name} onChange={(e) => setForm((f) => { const am = [...f.amenities]; am[i] = { ...am[i], name: e.target.value }; return { ...f, amenities: am }; })} className={inputCls} placeholder="WiFi" />
                  </Field>
                  <Field label={i === 0 ? 'Name (AR)' : undefined}>
                    <input value={a.nameAr} onChange={(e) => setForm((f) => { const am = [...f.amenities]; am[i] = { ...am[i], nameAr: e.target.value }; return { ...f, amenities: am }; })} className={inputCls} placeholder="واي فاي" dir="rtl" />
                  </Field>
                  <Field label={i === 0 ? 'Icon' : undefined}>
                    <input value={a.icon} onChange={(e) => setForm((f) => { const am = [...f.amenities]; am[i] = { ...am[i], icon: e.target.value }; return { ...f, amenities: am }; })} className={inputCls} placeholder="wifi" />
                  </Field>
                  <button onClick={() => setForm((f) => ({ ...f, amenities: f.amenities.filter((_, idx) => idx !== i) }))} className="p-2 rounded-lg hover:bg-red-50 text-red-400 mb-[1px]"><X size={14} /></button>
                </div>
              ))}
              <button onClick={() => setForm((f) => ({ ...f, amenities: [...f.amenities, { name: '', nameAr: '', icon: '' }] }))}
                className="flex items-center gap-1.5 text-sm text-gold-600 hover:text-gold-700 font-medium">
                <Plus size={14} /> Add Amenity
              </button>
            </Section>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving || fetching}
            className="flex items-center gap-2 px-5 py-2 text-sm rounded-xl bg-gold-500 text-white hover:bg-gold-600 disabled:opacity-50 transition-colors font-medium">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {editId ? 'Save Changes' : 'Create Chalet'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AddonFormModal ─────────────────────────────────────────────────────────────

function AddonFormModal({ addon, onClose, onSuccess }: { addon: ApiAddon | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<AddonForm>(
    addon ? { name: addon.name, nameAr: addon.nameAr, description: addon.description, descriptionAr: addon.descriptionAr, price: addon.price, isPerNight: addon.isPerNight, icon: addon.icon }
          : defaultAddon,
  );
  const [saving, setSaving] = useState(false);

  function set<K extends keyof AddonForm>(k: K, v: AddonForm[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit() {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    const r = addon ? await apiUpdateAddon(addon.id, form) : await apiCreateAddon(form);
    setSaving(false);
    if (r.success) { toast.success(addon ? 'Add-on updated' : 'Add-on created'); onSuccess(); }
    else toast.error(r.message || 'Failed');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">{addon ? 'Edit Add-on' : 'Create Add-on'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name (EN)" required><input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="BBQ Grill" /></Field>
            <Field label="Name (AR)"><input value={form.nameAr} onChange={(e) => set('nameAr', e.target.value)} className={inputCls} placeholder="شواية" dir="rtl" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Description (EN)"><textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} className={inputCls + ' resize-none'} /></Field>
            <Field label="Description (AR)"><textarea rows={2} value={form.descriptionAr} onChange={(e) => set('descriptionAr', e.target.value)} className={inputCls + ' resize-none'} dir="rtl" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (KWD)" required><input type="number" min="0" step="0.001" value={form.price} onChange={(e) => set('price', parseFloat(e.target.value) || 0)} className={inputCls} /></Field>
            <Field label="Icon name"><input value={form.icon} onChange={(e) => set('icon', e.target.value)} className={inputCls} placeholder="flame" /></Field>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.isPerNight} onChange={(e) => set('isPerNight', e.target.checked)} className="rounded accent-gold-500" />
            Charge per night (otherwise one-time fee)
          </label>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm rounded-xl bg-gold-500 text-white hover:bg-gold-600 disabled:opacity-50 transition-colors font-medium">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {addon ? 'Save Changes' : 'Create Add-on'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ChaletsTab ────────────────────────────────────────────────────────────────

function ChaletsTab() {
  const dispatch = useAppDispatch();
  const chalets = useAppSelector((s) => s.chalets.chalets);
  const loading = useAppSelector((s) => s.chalets.isLoading);

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState<string | null>(null); // null=closed, 'new'=create, id=edit
  const [imagesFor, setImagesFor] = useState<{ id: string; name: string } | null>(null);
  const [priceFor, setPriceFor] = useState<{ id: string; name: string; base: number; weekend: number } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function refresh() { (dispatch as any)(fetchChalets()); }

  const filtered = chalets.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.en.toLowerCase().includes(q) || (c.name.ar ?? '').toLowerCase().includes(q);
  });

  async function handleDelete() {
    if (!deleteId) return;
    setDeleteLoading(true);
    const r = await apiDeleteChalet(deleteId);
    setDeleteLoading(false);
    if (r.success) { toast.success('Chalet deleted'); setDeleteId(null); refresh(); }
    else toast.error(r.message || 'Failed to delete');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chalets…"
            className="w-full ps-9 pe-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold-400" />
        </div>
        <button onClick={refresh} disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
        <span className="text-sm text-gray-400">{filtered.length} chalets</span>
        <button onClick={() => setFormOpen('new')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-500 text-white text-sm font-medium hover:bg-gold-600 transition-colors ms-auto">
          <Plus size={14} /> Add Chalet
        </button>
      </div>

      {loading && chalets.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} padding="none" className="overflow-hidden">
              <div className="h-44 bg-gray-100 animate-pulse" />
              <div className="p-4 space-y-2"><div className="h-4 bg-gray-100 rounded-full animate-pulse w-3/4" /><div className="h-3 bg-gray-100 rounded-full animate-pulse w-1/2" /></div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><Building2 size={36} className="mx-auto mb-3 opacity-30" /><p>No chalets found</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((chalet) => {
            const typeKey = chalet.type.toLowerCase();
            const typeColor = TYPE_BADGE[typeKey] ?? 'bg-gray-100 text-gray-600';
            const typeName = chalet.type === 'normal' ? 'Standard' : chalet.type.charAt(0).toUpperCase() + chalet.type.slice(1);
            return (
              <Card key={chalet.id} padding="none" className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-44 bg-gray-100">
                  {chalet.images[0]
                    ? <img src={chalet.images[0]} alt={chalet.name.en} className="w-full h-full object-cover" />
                    : <div className="flex items-center justify-center h-full text-gray-300"><ImageIcon size={36} /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <span className={`absolute top-2 start-2 text-xs font-medium px-2 py-0.5 rounded-full ${typeColor}`}>{typeName}</span>
                  <span className={`absolute top-2 end-2 text-xs font-medium px-2 py-0.5 rounded-full ${chalet.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                    {chalet.isAvailable ? 'Active' : 'Inactive'}
                  </span>
                  {chalet.rating > 0 && (
                    <span className="absolute bottom-2 start-2 flex items-center gap-1 text-white text-xs">
                      <Star size={11} className="fill-gold-400 text-gold-400" /> {chalet.rating.toFixed(1)} ({chalet.reviewCount})
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{chalet.name.en}</h3>
                    {chalet.name.ar && <p className="text-xs text-gray-400 mt-0.5" dir="rtl">{chalet.name.ar}</p>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><BedDouble size={11} /> {chalet.bedrooms.length}</span>
                    <span className="flex items-center gap-1"><Bath size={11} /> {chalet.bathrooms}</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {chalet.maxGuests}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Base / night</p>
                      <p className="text-base font-bold text-gold-600">{chalet.basePrice.toLocaleString()} <span className="text-xs font-normal text-gray-400">KWD</span></p>
                      {chalet.weekendPrice && chalet.weekendPrice !== chalet.basePrice && (
                        <p className="text-xs text-gray-400">Weekend: {chalet.weekendPrice.toLocaleString()} KWD</p>
                      )}
                    </div>
                    <button
                      onClick={() => setPriceFor({ id: chalet.id, name: chalet.name.en, base: chalet.basePrice, weekend: chalet.weekendPrice ?? chalet.basePrice })}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gold-600 hover:bg-gold-50 border border-gold-200 transition-colors"
                    >
                      <DollarSign size={11} /> Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                    <button onClick={() => setFormOpen(chalet.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-100 transition-colors">
                      <Edit3 size={11} /> Edit
                    </button>
                    <button onClick={() => setImagesFor({ id: chalet.id, name: chalet.name.en })}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-purple-600 hover:bg-purple-50 border border-purple-100 transition-colors">
                      <ImageIcon size={11} /> Images
                    </button>
                    <button onClick={() => setDeleteId(chalet.id)}
                      className="flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 border border-red-100 transition-colors">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {formOpen !== null && (
        <ChaletFormModal editId={formOpen === 'new' ? null : formOpen} onClose={() => setFormOpen(null)} onSuccess={() => { setFormOpen(null); refresh(); }} />
      )}
      {imagesFor && <ImageManager chaletId={imagesFor.id} chaletName={imagesFor.name} onClose={() => { setImagesFor(null); refresh(); }} />}
      {priceFor && (
        <PriceModal
          chaletId={priceFor.id} chaletName={priceFor.name}
          currentBase={priceFor.base} currentWeekend={priceFor.weekend}
          onClose={() => setPriceFor(null)}
          onSuccess={() => { setPriceFor(null); refresh(); }}
        />
      )}
      {deleteId && <ConfirmModal message="Delete this chalet? This cannot be undone." onConfirm={handleDelete} onClose={() => setDeleteId(null)} loading={deleteLoading} />}
    </div>
  );
}

// ── AddonsTab ─────────────────────────────────────────────────────────────────

function AddonsTab() {
  const [addons, setAddons] = useState<ApiAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1, hasNextPage: false, hasPreviousPage: false, totalCount: 0 });
  const [formAddon, setFormAddon] = useState<ApiAddon | 'new' | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiFetchAddons(page, 20);
    setAddons(r.items);
    setMeta({ totalPages: r.totalPages, hasNextPage: r.hasNextPage, hasPreviousPage: r.hasPreviousPage, totalCount: r.totalCount });
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleteLoading(true);
    const r = await apiDeleteAddon(deleteId);
    setDeleteLoading(false);
    if (r.success) { toast.success('Add-on deleted'); setDeleteId(null); load(); }
    else toast.error(r.message || 'Failed');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
        <span className="text-sm text-gray-400">{meta.totalCount} add-ons</span>
        <button onClick={() => setFormAddon('new')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-500 text-white text-sm font-medium hover:bg-gold-600 transition-colors ms-auto">
          <Plus size={14} /> Add Add-on
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Card key={i} padding="md"><div className="space-y-2"><div className="h-8 w-8 rounded-xl bg-gray-100 animate-pulse" /><div className="h-4 bg-gray-100 rounded-full animate-pulse w-3/4" /></div></Card>)}
        </div>
      ) : addons.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><Package size={36} className="mx-auto mb-3 opacity-30" /><p>No add-ons yet</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {addons.map((addon) => (
            <Card key={addon.id} padding="md" className="hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center flex-shrink-0 text-gold-600">
                  {addon.icon ? <span className="text-base">{addon.icon.slice(0, 2)}</span> : <Package size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{addon.name}</h3>
                  {addon.nameAr && <p className="text-xs text-gray-400 truncate" dir="rtl">{addon.nameAr}</p>}
                </div>
              </div>
              {addon.description && <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{addon.description}</p>}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <p className="font-bold text-gray-900 text-sm">{addon.price.toLocaleString()} KWD</p>
                  <p className="text-xs text-gray-400">{addon.isPerNight ? 'per night' : 'one-time'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setFormAddon(addon)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"><Edit3 size={13} /></button>
                  <button onClick={() => setDeleteId(addon.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button disabled={!meta.hasPreviousPage || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">← Prev</button>
          <span className="text-sm text-gray-500">Page {page} of {meta.totalPages}</span>
          <button disabled={!meta.hasNextPage || loading} onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">Next →</button>
        </div>
      )}

      {formAddon !== null && (
        <AddonFormModal addon={formAddon === 'new' ? null : formAddon} onClose={() => setFormAddon(null)} onSuccess={() => { setFormAddon(null); load(); }} />
      )}
      {deleteId && <ConfirmModal message="Delete this add-on?" onConfirm={handleDelete} onClose={() => setDeleteId(null)} loading={deleteLoading} />}
    </div>
  );
}

// ── ManageChalets ─────────────────────────────────────────────────────────────

export function ManageChalets() {
  const [tab, setTab] = useState<'chalets' | 'addons'>('chalets');

  return (
    <div className="space-y-5">
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {(['chalets', 'addons'] as const).map((key) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {key === 'chalets' ? <Building2 size={15} /> : <Package size={15} />}
            {key === 'chalets' ? 'Chalets' : 'Add-ons'}
          </button>
        ))}
      </div>
      {tab === 'chalets' ? <ChaletsTab /> : <AddonsTab />}
    </div>
  );
}
