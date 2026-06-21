import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import uiReducer from '../features/uiSlice';
import agentChatReducer from '../features/agentChatSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    agentChat: agentChatReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
