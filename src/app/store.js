import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import uiReducer from '../features/uiSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
