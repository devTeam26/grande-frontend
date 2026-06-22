import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PricingRule, Promotion, User } from '../../types';
import { pricingRules as initialRules } from '../../data/pricingRules';
import { promotions as initialPromos } from '../../data/promotions';
import { mockUsers } from '../../data/mockUsers';

interface AdminState {
  pricingRules: PricingRule[];
  promotions: Promotion[];
  users: User[];
  isLoading: boolean;
}

const initialState: AdminState = {
  pricingRules: initialRules,
  promotions: initialPromos,
  users: mockUsers,
  isLoading: false,
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
    toggleUserActive(state, action: PayloadAction<string>) {
      const user = state.users.find((u) => u.id === action.payload);
      if (user) user.isActive = !user.isActive;
    },
    addUser(state, action: PayloadAction<User>) {
      state.users.push(action.payload);
    },
  },
});

export const {
  togglePricingRule, updatePricingRule, addPricingRule, deletePricingRule,
  togglePromotion, addPromotion, deletePromotion,
  toggleUserActive, addUser,
} = adminSlice.actions;

export default adminSlice.reducer;
