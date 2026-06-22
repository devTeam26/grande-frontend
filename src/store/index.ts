import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';
import chaletsReducer from './slices/chaletsSlice';
import bookingReducer from './slices/bookingSlice';
import adminReducer from './slices/adminSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    chalets: chaletsReducer,
    booking: bookingReducer,
    admin: adminReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
