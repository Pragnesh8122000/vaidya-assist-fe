import { useEffect } from 'react';
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
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Patients from './pages/Patients';
import Medicines from './pages/Medicines';
import Doctors from './pages/Doctors';
import Reports from './pages/Reports';
import AgentChatPage from './pages/AgentChat';
import Assistants from './pages/Assistants';
import Roles from './pages/Roles';
import Settings from './pages/Settings';
import Templates from './pages/Templates';
import DoctorDashboard from './pages/DoctorDashboard';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const token = localStorage.getItem('token');

  if (token && !isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
};

// Role slug for routing decisions (mirrors MainLayout's roleSlug).
const roleSlug = (user) => user?.role?.slug || (user?.role?.name || '').toLowerCase();

// Gates a route so only non-doctor roles (admin/staff) can access it directly.
const RoleRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (roleSlug(user) === 'doctor') return <Navigate to="/" replace />;
  return children;
};

// Pick the index page based on role: doctors get the DoctorDashboard, everyone
// else keeps the existing analytics Dashboard.
const HomeRoute = () => {
  const { user } = useSelector((state) => state.auth);
  return roleSlug(user) === 'doctor' ? <DoctorDashboard /> : <Dashboard />;
};

const AppRoutes = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { darkMode } = useSelector((state) => state.ui);
  const theme = getTheme(darkMode ? 'dark' : 'light');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(getMe());
    }
  }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (isAuthenticated && token) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [isAuthenticated]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer position="top-right" autoClose={3000} theme={darkMode ? 'dark' : 'light'} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<HomeRoute />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="patients" element={<Patients />} />
            <Route path="doctors" element={<RoleRoute><Doctors /></RoleRoute>} />
            <Route path="medicines" element={<Medicines />} />
            <Route path="templates" element={<RoleRoute><Templates /></RoleRoute>} />
            <Route path="reports" element={<RoleRoute><Reports /></RoleRoute>} />
            <Route path="agent" element={<RoleRoute><AgentChatPage /></RoleRoute>} />
            <Route path="assistants" element={<RoleRoute><Assistants /></RoleRoute>} />
            <Route path="roles" element={<RoleRoute><Roles /></RoleRoute>} />
            <Route path="settings" element={<Settings />} />
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
