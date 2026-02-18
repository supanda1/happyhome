import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface JobLocation {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  pincode: string;
}

interface JobCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  rating?: number;
}

interface JobService {
  id: string;
  name: string;
  category: string;
  estimated_duration: number;
  price: number;
}

interface Job {
  id: string;
  booking_id: string;
  order_id: string;
  customer: JobCustomer;
  service: JobService;
  location: JobLocation;
  scheduled_at: string;
  status: 'pending' | 'accepted' | 'started' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  special_instructions?: string;
  estimated_duration: number;
  actual_start_time?: string;
  actual_end_time?: string;
  completion_notes?: string;
  images_before?: string[];
  images_after?: string[];
  payment_status: 'pending' | 'completed';
  amount: number;
  distance?: number; // in kilometers
  created_at: string;
  updated_at: string;
}

interface JobsState {
  availableJobs: Job[];
  assignedJobs: Job[];
  currentJob: Job | null;
  completedJobs: Job[];
  jobHistory: Job[];
  filters: {
    radius: number;
    categories: string[];
    minPayment: number;
    sortBy: 'distance' | 'payment' | 'time' | 'priority';
  };
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

const initialState: JobsState = {
  availableJobs: [],
  assignedJobs: [],
  currentJob: null,
  completedJobs: [],
  jobHistory: [],
  filters: {
    radius: 10,
    categories: [],
    minPayment: 0,
    sortBy: 'distance',
  },
  isLoading: false,
  error: null,
  lastFetched: null,
};

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    // Available Jobs
    setAvailableJobs: (state, action: PayloadAction<Job[]>) => {
      state.availableJobs = action.payload;
      state.lastFetched = new Date().toISOString();
    },

    addAvailableJob: (state, action: PayloadAction<Job>) => {
      const existingIndex = state.availableJobs.findIndex(job => job.id === action.payload.id);
      if (existingIndex === -1) {
        state.availableJobs.unshift(action.payload);
      }
    },

    removeAvailableJob: (state, action: PayloadAction<string>) => {
      state.availableJobs = state.availableJobs.filter(job => job.id !== action.payload);
    },

    // Assigned Jobs
    setAssignedJobs: (state, action: PayloadAction<Job[]>) => {
      state.assignedJobs = action.payload;
    },

    acceptJob: (state, action: PayloadAction<Job>) => {
      const job = { ...action.payload, status: 'accepted' as const };
      
      // Remove from available jobs
      state.availableJobs = state.availableJobs.filter(j => j.id !== job.id);
      
      // Add to assigned jobs
      const existingIndex = state.assignedJobs.findIndex(j => j.id === job.id);
      if (existingIndex === -1) {
        state.assignedJobs.push(job);
      } else {
        state.assignedJobs[existingIndex] = job;
      }
    },

    rejectJob: (state, action: PayloadAction<string>) => {
      const jobId = action.payload;
      state.availableJobs = state.availableJobs.filter(job => job.id !== jobId);
    },

    // Current Job Management
    setCurrentJob: (state, action: PayloadAction<Job | null>) => {
      state.currentJob = action.payload;
    },

    startJob: (state, action: PayloadAction<string>) => {
      const jobId = action.payload;
      const job = state.assignedJobs.find(j => j.id === jobId);
      
      if (job) {
        job.status = 'started';
        job.actual_start_time = new Date().toISOString();
        state.currentJob = job;
      }
    },

    updateJobProgress: (state, action: PayloadAction<{
      jobId: string;
      updates: Partial<Job>;
    }>) => {
      const { jobId, updates } = action.payload;
      
      // Update in assigned jobs
      const assignedJobIndex = state.assignedJobs.findIndex(job => job.id === jobId);
      if (assignedJobIndex !== -1) {
        state.assignedJobs[assignedJobIndex] = { ...state.assignedJobs[assignedJobIndex], ...updates };
      }
      
      // Update current job if it matches
      if (state.currentJob?.id === jobId) {
        state.currentJob = { ...state.currentJob, ...updates };
      }
    },

    completeJob: (state, action: PayloadAction<{
      jobId: string;
      completionData: {
        completion_notes?: string;
        images_after?: string[];
        actual_end_time: string;
      };
    }>) => {
      const { jobId, completionData } = action.payload;
      const jobIndex = state.assignedJobs.findIndex(job => job.id === jobId);
      
      if (jobIndex !== -1) {
        const completedJob = {
          ...state.assignedJobs[jobIndex],
          ...completionData,
          status: 'completed' as const,
        };
        
        // Remove from assigned jobs
        state.assignedJobs.splice(jobIndex, 1);
        
        // Add to completed jobs
        state.completedJobs.unshift(completedJob);
        
        // Clear current job if it matches
        if (state.currentJob?.id === jobId) {
          state.currentJob = null;
        }
      }
    },

    cancelJob: (state, action: PayloadAction<{
      jobId: string;
      reason: string;
    }>) => {
      const { jobId, reason } = action.payload;
      
      // Remove from assigned jobs
      const jobIndex = state.assignedJobs.findIndex(job => job.id === jobId);
      if (jobIndex !== -1) {
        const cancelledJob = {
          ...state.assignedJobs[jobIndex],
          status: 'cancelled' as const,
          completion_notes: reason,
        };
        
        state.assignedJobs.splice(jobIndex, 1);
        state.jobHistory.unshift(cancelledJob);
      }
      
      // Clear current job if it matches
      if (state.currentJob?.id === jobId) {
        state.currentJob = null;
      }
    },

    // Job History
    setJobHistory: (state, action: PayloadAction<Job[]>) => {
      state.jobHistory = action.payload;
    },

    addToHistory: (state, action: PayloadAction<Job>) => {
      state.jobHistory.unshift(action.payload);
    },

    // Filters
    updateFilters: (state, action: PayloadAction<Partial<JobsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    resetFilters: (state) => {
      state.filters = initialState.filters;
    },

    // Loading and Error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Reset state
    resetJobsState: () => initialState,

    // Batch updates
    syncJobs: (state, action: PayloadAction<{
      available: Job[];
      assigned: Job[];
      completed: Job[];
    }>) => {
      const { available, assigned, completed } = action.payload;
      state.availableJobs = available;
      state.assignedJobs = assigned;
      state.completedJobs = completed;
      state.lastFetched = new Date().toISOString();
    },
  },
});

export const {
  setAvailableJobs,
  addAvailableJob,
  removeAvailableJob,
  setAssignedJobs,
  acceptJob,
  rejectJob,
  setCurrentJob,
  startJob,
  updateJobProgress,
  completeJob,
  cancelJob,
  setJobHistory,
  addToHistory,
  updateFilters,
  resetFilters,
  setLoading,
  setError,
  resetJobsState,
  syncJobs,
} = jobsSlice.actions;

export default jobsSlice.reducer;

// Selectors
export const selectAvailableJobs = (state: { jobs: JobsState }) => state.jobs.availableJobs;
export const selectAssignedJobs = (state: { jobs: JobsState }) => state.jobs.assignedJobs;
export const selectCurrentJob = (state: { jobs: JobsState }) => state.jobs.currentJob;
export const selectCompletedJobs = (state: { jobs: JobsState }) => state.jobs.completedJobs;
export const selectJobHistory = (state: { jobs: JobsState }) => state.jobs.jobHistory;
export const selectJobFilters = (state: { jobs: JobsState }) => state.jobs.filters;
export const selectJobsLoading = (state: { jobs: JobsState }) => state.jobs.isLoading;
export const selectJobsError = (state: { jobs: JobsState }) => state.jobs.error;
export const selectLastFetched = (state: { jobs: JobsState }) => state.jobs.lastFetched;