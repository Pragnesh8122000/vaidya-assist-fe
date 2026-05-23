import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData);
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Session expired');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => { state.loading = false; state.isAuthenticated = true; state.user = action.payload.user; })
      .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => { state.loading = false; state.isAuthenticated = true; state.user = action.payload.user; })
      .addCase(register.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(getMe.fulfilled, (state, action) => { state.isAuthenticated = true; state.user = action.payload; })
      .addCase(getMe.rejected, (state) => { state.isAuthenticated = false; state.user = null; localStorage.removeItem('token'); localStorage.removeItem('refreshToken'); });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
