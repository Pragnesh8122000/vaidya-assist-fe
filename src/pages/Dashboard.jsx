import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import WarningIcon from '@mui/icons-material/Warning';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/axios';
import AnimatedChartCard from '../components/AnimatedChartCard';

// Warm Manuscript palette swatches — clinical green, sage, turmeric amber,
// saffron, ink red, antique brass. Each maps cleanly to a theme token.
const COLORS = ['#3D5A4C', '#4F7260', '#C8862A', '#B26A00', '#A23A2F', '#8E6B3A'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [appointmentChart, setAppointmentChart] = useState([]);
  const [patientVisits, setPatientVisits] = useState([]);
  const [medicineStock, setMedicineStock] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <Box>
      <motion.div initial="hidden" animate="visible" variants={headerVariants}>
        <Typography variant="h4" gutterBottom>Dashboard</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Welcome to your clinic management overview</Typography>
      </motion.div>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Total Patients</Typography>
                  <Typography variant="h3" fontWeight={700} sx={{ color: '#3D5A4C' }}>{stats?.totalPatients || 0}</Typography>
                </Box>
                <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: 'rgba(61,90,76,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PeopleIcon sx={{ color: '#3D5A4C' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Today's Appointments</Typography>
                  <Typography variant="h3" fontWeight={700} sx={{ color: '#4F7260' }}>{stats?.todayAppointments || 0}</Typography>
                </Box>
                <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: 'rgba(79,114,96,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarMonthIcon sx={{ color: '#4F7260' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Pending</Typography>
                  <Typography variant="h3" fontWeight={700} sx={{ color: '#C8862A' }}>{stats?.pendingAppointments || 0}</Typography>
                </Box>
                <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: 'rgba(200,134,42,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HourglassTopIcon sx={{ color: '#C8862A' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Total Medicines</Typography>
                  <Typography variant="h3" fontWeight={700} sx={{ color: '#8E6B3A' }}>{stats?.totalMedicines || 0}</Typography>
                </Box>
                <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: 'rgba(142,107,58,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MedicalServicesIcon sx={{ color: '#8E6B3A' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Low Stock</Typography>
                  <Typography variant="h3" fontWeight={700} sx={{ color: '#A23A2F' }}>{stats?.lowStockMedicines || 0}</Typography>
                  <Typography variant="caption" color="text.secondary">Need restock</Typography>
                </Box>
                <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: 'rgba(162,58,47,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <WarningIcon sx={{ color: '#A23A2F' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
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
                <Bar dataKey="count" fill="#3D5A4C" name="Total" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#4F7260" name="Completed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" fill="#A23A2F" name="Cancelled" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </AnimatedChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <AnimatedChartCard title="Appointment Status" delay={0.3}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusDist} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={100} label={({ _id, count }) => `${_id}: ${count}`}>
                  {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
                <Line type="monotone" dataKey="visits" stroke="#3D5A4C" strokeWidth={2} name="Total Visits" />
                <Line type="monotone" dataKey="uniquePatients" stroke="#C8862A" strokeWidth={2} name="Unique Patients" />
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
                <Bar dataKey="totalStock" fill="#4F7260" name="Stock" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </AnimatedChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
