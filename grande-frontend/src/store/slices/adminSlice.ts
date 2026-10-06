import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { PricingRule, Promotion } from '../../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

function authHeaders(token?: string) {
  const t = token ?? localStorage.getItem('access_token');
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

// Singleton token refresh — prevents duplicate refresh calls
let _adminRefreshInFlight: Promise<string | null> | null = null;

async function adminRefreshToken(): Promise<string | null> {
  if (_adminRefreshInFlight) return _adminRefreshInFlight;
  const rt = localStorage.getItem('refresh_token');
  if (!rt) return null;
  _adminRefreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/Auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) return null;
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      if (json.success && json.data?.accessToken) {
        localStorage.setItem('access_token', json.data.accessToken);
        if (json.data.refreshToken) localStorage.setItem('refresh_token', json.data.refreshToken);
        return json.data.accessToken as string;
      }
      return null;
    } catch { return null; }
    finally { _adminRefreshInFlight = null; }
  })();
  return _adminRefreshInFlight;
}

async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  let res = await fetch(input, { ...init, headers: authHeaders() });
  if (res.status === 401) {
    const newToken = await adminRefreshToken();
    if (newToken) res = await fetch(input, { ...init, headers: authHeaders(newToken) });
  }
  return res;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ApiAdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  roles: string[];
  loyaltyPoints: number;
  totalBookings: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdminDashboardStats {
  totalChalets: number;
  activeChalets: number;
  totalBookings: number;
  bookingsToday: number;
  confirmedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  revenueThisMonth: number;
  revenueThisWeek: number;
  occupancyRate: number;
  totalUsers: number;
  newUsersThisMonth: number;
  revenueByType: { type: string; amount: number; bookingCount: number }[];
  bookingsByStatus: { status: string; count: number }[];
}

export interface ApiPricingRule {
  id: string;
  name: string;
  chaletId: string | null;
  applicableChaletType: string;
  type: string;
  multiplier: number;
  fixedAmount: number;
  startDate: string | null;
  endDate: string | null;
  dayOfWeek: string | null;
  minNights: number;
  occupancyThreshold: number;
  priority: number;
}

export interface ApiPromotion {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  description: string;
  discountType: string;
  discountValue: number;
  minBookingAmount: number;
  maxDiscountAmount: number;
  maxUses: number;
  usageCount: number;
  validFrom: string;
  validTo: string;
  applicableChaletType: string;
  isActive: boolean;
}

export type PricingRulePayload = {
  name: string;
  chaletId?: string | null;
  applicableChaletType?: string;
  type: string;
  multiplier?: number;
  fixedAmount?: number;
  startDate?: string | null;
  endDate?: string | null;
  dayOfWeek?: string | null;
  minNights?: number;
  occupancyThreshold?: number;
  priority?: number;
};

export type PromotionPayload = {
  code: string;
  name: string;
  nameAr: string;
  description: string;
  discountType: string;
  discountValue: number;
  minBookingAmount?: number;
  maxDiscountAmount?: number;
  maxUses?: number;
  validFrom: string;
  validTo: string;
  applicableChaletType?: string;
};

// ── Thunks ────────────────────────────────────────────────────────────────────
export const fetchAdminDashboard = createAsyncThunk('admin/fetchDashboard', async () => {
  const res = await adminFetch(`${API_BASE}/api/admin/dashboard`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data as AdminDashboardStats;
});

export const fetchAdminUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (params?: { page?: number; pageSize?: number; role?: string }) => {
    const p = params?.page ?? 1;
    const ps = params?.pageSize ?? 100;
    const roleQ = params?.role ? `&role=${encodeURIComponent(params.role)}` : '';
    const res = await adminFetch(`${API_BASE}/api/admin/users?page=${p}&pageSize=${ps}${roleQ}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const raw = (json.data?.items ?? json.data ?? []) as ApiAdminUser[];
    return raw;
  },
);

async function safeJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}
function extractError(json: Record<string, unknown>, status: number): string {
  if (Array.isArray(json.errors)) return (json.errors as string[]).join('\n');
  if (json.errors && typeof json.errors === 'object') return Object.values(json.errors as Record<string, string[]>).flat().join('\n');
  return (json.message as string) || `HTTP ${status}`;
}

export const fetchPricingRules = createAsyncThunk('admin/fetchPricingRules', async (chaletId?: string) => {
  const q = chaletId ? `?chaletId=${chaletId}` : '';
  const res = await adminFetch(`${API_BASE}/api/admin/pricing/rules${q}`);
  const json = await safeJson(res);
  console.log('[fetchPricingRules] status:', res.status, 'body:', json);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = json.data;
  return (Array.isArray(data) ? data : (data as any)?.items ?? data ?? []) as ApiPricingRule[];
});

export const fetchPromotions = createAsyncThunk('admin/fetchPromotions', async () => {
  const res = await adminFetch(`${API_BASE}/api/admin/pricing/promotions?page=1&pageSize=50`);
  const json = await safeJson(res);
  console.log('[fetchPromotions] status:', res.status, 'body:', json);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = json.data;
  return ((data as any)?.items ?? (Array.isArray(data) ? data : [])) as ApiPromotion[];
});

function cleanRulePayload(payload: PricingRulePayload): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: payload.name,
    type: payload.type,
    multiplier: payload.multiplier ?? 1,
    fixedAmount: payload.fixedAmount ?? 0,
    minNights: payload.minNights ?? 0,
    occupancyThreshold: payload.occupancyThreshold ?? 0,
    priority: payload.priority ?? 0,
  };
  if (payload.chaletId) body.chaletId = payload.chaletId;
  if (payload.applicableChaletType) body.applicableChaletType = payload.applicableChaletType;
  if (payload.startDate) body.startDate = payload.startDate;
  if (payload.endDate) body.endDate = payload.endDate;
  if (payload.dayOfWeek) body.dayOfWeek = payload.dayOfWeek;
  return body;
}

export async function createPricingRuleApi(payload: PricingRulePayload): Promise<{ success: boolean; message?: string }> {
  try {
    const body = cleanRulePayload(payload);
    console.log('[createPricingRuleApi] sending:', body);
    const res = await adminFetch(`${API_BASE}/api/admin/pricing/rules`, { method: 'POST', body: JSON.stringify(body) });
    const json = await safeJson(res);
    console.log('[createPricingRuleApi] response:', res.status, json);
    return res.ok ? { success: true } : { success: false, message: extractError(json, res.status) };
  } catch { return { success: false, message: 'Network error' }; }
}

export async function updatePricingRuleApi(id: string, payload: PricingRulePayload): Promise<{ success: boolean; message?: string }> {
  try {
    const body = cleanRulePayload(payload);
    console.log('[updatePricingRuleApi] sending:', body);
    const res = await adminFetch(`${API_BASE}/api/admin/pricing/rules/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    const json = await safeJson(res);
    console.log('[updatePricingRuleApi] response:', res.status, json);
    return res.ok ? { success: true } : { success: false, message: extractError(json, res.status) };
  } catch { return { success: false, message: 'Network error' }; }
}

export async function deletePricingRuleApi(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await adminFetch(`${API_BASE}/api/admin/pricing/rules/${id}`, { method: 'DELETE' });
    const json = await safeJson(res);
    return res.ok ? { success: true } : { success: false, message: extractError(json, res.status) };
  } catch { return { success: false, message: 'Network error' }; }
}

function cleanPromoPayload(payload: PromotionPayload): Record<string, unknown> {
  const body: Record<string, unknown> = {
    code: payload.code,
    name: payload.name,
    nameAr: payload.nameAr ?? '',
    description: payload.description ?? '',
    discountType: payload.discountType,
    discountValue: payload.discountValue,
    validFrom: payload.validFrom,
    validTo: payload.validTo,
  };
  if (payload.applicableChaletType) body.applicableChaletType = payload.applicableChaletType;
  if (payload.minBookingAmount) body.minBookingAmount = payload.minBookingAmount;
  if (payload.maxDiscountAmount) body.maxDiscountAmount = payload.maxDiscountAmount;
  if (payload.maxUses) body.maxUses = payload.maxUses;
  return body;
}

export async function createPromotionApi(payload: PromotionPayload): Promise<{ success: boolean; message?: string }> {
  try {
    const body = cleanPromoPayload(payload);
    console.log('[createPromotionApi] sending:', body);
    const res = await adminFetch(`${API_BASE}/api/admin/pricing/promotions`, { method: 'POST', body: JSON.stringify(body) });
    const json = await safeJson(res);
    console.log('[createPromotionApi] response:', res.status, json);
    return res.ok ? { success: true } : { success: false, message: extractError(json, res.status) };
  } catch { return { success: false, message: 'Network error' }; }
}

export async function updatePromotionApi(id: string, payload: PromotionPayload): Promise<{ success: boolean; message?: string }> {
  try {
    const body = cleanPromoPayload(payload);
    console.log('[updatePromotionApi] sending:', body);
    const res = await adminFetch(`${API_BASE}/api/admin/pricing/promotions/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    const json = await safeJson(res);
    console.log('[updatePromotionApi] response:', res.status, json);
    return res.ok ? { success: true } : { success: false, message: extractError(json, res.status) };
  } catch { return { success: false, message: 'Network error' }; }
}

export async function deletePromotionApi(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await adminFetch(`${API_BASE}/api/admin/pricing/promotions/${id}`, { method: 'DELETE' });
    const json = await safeJson(res);
    return res.ok ? { success: true } : { success: false, message: extractError(json, res.status) };
  } catch { return { success: false, message: 'Network error' }; }
}

export async function activateUser(userId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await adminFetch(`${API_BASE}/api/admin/users/${userId}/activate`, { method: 'POST' });
    const json = await safeJson(res);
    return { success: res.ok, message: (json.message as string | undefined) || (res.ok ? undefined : extractError(json, res.status)) };
  } catch { return { success: false, message: 'Network error' }; }
}

export async function deactivateUser(userId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await adminFetch(`${API_BASE}/api/admin/users/${userId}/deactivate`, { method: 'POST' });
    const json = await safeJson(res);
    return { success: res.ok, message: (json.message as string | undefined) || (res.ok ? undefined : extractError(json, res.status)) };
  } catch { return { success: false, message: 'Network error' }; }
}

export async function createStaffUser(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await adminFetch(`${API_BASE}/api/admin/users/staff`, { method: 'POST', body: JSON.stringify(payload) });
    const json = await safeJson(res);
    return { success: res.ok && !!json.success, message: json.message as string | undefined };
  } catch { return { success: false, message: 'Network error' }; }
}

// ── State ─────────────────────────────────────────────────────────────────────
interface AdminState {
  pricingRules: PricingRule[];
  promotions: Promotion[];
  apiUsers: ApiAdminUser[];
  usersLoading: boolean;
  dashboardStats: AdminDashboardStats | null;
  dashboardLoading: boolean;
  isLoading: boolean;
  apiPricingRules: ApiPricingRule[];
  pricingRulesLoading: boolean;
  apiPromotions: ApiPromotion[];
  promotionsLoading: boolean;
}

const initialState: AdminState = {
  pricingRules: [],
  promotions: [],
  apiUsers: [],
  usersLoading: false,
  dashboardStats: null,
  dashboardLoading: false,
  isLoading: false,
  apiPricingRules: [],
  pricingRulesLoading: false,
  apiPromotions: [],
  promotionsLoading: false,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    togglePricingRule(state, action: PayloadAction<string>) {
      const rule = state.pricingRules.find((r) => r.id === action.payload);
      if (rule) rule.isActive = !rule.isActive;
    },
    updatePricingRule(state, action: PayloadAction<PricingRule>) {
      const idx = state.pricingRules.findIndex((r) => r.id === action.payload.id);
      if (idx >= 0) state.pricingRules[idx] = action.payload;
    },
    addPricingRule(state, action: PayloadAction<PricingRule>) {
      state.pricingRules.push(action.payload);
    },
    deletePricingRule(state, action: PayloadAction<string>) {
      state.pricingRules = state.pricingRules.filter((r) => r.id !== action.payload);
    },
    togglePromotion(state, action: PayloadAction<string>) {
      const promo = state.promotions.find((p) => p.id === action.payload);
      if (promo) promo.isActive = !promo.isActive;
    },
    addPromotion(state, action: PayloadAction<Promotion>) {
      state.promotions.push(action.payload);
    },
    deletePromotion(state, action: PayloadAction<string>) {
      state.promotions = state.promotions.filter((p) => p.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminUsers.pending, (state) => { state.usersLoading = true; })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => { state.apiUsers = action.payload; state.usersLoading = false; })
      .addCase(fetchAdminUsers.rejected, (state) => { state.usersLoading = false; })
      .addCase(fetchAdminDashboard.pending, (state) => { state.dashboardLoading = true; })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => { state.dashboardStats = action.payload; state.dashboardLoading = false; })
      .addCase(fetchAdminDashboard.rejected, (state) => { state.dashboardLoading = false; })
      .addCase(fetchPricingRules.pending, (state) => { state.pricingRulesLoading = true; })
      .addCase(fetchPricingRules.fulfilled, (state, action) => { state.apiPricingRules = action.payload; state.pricingRulesLoading = false; })
      .addCase(fetchPricingRules.rejected, (state) => { state.pricingRulesLoading = false; })
      .addCase(fetchPromotions.pending, (state) => { state.promotionsLoading = true; })
      .addCase(fetchPromotions.fulfilled, (state, action) => { state.apiPromotions = action.payload; state.promotionsLoading = false; })
      .addCase(fetchPromotions.rejected, (state) => { state.promotionsLoading = false; });
  },
});

export const {
  togglePricingRule, updatePricingRule, addPricingRule, deletePricingRule,
  togglePromotion, addPromotion, deletePromotion,
} = adminSlice.actions;

export default adminSlice.reducer;
