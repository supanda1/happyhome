import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query/react';
import { persistStore, persistReducer } from 'redux-persist';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API slice
import { apiSlice } from './api/apiSlice';

// Feature slices
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import bookingReducer from './slices/bookingSlice';
import userReducer from './slices/userSlice';
import appReducer from './slices/appSlice';
import notificationReducer from './slices/notificationSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'cart', 'user', 'app'], // Only persist these slices
  blacklist: ['api'], // Don't persist API cache
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  booking: bookingReducer,
  user: userReducer,
  app: appReducer,
  notifications: notificationReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create persistor
export const persistor = persistStore(store);

// Setup RTK Query listeners
setupListeners(store.dispatch);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Reset store function
export const resetStore = () => {
  persistor.purge();
  store.dispatch({ type: 'RESET_STORE' });
};