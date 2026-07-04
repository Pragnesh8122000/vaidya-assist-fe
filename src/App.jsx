import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider, useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import store from './app/store';
import { getTheme } from './theme/theme';
import { getMe } from './features/authSlice';
import { connectSocket, disconnectSocket } from './socket/socket';
import { setActiveClinicId } from './api/axios';
import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
// PERF-1 fix: lazy-load every page so the initial bundle ships only the
// shell (App + MainLayout + theme). Each page is fetched on first
// navigation. Login/Register stay eagerly loaded — they're the first
// screen a user (or a logged-out visitor) sees, and their chunks are
// already tiny.
import Login from './pages/Login';
import Register from './pages/Register';
import PageFallback from './components/PageFallback';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Patients = lazy(() => import('./pages/Patients'));
const Medicines = lazy(() => import('./pages/Medicines'));
const Doctors = lazy(() => import('./pages/Doctors'));
const Reports = lazy(() => import('./pages/Reports'));
const AgentChatPage = lazy(() => import('./pages/AgentChat'));
const Assistants = lazy(() => import('./pages/Assistants'));
const Roles = lazy(() => import('./pages/Roles'));
const Settings = lazy(() => import('./pages/Settings'));
const Templates = lazy(() => import('./pages/Templates'));
import { ROLES } from './types/auth';

// Role slug for routing decisions (mirrors MainLayout's roleSlug).
// ARCH-1 + ARCH-2 fix: read from a typed, centralised allowlist so route
// guards and menu visibility stay in sync.
const roleSlug = (user) => user?.role?.slug || (user?.role?.name || '').toLowerCase();

// ProtectedRoute — requires authentication. ARCH-1: previously this was
// the only check; route-level RoleRoute still gates admin scope below.
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  // ARCH-4 fix: read auth state from Redux, not localStorage. The previous
  // implementation read `localStorage.getItem('token')` and rendered a
  // spinner when only the token existed — that path could let a stale or
  // revoked token linger after Redux cleared it.
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
};

// RoleRoute — requires authentication AND membership in `allowedRoles`.
// ARCH-2 fix: the previous implementation only blocked `doctor`, so any
// non-doctor (assistant, receptionist, pharmacist) reached admin-only
// routes. Now both doctor and assistant have scoped access; pharmacist
// and receptionist are blocked from admin-only routes by default.
const RoleRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" />;
  const slug = roleSlug(user);
  if (!allowedRoles.includes(slug)) return <Navigate to="/" replace />;
  return children;
};

// Pick the index page based on role: doctors get the DoctorDashboard, everyone
// else keeps the existing analytics Dashboard.
const HomeRoute = () => {
  const { user } = useSelector((state) => state.auth);
  return roleSlug(user) === ROLES.DOCTOR ? <DoctorDashboard /> : <Dashboard />;
};

const AppRoutes = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { darkMode } = useSelector((state) => state.ui);
  const theme = getTheme(darkMode ? 'dark' : 'light');

  useEffect(() => {
    // ARCH-4 fix: dispatch getMe unconditionally so Redux becomes the
    // source of truth. If a stale token is in localStorage but the user
    // is no longer authenticated server-side, getMe.rejected clears both
    // Redux and localStorage (see authSlice).
    dispatch(getMe());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('token');
      if (token) connectSocket(token);
      else disconnectSocket();
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [isAuthenticated]);

  // ARCH-3 follow-up: mirror the active clinicId from Redux into the
  // axios interceptor cache. The cache is the single source of truth
  // for query scoping, so every page inherits the clinic filter
  // without having to remember to add it. When the user logs out or
  // switches accounts, the cache is cleared and the next auth refresh
  // repopulates it from the server's user payload.
  const clinicId = useSelector((state) => state.auth.user?.clinicId) || null;
  useEffect(() => {
    setActiveClinicId(clinicId);
  }, [clinicId]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme={darkMode ? 'dark' : 'light'}
        // A11Y-8 fix: react-toastify accepts `role` and `aria-live` on the
        // container and forwards them to the rendered toast region. Without
        // this, screen readers do not announce transient notifications
        // (e.g. "Patient deleted" after a row is removed). `assertive` is
        // appropriate here because the toast is a direct response to a
        // user action — interrupting screen-reader flow matches the
        // user's expectation of feedback. The container itself is a
        // landmark so users can find dismissed messages later.
        role="alert"
        aria-live="assertive"
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
          <Route path="/" element={<ProtectedRoute><ErrorBoundary><MainLayout /></ErrorBoundary></ProtectedRoute>}>
            {/* PERF-1: every page is lazy. A single Suspense boundary at
                the route root keeps the fallback scoped to navigation
                transitions, not the whole shell. */}
            <Route index element={<Suspense fallback={<PageFallback />}><HomeRoute /></Suspense>} />
            <Route path="appointments" element={<Suspense fallback={<PageFallback />}><Appointments /></Suspense>} />
            <Route path="patients" element={<Suspense fallback={<PageFallback />}><Patients /></Suspense>} />
            <Route path="doctors" element={<RoleRoute allowedRoles={[ROLES.DOCTOR, ROLES.ASSISTANT]}><Suspense fallback={<PageFallback />}><Doctors /></Suspense></RoleRoute>} />
            <Route path="medicines" element={<Suspense fallback={<PageFallback />}><Medicines /></Suspense>} />
            <Route path="templates" element={<RoleRoute allowedRoles={[ROLES.DOCTOR]}><Suspense fallback={<PageFallback />}><Templates /></Suspense></RoleRoute>} />
            <Route path="reports" element={<RoleRoute allowedRoles={[ROLES.DOCTOR, ROLES.ASSISTANT]}><Suspense fallback={<PageFallback />}><Reports /></Suspense></RoleRoute>} />
            <Route path="agent" element={<RoleRoute allowedRoles={[ROLES.DOCTOR, ROLES.ASSISTANT]}><Suspense fallback={<PageFallback />}><AgentChatPage /></Suspense></RoleRoute>} />
            <Route path="assistants" element={<RoleRoute allowedRoles={[ROLES.DOCTOR]}><Suspense fallback={<PageFallback />}><Assistants /></Suspense></RoleRoute>} />
            <Route path="roles" element={<RoleRoute allowedRoles={[ROLES.DOCTOR]}><Suspense fallback={<PageFallback />}><Roles /></Suspense></RoleRoute>} />
            <Route path="settings" element={<Suspense fallback={<PageFallback />}><Settings /></Suspense>} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

const App = () => (
  <Provider store={store}>
    <AppRoutes />
  </Provider>
);

export default App;
