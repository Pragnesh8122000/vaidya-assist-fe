/**
 * Tests for the Google Sign-In flow in the Doctor/Admin app (R2).
 *
 * Covers:
 *  - authSlice: googleLogin thunk (success, failure, 403 rejection)
 *  - Login.jsx: Google button renders, success dispatches, error shown
 *
 * Mocks @react-oauth/google and the api module so no real network or
 * Google SDK is needed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import authReducer, { googleLogin } from './authSlice';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';

// ── Mock @react-oauth/google ────────────────────────────────────────
// We mock GoogleLogin to render a plain button that invokes onSuccess
// with a fake credential, so we can test the Redux dispatch flow.
vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess, onError }) => (
    <button
      data-testid="google-login-button"
      onClick={() => onSuccess?.({ credential: 'fake-google-id-token' })}
    >
      Google SSO
    </button>
  ),
  GoogleOAuthProvider: ({ children }) => <>{children}</>,
}));

// ── Mock the API module so no real network calls are made ─────────────
vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  setActiveClinicId: vi.fn(),
  getActiveClinicId: vi.fn(),
}));

// ── Mock react-toastify so toast calls don't crash in jsdom ──────────
vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// ── Mock framer-motion to avoid animation issues in jsdom ───────────
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// ── Helpers ──────────────────────────────────────────────────────────
const makeStore = (preloaded) =>
  configureStore({
    reducer: { auth: authReducer, ui: (s = { sidebarOpen: true, darkMode: false }) => s },
    preloadedState: preloaded,
  });

const renderWithStore = (store, route = '/login') =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

// ── authSlice: googleLogin thunk ──────────────────────────────────────
describe('authSlice — googleLogin', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('dispatches googleLogin.fulfilled and stores tokens on success', async () => {
    const axios = (await import('../api/axios')).default;
    axios.post.mockResolvedValueOnce({
      data: {
        data: {
          token: 'jwt-access-token',
          refreshToken: 'jwt-refresh-token',
          user: { _id: 'u1', name: 'Dr Smith', email: 'dr@example.com', role: { slug: 'doctor' } },
        },
      },
    });

    const store = makeStore();
    const result = await store.dispatch(googleLogin('fake-google-id-token'));

    expect(result.type).toBe('auth/googleLogin/fulfilled');
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.user.name).toBe('Dr Smith');
    expect(localStorage.getItem('token')).toBe('jwt-access-token');
    expect(localStorage.getItem('refreshToken')).toBe('jwt-refresh-token');
  });

  it('dispatches googleLogin.rejected on API error', async () => {
    const axios = (await import('../api/axios')).default;
    axios.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid or expired Google token.' } },
    });

    const store = makeStore();
    const result = await store.dispatch(googleLogin('bad-token'));

    expect(result.type).toBe('auth/googleLogin/rejected');
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.error).toBe('Invalid or expired Google token.');
  });

  it('dispatches googleLogin.rejected on doctor-not-found 403', async () => {
    const axios = (await import('../api/axios')).default;
    axios.post.mockRejectedValueOnce({
      response: {
        data: { message: 'No account found for this email. Please contact your clinic administrator.' },
      },
    });

    const store = makeStore();
    const result = await store.dispatch(googleLogin('doctor-no-account-token'));

    expect(result.type).toBe('auth/googleLogin/rejected');
    expect(store.getState().auth.error).toContain('No account found');
  });

  it('sends role=doctor in the request body', async () => {
    const axios = (await import('../api/axios')).default;
    axios.post.mockResolvedValueOnce({
      data: {
        data: {
          token: 't',
          refreshToken: 'r',
          user: { _id: 'u1', name: 'Dr', role: { slug: 'doctor' } },
        },
      },
    });

    const store = makeStore();
    await store.dispatch(googleLogin('some-id-token'));

    expect(axios.post).toHaveBeenCalledWith('/auth/google', {
      idToken: 'some-id-token',
      role: 'doctor',
    });
  });
});

// ── Login page: Google Sign-In button ────────────────────────────────
describe('Login page — Google Sign-In', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the Google Sign-In button', () => {
    const store = makeStore();
    renderWithStore(store);

    expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
  });

  it('dispatches googleLogin and authenticates on Google button click', async () => {
    const axios = (await import('../api/axios')).default;
    axios.post.mockResolvedValueOnce({
      data: {
        data: {
          token: 'jwt-access-token',
          refreshToken: 'jwt-refresh-token',
          user: { _id: 'u1', name: 'Dr Smith', email: 'dr@example.com', role: { slug: 'doctor' } },
        },
      },
    });

    const store = makeStore();
    renderWithStore(store);

    // Click the mocked Google Sign-In button
    await userEvent.click(screen.getByTestId('google-login-button'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/auth/google', {
        idToken: 'fake-google-id-token',
        role: 'doctor',
      });
    });

    await waitFor(() => {
      expect(store.getState().auth.isAuthenticated).toBe(true);
    });
  });

  it('shows error in state on Google Sign-In failure', async () => {
    const axios = (await import('../api/axios')).default;
    axios.post.mockRejectedValueOnce({
      response: {
        data: { message: 'No account found for this email. Please contact your clinic administrator.' },
      },
    });

    const store = makeStore();
    renderWithStore(store);

    await userEvent.click(screen.getByTestId('google-login-button'));

    await waitFor(() => {
      expect(store.getState().auth.error).toContain('No account found');
    });
  });

  it('renders the "or" divider between password form and Google button', () => {
    const store = makeStore();
    renderWithStore(store);

    // MUI Divider with children renders the "or" text
    expect(screen.getByText('or')).toBeInTheDocument();
  });
});