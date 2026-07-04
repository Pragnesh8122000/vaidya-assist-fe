// Vitest setup — registers jest-dom matchers and provides a stub for
// import.meta.env so tests don't crash when modules read VITE_* vars.
import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Reset DOM and mocks between tests.
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

// Default import.meta.env values used across the app. Individual tests can
// override via vi.stubEnv before importing the module under test.
if (typeof import.meta.env.VITE_API_URL === 'undefined') {
  import.meta.env.VITE_API_URL = 'http://localhost:5050/api';
  import.meta.env.VITE_AGENT_API_URL = 'http://localhost:4000/api';
  import.meta.env.VITE_SOCKET_URL = 'http://localhost:5050';
}
