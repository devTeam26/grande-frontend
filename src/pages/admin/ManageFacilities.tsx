import { useRef, useState, useCallback } from 'react';
import { Camera, X, Upload, Loader2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export const FACILITY_STORAGE_KEY = 'grandebeach_facility_photos';

export type FacilityKey = 'indoor' | 'kids' | 'reception' | 'outdoor';

// Variable-length array per category; photos[0] = card cover on home page
export type FacilityStore = Record<FacilityKey, string[]>;

export const FACILITY_DEFAULTS: FacilityStore = {
  indoor: [], kids: [], reception: [], outdoor: [],
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

function compressImage(file: File, maxPx = 1400, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target?.result as string;
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

// Filled photo tile
function FilledSlot({ url, index, onReplace, onRemove }: {
  url: string; index: number;
  onReplace: (file: File) => Promise<void>;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setLoading(true);
    try { await onReplace(file); } finally { setLoading(false); }
  }, [onReplace]);

  return (
    <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-gray-100 group">
      <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />

      {index === 0 && (
        <span className="absolute top-2 start-2 bg-gold-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
          Cover
        </span>
      )}

      {loading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Loader2 size={24} className="text-white animate-spin" />
        </div>
      )}

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white shadow transition-colors"
          title="Replace"
        >
          <Camera size={16} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-red-500 hover:bg-white shadow transition-colors"
          title="Remove"
        >
          <X size={16} />
        </button>
      </div>

      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleChange} />
    </div>
  );
}

// Empty "add" tile
function AddSlot({ onUpload }: { onUpload: (file: File) => Promise<void> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = '';
    setLoading(true);
    try {
      for (const file of files) await onUpload(file);
    } finally {
      setLoading(false);
    }
  }, [onUpload]);

  return (
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
          <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 group-hover:border-gold-300 flex items-center justify-center shadow-sm transition-colors">
            <Plus size={22} className="text-gray-400 group-hover:text-gold-500 transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 group-hover:text-gold-600 transition-colors">Add Photos</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Select one or more</p>
          </div>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </button>
  );
}

export function ManageFacilities() {
  const [store, setStore] = useState<FacilityStore>(loadFacilityStore);

  function mutate(key: FacilityKey, updater: (photos: string[]) => string[]) {
    setStore((prev) => {
      const next = { ...prev, [key]: updater([...prev[key]]) };
      saveFacilityStore(next);
      return next;
    });
  }

  async function handleAdd(key: FacilityKey, file: File) {
    const dataUrl = await compressImage(file).catch(() => { toast.error('Failed to process image'); return ''; });
    if (!dataUrl) return;
    mutate(key, (p) => [...p, dataUrl]);
    toast.success('Photo added');
  }

  async function handleReplace(key: FacilityKey, idx: number, file: File) {
    const dataUrl = await compressImage(file).catch(() => { toast.error('Failed to process image'); return ''; });
    if (!dataUrl) return;
    mutate(key, (p) => { p[idx] = dataUrl; return p; });
    toast.success('Photo replaced');
  }

  function handleRemove(key: FacilityKey, idx: number) {
    mutate(key, (p) => p.filter((_, i) => i !== idx));
  }

  function handleClearAll(key: FacilityKey) {
    mutate(key, () => []);
    toast.success('Photos cleared');
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Resort Facilities Photos</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload any number of photos per category. The first photo is used as the card cover on the home page. All photos appear in the gallery modal. Changes save instantly.
        </p>
      </div>

      <div className="space-y-8">
        {CATEGORIES.map(({ key, en, ar }) => {
          const photos = store[key];
          return (
            <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-900 text-base">{en}</h3>
                  <p className="text-xs text-gray-400">{ar} · {photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
                </div>
                {photos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleClearAll(key)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((url, idx) => (
                  <FilledSlot
                    key={idx}
                    url={url}
                    index={idx}
                    onReplace={(file) => handleReplace(key, idx, file)}
                    onRemove={() => handleRemove(key, idx)}
                  />
                ))}
                <AddSlot onUpload={(file) => handleAdd(key, file)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
