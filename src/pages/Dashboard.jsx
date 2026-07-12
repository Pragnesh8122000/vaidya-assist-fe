import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import WarningIcon from '@mui/icons-material/Warning';
import SyncIcon from '@mui/icons-material/Sync';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/axios';
import AnimatedChartCard from '../components/AnimatedChartCard';
import { GUEST_DASHBOARD_STATS } from '../constants/guestData';

// A11Y-6 fix: the previous "COLORS" array was 6 hardcoded hex strings
// that re-asserted the warm-manuscript palette inline, which (a)
// meant dark mode painted chart slices with light-mode hex, and (b)
// was unreachable from the theme. Now the chart series resolve to
// the same tokens the theme defines for primary/info/accent/brass/
// danger. The pie `COLORS` array is kept as a fallback for slice
// ordering but sourced from the theme at render time.
const STAT_TOKENS = ['statPrimary', 'statInfo', 'statAccent', 'statBrass', 'statDanger'];

const Dashboard = () => {
  const theme = useTheme();
  const { isGuest } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [appointmentChart, setAppointmentChart] = useState([]);
  const [patientVisits, setPatientVisits] = useState([]);
  const [medicineStock, setMedicineStock] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Guest mode: use static data, no API calls
  useEffect(() => {
    if (isGuest) {
      setStats(GUEST_DASHBOARD_STATS);
      setAppointmentChart(GUEST_DASHBOARD_STATS.appointmentChart);
      setStatusDist(GUEST_DASHBOARD_STATS.statusDist);
      setPatientVisits([]);
      setMedicineStock([]);
      setLoading(false);
      return;
    }
  }, [isGuest]);

  // UX-6: previously the catch block swallowed errors silently and the
  // page rendered an empty-looking dashboard — indistinguishable from
  // "no data". Now a failure surfaces an Alert with a Retry button,
  // mirroring the Doctors.jsx:73 pattern. The raw axios error is still
  // not logged (SEC-5: it carries the bearer token in config.headers).
  const fetchData = useCallback(async () => {
    if (isGuest) return; // Guest data loaded above
    setLoading(true);
    setError(null);
    try {
      const [s, a, p, m, st] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/appointment-chart?days=7'),
        api.get('/dashboard/patient-visits?months=6'),
        api.get('/dashboard/medicine-stock'),
        api.get('/dashboard/appointment-status'),
      ]);
      setStats(s.data.data);
      setAppointmentChart(a.data.data);
      setPatientVisits(p.data.data);
      setMedicineStock(m.data.data);
      setStatusDist(st.data.data);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, isGuest]);

  if (loading) {
    // UX-6: skeleton cards instead of a bare spinner so the layout
    // doesn't jump when data resolves.
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Skeleton height={40} width={180} />
          <Skeleton height={24} width={320} />
        </Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={i}>
              <Card><CardContent><Skeleton variant="rectangular" height={88} /></CardContent></Card>
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid size={{ xs: 12, md: 6 }} key={i}>
              <Card><CardContent><Skeleton variant="rectangular" height={300} /></CardContent></Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={<Button color="inherit" size="small" startIcon={<SyncIcon />} onClick={fetchData}>Retry</Button>}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  // A11Y-6 fix: stat-card definitions. Each entry names a theme token
  // (statPrimary / statInfo / statAccent / statBrass / statDanger)
  // instead of inlining rgba/hex. The fg/bg pair is defined once in
  // theme.js so a palette change or dark-mode flip is a one-line edit.
  // The 0.16-alpha swatches replaced 0.12-alpha ones that failed
  // WCAG 1.4.11 (non-text contrast) at 1.4:1.
  const swatch = (name) => theme.palette[name];
  const STATS = [
    { label: 'Total Patients',         value: stats?.totalPatients,        icon: <PeopleIcon />,           token: 'statPrimary' },
    { label: "Today's Appointments",   value: stats?.todayAppointments,    icon: <CalendarMonthIcon />,    token: 'statInfo'    },
    { label: 'Pending',                value: stats?.pendingAppointments,  icon: <HourglassTopIcon />,     token: 'statAccent'  },
    { label: 'Total Medicines',        value: stats?.totalMedicines,       icon: <MedicalServicesIcon />,  token: 'statBrass'   },
    { label: 'Low Stock',              value: stats?.lowStockMedicines,    icon: <WarningIcon />,          token: 'statDanger',  caption: 'Need restock' },
  ];

  // Chart series. Resolved at render so dark mode picks up the
  // mode-correct foreground without inline conditionals.
  const cPrimary = swatch('statPrimary').fg;
  const cInfo    = swatch('statInfo').fg;
  const cAccent  = swatch('statAccent').fg;
  const cBrass   = swatch('statBrass').fg;
  const cDanger  = swatch('statDanger').fg;
  // Pie slices cycle through the 5 stat tokens. Status charts rarely
  // surface more than 5 distinct values, but the modulo handles it.
  const PIE_FG = [cPrimary, cInfo, cAccent, cBrass, cDanger];

  return (
    <Box>
      <motion.div initial="hidden" animate="visible" variants={headerVariants}>
        <Typography variant="h4" gutterBottom>Dashboard</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Welcome to your clinic management overview</Typography>
      </motion.div>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {STATS.map((s) => {
          const c = swatch(s.token);
          // Clone the icon element with the swatch's foreground color
          // applied via sx. The icon's source component is stateless,
          // so cloning it per-row is cheap and keeps the swatch tokens
          // as the single source of truth.
          const IconEl = s.icon
            ? { ...s.icon, props: { ...(s.icon.props || {}), sx: { color: c.fg } } }
            : null;
          return (
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={s.label}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>{s.label}</Typography>
                      <Typography variant="h3" fontWeight={700} sx={{ color: c.fg }}>{s.value || 0}</Typography>
                      {s.caption && <Typography variant="caption" color="text.secondary">{s.caption}</Typography>}
                    </Box>
                    <Box
                      sx={{
                        width: 48, height: 48, borderRadius: '12px',
                        // theme.palette.stat*.bg is a string in rgba()
                        // form (e.g. "rgba(61,90,76,0.16)"). Passing
                        // the raw string is intentional — sx accepts
                        // any valid CSS background value and we don't
                        // need to muck with MUI's alpha() helper on
                        // the consumer side.
                        bgcolor: c.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {IconEl}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <AnimatedChartCard title="Appointments (Last 7 Days)" delay={0.2}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={appointmentChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill={cPrimary} name="Total" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill={cInfo} name="Completed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" fill={cDanger} name="Cancelled" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </AnimatedChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <AnimatedChartCard title="Appointment Status" delay={0.3}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusDist} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={100} label={({ _id, count }) => `${_id}: ${count}`}>
                  {statusDist.map((_, i) => <Cell key={i} fill={PIE_FG[i % PIE_FG.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </AnimatedChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <AnimatedChartCard title="Patient Visits (6 Months)" delay={0.4}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={patientVisits}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="visits" stroke={cPrimary} strokeWidth={2} name="Total Visits" />
                <Line type="monotone" dataKey="uniquePatients" stroke={cAccent} strokeWidth={2} name="Unique Patients" />
              </LineChart>
            </ResponsiveContainer>
          </AnimatedChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <AnimatedChartCard title="Medicine Stock by Category" delay={0.5}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={medicineStock} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="_id" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="totalStock" fill={cInfo} name="Stock" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </AnimatedChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
