import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Booking, GuestInfo, PaymentMethod, PaymentPlan, PricingBreakdown } from '../../types';

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
  pricing: PricingBreakdown | null;
}

interface BookingState {
  draft: BookingDraft;
  bookings: Booking[];
  currentBooking: Booking | null;
  isLoading: boolean;
  error: string | null;
}

const getInitialDraft = (): BookingDraft => {
  try {
    const saved = localStorage.getItem('bookingDraft');
    if (saved) {
      return JSON.parse(saved) as BookingDraft;
    }
  } catch (e) {
    console.error('Failed to load booking draft from localStorage:', e);
  }
  
  return {
    chaletId: null,
    checkIn: null,
    checkOut: null,
    guests: 2,
    guestInfo: {},
    paymentPlan: 'full',
    paymentMethod: null,
    promoCode: null,
    promoDiscount: 0,
    loyaltyPointsToRedeem: 0,
    pricing: null,
  };
};

const initialState: BookingState = {
  draft: getInitialDraft(),
  bookings: JSON.parse(localStorage.getItem('bookings') || '[]') as Booking[],
  currentBooking: null,
  isLoading: false,
  error: null,
};

const saveDraftToLocalStorage = (draft: BookingDraft) => {
  try {
    localStorage.setItem('bookingDraft', JSON.stringify(draft));
  } catch (e) {
    console.error('Failed to save booking draft to localStorage:', e);
  }
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    startBooking(state, action: PayloadAction<{ chaletId: string; checkIn?: string; checkOut?: string; guests?: number }>) {
      state.draft = {
        ...state.draft,
        chaletId: action.payload.chaletId,
        checkIn: action.payload.checkIn ?? null,
        checkOut: action.payload.checkOut ?? null,
        guests: action.payload.guests ?? 2,
      };
      saveDraftToLocalStorage(state.draft);
    },
    setDates(state, action: PayloadAction<{ checkIn: string; checkOut: string }>) {
      state.draft.checkIn = action.payload.checkIn;
      state.draft.checkOut = action.payload.checkOut;
      saveDraftToLocalStorage(state.draft);
    },
    setGuests(state, action: PayloadAction<number>) {
      state.draft.guests = action.payload;
      saveDraftToLocalStorage(state.draft);
    },
    setGuestInfo(state, action: PayloadAction<Partial<GuestInfo>>) {
      state.draft.guestInfo = { ...state.draft.guestInfo, ...action.payload };
      saveDraftToLocalStorage(state.draft);
    },
    setPaymentPlan(state, action: PayloadAction<PaymentPlan>) {
      state.draft.paymentPlan = action.payload;
      saveDraftToLocalStorage(state.draft);
    },
    setPaymentMethod(state, action: PayloadAction<PaymentMethod>) {
      state.draft.paymentMethod = action.payload;
      saveDraftToLocalStorage(state.draft);
    },
    applyPromo(state, action: PayloadAction<{ code: string; discount: number }>) {
      state.draft.promoCode = action.payload.code;
      state.draft.promoDiscount = action.payload.discount;
      saveDraftToLocalStorage(state.draft);
    },
    setLoyaltyRedeem(state, action: PayloadAction<number>) {
      state.draft.loyaltyPointsToRedeem = action.payload;
      saveDraftToLocalStorage(state.draft);
    },
    setPricing(state, action: PayloadAction<PricingBreakdown | null>) {
      state.draft.pricing = action.payload;
      saveDraftToLocalStorage(state.draft);
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
      if (booking) {
        booking.status = 'cancelled';
        booking.updatedAt = new Date().toISOString();
        localStorage.setItem('bookings', JSON.stringify(state.bookings));
      }
    },
    updateBookingStatus(state, action: PayloadAction<{ id: string; status: Booking['status'] }>) {
      const booking = state.bookings.find((b) => b.id === action.payload.id);
      if (booking) {
        booking.status = action.payload.status;
        booking.updatedAt = new Date().toISOString();
        localStorage.setItem('bookings', JSON.stringify(state.bookings));
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearDraft(state) {
      state.draft = getInitialDraft();
      localStorage.removeItem('bookingDraft');
    },
  },
});

export const {
  startBooking, setDates, setGuests, setGuestInfo,
  setPaymentPlan, setPaymentMethod, applyPromo, setLoyaltyRedeem,
  setPricing, confirmBooking, cancelBooking, updateBookingStatus,
  setLoading, setError, clearDraft,
} = bookingSlice.actions;

export default bookingSlice.reducer;
