import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import api, { setActiveClinicId } from '../api/axios';
import { GUEST_USER } from '../constants/guestData';

// TS-1 fix: explicit AuthState interface and createAsyncThunk generics so
// the rejected handler can be typed (see authSlice.reducer below).
/**
 * @typedef {Object} User
 * @property {string} _id
 * @property {string} name
 * @property {string} email
 * @property {string} [phone]
 * @property {string} [clinicId]
 * @property {string} [doctorId]
 * @property {{_id: string, name: string, slug: string}} [role]
 */

/**
 * @typedef {Object} AuthState
 * @property {User|null} user
 * @property {boolean} isAuthenticated
 * @property {boolean} loading
 * @property {string|null} error
 */

/** @type {AuthState} */
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  isGuest: false,
};

/**
 * @typedef {Object} AuthResponse
 * @property {string} token
 * @property {string} refreshToken
 * @property {User} user
 */

/**
 * Persist tokens. Tokens live in localStorage (SEC-1 / SEC-2 follow-up
 * is to migrate to httpOnly cookies). Until that migration, this is the
 * single point that writes tokens so the rest of the app reads a
 * consistent shape.
 * @param {AuthResponse} payload
 */
const persistTokens = (payload) => {
  if (typeof window === 'undefined') return;
  if (payload?.token) localStorage.setItem('token', payload.token);
  if (payload?.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken);
};

const clearTokens = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
};

export const login = createAsyncThunk(
  'auth/login',
  /** @param {{email: string, password: string}} credentials */
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      persistTokens(data.data);
      return /** @type {AuthResponse} */ (data.data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  /** @param {Object} userData */
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      persistTokens(data.data);
      return /** @type {AuthResponse} */ (data.data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  },
);

/** Google Sign-In: sends the Google ID token to the backend for verification. */
export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  /** @param {string} idToken */
  async (idToken, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/google', { idToken, role: 'doctor' });
      persistTokens(data.data);
      return /** @type {AuthResponse} */ (data.data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Google sign-in failed');
    }
  },
);

export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/auth/me');
      return /** @type {User} */ (data.data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Session expired');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      clearTokens();
      // ARCH-3 follow-up: drop the clinic scope from the axios cache
      // so a stale clinicId from a previous session cannot leak into
      // a subsequent login on the same browser.
      setActiveClinicId(null);
    },
    clearError: (state) => { state.error = null; },
    enterGuestMode: (state) => {
      state.isGuest = true;
      state.isAuthenticated = true;
      state.user = GUEST_USER;
      state.error = null;
    },
    exitGuestMode: (state) => {
      state.isGuest = false;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      clearTokens();
      setActiveClinicId(null);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.isGuest = false;
        state.user = action.payload.user;
        toast.success(`Welcome back, ${action.payload.user.name || 'Admin'}!`);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        // TS-1 fix: the rejected payload is now typed via the thunk
        // generic above, so this assignment is checked at lint time.
        state.error = typeof action.payload === 'string' ? action.payload : 'Login failed';
        toast.error(state.error);
      })
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.isGuest = false;
        state.user = action.payload.user;
        toast.success('Account created successfully!');
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Registration failed';
        toast.error(state.error);
      })
      .addCase(googleLogin.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.isGuest = false;
        state.user = action.payload.user;
        toast.success(`Welcome back, ${action.payload.user.name || 'Admin'}!`);
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Google sign-in failed';
        toast.error(state.error);
      })
      .addCase(getMe.pending, (state) => { state.loading = true; })
      .addCase(getMe.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(getMe.rejected, (state) => {
        // Silent recovery: a rejected getMe means the token is invalid
        // (expired, revoked, or tampered). Clear both Redux and storage
        // so the user is forced back to the login page on the next
        // render. No toast — this is a startup path, not a user action.
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        clearTokens();
        setActiveClinicId(null);
      });
  },
});

export const { logout, clearError, enterGuestMode, exitGuestMode } = authSlice.actions;
export default authSlice.reducer;
