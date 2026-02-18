import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LocationCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

interface LocationState {
  currentLocation: LocationCoordinates | null;
  isTracking: boolean;
  isLocationEnabled: boolean;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  trackingHistory: {
    timestamp: string;
    location: LocationCoordinates;
  }[];
  workingArea: {
    center: LocationCoordinates | null;
    radius: number; // in kilometers
  };
  nearbyJobs: string[]; // job IDs within radius
  distanceToCurrentJob?: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: LocationState = {
  currentLocation: null,
  isTracking: false,
  isLocationEnabled: false,
  permissionStatus: 'undetermined',
  trackingHistory: [],
  workingArea: {
    center: null,
    radius: 10,
  },
  nearbyJobs: [],
  distanceToCurrentJob: undefined,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    // Location Updates
    setCurrentLocation: (state, action: PayloadAction<LocationCoordinates>) => {
      state.currentLocation = action.payload;
      state.lastUpdated = new Date().toISOString();
      
      // Add to tracking history if tracking is enabled
      if (state.isTracking) {
        state.trackingHistory.push({
          timestamp: state.lastUpdated,
          location: action.payload,
        });
        
        // Keep only last 100 locations to prevent memory issues
        if (state.trackingHistory.length > 100) {
          state.trackingHistory = state.trackingHistory.slice(-100);
        }
      }
    },

    // Permission Management
    setPermissionStatus: (state, action: PayloadAction<'granted' | 'denied' | 'undetermined'>) => {
      state.permissionStatus = action.payload;
      state.isLocationEnabled = action.payload === 'granted';
    },

    // Tracking Control
    startLocationTracking: (state) => {
      if (state.isLocationEnabled) {
        state.isTracking = true;
        state.trackingHistory = []; // Reset history when starting new tracking
      }
    },

    stopLocationTracking: (state) => {
      state.isTracking = false;
    },

    // Working Area Management
    setWorkingArea: (state, action: PayloadAction<{
      center: LocationCoordinates;
      radius: number;
    }>) => {
      state.workingArea = action.payload;
    },

    updateWorkingRadius: (state, action: PayloadAction<number>) => {
      state.workingArea.radius = action.payload;
    },

    // Nearby Jobs
    setNearbyJobs: (state, action: PayloadAction<string[]>) => {
      state.nearbyJobs = action.payload;
    },

    addNearbyJob: (state, action: PayloadAction<string>) => {
      if (!state.nearbyJobs.includes(action.payload)) {
        state.nearbyJobs.push(action.payload);
      }
    },

    removeNearbyJob: (state, action: PayloadAction<string>) => {
      state.nearbyJobs = state.nearbyJobs.filter(jobId => jobId !== action.payload);
    },

    // Distance Calculations
    setDistanceToCurrentJob: (state, action: PayloadAction<number>) => {
      state.distanceToCurrentJob = action.payload;
    },

    // Tracking History Management
    clearTrackingHistory: (state) => {
      state.trackingHistory = [];
    },

    addLocationToHistory: (state, action: PayloadAction<{
      timestamp: string;
      location: LocationCoordinates;
    }>) => {
      state.trackingHistory.push(action.payload);
      
      // Keep only last 100 locations
      if (state.trackingHistory.length > 100) {
        state.trackingHistory = state.trackingHistory.slice(-100);
      }
    },

    // Bulk location updates (for offline sync)
    syncLocationHistory: (state, action: PayloadAction<{
      timestamp: string;
      location: LocationCoordinates;
    }[]>) => {
      state.trackingHistory = [...state.trackingHistory, ...action.payload];
      
      // Sort by timestamp and keep only last 100
      state.trackingHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      if (state.trackingHistory.length > 100) {
        state.trackingHistory = state.trackingHistory.slice(-100);
      }
    },

    // Loading and Error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Reset state
    resetLocationState: () => initialState,

    // Emergency location clear (for privacy)
    clearAllLocationData: (state) => {
      state.currentLocation = null;
      state.trackingHistory = [];
      state.workingArea.center = null;
      state.isTracking = false;
      state.lastUpdated = null;
    },
  },
});

export const {
  setCurrentLocation,
  setPermissionStatus,
  startLocationTracking,
  stopLocationTracking,
  setWorkingArea,
  updateWorkingRadius,
  setNearbyJobs,
  addNearbyJob,
  removeNearbyJob,
  setDistanceToCurrentJob,
  clearTrackingHistory,
  addLocationToHistory,
  syncLocationHistory,
  setLoading,
  setError,
  resetLocationState,
  clearAllLocationData,
} = locationSlice.actions;

export default locationSlice.reducer;

// Selectors
export const selectCurrentLocation = (state: { location: LocationState }) => state.location.currentLocation;
export const selectIsTracking = (state: { location: LocationState }) => state.location.isTracking;
export const selectIsLocationEnabled = (state: { location: LocationState }) => state.location.isLocationEnabled;
export const selectPermissionStatus = (state: { location: LocationState }) => state.location.permissionStatus;
export const selectTrackingHistory = (state: { location: LocationState }) => state.location.trackingHistory;
export const selectWorkingArea = (state: { location: LocationState }) => state.location.workingArea;
export const selectNearbyJobs = (state: { location: LocationState }) => state.location.nearbyJobs;
export const selectDistanceToCurrentJob = (state: { location: LocationState }) => state.location.distanceToCurrentJob;
export const selectLocationLoading = (state: { location: LocationState }) => state.location.isLoading;
export const selectLocationError = (state: { location: LocationState }) => state.location.error;
export const selectLastLocationUpdate = (state: { location: LocationState }) => state.location.lastUpdated;