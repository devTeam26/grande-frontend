import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export interface ApiAddon {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  isPerNight: boolean;
  icon: string;
}

interface AddonsState {
  items: ApiAddon[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AddonsState = {
  items: [],
  isLoading: false,
  error: null,
};

// GET /api/AddOns?page=1&pageSize=100
export const fetchAddons = createAsyncThunk('addons/fetch', async () => {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = { accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/AddOns?page=1&pageSize=100`, { headers });
  console.log('[fetchAddons] status:', res.status);

  if (!res.ok) {
    const text = await res.text();
    console.error('[fetchAddons] error body:', text);
    throw new Error(`Failed to fetch add-ons: ${res.status}`);
  }

  const json = await res.json() as { success?: boolean; data?: { items?: ApiAddon[] } };
  console.log('[fetchAddons] response:', json);
  return json.data?.items ?? [];
});

// GET /api/AddOns/{id}
export async function fetchAddonById(id: string): Promise<ApiAddon | null> {
  try {
    const res = await fetch(`${API_BASE}/api/AddOns/${id}`, {
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json() as { data?: ApiAddon };
    return json.data ?? null;
  } catch {
    return null;
  }
}

const addonsSlice = createSlice({
  name: 'addons',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddons.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAddons.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchAddons.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.error.message as string) ?? 'Could not load add-ons';
        console.error('[addonsSlice] fetchAddons rejected:', action.error);
      });
  },
});

export default addonsSlice.reducer;
