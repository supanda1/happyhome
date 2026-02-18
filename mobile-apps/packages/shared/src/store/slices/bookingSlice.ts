import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Booking, BookingStatus } from '../../types';

interface BookingState {
  currentBooking: Booking | null;
  bookings: Booking[];
  activeJobs: Booking[]; // For engineer app
  isLoading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  currentBooking: null,
  bookings: [],
  activeJobs: [],
  isLoading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setCurrentBooking: (state, action: PayloadAction<Booking>) => {
      state.currentBooking = action.payload;
    },
    setBookings: (state, action: PayloadAction<Booking[]>) => {
      state.bookings = action.payload;
    },
    addBooking: (state, action: PayloadAction<Booking>) => {
      state.bookings.unshift(action.payload);
    },
    updateBooking: (state, action: PayloadAction<Booking>) => {
      const index = state.bookings.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.bookings[index] = action.payload;
      }
      if (state.currentBooking?.id === action.payload.id) {
        state.currentBooking = action.payload;
      }
    },
    updateBookingStatus: (state, action: PayloadAction<{ id: string; status: BookingStatus }>) => {
      const { id, status } = action.payload;
      const booking = state.bookings.find(b => b.id === id);
      if (booking) {
        booking.status = status;
      }
      if (state.currentBooking?.id === id) {
        state.currentBooking.status = status;
      }
    },
    setActiveJobs: (state, action: PayloadAction<Booking[]>) => {
      state.activeJobs = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetBookingState: () => initialState,
  },
});

export const {
  setCurrentBooking,
  setBookings,
  addBooking,
  updateBooking,
  updateBookingStatus,
  setActiveJobs,
  setLoading,
  setError,
  resetBookingState,
} = bookingSlice.actions;

export default bookingSlice.reducer;