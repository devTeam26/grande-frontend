import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Booking, GuestInfo, PaymentMethod, PaymentPlan, PricingBreakdown } from '../../types';
import { logout } from './authSlice';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

function authHeaders(token?: string) {
  const t = token ?? localStorage.getItem('access_token');
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

// Singleton: if a refresh is already in-flight, reuse it instead of starting a second one.
// This prevents the race condition when multiple concurrent requests all get 401 simultaneously.
let _refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (_refreshInFlight) return _refreshInFlight;
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;
  _refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/Auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const json = await safeJson(res);
      const data = json.data as { accessToken?: string; refreshToken?: string } | undefined;
      if (json.success && data?.accessToken) {
        localStorage.setItem('access_token', data.accessToken);
        if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
        return data.accessToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      _refreshInFlight = null;
    }
  })();
  return _refreshInFlight;
}

async function fetchWithAuth(input: string, init: RequestInit): Promise<Response> {
  let res = await fetch(input, { ...init, headers: authHeaders() });
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(input, { ...init, headers: authHeaders(newToken) });
    }
  }
  return res;
}

async function safeJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try { return text ? (JSON.parse(text) as Record<string, unknown>) : {}; } catch { return {}; }
}

function extractError(json: Record<string, unknown>, status: number): string {
  if (Array.isArray(json.errors)) return (json.errors as string[]).join('\n');
  if (json.errors && typeof json.errors === 'object') {
    return Object.values(json.errors as Record<string, string[]>)
      .flat()
      .join('\n');
  }
  return (json.message as string) || `HTTP ${status}`;
}

// ── API booking shape returned by the backend ─────────────────────────────────
export interface ApiBooking {
  id: string;
  bookingNumber: string;
  chaletId: string;
  chaletName: string;
  chaletType: string;
  userId: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestCount: number;
  baseAmount: number;
  addOnsAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  statusName: string;
  source: string;
  specialRequests: string;
  cancellationReason: string;
  createdAt: string;
  addOns: { addOnId: string; name: string; quantity: number; unitPrice: number; totalPrice: number }[];
  // fields returned only by guest-facing booking APIs (not admin endpoints)
  discountAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  paymentType?: string;
  promotionCode?: string;
  loyaltyPointsEarned?: number;
  loyaltyPointsRedeemed?: number;
  payments?: { id: string; amount: number; provider: string; status: string; paidAt: string }[];
}

// ── Price-preview API ─────────────────────────────────────────────────────────
export interface PricePreviewResult {
  baseAmount: number;
  addOnsAmount: number;
  discountAmount: number;
  loyaltyDiscount: number;
  taxAmount: number;
  totalAmount: number;
  partialPaymentAmount: number;
  loyaltyPointsToEarn: number;
  breakdown: { description: string; amount: number; isDiscount: boolean }[];
}

export async function getPricePreview(payload: {
  chaletId: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  paymentType?: string;
  preferredPaymentProvider?: string;
  promotionCode?: string;
  loyaltyPointsToRedeem?: number;
  specialRequests?: string;
  addOns?: { addOnId: string; quantity: number }[];
}): Promise<{ success: boolean; data?: PricePreviewResult; message?: string }> {
  try {
    const body = { paymentType: 'Full', preferredPaymentProvider: 'Tap', addOns: [], loyaltyPointsToRedeem: 0, ...payload };
    const res = await fetchWithAuth(`${API_BASE}/api/Bookings/price-preview`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const json = await safeJson(res);
    if (!res.ok || !json.success) {
      const msg = extractError(json as Record<string, unknown>, res.status);
      return { success: false, message: msg };
    }
    return { success: true, data: json.data as PricePreviewResult };
  } catch (err) {
    console.error('[getPricePreview] fetch threw:', err);
    return { success: false, message: err instanceof Error ? err.message : 'Network error' };
  }
}

// ── Submit booking ────────────────────────────────────────────────────────────
export async function submitBooking(payload: {
  chaletId: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  paymentType: string;
  preferredPaymentProvider: string;
  promotionCode?: string;
  loyaltyPointsToRedeem?: number;
  specialRequests?: string;
  addOns: { addOnId: string; quantity: number }[];
}): Promise<{ success: boolean; data?: ApiBooking; message?: string }> {
  try {
    const body = JSON.stringify(payload);
    console.log('[submitBooking] payload:', payload);
    const res = await fetchWithAuth(`${API_BASE}/api/Bookings`, {
      method: 'POST',
      body,
    });
    const json = await safeJson(res);
    console.log('[submitBooking] status:', res.status, 'response:', json);
    if (!res.ok || !json.success) {
      const msg = extractError(json as Record<string, unknown>, res.status);
      return { success: false, message: msg };
    }
    return { success: true, data: json.data as ApiBooking };
  } catch (err) {
    console.error('[submitBooking] fetch threw:', err);
    return { success: false, message: err instanceof Error ? err.message : 'Network error' };
  }
}

// ── Cancel booking (user) ─────────────────────────────────────────────────────
export async function cancelUserBooking(id: string, reason?: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/Bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason ?? '' }),
    });
    const json = await safeJson(res);
    return { success: res.ok && Boolean(json.success), message: json.message as string | undefined };
  } catch {
    return { success: false, message: 'Network error' };
  }
}

// ── Fetch user's own bookings ─────────────────────────────────────────────────
export const fetchMyBookings = createAsyncThunk(
  'booking/fetchMy',
  async (params: { page?: number; pageSize?: number } | undefined, { rejectWithValue, dispatch }) => {
    const p = params?.page ?? 1;
    const ps = params?.pageSize ?? 50;
    const res = await fetchWithAuth(`${API_BASE}/api/Bookings/my?page=${p}&pageSize=${ps}`, {});
    if (res.status === 404) return [] as ApiBooking[]; // API returns 404 when user has no bookings
    if (!res.ok) {
      if (res.status === 401) dispatch(logout()); // both tokens expired — redirect to login
      return rejectWithValue(res.status);
    }
    const json = await safeJson(res);
    return ((json.data as { items?: ApiBooking[] } | undefined)?.items ?? []) as ApiBooking[];
  },
);

// ── Fetch booking by ID ───────────────────────────────────────────────────────
export const fetchBookingById = createAsyncThunk('booking/fetchById', async (id: string) => {
  const res = await fetchWithAuth(`${API_BASE}/api/Bookings/${id}`, {});
  if (!res.ok) throw new Error('Not found');
  const json = await safeJson(res);
  return json.data as ApiBooking;
});

// ── Fetch booking by booking number ──────────────────────────────────────────
export async function fetchBookingByNumber(bookingNumber: string): Promise<{ success: boolean; data?: ApiBooking; message?: string }> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/Bookings/by-number/${encodeURIComponent(bookingNumber)}`, {});
    const json = await safeJson(res);
    if (!res.ok || !json.success) return { success: false, message: (json.message as string) || 'Not found' };
    return { success: true, data: json.data as ApiBooking };
  } catch {
    return { success: false, message: 'Network error' };
  }
}

// ── Admin: fetch ALL bookings ─────────────────────────────────────────────────
export interface AdminBookingsMeta {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const fetchAdminBookings = createAsyncThunk(
  'booking/fetchAdmin',
  async (params?: { page?: number; pageSize?: number; status?: string }) => {
    const p = params?.page ?? 1;
    const ps = params?.pageSize ?? 20;
    const statusQ = params?.status ? `&status=${params.status}` : '';
    const res = await fetchWithAuth(`${API_BASE}/api/admin/bookings?page=${p}&pageSize=${ps}${statusQ}`, {});
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const json = await safeJson(res);
    const d = json.data as ({ items?: ApiBooking[] } & AdminBookingsMeta) | undefined;
    return {
      items: (d?.items ?? []) as ApiBooking[],
      meta: {
        totalCount: d?.totalCount ?? 0,
        page: d?.page ?? p,
        pageSize: d?.pageSize ?? ps,
        totalPages: d?.totalPages ?? 1,
        hasNextPage: d?.hasNextPage ?? false,
        hasPreviousPage: d?.hasPreviousPage ?? false,
      } as AdminBookingsMeta,
    };
  },
);

// ── Admin: fetch single booking by ID ─────────────────────────────────────────
export async function fetchAdminBookingById(id: string): Promise<{ success: boolean; data?: ApiBooking; message?: string }> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/admin/bookings/${id}`, {});
    const json = await safeJson(res);
    if (!res.ok || !json.success) return { success: false, message: (json.message as string) || 'Not found' };
    return { success: true, data: json.data as ApiBooking };
  } catch {
    return { success: false, message: 'Network error' };
  }
}

// ── Admin: booking actions ────────────────────────────────────────────────────
async function putStatus(id: string, status: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/admin/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    const json = await safeJson(res);
    if (!res.ok || json.success === false) return { success: false, message: extractError(json, res.status) };
    return { success: true, message: json.message as string | undefined };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Network error' };
  }
}

async function postAction(id: string, action: string, body?: object): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/admin/bookings/${id}/${action}`, {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
    const json = await safeJson(res);
    if (!res.ok || json.success === false) return { success: false, message: extractError(json, res.status) };
    return { success: true, message: json.message as string | undefined };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Network error' };
  }
}

export const approveAdminBooking  = (id: string) => postAction(id, 'approve');
export const rejectAdminBooking   = (id: string, reason: string) => postAction(id, 'reject', { reason });
export const confirmAdminBooking  = (id: string) => putStatus(id, 'Confirmed');
export const cancelAdminBooking   = (id: string, reason?: string) => postAction(id, 'cancel', { reason: reason ?? '' });
export const completeAdminBooking = (id: string) => putStatus(id, 'Completed');
export const refundAdminBooking   = (id: string) => postAction(id, 'refund');

export async function updateAdminBookingStatus(id: string, status: string): Promise<{ success: boolean; message?: string }> {
  if (status === 'Cancelled') return cancelAdminBooking(id);
  return putStatus(id, status);
}

// ─────────────────────────────────────────────────────────────────────────────

interface BookingDraft {
  chaletId: string | null;
  checkIn: string | null;
  checkOut: string | null;
  guests: number;
  guestInfo: Partial<GuestInfo>;
  paymentPlan: PaymentPlan;
  paymentMethod: PaymentMethod | null;
  promoCode: string | null;
  promoDiscount: number;
  loyaltyPointsToRedeem: number;
  selectedAddons: string[];
  pricing: PricingBreakdown | null;
}

interface BookingState {
  draft: BookingDraft;
  bookings: Booking[];
  myBookings: ApiBooking[];
  myBookingsLoading: boolean;
  myBookingsError: number | null;
  adminBookings: ApiBooking[];
  adminBookingsMeta: AdminBookingsMeta | null;
  adminBookingsLoading: boolean;
  currentBooking: Booking | null;
  currentApiBooking: ApiBooking | null;
  isLoading: boolean;
  error: string | null;
}

const getInitialDraft = (): BookingDraft => {
  try {
    const saved = localStorage.getItem('bookingDraft');
    if (saved) return JSON.parse(saved) as BookingDraft;
  } catch { /* ignore */ }
  return {
    chaletId: null, checkIn: null, checkOut: null, guests: 2,
    guestInfo: {}, paymentPlan: 'full', paymentMethod: null,
    promoCode: null, promoDiscount: 0, loyaltyPointsToRedeem: 0,
    selectedAddons: [], pricing: null,
  };
};

const saveDraft = (draft: BookingDraft) => {
  try { localStorage.setItem('bookingDraft', JSON.stringify(draft)); } catch { /* ignore */ }
};

const initialState: BookingState = {
  draft: getInitialDraft(),
  bookings: JSON.parse(localStorage.getItem('bookings') || '[]') as Booking[],
  myBookings: [],
  myBookingsLoading: false,
  myBookingsError: null,
  adminBookings: [],
  adminBookingsMeta: null,
  adminBookingsLoading: false,
  currentBooking: null,
  currentApiBooking: null,
  isLoading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    startBooking(state, action: PayloadAction<{ chaletId: string; checkIn?: string; checkOut?: string; guests?: number }>) {
      state.draft = { ...state.draft, chaletId: action.payload.chaletId, checkIn: action.payload.checkIn ?? null, checkOut: action.payload.checkOut ?? null, guests: action.payload.guests ?? 2 };
      saveDraft(state.draft);
    },
    setDates(state, action: PayloadAction<{ checkIn: string; checkOut: string }>) {
      state.draft.checkIn = action.payload.checkIn;
      state.draft.checkOut = action.payload.checkOut;
      saveDraft(state.draft);
    },
    setGuests(state, action: PayloadAction<number>) {
      state.draft.guests = action.payload;
      saveDraft(state.draft);
    },
    setGuestInfo(state, action: PayloadAction<Partial<GuestInfo>>) {
      state.draft.guestInfo = { ...state.draft.guestInfo, ...action.payload };
      saveDraft(state.draft);
    },
    setPaymentPlan(state, action: PayloadAction<PaymentPlan>) {
      state.draft.paymentPlan = action.payload;
      saveDraft(state.draft);
    },
    setPaymentMethod(state, action: PayloadAction<PaymentMethod>) {
      state.draft.paymentMethod = action.payload;
      saveDraft(state.draft);
    },
    applyPromo(state, action: PayloadAction<{ code: string; discount: number }>) {
      state.draft.promoCode = action.payload.code;
      state.draft.promoDiscount = action.payload.discount;
      saveDraft(state.draft);
    },
    setLoyaltyRedeem(state, action: PayloadAction<number>) {
      state.draft.loyaltyPointsToRedeem = action.payload;
      saveDraft(state.draft);
    },
    setAddons(state, action: PayloadAction<string[]>) {
      state.draft.selectedAddons = action.payload;
      saveDraft(state.draft);
    },
    setPricing(state, action: PayloadAction<PricingBreakdown | null>) {
      state.draft.pricing = action.payload;
      saveDraft(state.draft);
    },
    setCurrentApiBooking(state, action: PayloadAction<ApiBooking>) {
      state.currentApiBooking = action.payload;
    },
    confirmBooking(state, action: PayloadAction<Booking>) {
      state.currentBooking = action.payload;
      state.bookings.push(action.payload);
      localStorage.setItem('bookings', JSON.stringify(state.bookings));
      state.draft = getInitialDraft();
      localStorage.removeItem('bookingDraft');
    },
    cancelBooking(state, action: PayloadAction<string>) {
      const booking = state.bookings.find((b) => b.id === action.payload);
      if (booking) { booking.status = 'cancelled'; booking.updatedAt = new Date().toISOString(); localStorage.setItem('bookings', JSON.stringify(state.bookings)); }
      // also update myBookings
      const mb = state.myBookings.find((b) => b.id === action.payload);
      if (mb) mb.status = 'Cancelled';
    },
    updateBookingStatus(state, action: PayloadAction<{ id: string; status: Booking['status'] }>) {
      const booking = state.bookings.find((b) => b.id === action.payload.id);
      if (booking) { booking.status = action.payload.status; booking.updatedAt = new Date().toISOString(); localStorage.setItem('bookings', JSON.stringify(state.bookings)); }
    },
    setLoading(state, action: PayloadAction<boolean>) { state.isLoading = action.payload; },
    setError(state, action: PayloadAction<string | null>) { state.error = action.payload; },
    clearDraft(state) { state.draft = getInitialDraft(); localStorage.removeItem('bookingDraft'); },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyBookings.pending, (state) => { state.myBookingsLoading = true; state.myBookingsError = null; })
      .addCase(fetchMyBookings.fulfilled, (state, action) => { state.myBookings = action.payload; state.myBookingsLoading = false; state.myBookingsError = null; })
      .addCase(fetchMyBookings.rejected, (state, action) => { state.myBookingsLoading = false; state.myBookingsError = (action.payload as number) ?? 500; })
      .addCase(fetchBookingById.fulfilled, (state, action) => { state.currentApiBooking = action.payload; })
      .addCase(fetchAdminBookings.pending, (state) => { state.adminBookingsLoading = true; })
      .addCase(fetchAdminBookings.fulfilled, (state, action) => {
        state.adminBookings = action.payload.items;
        state.adminBookingsMeta = action.payload.meta;
        state.adminBookingsLoading = false;
      })
      .addCase(fetchAdminBookings.rejected, (state) => { state.adminBookingsLoading = false; });
  },
});

export const {
  startBooking, setDates, setGuests, setGuestInfo,
  setPaymentPlan, setPaymentMethod, applyPromo, setLoyaltyRedeem,
  setAddons, setPricing, setCurrentApiBooking, confirmBooking, cancelBooking,
  updateBookingStatus, setLoading, setError, clearDraft,
} = bookingSlice.actions;

export default bookingSlice.reducer;
