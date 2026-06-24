import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types';
import { mockUsers, DEMO_CREDENTIALS } from '../../data/mockUsers';
import { getLoyaltyTier } from '../../utils/pricing';

// ─── API BASE URL ────────────────────────────────────────────────────────────
// Reads from .env → VITE_API_BASE_URL=https://api.grandebeach.com/
// Make sure your .env file has this variable set before connecting to the backend
const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

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

// ─── Maps the API user shape → frontend User type ───────────────────────────
function mapApiUserToUser(apiUser: ApiUser, preferredLanguage: string): User {
  return {
    id: apiUser.id,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    email: apiUser.email,
    phoneNumber: apiUser.phoneNumber,                          // same field name now
    roles: (apiUser.roles?.[0] ?? 'user') as User['roles'],   // API array → single value
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

      const result: AuthApiResponse = await response.json();

      if (!response.ok || !result.success) {
        // API returns errors as an array — join them or show the message field
        const errorMsg = result.errors?.join(', ') || result.message || 'Registration failed';
        dispatch(authSlice.actions.loginFailure(errorMsg));
        return;
      }

      // ── SAVE TOKENS TO localStorage ─────────────────────────────────────
      // accessToken is used in Authorization header for future API calls
      // refreshToken is used to get a new accessToken when it expires
      localStorage.setItem('access_token', result.data.accessToken);
      localStorage.setItem('refresh_token', result.data.refreshToken);

      // ── MAP API USER → FRONTEND USER TYPE & SAVE SESSION ────────────────
      const user = mapApiUserToUser(result.data.user, payload.preferredLanguage);
      dispatch(authSlice.actions.loginSuccess(user));

    } catch {
      dispatch(authSlice.actions.loginFailure('Network error. Please try again.'));
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

      const result: AuthApiResponse = await response.json();

      // ── DEBUG: remove this after confirming tokens appear in localStorage ──
      console.log('[loginWithAPI] HTTP status:', response.status);
      console.log('[loginWithAPI] Full response:', result);
      console.log('[loginWithAPI] accessToken:', result.data?.accessToken);
      console.log('[loginWithAPI] refreshToken:', result.data?.refreshToken);

      if (!response.ok || !result.success) {
        const errorMsg = result.errors?.join(', ') || result.message || 'login failed';
        dispatch(authSlice.actions.loginFailure(errorMsg));
        return;
      }

      localStorage.setItem('access_token', result.data.accessToken);
      localStorage.setItem('refresh_token', result.data.refreshToken);

      // ── MAP API USER → FRONTEND USER TYPE & SAVE SESSION ────────────────
      // preferredLanguage comes from the API response, not the login payload
      const user = mapApiUserToUser(result.data.user, result.data.user.preferredLanguage);
      dispatch(authSlice.actions.loginSuccess(user));

    } catch {
      dispatch(authSlice.actions.loginFailure('Network error. Please try again.'));
    }
  };
}
// ─── DEMO LOGIN (mock — keep until real login endpoint is ready) ──────────────
export function loginWithCredentials(email: string, password: string) {
  return (dispatch: (action: ReturnType<typeof authSlice.actions.loginStart | typeof authSlice.actions.loginSuccess | typeof authSlice.actions.loginFailure>) => void) => {
    dispatch(authSlice.actions.loginStart());
    setTimeout(() => {
      const entry = Object.values(DEMO_CREDENTIALS).find((c) => c.email === email && c.password === password);
      if (entry) {
        const user = mockUsers.find((u) => u.email === email);
        if (user) {
          dispatch(authSlice.actions.loginSuccess(user));
        } else {
          dispatch(authSlice.actions.loginFailure('User not found'));
        }
      } else {
        dispatch(authSlice.actions.loginFailure('Invalid email or password'));
      }
    }, 800);
  };
}

export const { loginStart, loginSuccess, loginFailure, logout, continueAsGuest, updateLoyaltyPoints, clearError } = authSlice.actions;
export default authSlice.reducer;
