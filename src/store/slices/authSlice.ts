import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types';
import { mockUsers, DEMO_CREDENTIALS } from '../../data/mockUsers';
import { getLoyaltyTier } from '../../utils/pricing';

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

// Thunk-like action for demo login
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
