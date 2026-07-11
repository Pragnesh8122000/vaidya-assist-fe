import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import authReducer, { login, logout, getMe } from './authSlice';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';

// Mock the api module so tests don't hit a real network.
vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess }) => (
    <button data-testid="google-login-button" type="button" onClick={() => onSuccess?.({ credential: 'mock' })}>
      Google SSO
    </button>
  ),
  GoogleOAuthProvider: ({ children }) => <>{children}</>,
}));

vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  setActiveClinicId: vi.fn(),
  getActiveClinicId: vi.fn(),
}));

const makeStore = (preloaded) => configureStore({
  reducer: { auth: authReducer, ui: (s = { sidebarOpen: true, darkMode: false }) => s },
  preloadedState: preloaded,
});

const renderWithStore = (ui, { store, route = '/login' } = {}) => ({
  store,
  ...render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    </Provider>,
  ),
});

describe('authSlice', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

  it('starts unauthenticated', () => {
    const store = makeStore();
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.user).toBeNull();
  });

  it('logout clears user, isAuthenticated, and storage', () => {
    localStorage.setItem('token', 'fake');
    localStorage.setItem('refreshToken', 'fake-r');
    const store = makeStore({ auth: { user: { name: 'X' }, isAuthenticated: true, loading: false, error: null } });
    store.dispatch(logout());
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});

describe('Login flow → Dashboard redirect', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

  it('navigates to / on successful login', async () => {
    const axios = (await import('../api/axios')).default;
    axios.post.mockResolvedValueOnce({
      data: { data: { token: 't', refreshToken: 'r', user: { _id: 'u1', name: 'Dr', role: { slug: 'doctor' } } } },
    });
    const store = makeStore();
    renderWithStore(
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
      </Routes>,
      { store, route: '/login' },
    );
    // A11Y-8: the password reveal IconButton now carries an aria-label
    // ("Show password" / "Hide password") that also matches /password/i,
    // so scope the input lookup to the textbox role to avoid the
    // ambiguous match. Same scoping for email — the field is identified
    // by the label <label>Email</label> for the input, not the icon.
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), { target: { value: 'a@b.c' } });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in|login/i }));
    await waitFor(() => expect(store.getState().auth.isAuthenticated).toBe(true));
    expect(store.getState().auth.user?.name).toBe('Dr');
    expect(localStorage.getItem('token')).toBe('t');
  });

  it('getMe.rejected wipes state so the user must re-auth', async () => {
    const axios = (await import('../api/axios')).default;
    axios.get.mockRejectedValueOnce({ response: { data: { message: 'nope' } } });
    const store = makeStore({
      auth: { user: { name: 'Stale' }, isAuthenticated: true, loading: false, error: null },
    });
    localStorage.setItem('token', 'expired');
    await store.dispatch(getMe());
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
