import { createSlice } from '@reduxjs/toolkit';

/**
 * @typedef {Object} UiState
 * @property {boolean} sidebarOpen
 * @property {boolean} darkMode
 */

/** @type {UiState} */
const initialState = {
  sidebarOpen: true,
  darkMode: typeof window !== 'undefined' && localStorage.getItem('darkMode') === 'true',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      if (typeof window !== 'undefined') {
        localStorage.setItem('darkMode', String(state.darkMode));
      }
    },
  },
});

export const { toggleSidebar, toggleDarkMode } = uiSlice.actions;
export default uiSlice.reducer;
