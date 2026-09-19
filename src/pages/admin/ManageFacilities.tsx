import { useRef, useState, useCallback } from 'react';
import { Camera, X, Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const FACILITY_STORAGE_KEY = 'grandebeach_facility_photos';

export type FacilityKey = 'indoor' | 'kids' | 'reception' | 'outdoor';

// Per-category: 3 photos. imgs[0] also acts as the home-page card cover.
export type FacilityStore = Record<FacilityKey, [string, string, string]>;

export const FACILITY_DEFAULTS: FacilityStore = {
  indoor:    ['', '', ''],
  kids:      ['', '', ''],
  reception: ['', '', ''],
  outdoor:   ['', '', ''],
};

export function loadFacilityStore(): FacilityStore {
  try {
    const raw = localStorage.getItem(FACILITY_STORAGE_KEY);
    if (!raw) return structuredClone(FACILITY_DEFAULTS);
    return { ...structuredClone(FACILITY_DEFAULTS), ...JSON.parse(raw) } as FacilityStore;
  } catch {
    return structuredClone(FACILITY_DEFAULTS);
  }
}

function saveFacilityStore(store: FacilityStore) {
  localStorage.setItem(FACILITY_STORAGE_KEY, JSON.stringify(store));
}

// Compress + resize an image file using canvas, returns base64 data URL
function compressImage(file: File, maxPx = 1400, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new window.Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

const CATEGORIES: { key: FacilityKey; en: string; ar: string }[] = [
  { key: 'indoor',    en: 'Indoor',    ar: 'داخلي' },
  { key: 'kids',      en: 'Kids Area', ar: 'منطقة الأطفال' },
  { key: 'reception', en: 'Reception', ar: 'الاستقبال' },
  { key: 'outdoor',   en: 'Outdoor',   ar: 'خارجي' },
];

const SLOT_LABELS = ['Cover Photo', 'Photo 2', 'Photo 3'];

// Single upload slot
function PhotoSlot({
  url, label, onUpload, onRemove,
}: {
  url: string;
  label: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setLoading(true);
    try {
      await onUpload(file);
    } finally {
      setLoading(false);
    }
  }, [onUpload]);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>

      {url ? (
        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-gray-100 group">
          <img src={url} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white transition-colors shadow"
              title="Replace photo"
            >
              <Camera size={16} />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-red-500 hover:bg-white transition-colors shadow"
              title="Remove photo"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-200 hover:border-gold-400 bg-gray-50 hover:bg-gold-50/40 flex flex-col items-center justify-center gap-2 transition-all duration-200 group disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={28} className="text-gold-400 animate-spin" />
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center group-hover:border-gold-300 transition-colors shadow-sm">
                <Upload size={20} className="text-gray-400 group-hover:text-gold-500 transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500 group-hover:text-gold-600 transition-colors">Click to upload</p>
                <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG, WEBP</p>
              </div>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

export function ManageFacilities() {
  const [store, setStore] = useState<FacilityStore>(loadFacilityStore);

  async function handleUpload(key: FacilityKey, idx: 0 | 1 | 2, file: File) {
    try {
      const dataUrl = await compressImage(file);
      setStore((prev) => {
        const photos = [...prev[key]] as [string, string, string];
        photos[idx] = dataUrl;
        const next = { ...prev, [key]: photos };
        saveFacilityStore(next);
        return next;
      });
      toast.success('Photo uploaded');
    } catch {
      toast.error('Failed to process image');
    }
  }

  function handleRemove(key: FacilityKey, idx: 0 | 1 | 2) {
    setStore((prev) => {
      const photos = [...prev[key]] as [string, string, string];
      photos[idx] = '';
      const next = { ...prev, [key]: photos };
      saveFacilityStore(next);
      return next;
    });
  }

  function handleClearAll(key: FacilityKey) {
    setStore((prev) => {
      const next = { ...prev, [key]: ['', '', ''] as [string, string, string] };
      saveFacilityStore(next);
      return next;
    });
    toast.success('Photos cleared');
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Resort Facilities Photos</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload photos for each facility category. The first photo is also used as the card cover on the home page. Changes are saved instantly.
        </p>
      </div>

      <div className="space-y-8">
        {CATEGORIES.map(({ key, en, ar }) => (
          <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900 text-base">{en}</h3>
                <p className="text-xs text-gray-400">{ar}</p>
              </div>
              <button
                type="button"
                onClick={() => handleClearAll(key)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
              >
                Clear all
              </button>
            </div>

            {/* Photo slots */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
              {([0, 1, 2] as const).map((idx) => (
                <PhotoSlot
                  key={idx}
                  url={store[key][idx]}
                  label={SLOT_LABELS[idx]}
                  onUpload={(file) => handleUpload(key, idx, file)}
                  onRemove={() => handleRemove(key, idx)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
