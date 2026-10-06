import { createSlice, createAsyncThunk, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { Chalet, ChaletFilters, ChaletType } from '../../types';

function mapTypeToApi(type: ChaletType | 'all'): string | undefined {
  if (type === 'all') return undefined;
  if (type === 'normal') return 'Standard';
  if (type === 'superior') return 'Superior';
  if (type === 'vip') return 'VIP';
  return undefined;
}

// ── API types ────────────────────────────────────────────────────────────────
interface ApiAmenity {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
}

interface ApiImage {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface ApiChalet {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  type: string;            // "Standard" | "Superior" | "VIP"
  typeName: string;
  masterBedrooms: number;
  singleBedrooms: number;
  bedsPerSingleBedroom: number;
  bathrooms: number;
  hasServantRoom: boolean;
  maxGuests: number;
  basePrice: number;
  weekendPrice: number;
  currentDynamicPrice: number;
  occupancyPercentage: number;
  location: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  googleReviewUrl: string;
  isActive: boolean;
  averageRating: number;
  totalReviews: number;
  amenities: ApiAmenity[];
  images?: ApiImage[];
}

// ── Mapper ───────────────────────────────────────────────────────────────────
function mapType(apiType: string): ChaletType {
  const t = apiType.toLowerCase();
  if (t === 'superior') return 'superior';
  if (t === 'vip') return 'vip';
  return 'normal';
}

function mapChalet(a: ApiChalet): Chalet {
  return {
    id: a.id,
    name:        { en: a.name,        ar: a.nameAr        },
    description: { en: a.description, ar: a.descriptionAr },
    type: mapType(a.type),
    basePrice: a.basePrice,
    images: a.images
      ? [...a.images]
          .filter((img) => img.url.includes('digitaloceanspaces.com'))
          .sort((x, y) => {
            if (x.isPrimary && !y.isPrimary) return -1;
            if (!x.isPrimary && y.isPrimary) return 1;
            return x.sortOrder - y.sortOrder;
          })
          .map((img) => img.url)
      : [],
    bedrooms: [
      ...Array.from({ length: a.masterBedrooms }, () => ({ type: 'master' as const, beds: 1,                    hasEnsuite: true  })),
      ...Array.from({ length: a.singleBedrooms }, () => ({ type: 'single' as const, beds: a.bedsPerSingleBedroom, hasEnsuite: false })),
    ],
    bathrooms: a.bathrooms,
    hasServantRoom: a.hasServantRoom,
    maxGuests: a.maxGuests,
    amenities: a.amenities.map((am) => am.name),
    location: {
      lat: a.latitude,
      lng: a.longitude,
      address: {
        en: (a.location ?? '').replace(/salwa/gi, 'Khairan'),
        ar: (a.location ?? '').replace(/salwa/gi, 'خيران'),
      },
      region:  { en: 'Khairan, Kuwait', ar: 'خيران، الكويت' },
    },
    googleMapsUrl: a.googleMapsUrl || undefined,
    googleReviewUrl: a.googleReviewUrl || undefined,
    weekendPrice: a.weekendPrice,
    cancellationPolicy: 'moderate',
    isAvailable: a.isActive,
    rating: a.averageRating,
    reviewCount: a.totalReviews,
    featured: mapType(a.type) !== 'normal',
  };
}

// ── API base ──────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
const PAGE_SIZE = 50;

// ── Fetch single chalet by ID ─────────────────────────────────────────────────
export const fetchChaletById = createAsyncThunk('chalets/fetchById', async (id: string) => {
  const res = await fetch(`${API_BASE}/api/Chalets/${id}`);
  if (!res.ok) throw new Error('Chalet not found');
  const json = await res.json();
  return json.data as ApiChalet;
});

const DEFAULT_MAX_PRICE = 10000;

function buildChaletParams(filters?: ChaletFilters, page = 1): URLSearchParams {
  const p = new URLSearchParams({ Page: String(page), PageSize: String(PAGE_SIZE) });
  if (filters) {
    const apiType = mapTypeToApi(filters.type);
    if (apiType) p.set('Type', apiType);
    if (filters.guests > 1) p.set('Guests', String(filters.guests));
    if (filters.minPrice > 0) p.set('MinPrice', String(filters.minPrice));
    if (filters.maxPrice < DEFAULT_MAX_PRICE) p.set('MaxPrice', String(filters.maxPrice));
    if (filters.checkIn) p.set('CheckIn', new Date(filters.checkIn).toISOString());
    if (filters.checkOut) p.set('CheckOut', new Date(filters.checkOut).toISOString());
  }
  return p;
}

export const fetchChalets = createAsyncThunk('chalets/fetchAll', async (filters?: ChaletFilters) => {
  const params = buildChaletParams(filters, 1);
  const firstRes  = await fetch(`${API_BASE}/api/Chalets?${params}`);
  if (!firstRes.ok) throw new Error(`Chalets fetch failed: ${firstRes.status}`);
  const firstJson = await firstRes.json();
  if (!firstJson.data) throw new Error('Chalets response missing data');
  const { items, totalPages } = firstJson.data as { items: ApiChalet[]; totalPages: number };

  if (totalPages <= 1) return items;

  const restPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      fetch(`${API_BASE}/api/Chalets?${buildChaletParams(filters, i + 2)}`)
        .then((r) => r.json())
        .then((j) => j.data.items as ApiChalet[]),
    ),
  );

  return [...items, ...restPages.flat()];
});

// ── Slice ─────────────────────────────────────────────────────────────────────
interface ChaletsState {
  chalets: Chalet[];
  selectedChalet: Chalet | null;
  filters: ChaletFilters;
  isLoading: boolean;
  error: string | null;
}

const initialState: ChaletsState = {
  chalets: [],
  selectedChalet: null,
  filters: {
    type: 'all',
    minPrice: 0,
    maxPrice: DEFAULT_MAX_PRICE,
    guests: 1,
    checkIn: null,
    checkOut: null,
    amenities: [],
    sortBy: 'featured',
  },
  isLoading: false,
  error: null,
};

const chaletsSlice = createSlice({
  name: 'chalets',
  initialState,
  reducers: {
    setSelectedChalet(state, action: PayloadAction<string>) {
      state.selectedChalet = state.chalets.find((c) => c.id === action.payload) ?? null;
    },
    clearSelectedChalet(state) {
      state.selectedChalet = null;
    },
    setFilter<K extends keyof ChaletFilters>(
      state: ChaletsState,
      action: PayloadAction<{ key: K; value: ChaletFilters[K] }>,
    ) {
      (state.filters as ChaletFilters)[action.payload.key] = action.payload.value;
    },
    resetFilters(state) {
      state.filters = {
        type: 'all',
        minPrice: 0,
        maxPrice: DEFAULT_MAX_PRICE,
        guests: 1,
        checkIn: null,
        checkOut: null,
        amenities: [],
        sortBy: 'featured',
      };
    },
    toggleChaletAvailability(state, action: PayloadAction<string>) {
      const chalet = state.chalets.find((c) => c.id === action.payload);
      if (chalet) chalet.isAvailable = !chalet.isAvailable;
    },
    updateChaletBasePrice(state, action: PayloadAction<{ id: string; price: number }>) {
      const chalet = state.chalets.find((c) => c.id === action.payload.id);
      if (chalet) chalet.basePrice = action.payload.price;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChalets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChalets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chalets = (action.payload as ApiChalet[]).map((a) => mapChalet(a));
      })
      .addCase(fetchChalets.rejected, (state) => {
        state.isLoading = false;
        state.error = 'Failed to load chalets';
      })
      .addCase(fetchChaletById.fulfilled, (state, action) => {
        const payload = action.payload as ApiChalet;
        const idx = state.chalets.findIndex((c) => c.id === payload.id);
        const mapped = mapChalet(payload);
        if (idx >= 0) {
          state.chalets[idx] = mapped;
        } else {
          state.chalets.push(mapped);
        }
        state.selectedChalet = mapped;
      });
  },
});

export const {
  setSelectedChalet, clearSelectedChalet,
  setFilter, resetFilters,
  toggleChaletAvailability, updateChaletBasePrice,
} = chaletsSlice.actions;

const TYPE_ORDER: Record<string, number> = { normal: 0, superior: 1, vip: 2 };

function naturalName(a: Chalet, b: Chalet): number {
  return a.name.en.localeCompare(b.name.en, undefined, { numeric: true, sensitivity: 'base' });
}

// Filtering is server-side; this selector handles sorting only.
export const selectFilteredChalets = createSelector(
  (state: { chalets: ChaletsState }) => state.chalets.chalets,
  (state: { chalets: ChaletsState }) => state.chalets.filters.sortBy,
  (chalets, sortBy) => {
    const result = [...chalets];
    if (sortBy === 'price_asc')  return result.sort((a, b) => a.basePrice - b.basePrice || naturalName(a, b));
    if (sortBy === 'price_desc') return result.sort((a, b) => b.basePrice - a.basePrice || naturalName(a, b));
    if (sortBy === 'rating')     return result.sort((a, b) => b.rating - a.rating || naturalName(a, b));
    // Default: type priority (VIP → Superior → Standard) then natural name (A1, A2, B1…)
    return result.sort((a, b) => (TYPE_ORDER[a.type] ?? 3) - (TYPE_ORDER[b.type] ?? 3) || naturalName(a, b));
  },
);

export default chaletsSlice.reducer;
