import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, Address } from '../../types';

interface UserState {
  profile: User | null;
  addresses: Address[];
  preferences: {
    notifications: boolean;
    marketing: boolean;
    sms: boolean;
    email: boolean;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  addresses: [],
  preferences: {
    notifications: true,
    marketing: false,
    sms: true,
    email: true,
  },
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<User>) => {
      state.profile = action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    setAddresses: (state, action: PayloadAction<Address[]>) => {
      state.addresses = action.payload;
    },
    addAddress: (state, action: PayloadAction<Address>) => {
      state.addresses.push(action.payload);
    },
    updateAddress: (state, action: PayloadAction<Address>) => {
      const index = state.addresses.findIndex(addr => addr.id === action.payload.id);
      if (index !== -1) {
        state.addresses[index] = action.payload;
      }
    },
    removeAddress: (state, action: PayloadAction<string>) => {
      state.addresses = state.addresses.filter(addr => addr.id !== action.payload);
    },
    updatePreferences: (state, action: PayloadAction<Partial<UserState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetUserState: () => initialState,
  },
});

export const {
  setProfile,
  updateProfile,
  setAddresses,
  addAddress,
  updateAddress,
  removeAddress,
  updatePreferences,
  setLoading,
  setError,
  resetUserState,
} = userSlice.actions;

export default userSlice.reducer;