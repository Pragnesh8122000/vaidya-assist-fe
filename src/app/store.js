import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import uiReducer from '../features/uiSlice';
import agentChatReducer from '../features/agentChatSlice';

/**
 * Root Redux store. Three slices:
 *   - auth:        user, token lifecycle, role-based access
 *   - ui:          sidebar + dark-mode UI preferences
 *   - agentChat:   the staff-side assistant widget state
 *
 * The `serializableCheck: false` middleware override is intentional:
 * the agent chat carries `dayjs` objects and conversation-state
 * payloads that are not strictly JSON-serialisable. Disabling the
 * check is a documented trade-off; we accept it because the chat
 * state is ephemeral and never persisted.
 *
 * @typedef {Object} RootState
 * @property {import('../features/authSlice').AuthState} auth
 * @property {import('../features/uiSlice').UiState} ui
 * @property {import('../features/agentChatSlice').AgentChatState} agentChat
 */
const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    agentChat: agentChatReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
