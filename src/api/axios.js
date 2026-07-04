import axios from 'axios';

// PERF-2 fix: local dev now uses a same-origin /api baseURL so the
// Vite dev proxy can forward to the onrender backend (see the
// `server.proxy` block in vite.config.js). In production, set
// VITE_API_URL to the deployed backend. Falling back to /api in dev
// also avoids the cross-origin round trip that 404'd any CORS preflight
// during local development.
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://vaidya-assist-be.onrender.com/api');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// The currently-scoped clinic id. ARCH-3 fix: we read this from a small
// in-memory cache that the auth flow refreshes, instead of relying on
// every page to remember to add `?clinicId=...` to its data calls. The
// cache is intentionally ephemeral — tokens live in localStorage but
// the clinicId is regenerated on every page load from a single auth
// source, so a stale clinicId cannot persist across logout/relogin.
//
// Pages that need to query a different clinic (admin cross-clinic
// tooling, when it exists) can still override by passing `clinicId`
// explicitly in their request params; the interceptor only injects
// when the param is absent.
let activeClinicId = null;
export const setActiveClinicId = (id) => { activeClinicId = id || null; };
export const getActiveClinicId = () => activeClinicId;

// Request interceptor - add auth token and scope data calls to the
// active clinic so a single user cannot accidentally (or otherwise)
// pull records belonging to a clinic they are not signed in to.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Only attach the clinic scope on data-bearing requests. Auth and
  // socket-bootstrap endpoints must stay unscoped.
  const url = config.url || '';
  const isDataCall = !url.startsWith('/auth/') && !url.includes('://');
  if (isDataCall && activeClinicId) {
    config.params = { ...(config.params || {}), clinicId: activeClinicId };
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.token}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
