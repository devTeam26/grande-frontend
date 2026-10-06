import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types';
import { getLoyaltyTier } from '../../utils/pricing';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) ?? '';

async function safeJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try { return text ? (JSON.parse(text) as Record<string, unknown>) : {}; } catch { return {}; }
}

// ─── Shape of the user object returned by the API ───────────────────────────
interface ApiUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  preferredLanguage: string;
  loyaltyPoints: number;
  totalBookings: number;    // API uses totalBookings — frontend uses bookingsCount
  roles: string[];          // API returns array — frontend uses single role string
}

// ─── Shape of the full API response for register / login ────────────────────
interface AuthApiResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    user: ApiUser;
  };
  errors: string[];
}

// ─── Normalizes any role string the API might return → frontend UserRole ─────
function normalizeRole(raw: string): User['roles'] {
  const r = raw.toLowerCase().replace(/[-_\s]/g, '');
  if (r === 'admin' || r === 'superadmin' || r === 'manager' || r === 'staff') return 'admin';
  return 'user';
}

// ─── Maps the API user shape → frontend User type ───────────────────────────
function mapApiUserToUser(apiUser: ApiUser, preferredLanguage: string): User {
  return {
    id: apiUser.id,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    email: apiUser.email,
    phoneNumber: apiUser.phoneNumber,
    roles: normalizeRole(apiUser.roles?.[0] ?? 'user'),
    loyaltyPoints: apiUser.loyaltyPoints ?? 0,
    loyaltyTier: getLoyaltyTier(apiUser.loyaltyPoints ?? 0),
    totalSpent: 0,                                             // not in API response yet
    bookingsCount: apiUser.totalBookings ?? 0,                 // totalBookings → bookingsCount
    createdAt: new Date().toISOString(),                       // not in API response yet
    preferences: {
      language: (preferredLanguage as 'en' | 'ar') ?? 'en',
      notifications: { email: true, whatsapp: false, sms: false },
    },
    isActive: true,
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  error: string | null;
}

const storedUser = localStorage.getItem('auth_user');

const initialState: AuthState = {
  user: storedUser ? (JSON.parse(storedUser) as User) : null,
  isAuthenticated: !!storedUser,
  isGuest: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isGuest = false;
      state.isLoading = false;
      state.error = null;
      localStorage.setItem('auth_user', JSON.stringify(action.payload));
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.isGuest = false;
      state.error = null;
      localStorage.removeItem('auth_user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },
    continueAsGuest(state) {
      state.isGuest = true;
      state.isAuthenticated = false;
      state.user = null;
    },
    updateLoyaltyPoints(state, action: PayloadAction<number>) {
      if (state.user) {
        state.user.loyaltyPoints += action.payload;
        state.user.loyaltyTier = getLoyaltyTier(state.user.loyaltyPoints);
        localStorage.setItem('auth_user', JSON.stringify(state.user));
      }
    },
    clearError(state) {
      state.error = null;
    },
  },
});

// ─── REAL REGISTER THUNK ─────────────────────────────────────────────────────
// Calls POST /auth/register (change the path if your backend uses a different route)
// Request body matches the API schema exactly
export function registerWithAPI(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;       // mapped from the form's "phone" field
  preferredLanguage: string; // taken from current i18n language
}) {
  return async (dispatch: (a: PayloadAction<User | string | undefined>) => void) => {
    dispatch(authSlice.actions.loginStart());
    try {
      // ── PUT YOUR REGISTER ENDPOINT HERE ────────────────────────────────
      // Currently: POST https://api.grandebeach.com/auth/register
      // Change '/auth/register' to match your backend route exactly
      const response = await fetch(`${API_BASE}/api/Auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await safeJson(response) as Partial<AuthApiResponse>;

      if (!response.ok || !result.success) {
        const errorMsg = result.errors?.join(', ') || result.message || 'Registration failed';
        dispatch(authSlice.actions.loginFailure(errorMsg));
        return;
      }

      localStorage.setItem('access_token', result.data!.accessToken);
      localStorage.setItem('refresh_token', result.data!.refreshToken);

      const user = mapApiUserToUser(result.data!.user, payload.preferredLanguage);
      dispatch(authSlice.actions.loginSuccess(user));

    } catch {
      dispatch(authSlice.actions.loginFailure('Registration failed. Please try again.'));
    }
  };
}

export function loginWithAPI(payload: {
  email: string;
  password: string;
}) {
  return async (dispatch: (a: PayloadAction<User | string | undefined>) => void) => {
    dispatch(authSlice.actions.loginStart());
    try {
      const response = await fetch(`${API_BASE}/api/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await safeJson(response) as Partial<AuthApiResponse>;

      if (!response.ok || !result.success) {
        const errorMsg = result.errors?.join(', ') || result.message || 'Invalid email or password';
        dispatch(authSlice.actions.loginFailure(errorMsg));
        return;
      }

      localStorage.setItem('access_token', result.data!.accessToken);
      localStorage.setItem('refresh_token', result.data!.refreshToken);

      const user = mapApiUserToUser(result.data!.user, result.data!.user.preferredLanguage);
      dispatch(authSlice.actions.loginSuccess(user));

    } catch {
      dispatch(authSlice.actions.loginFailure('Login failed. Please try again.'));
    }
  };
}
export const { loginStart, loginSuccess, loginFailure, logout, continueAsGuest, updateLoyaltyPoints, clearError } = authSlice.actions;

// ─── LOGOUT THUNK ─────────────────────────────────────────────────────────────
// POST /api/Auth/logout — invalidates the token server-side, then clears local state
export function logoutWithAPI() {
  return async (dispatch: (a: ReturnType<typeof authSlice.actions.logout>) => void) => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await fetch(`${API_BASE}/api/Auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
      }
    } catch { /* silent — always clear local state even if API fails */ }
    dispatch(authSlice.actions.logout());
  };
}

// ─── UPDATE PROFILE THUNK ────────────────────────────────────────────────────
// PUT /api/Auth/profile
export function updateProfile(payload: {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  preferredLanguage: string;
}) {
  return async (dispatch: (a: ReturnType<typeof authSlice.actions.loginSuccess | typeof authSlice.actions.loginFailure>) => void) => {
    const token = localStorage.getItem('access_token');
    if (!token) return { success: false, message: 'Not authenticated' };
    try {
      const response = await fetch(`${API_BASE}/api/Auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const result = await safeJson(response) as { success?: boolean; message?: string; data?: ApiUser; errors?: string[] };
      if (!response.ok || !result.success) return { success: false, message: result.errors?.join(', ') || result.message || 'Update failed' };
      const user = mapApiUserToUser(result.data!, payload.preferredLanguage);
      dispatch(authSlice.actions.loginSuccess(user));
      return { success: true };
    } catch {
      return { success: false, message: 'Update failed. Please try again.' };
    }
  };
}

// ─── CHANGE PASSWORD THUNK ────────────────────────────────────────────────────
// POST /api/Auth/change-password
export async function changePassword(payload: { currentPassword: string; newPassword: string }) {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE}/api/Auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const result = await safeJson(response) as { success?: boolean; message?: string; errors?: string[] };
    return { success: response.ok && Boolean(result.success), message: result.errors?.join(', ') || result.message || '' };
  } catch {
    return { success: false, message: 'Password change failed. Please try again.' };
  }
}

// ─── FORGOT PASSWORD THUNK ────────────────────────────────────────────────────
// POST /api/Auth/forgot-password
export async function forgotPassword(email: string) {
  try {
    const response = await fetch(`${API_BASE}/api/Auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const result = await safeJson(response) as { success?: boolean; message?: string };
    return { success: response.ok && Boolean(result.success), message: result.message || '' };
  } catch {
    return { success: false, message: 'Request failed. Please try again.' };
  }
}

// ─── RESET PASSWORD THUNK ─────────────────────────────────────────────────────
// POST /api/Auth/reset-password
export async function resetPassword(payload: { email: string; token: string; newPassword: string }) {
  try {
    const response = await fetch(`${API_BASE}/api/Auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await safeJson(response) as { success?: boolean; message?: string; errors?: string[] };
    return { success: response.ok && Boolean(result.success), message: result.errors?.join(', ') || result.message || '' };
  } catch {
    return { success: false, message: 'Password reset failed. Please try again.' };
  }
}

// ─── FETCH PROFILE THUNK ─────────────────────────────────────────────────────
// GET /api/Auth/profile — requires Bearer token in Authorization header
export async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE}/api/Auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const json = await safeJson(res) as { success?: boolean; data?: { accessToken?: string; refreshToken?: string } };
    if (json.success && json.data?.accessToken) {
      localStorage.setItem('access_token', json.data.accessToken);
      if (json.data.refreshToken) localStorage.setItem('refresh_token', json.data.refreshToken);
      return json.data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

export function fetchProfile() {
  return async (dispatch: (a: ReturnType<typeof authSlice.actions.loginSuccess | typeof authSlice.actions.loginFailure>) => void) => {
    let token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      let response = await fetch(`${API_BASE}/api/Auth/profile`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 401) {
        token = await tryRefreshToken();
        if (!token) return;
        response = await fetch(`${API_BASE}/api/Auth/profile`, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
      }
      if (!response.ok) return;
      const result = await safeJson(response) as { success?: boolean; data?: ApiUser };
      if (!result.success || !result.data) return;
      const user = mapApiUserToUser(result.data, result.data.preferredLanguage);
      dispatch(authSlice.actions.loginSuccess(user));
    } catch {
      // silently fail — the cached user from localStorage is still shown
    }
  };
}

export default authSlice.reducer;
