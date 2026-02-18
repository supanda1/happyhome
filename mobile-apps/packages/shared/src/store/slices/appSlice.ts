import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  isOnboardingCompleted: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notificationsEnabled: boolean;
  biometricAuthEnabled: boolean;
  locationPermissionGranted: boolean;
  isOffline: boolean;
  lastSyncTime: string | null;
  appVersion: string;
  buildNumber: string;
  firstLaunch: boolean;
  debugMode: boolean;
}

const initialState: AppState = {
  isOnboardingCompleted: false,
  theme: 'system',
  language: 'en',
  notificationsEnabled: true,
  biometricAuthEnabled: false,
  locationPermissionGranted: false,
  isOffline: false,
  lastSyncTime: null,
  appVersion: '1.0.0',
  buildNumber: '1',
  firstLaunch: true,
  debugMode: __DEV__,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    completeOnboarding: (state) => {
      state.isOnboardingCompleted = true;
      state.firstLaunch = false;
    },

    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },

    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },

    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notificationsEnabled = action.payload;
    },

    setBiometricAuthEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricAuthEnabled = action.payload;
    },

    setLocationPermission: (state, action: PayloadAction<boolean>) => {
      state.locationPermissionGranted = action.payload;
    },

    setOfflineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOffline = action.payload;
    },

    updateSyncTime: (state) => {
      state.lastSyncTime = new Date().toISOString();
    },

    setAppVersion: (state, action: PayloadAction<{ version: string; build: string }>) => {
      state.appVersion = action.payload.version;
      state.buildNumber = action.payload.build;
    },

    setDebugMode: (state, action: PayloadAction<boolean>) => {
      state.debugMode = action.payload;
    },

    resetAppState: () => initialState,
  },
});

export const {
  completeOnboarding,
  setTheme,
  setLanguage,
  setNotificationsEnabled,
  setBiometricAuthEnabled,
  setLocationPermission,
  setOfflineStatus,
  updateSyncTime,
  setAppVersion,
  setDebugMode,
  resetAppState,
} = appSlice.actions;

export default appSlice.reducer;