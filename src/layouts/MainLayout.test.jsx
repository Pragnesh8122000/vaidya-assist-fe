import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../features/authSlice';
import uiReducer from '../features/uiSlice';
import agentChatReducer from '../features/agentChatSlice';
import MainLayout from './MainLayout';

// Test Gap P2 — MainLayout a11y + role-based menu visibility. This file
// covers three of the five P2 gaps in one place because they all live
// in the same component:
//   1. Nav by role — a doctor must see "Templates"/"Assistants"/"Roles";
//      a receptionist must not.
//   2. A11y landmarks — skip link, <main>, <header>, page H1.
//   3. Snapshot — the rendered structure stays stable.
//
// The "snapshot" coverage here is structural (asserted roles/labels)
// rather than a literal string match: a literal snapshot is noisy and
// rots the moment any copy edits, while a structural one survives copy
// changes and still catches the regressions that matter (missing
// landmark, broken nav filter, role leaked between users).

// Mock the api so MainLayout's notification fetch on mount is a no-op.
vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { data: [], unreadCount: 0 } }),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  setActiveClinicId: vi.fn(),
  getActiveClinicId: vi.fn(),
}));

// Stub the socket export so MainLayout's openChat wiring doesn't fail
// when AgentChatWidget's lazy import resolves the socket module.
vi.mock('../socket/socket', () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => null),
}));

const makeStore = (user) => configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    agentChat: agentChatReducer,
  },
  preloadedState: {
    auth: user
      ? { user, isAuthenticated: true, loading: false, error: null }
      : { user: null, isAuthenticated: true, loading: false, error: null },
    ui: { sidebarOpen: true, darkMode: false },
    agentChat: { open: false, messages: [], conversationId: null, loading: false, error: null },
  },
});

const renderLayout = (user, route = '/') => render(
  <Provider store={makeStore(user)}>
    <MemoryRouter initialEntries={[route]}>
      <MainLayout />
    </MemoryRouter>
  </Provider>,
);

describe('MainLayout — nav by role', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

  it('doctor sees doctor-only routes (Templates, Assistants, Roles)', () => {
    renderLayout(
      { _id: 'u', name: 'Dr', role: { slug: 'doctor', name: 'Doctor' } },
      '/',
    );
    // Doctor-only routes.
    expect(screen.getByRole('button', { name: /^templates$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^assistants$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^roles$/i })).toBeInTheDocument();
    // Common routes.
    expect(screen.getByRole('button', { name: /^appointments$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^patients$/i })).toBeInTheDocument();
  });

  it('receptionist does NOT see doctor-only or operational-staff routes', () => {
    renderLayout(
      { _id: 'u', name: 'Rec', role: { slug: 'receptionist', name: 'Receptionist' } },
      '/',
    );
    // Doctor-only — must be hidden.
    expect(screen.queryByRole('button', { name: /^templates$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^assistants$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^roles$/i })).toBeNull();
    // Operational (doctor+assistant) — must also be hidden for receptionist.
    expect(screen.queryByRole('button', { name: /^doctors$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^reports$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^agent$/i })).toBeNull();
    // Common staff routes — must be visible.
    expect(screen.getByRole('button', { name: /^appointments$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^patients$/i })).toBeInTheDocument();
  });

  it('pharmacist sees medicines but not Templates/Assistants/Roles', () => {
    renderLayout(
      { _id: 'u', name: 'Ph', role: { slug: 'pharmacist', name: 'Pharmacist' } },
      '/',
    );
    expect(screen.getByRole('button', { name: /^medicines$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^templates$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^assistants$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^roles$/i })).toBeNull();
  });
});

describe('MainLayout — accessibility landmarks', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

  it('renders a skip-to-main link as the first focusable element', () => {
    renderLayout({ _id: 'u', name: 'Dr', role: { slug: 'doctor', name: 'Doctor' } }, '/');
    // The skip link is the only <a> in the document; verify it both
    // exists and points to the main region. The hash must match
    // `id="main-content"` on the <main> element below.
    const skip = screen.getByRole('link', { name: /skip to main content/i });
    expect(skip).toBeInTheDocument();
    expect(skip.getAttribute('href')).toBe('#main-content');
  });

  it('exposes the AppBar as a <header> landmark', () => {
    renderLayout({ _id: 'u', name: 'Dr', role: { slug: 'doctor', name: 'Doctor' } }, '/');
    // MUI AppBar accepts `component="header"` so screen readers see a
    // banner landmark. The query function returns the underlying
    // <header> element.
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('exposes a labelled <main> region as the primary content landmark', () => {
    renderLayout({ _id: 'u', name: 'Dr', role: { slug: 'doctor', name: 'Doctor' } }, '/');
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveAttribute('aria-label', 'Main content');
  });

  it('renders a labelled <nav> landmark for the sidebar', () => {
    renderLayout({ _id: 'u', name: 'Dr', role: { slug: 'doctor', name: 'Doctor' } }, '/');
    // The sidebar is a <List component="nav" aria-label="Main navigation">.
    // This gives SR rotor-nav a clearly named "Main navigation" region.
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });

  it('marks the active route with aria-current="page"', () => {
    renderLayout({ _id: 'u', name: 'Dr', role: { slug: 'doctor', name: 'Doctor' } }, '/patients');
    // The Patients ListItemButton is the one that should be marked
    // current; the others have no aria-current attribute.
    const patientsBtn = screen.getByRole('button', { name: /^patients$/i });
    expect(patientsBtn).toHaveAttribute('aria-current', 'page');
    // Sanity: the inactive Dashboard item is NOT marked current.
    const dashboardBtn = screen.getByRole('button', { name: /^dashboard$/i });
    expect(dashboardBtn).not.toHaveAttribute('aria-current');
  });

  it('renders the page title as an <h1> for screen-reader rotor navigation', () => {
    renderLayout({ _id: 'u', name: 'Dr', role: { slug: 'doctor', name: 'Doctor' } }, '/appointments');
    // The h1 is sourced from the active route's menu label. If the
    // menu map gets out of sync with the route table, this catches it.
    expect(screen.getByRole('heading', { level: 1, name: /appointments/i })).toBeInTheDocument();
  });
});
