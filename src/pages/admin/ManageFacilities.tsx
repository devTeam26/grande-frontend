import { useState, useEffect } from 'react';
import { Save, RotateCcw, Image, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const FACILITY_STORAGE_KEY = 'grandebeach_facility_photos';

type FacilityKey = 'indoor' | 'kids' | 'reception' | 'outdoor';

interface FacilityEntry {
  img: string;
  imgs: [string, string, string];
}

type FacilityStore = Record<FacilityKey, FacilityEntry>;

const DEFAULTS: FacilityStore = {
  indoor:    { img: '', imgs: ['', '', ''] },
  kids:      { img: '', imgs: ['', '', ''] },
  reception: { img: '', imgs: ['', '', ''] },
  outdoor:   { img: '', imgs: ['', '', ''] },
};

const LABELS: Record<FacilityKey, { en: string; ar: string }> = {
  indoor:    { en: 'Indoor',    ar: 'داخلي' },
  kids:      { en: 'Kids Area', ar: 'منطقة الأطفال' },
  reception: { en: 'Reception', ar: 'الاستقبال' },
  outdoor:   { en: 'Outdoor',   ar: 'خارجي' },
};

const KEYS: FacilityKey[] = ['indoor', 'kids', 'reception', 'outdoor'];

function loadStore(): FacilityStore {
  try {
    const raw = localStorage.getItem(FACILITY_STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULTS);
    return { ...structuredClone(DEFAULTS), ...JSON.parse(raw) } as FacilityStore;
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function ImgPreview({ url }: { url: string }) {
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  useEffect(() => {
    if (!url) { setStatus('idle'); return; }
    setStatus('idle');
    const img = new window.Image();
    img.onload  = () => setStatus('ok');
    img.onerror = () => setStatus('err');
    img.src = url;
  }, [url]);

  if (!url) return null;
  return (
    <div className="mt-2">
      {status === 'ok' && (
        <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
          <img src={url} alt="preview" className="w-full h-full object-cover" />
          <span className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            <CheckCircle size={10} /> OK
          </span>
        </div>
      )}
      {status === 'err' && (
        <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1">
          <AlertCircle size={13} /> Could not load image — check the URL
        </div>
      )}
    </div>
  );
}

export function ManageFacilities() {
  const [store, setStore] = useState<FacilityStore>(loadStore);
  const [saved, setSaved] = useState(false);

  function setImg(key: FacilityKey, value: string) {
    setStore((s) => ({ ...s, [key]: { ...s[key], img: value } }));
    setSaved(false);
  }

  function setGallery(key: FacilityKey, idx: 0 | 1 | 2, value: string) {
    setStore((s) => {
      const imgs = [...s[key].imgs] as [string, string, string];
      imgs[idx] = value;
      return { ...s, [key]: { ...s[key], imgs } };
    });
    setSaved(false);
  }

  function handleSave() {
    localStorage.setItem(FACILITY_STORAGE_KEY, JSON.stringify(store));
    setSaved(true);
    toast.success('Facility photos saved');
  }

  function handleReset(key: FacilityKey) {
    setStore((s) => ({ ...s, [key]: structuredClone(DEFAULTS[key]) }));
    setSaved(false);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resort Facilities</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter CDN photo URLs for each facility category. Changes are saved to this browser and reflected on the homepage immediately.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-gold-500 hover:bg-gold-600 text-white'
          }`}
        >
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? 'Saved' : 'Save All'}
        </button>
      </div>

      <div className="space-y-6">
        {KEYS.map((key) => (
          <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gold-50 flex items-center justify-center">
                  <Image className="text-gold-500" size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{LABELS[key].en}</h3>
                  <p className="text-xs text-gray-400">{LABELS[key].ar}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleReset(key)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <RotateCcw size={12} /> Clear
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cover photo */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Cover Photo <span className="text-gray-400 font-normal normal-case">(shown on home page card)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://cdn.example.com/photo.jpg"
                  value={store[key].img}
                  onChange={(e) => setImg(key, e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 font-mono"
                />
                <ImgPreview url={store[key].img} />
              </div>

              {/* Gallery photos */}
              {([0, 1, 2] as const).map((idx) => (
                <div key={idx}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Gallery Photo {idx + 1} <span className="text-gray-400 font-normal normal-case">(modal carousel)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://cdn.example.com/photo.jpg"
                    value={store[key].imgs[idx]}
                    onChange={(e) => setGallery(key, idx, e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 font-mono"
                  />
                  <ImgPreview url={store[key].imgs[idx]} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-gold-500 hover:bg-gold-600 text-white'
          }`}
        >
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? 'All Changes Saved' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
