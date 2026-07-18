import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDoctors as fetchDoctorsApi } from '../api/doctors';

/**
 * @typedef {Object} DoctorsState
 * @property {any[]} data
 * @property {number} count
 * @property {boolean} loading
 * @property {string|null} error
 * @property {string} search
 */

/** @type {DoctorsState} */
const initialState = {
  data: [],
  count: 0,
  loading: false,
  error: null,
  search: '',
};

export const getDoctors = createAsyncThunk(
  'doctors/getDoctors',
  /** @param {{ search?: string, page?: number, limit?: number }} params */
  async ({ search = '', page = 1, limit = 50 } = {}, { rejectWithValue }) => {
    try {
      const response = await fetchDoctorsApi({ search, page, limit });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load doctors');
    }
  },
);

const doctorsSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {
    setDoctorsSearch: (state, action) => {
      state.search = action.payload;
    },
    clearDoctorsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDoctors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDoctors.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data || [];
        state.count = action.payload.count || 0;
      })
      .addCase(getDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load doctors';
      });
  },
});

export const { setDoctorsSearch, clearDoctorsError } = doctorsSlice.actions;
export default doctorsSlice.reducer;
