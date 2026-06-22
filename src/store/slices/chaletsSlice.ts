import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Chalet, ChaletFilters, ChaletType } from '../../types';
import { chalets as allChalets } from '../../data/chalets';

interface ChaletsState {
  chalets: Chalet[];
  selectedChalet: Chalet | null;
  filters: ChaletFilters;
  isLoading: boolean;
}

const initialState: ChaletsState = {
  chalets: allChalets,
  selectedChalet: null,
  filters: {
    type: 'all',
    minPrice: 0,
    maxPrice: 5000,
    guests: 1,
    checkIn: null,
    checkOut: null,
    amenities: [],
    sortBy: 'featured',
  },
  isLoading: false,
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
        maxPrice: 5000,
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
});

export const { setSelectedChalet, clearSelectedChalet, setFilter, resetFilters, toggleChaletAvailability, updateChaletBasePrice } = chaletsSlice.actions;

export function selectFilteredChalets(state: { chalets: ChaletsState }) {
  const { chalets, filters } = state.chalets;
  let result = chalets.filter((c) => {
    if (!c.isAvailable) return false;
    if (filters.type !== 'all' && c.type !== (filters.type as ChaletType)) return false;
    if (c.basePrice < filters.minPrice || c.basePrice > filters.maxPrice) return false;
    if (c.maxGuests < filters.guests) return false;
    if (filters.amenities.length > 0 && !filters.amenities.every((a) => c.amenities.includes(a))) return false;
    return true;
  });

  if (filters.sortBy === 'price_asc') result = [...result].sort((a, b) => a.basePrice - b.basePrice);
  else if (filters.sortBy === 'price_desc') result = [...result].sort((a, b) => b.basePrice - a.basePrice);
  else if (filters.sortBy === 'rating') result = [...result].sort((a, b) => b.rating - a.rating);
  else result = [...result].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  return result;
}

export default chaletsSlice.reducer;
