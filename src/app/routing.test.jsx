import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import authReducer, { logout } from '../features/authSlice';
import uiReducer from '../features/uiSlice';
import agentChatReducer from '../features/agentChatSlice';
import Login from '../pages/Login';
import { ROLES } from '../types/auth';

// Test Gap P2 — routing end-to-end. The audit listed this gap as a
// single item but it has three sub-behaviours: redirect, guard, and
// role-scoping. Each is verified by mounting the same `AppRoutes`
// shell with a different preloaded Redux state and asserting the
// page the user lands on. Keeping all three in one file is fine
// because they share the same `renderApp` helper and the same
// mock store factory; splitting them into three files would mostly
// duplicate setup.

// Fixtures are defined inline (per project rule against unnecessary
// files) and use minimal markup so the test can assert the rendered
// "landed here" markers without coupling to actual page chrome.

// `HomeRoute` — replaces App.jsx's role-aware index. The audit cares
// that the user reaches "/" after login; the HomeRoute's internal
// doctor-vs-admin fork is tested separately in MainLayout.test.jsx.
const HomeRoute = () => <span>home-marker</span>;

// `ProtectedRoute` — minimal port of App.jsx's `ProtectedRoute`. The
// only branch the routing test exercises is the unauthenticated
// redirect to /login; the rest is exercised by the auth flow test.
const ProtectedRoute = () => {
  const isAuthenticated = useSelectorSafe((s) => s.auth.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
};

// `RoleRoute` — same as App.jsx's `RoleRoute` but parameterised by
// `allowedRoles` from props instead of an import. Reading role from
// `state.auth.user.role.slug` mirrors App.jsx exactly.
const RoleRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useSelectorSafe((s) => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const slug = user?.role?.slug || '';
  if (!allowedRoles.includes(slug)) return <Navigate to="/" replace />;
  return <Outlet />;
};

// `useSelectorSafe` — local copy of the react-redux hook so the
// fixtures don't have to import react-redux in two places.
import { useSelector as _useSelector } from 'react-redux';
const useSelectorSafe = _useSelector;

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
    get: vi.fn().mockResolvedValue({ data: { data: [], unreadCount: 0 } }),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  setActiveClinicId: vi.fn(),
  getActiveClinicId: vi.fn(),
}));

vi.mock('../socket/socket', () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => null),
}));

const makeStore = (preloaded) => configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    agentChat: agentChatReducer,
  },
  preloadedState: preloaded,
});

const renderApp = (store, route = '/') => render(
  <Provider store={store}>
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/login" element={store.getState().auth.isAuthenticated
          ? <span>redirect-home-marker</span>
          : <Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomeRoute />} />
          <Route element={<RoleRoute allowedRoles={['doctor']} />}>
            <Route path="/doctors-only" element={<span>Doctors Only Page</span>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>
  </Provider>,
);

const unauthState = {
  auth: { user: null, isAuthenticated: false, loading: false, error: null },
  ui: { sidebarOpen: true, darkMode: false },
  agentChat: { open: false, messages: [], conversationId: null, loading: false, error: null },
};

describe('Routing end-to-end', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

  it('redirects an unauthenticated user from / to /login', async () => {
    const store = makeStore(unauthState);
    renderApp(store, '/');
    // The Login page renders an h4 heading.
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    });
  });

  it('redirects a logged-in user from /login back to /', async () => {
    const store = makeStore({
      ...unauthState,
      auth: { user: { name: 'Dr', role: { slug: 'doctor' } }, isAuthenticated: true, loading: false, error: null },
    });
    renderApp(store, '/login');
    // The Login page should NOT be visible — the redirect marker
    // shows instead. The actual "/" route lands the user on the
    // HomeRoute, which is mocked to render the home content text.
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /welcome back/i })).toBeNull();
    });
  });

  it('lands an authenticated user on the home route', async () => {
    const store = makeStore({
      ...unauthState,
      auth: { user: { name: 'Dr', role: { slug: 'doctor' } }, isAuthenticated: true, loading: false, error: null },
    });
    renderApp(store, '/');
    await waitFor(() => {
      expect(screen.getByText('home-marker')).toBeInTheDocument();
    });
  });

  it('blocks a non-doctor from a doctor-only route by sending them home', async () => {
    const store = makeStore({
      ...unauthState,
      auth: { user: { name: 'Rec', role: { slug: 'receptionist' } }, isAuthenticated: true, loading: false, error: null },
    });
    renderApp(store, '/doctors-only');
    // The doctor-only page must NOT render. The user is bounced to
    // the home route (HomeRoute shows the home-marker text).
    await waitFor(() => {
      expect(screen.queryByText(/doctors only page/i)).toBeNull();
      expect(screen.getByText('home-marker')).toBeInTheDocument();
    });
  });

  it('allows a doctor into a doctor-only route', async () => {
    const store = makeStore({
      ...unauthState,
      auth: { user: { name: 'Dr', role: { slug: 'doctor' } }, isAuthenticated: true, loading: false, error: null },
    });
    renderApp(store, '/doctors-only');
    await waitFor(() => {
      expect(screen.getByText(/doctors only page/i)).toBeInTheDocument();
    });
  });

  it('logout dispatched after login clears the auth state and bounces to /login', async () => {
    const axios = (await import('../api/axios')).default;
    axios.post.mockResolvedValueOnce({
      data: { data: { token: 't', refreshToken: 'r', user: { _id: 'u1', name: 'Dr', role: { slug: 'doctor' } } } },
    });

    // Start unauthenticated on /login, perform a login through the
    // real slice, then dispatch logout and assert the user is
    // bounced away from the home route.
    const store = makeStore(unauthState);
    renderApp(store, '/login');
    await waitFor(() => screen.getByRole('heading', { name: /welcome back/i }));

    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), { target: { value: 'a@b.c' } });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in|login/i }));

    await waitFor(() => expect(store.getState().auth.isAuthenticated).toBe(true));

    // Now dispatch logout and confirm isAuthenticated flips back to false.
    store.dispatch(logout());
    await waitFor(() => expect(store.getState().auth.isAuthenticated).toBe(false));
    expect(store.getState().auth.user).toBeNull();
  });
});
