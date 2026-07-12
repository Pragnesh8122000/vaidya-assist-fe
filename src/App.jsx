import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider, useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import LockOutlineIcon from '@mui/icons-material/LockOutline';
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
import { GUEST_RESTRICTED_ROUTES, GUEST_RESTRICTION_MESSAGES } from './constants/guestData';

// Role slug for routing decisions (mirrors MainLayout's roleSlug).
// ARCH-1 + ARCH-2 fix: read from a typed, centralised allowlist so route
// guards and menu visibility stay in sync.
const roleSlug = (user) => user?.role?.slug || (user?.role?.name || '').toLowerCase();

// GuestRestrictedPage — shown when a guest user tries to access a restricted route.
const GuestRestrictedPage = ({ title, body }) => (
  <Box sx={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '50vh', p: 4, textAlign: 'center',
  }}>
    <LockOutlineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
    <Typography variant="h5" fontWeight={600} gutterBottom>{title}</Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>{body}</Typography>
    <Button variant="contained" color="primary" href="/login">Sign In or Create Account</Button>
  </Box>
);

// ProtectedRoute — requires authentication (real or guest).
// Guest users pass through but cannot access GUEST_RESTRICTED_ROUTES.
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isGuest } = useSelector((state) => state.auth);
  const location = typeof window !== 'undefined' ? window.location : { pathname: '/' };
  // ARCH-4 fix: read auth state from Redux, not localStorage.
  if (!isAuthenticated) return <Navigate to="/login" />;
  // Guest mode restriction: block access to restricted routes
  if (isGuest && GUEST_RESTRICTED_ROUTES.includes(location.pathname)) {
    const msg = GUEST_RESTRICTION_MESSAGES[location.pathname] || GUEST_RESTRICTION_MESSAGES.default;
    return <GuestRestrictedPage title={msg.title} body={msg.body} />;
  }
  return children;
};

// RoleRoute — requires authentication AND membership in `allowedRoles`.
// Guest users are always blocked from role-restricted routes.
const RoleRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isGuest } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (isGuest) {
    const msg = GUEST_RESTRICTION_MESSAGES.default;
    return <GuestRestrictedPage title={msg.title} body={msg.body} />;
  }
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
  const { isAuthenticated, isGuest } = useSelector((state) => state.auth);
  const { darkMode } = useSelector((state) => state.ui);
  const theme = getTheme(darkMode ? 'dark' : 'light');

  useEffect(() => {
    // Skip getMe for guest mode — no real token exists.
    // ARCH-4 fix: dispatch getMe unconditionally (except guests) so Redux
    // becomes the source of truth.
    if (!isGuest) {
      dispatch(getMe());
    }
  }, [dispatch, isGuest]);

  useEffect(() => {
    // Guests don't have a real token, so no socket connection.
    if (isAuthenticated && !isGuest) {
      const token = localStorage.getItem('token');
      if (token) connectSocket(token);
      else disconnectSocket();
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [isAuthenticated, isGuest]);

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
