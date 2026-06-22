import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Language } from '../../types';

interface UIState {
  language: Language;
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
}

const initialState: UIState = {
  language: (localStorage.getItem('lang') as Language) || 'en',
  isMobileMenuOpen: false,
  isSearchOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<Language>) {
      state.language = action.payload;
    },
    toggleMobileMenu(state) {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    closeMobileMenu(state) {
      state.isMobileMenuOpen = false;
    },
    toggleSearch(state) {
      state.isSearchOpen = !state.isSearchOpen;
    },
  },
});

export const { setLanguage, toggleMobileMenu, closeMobileMenu, toggleSearch } = uiSlice.actions;
export default uiSlice.reducer;
