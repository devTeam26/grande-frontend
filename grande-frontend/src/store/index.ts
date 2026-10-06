import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';
import chaletsReducer from './slices/chaletsSlice';
import bookingReducer from './slices/bookingSlice';
import adminReducer from './slices/adminSlice';
import addonsReducer from './slices/addonsSlice';
import notificationsReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    chalets: chaletsReducer,
    booking: bookingReducer,
    admin: adminReducer,
    addons: addonsReducer,
    notifications: notificationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
