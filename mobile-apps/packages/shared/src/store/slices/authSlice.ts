import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, AuthTokens, User, BiometricAuthConfig } from '../../types';

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  tokens: null,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Authentication actions
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    
    loginSuccess: (state, action: PayloadAction<{ user: User; tokens: AuthTokens }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.tokens = action.payload.tokens;
      state.error = null;
    },
    
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.tokens = null;
      state.error = action.payload;
    },

    // Registration actions
    registerStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    
    registerSuccess: (state, action: PayloadAction<{ user: User; tokens: AuthTokens }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.tokens = action.payload.tokens;
      state.error = null;
    },
    
    registerFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.tokens = null;
      state.error = action.payload;
    },

    // Token management
    setTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.tokens = action.payload;
      state.isAuthenticated = true;
    },

    refreshTokenStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    refreshTokenSuccess: (state, action: PayloadAction<AuthTokens>) => {
      state.isLoading = false;
      state.tokens = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },

    refreshTokenFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.tokens = null;
      state.error = action.payload;
    },

    // User profile updates
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    // Logout
    logout: (state) => {
      state.isAuthenticated = false;
      state.isLoading = false;
      state.user = null;
      state.tokens = null;
      state.error = null;
    },

    // Error management
    clearError: (state) => {
      state.error = null;
    },

    // Loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Hydrate from storage
    hydrateAuth: (state, action: PayloadAction<{ user: User; tokens: AuthTokens }>) => {
      if (action.payload.tokens && action.payload.user) {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
      }
    },

    // Reset state
    resetAuthState: () => initialState,
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  setTokens,
  refreshTokenStart,
  refreshTokenSuccess,
  refreshTokenFailure,
  updateUserProfile,
  logout,
  clearError,
  setLoading,
  hydrateAuth,
  resetAuthState,
} = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectTokens = (state: { auth: AuthState }) => state.auth.tokens;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;