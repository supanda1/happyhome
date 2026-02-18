import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface EngineerProfile {
  id: string;
  employee_id: string;
  skills: string[];
  experience_years: number;
  rating: number;
  total_jobs: number;
  is_available: boolean;
  shift_start?: string;
  shift_end?: string;
  documents: EngineerDocument[];
}

interface EngineerDocument {
  id: string;
  type: string;
  url: string;
  is_verified: boolean;
  verified_at?: string;
}

interface EngineerStats {
  todayJobs: number;
  weeklyJobs: number;
  monthlyEarnings: number;
  totalEarnings: number;
  averageRating: number;
  completionRate: number;
}

interface EngineerState {
  profile: EngineerProfile | null;
  stats: EngineerStats;
  isAvailable: boolean;
  currentShift: {
    started: boolean;
    startTime?: string;
    endTime?: string;
  };
  preferences: {
    autoAcceptJobs: boolean;
    maxJobsPerDay: number;
    preferredRadius: number;
    workingDays: string[];
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: EngineerState = {
  profile: null,
  stats: {
    todayJobs: 0,
    weeklyJobs: 0,
    monthlyEarnings: 0,
    totalEarnings: 0,
    averageRating: 0,
    completionRate: 0,
  },
  isAvailable: false,
  currentShift: {
    started: false,
  },
  preferences: {
    autoAcceptJobs: false,
    maxJobsPerDay: 8,
    preferredRadius: 10,
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  isLoading: false,
  error: null,
};

const engineerSlice = createSlice({
  name: 'engineer',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<EngineerProfile>) => {
      state.profile = action.payload;
      state.isAvailable = action.payload.is_available;
    },

    updateProfile: (state, action: PayloadAction<Partial<EngineerProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },

    setStats: (state, action: PayloadAction<EngineerStats>) => {
      state.stats = action.payload;
    },

    updateStats: (state, action: PayloadAction<Partial<EngineerStats>>) => {
      state.stats = { ...state.stats, ...action.payload };
    },

    setAvailability: (state, action: PayloadAction<boolean>) => {
      state.isAvailable = action.payload;
      if (state.profile) {
        state.profile.is_available = action.payload;
      }
    },

    startShift: (state) => {
      state.currentShift = {
        started: true,
        startTime: new Date().toISOString(),
      };
      state.isAvailable = true;
    },

    endShift: (state) => {
      state.currentShift = {
        started: false,
        startTime: state.currentShift.startTime,
        endTime: new Date().toISOString(),
      };
      state.isAvailable = false;
    },

    updatePreferences: (state, action: PayloadAction<Partial<EngineerState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },

    addDocument: (state, action: PayloadAction<EngineerDocument>) => {
      if (state.profile) {
        state.profile.documents.push(action.payload);
      }
    },

    updateDocument: (state, action: PayloadAction<EngineerDocument>) => {
      if (state.profile) {
        const index = state.profile.documents.findIndex(doc => doc.id === action.payload.id);
        if (index !== -1) {
          state.profile.documents[index] = action.payload;
        }
      }
    },

    removeDocument: (state, action: PayloadAction<string>) => {
      if (state.profile) {
        state.profile.documents = state.profile.documents.filter(doc => doc.id !== action.payload);
      }
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    resetEngineerState: () => initialState,
  },
});

export const {
  setProfile,
  updateProfile,
  setStats,
  updateStats,
  setAvailability,
  startShift,
  endShift,
  updatePreferences,
  addDocument,
  updateDocument,
  removeDocument,
  setLoading,
  setError,
  resetEngineerState,
} = engineerSlice.actions;

export default engineerSlice.reducer;

// Selectors
export const selectEngineerProfile = (state: { engineer: EngineerState }) => state.engineer.profile;
export const selectEngineerStats = (state: { engineer: EngineerState }) => state.engineer.stats;
export const selectIsAvailable = (state: { engineer: EngineerState }) => state.engineer.isAvailable;
export const selectCurrentShift = (state: { engineer: EngineerState }) => state.engineer.currentShift;
export const selectEngineerPreferences = (state: { engineer: EngineerState }) => state.engineer.preferences;
export const selectEngineerLoading = (state: { engineer: EngineerState }) => state.engineer.isLoading;
export const selectEngineerError = (state: { engineer: EngineerState }) => state.engineer.error;