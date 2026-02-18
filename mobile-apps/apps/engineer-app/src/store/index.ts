import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';

// Engineer-specific reducers
import engineerReducer from './slices/engineerSlice';
import jobsReducer from './slices/jobsSlice';
import locationReducer from './slices/locationSlice';

// Import auth reducer directly
import authReducer from './slices/authSlice';

// Create engineer-specific store
const engineerPersistConfig = {
  key: 'engineer-app',
  storage: AsyncStorage,
  whitelist: ['auth', 'engineer', 'jobs', 'location'],
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  engineer: engineerReducer,
  jobs: jobsReducer,
  location: locationReducer,
});

const persistedReducer = persistReducer(engineerPersistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;