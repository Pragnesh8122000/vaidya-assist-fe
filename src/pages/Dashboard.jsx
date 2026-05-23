import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import WarningIcon from '@mui/icons-material/Warning';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/axios';
import AnimatedStatCard from '../components/AnimatedStatCard';
import AnimatedChartCard from '../components/AnimatedChartCard';

const COLORS = ['#1565C0', '#42A5F5', '#00897B', '#F57F17', '#C62828', '#7B1FA2'];

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
          <AnimatedStatCard title="Total Patients" value={stats?.totalPatients || 0} icon={<PeopleIcon sx={{ color: '#1565C0' }} />} color="#1565C0" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <AnimatedStatCard title="Today's Appointments" value={stats?.todayAppointments || 0} icon={<CalendarMonthIcon sx={{ color: '#00897B' }} />} color="#00897B" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <AnimatedStatCard title="Pending" value={stats?.pendingAppointments || 0} icon={<HourglassTopIcon sx={{ color: '#F57F17' }} />} color="#F57F17" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <AnimatedStatCard title="Total Medicines" value={stats?.totalMedicines || 0} icon={<MedicalServicesIcon sx={{ color: '#7B1FA2' }} />} color="#7B1FA2" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <AnimatedStatCard title="Low Stock" value={stats?.lowStockMedicines || 0} icon={<WarningIcon sx={{ color: '#C62828' }} />} color="#C62828" subtitle="Need restock" />
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
                <Bar dataKey="count" fill="#1565C0" name="Total" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#00897B" name="Completed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" fill="#C62828" name="Cancelled" radius={[4, 4, 0, 0]} />
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
                <Line type="monotone" dataKey="visits" stroke="#1565C0" strokeWidth={2} name="Total Visits" />
                <Line type="monotone" dataKey="uniquePatients" stroke="#00897B" strokeWidth={2} name="Unique Patients" />
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
                <Bar dataKey="totalStock" fill="#42A5F5" name="Stock" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </AnimatedChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
