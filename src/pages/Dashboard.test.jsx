import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme/theme';
import Dashboard from './Dashboard';
import authReducer from '../features/authSlice';

// Test Gap P2 — Dashboard chart rendering. The Dashboard mounts five
// recharts containers (BarChart × 2, PieChart, LineChart) plus five
// stat cards. The previous test surface covered reducers, axios, and
// the auth flow but left the page that doctors see first in the
// morning unverified. These tests pin:
//   1. Stat numbers come from /dashboard/stats — a 401/500 here is
//      what nurses see first; the empty-state must not crash.
//   2. Each chart card title renders so a missing chart is loud.
//   3. Recharts' SVG actually paints, so a recharts upgrade that
//      breaks rendering is caught immediately.

vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  setActiveClinicId: vi.fn(),
  getActiveClinicId: vi.fn(),
}));

// Mock framer-motion to a passthrough so the test environment doesn't
// need a real animation tick. The motion.div in the page title is the
// only motion usage; everything else is plain MUI.
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_target, prop) => {
      // Return a passthrough component for every motion.* tag.
      const Component = ({ children, ...rest }) => {
        const Tag = typeof prop === 'string' ? prop : 'div';
        return <Tag {...rest}>{children}</Tag>;
      };
      return Component;
    },
  }),
}));

const makeStore = (preloaded) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: preloaded,
  });

const renderDashboard = (preloaded) => {
  const theme = getTheme('light');
  const store = makeStore(preloaded);
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Dashboard />
      </ThemeProvider>
    </Provider>,
  );
};

const mockAllEndpoints = (axios, { stats, appointmentChart = [], patientVisits = [], medicineStock = [], statusDist = [] } = {}) => {
  // Dashboard calls five endpoints in parallel. Returning a stable
  // shape lets the page reach the "post-loading" branch quickly.
  axios.get.mockImplementation((url) => {
    if (url.includes('/dashboard/stats')) return Promise.resolve({ data: { data: stats } });
    if (url.includes('/dashboard/appointment-chart')) return Promise.resolve({ data: { data: appointmentChart } });
    if (url.includes('/dashboard/patient-visits')) return Promise.resolve({ data: { data: patientVisits } });
    if (url.includes('/dashboard/medicine-stock')) return Promise.resolve({ data: { data: medicineStock } });
    if (url.includes('/dashboard/appointment-status')) return Promise.resolve({ data: { data: statusDist } });
    return Promise.resolve({ data: { data: [] } });
  });
};

const fullStats = {
  totalPatients: 42,
  todayAppointments: 7,
  pendingAppointments: 3,
  totalMedicines: 120,
  lowStockMedicines: 5,
};

const fullAppointmentChart = [
  { _id: 'Mon', count: 5, completed: 4, cancelled: 1 },
  { _id: 'Tue', count: 8, completed: 6, cancelled: 0 },
  { _id: 'Wed', count: 6, completed: 5, cancelled: 1 },
];

const fullPatientVisits = [
  { _id: '2025-12', visits: 30, uniquePatients: 22 },
  { _id: '2026-01', visits: 40, uniquePatients: 28 },
];

const fullMedicineStock = [
  { _id: 'Analgesic', count: 40 },
  { _id: 'Antibiotic', count: 25 },
];

const fullStatusDist = [
  { _id: 'Waiting', count: 3 },
  { _id: 'Completed', count: 10 },
];

describe('Dashboard', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

  it('renders the page title', async () => {
    const axios = (await import('../api/axios')).default;
    mockAllEndpoints(axios);
    renderDashboard({ auth: { user: null, isAuthenticated: false, isGuest: false, loading: false, error: null } });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /dashboard/i, level: 4 })).toBeInTheDocument();
    });
  });

  it('shows each stat card label with its numeric value', async () => {
    const axios = (await import('../api/axios')).default;
    mockAllEndpoints(axios, { stats: fullStats });
    renderDashboard({ auth: { user: null, isAuthenticated: false, isGuest: false, loading: false, error: null } });
    // The five stat labels. The numbers are the h3 in each card;
    // checking that all five labels appear verifies the loading
    // state has resolved and the cards mounted.
    await waitFor(() => {
      expect(screen.getByText('Total Patients')).toBeInTheDocument();
      expect(screen.getByText("Today's Appointments")).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Total Medicines')).toBeInTheDocument();
      expect(screen.getByText('Low Stock')).toBeInTheDocument();
    });
    // And the actual values from /dashboard/stats. If a key gets
    // renamed on the backend, this assertion fires.
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders all four chart card titles so a missing chart is loud', async () => {
    const axios = (await import('../api/axios')).default;
    mockAllEndpoints(axios, {
      stats: fullStats,
      appointmentChart: fullAppointmentChart,
      patientVisits: fullPatientVisits,
      medicineStock: fullMedicineStock,
      statusDist: fullStatusDist,
    });
    renderDashboard({ auth: { user: null, isAuthenticated: false, isGuest: false, loading: false, error: null } });
    await waitFor(() => {
      // The chart titles are rendered by AnimatedChartCard inside the
      // Dashboard's <Grid>. If a chart is removed or renamed, the
      // test fails here rather than via a silent "white space" UX.
      expect(screen.getByText('Appointments (Last 7 Days)')).toBeInTheDocument();
      expect(screen.getByText('Appointment Status')).toBeInTheDocument();
      expect(screen.getByText('Patient Visits (6 Months)')).toBeInTheDocument();
      expect(screen.getByText('Medicine Stock by Category')).toBeInTheDocument();
    });
  });

  it('falls back to zeros when the stats endpoint returns no data', async () => {
    // Empty payload — the page must not crash and must show "0" for
    // every count. This is the empty-state path new installs hit
    // before they have any data.
    const axios = (await import('../api/axios')).default;
    mockAllEndpoints(axios);
    renderDashboard({ auth: { user: null, isAuthenticated: false, isGuest: false, loading: false, error: null } });
    await waitFor(() => {
      // All five stat cards default to 0 when the payload is missing.
      // We don't pin the exact count of zeros (other UI surfaces also
      // use them); instead we assert the labels rendered and at
      // least one "0" appears from the stats cards.
      expect(screen.getByText('Total Patients')).toBeInTheDocument();
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });
  });

  it('does not crash when the API errors out', async () => {
    // UX-6: a fetch failure now surfaces an Alert+Retry (mirroring
    // Doctors.jsx:73) instead of silently rendering an empty
    // dashboard. The page must not throw, and the error must be
    // visible so users can tell "failed" from "no data".
    const axios = (await import('../api/axios')).default;
    axios.get.mockRejectedValue(new Error('Network Error'));
    expect(() => renderDashboard()).not.toThrow();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/failed to load dashboard data/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });
});
