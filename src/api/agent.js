import axios from 'axios';

const AGENT_API_URL = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:4000/api';

const agentApi = axios.create({
  baseURL: AGENT_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add auth token
agentApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor - handle token expiry the same way as the main API
agentApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'https://vaidya-assist-be.onrender.com/api'}/auth/refresh-token`,
          { refreshToken }
        );
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.token}`;
        return agentApi(originalRequest);
      } catch (err) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Send a message to the Vaidya Assist agent.
 *
 * @param {string} message - the user's current message
 * @param {Array<{role: 'user'|'assistant', content: string}>} [history] - conversation history
 * @returns {Promise<{content: string, toolCalled: boolean, toolName?: string}>}
 */
export async function sendAgentMessage(message, history = []) {
  const { data } = await agentApi.post('/agent/message', { message, history });
  return data.data;
}

export default agentApi;
