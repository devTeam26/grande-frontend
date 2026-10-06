import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AppNotification {
  id: string;
  type: 'new_booking' | 'booking_update';
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  read: boolean;
  createdAt: string;
  bookingId?: string;
}

interface NotificationState {
  items: AppNotification[];
  // snapshot used for change detection — NOT persisted
  lastBookingIds: string[];
  lastBookingStatuses: Record<string, string>;
}

function loadItems(): AppNotification[] {
  try { return JSON.parse(localStorage.getItem('notifications') || '[]') as AppNotification[]; } catch { return []; }
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: loadItems(),
    lastBookingIds: [] as string[],
    lastBookingStatuses: {} as Record<string, string>,
  } as NotificationState,
  reducers: {
    addNotification(state, action: PayloadAction<Omit<AppNotification, 'id' | 'read' | 'createdAt'>>) {
      const n: AppNotification = {
        ...action.payload,
        id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      state.items.unshift(n);
      if (state.items.length > 50) state.items = state.items.slice(0, 50);
      localStorage.setItem('notifications', JSON.stringify(state.items));
    },
    markRead(state, action: PayloadAction<string>) {
      const n = state.items.find((i) => i.id === action.payload);
      if (n) { n.read = true; localStorage.setItem('notifications', JSON.stringify(state.items)); }
    },
    markAllRead(state) {
      state.items.forEach((i) => { i.read = true; });
      localStorage.setItem('notifications', JSON.stringify(state.items));
    },
    clearAll(state) {
      state.items = [];
      localStorage.removeItem('notifications');
    },
    setLastBookingIds(state, action: PayloadAction<string[]>) {
      state.lastBookingIds = action.payload;
    },
    setLastBookingStatuses(state, action: PayloadAction<Record<string, string>>) {
      state.lastBookingStatuses = action.payload;
    },
  },
});

export const {
  addNotification, markRead, markAllRead, clearAll,
  setLastBookingIds, setLastBookingStatuses,
} = notificationSlice.actions;

export default notificationSlice.reducer;
