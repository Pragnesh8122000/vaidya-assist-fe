import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider, useSelector, useDispatch } from 'react-redux';
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
import Files from './pages/Files';
import Reports from './pages/Reports';
import ChatPage from './pages/Chat';
import AgentChatPage from './pages/AgentChat';
import Assistants from './pages/Assistants';
import Roles from './pages/Roles';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
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
            <Route index element={<Dashboard />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="patients" element={<Patients />} />
            <Route path="medicines" element={<Medicines />} />
            <Route path="files" element={<Files />} />
            <Route path="reports" element={<Reports />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="agent" element={<AgentChatPage />} />
            <Route path="assistants" element={<Assistants />} />
            <Route path="roles" element={<Roles />} />
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
