import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { getSocket } from '../socket/socket';
import PatientHistoryDrawer from '../components/PatientHistoryDrawer';
import PrescriptionDialog from '../components/PrescriptionDialog';

const statusColors = {
  Waiting: 'warning',
  'In Consultation': 'info',
  Completed: 'success',
  Cancelled: 'error',
};
const statuses = ['Waiting', 'In Consultation', 'Completed', 'Cancelled'];
const queueColumns = ['Waiting', 'In Consultation', 'Completed'];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Compare an appointment date (stored as UTC midnight) to today in YYYY-MM-DD form.
const aptDateMatchesToday = (apt) => {
  if (!apt.date) return false;
  const d = new Date(apt.date);
  const y = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  return y === todayStr();
};

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerPatient, setDrawerPatient] = useState(null);
  const [prescriptionApt, setPrescriptionApt] = useState(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const today = todayStr();
      let list = [];
      // Try server-side date filter first.
      try {
        const { data } = await api.get('/appointments', { params: { date: today, limit: 100 } });
        list = data.data || [];
        // If the backend ignores `date`, filter client-side.
        const sameDay = list.filter(aptDateMatchesToday);
        if (sameDay.length > 0 || list.length === 0) {
          list = sameDay.length > 0 ? sameDay : list;
        }
      } catch {
        list = [];
      }

      // Fallback: if the date filter returned nothing useful, fetch a page and filter client-side.
      if (list.length === 0) {
        try {
          const { data } = await api.get('/appointments', { params: { limit: 100 } });
          list = (data.data || []).filter(aptDateMatchesToday);
        } catch {
          list = [];
        }
      }

      // Sort by time ascending
      list.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      setAppointments(list);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.on('appointment:updated', () => fetchAppointments());
      socket.on('appointment:created', () => fetchAppointments());
      socket.on('appointment:deleted', () => fetchAppointments());
      socket.on('prescription:updated', () => fetchAppointments());
      return () => {
        socket.off('appointment:updated');
        socket.off('appointment:created');
        socket.off('appointment:deleted');
        socket.off('prescription:updated');
      };
    }
  }, [fetchAppointments]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      toast.success(`Status changed to ${status}`);
      fetchAppointments();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const advanceStatus = (apt) => {
    const idx = statuses.indexOf(apt.status);
    // Cycle up to "Completed"; stop before "Cancelled" (last index) like Appointments.jsx.
    if (idx < statuses.length - 2) {
      handleStatusChange(apt._id, statuses[idx + 1]);
    }
  };

  const todaysList = appointments;
  const counts = {
    Waiting: appointments.filter((a) => a.status === 'Waiting').length,
    'In Consultation': appointments.filter((a) => a.status === 'In Consultation').length,
    Completed: appointments.filter((a) => a.status === 'Completed').length,
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4">Doctor Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/appointments')}>
            New Appointment
          </Button>
          <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={() => navigate('/patients')}>
            Add Patient
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {queueColumns.map((col) => (
          <Grid size={{ xs: 12, sm: 4 }} key={col}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">{col}</Typography>
                  <Typography variant="h4" fontWeight={700}>{counts[col]}</Typography>
                </Box>
                <Chip label="today" size="small" color={statusColors[col]} variant="outlined" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Today's appointment timeline */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AccessTimeIcon color="primary" />
                <Typography variant="h6">Today's Timeline</Typography>
              </Box>
              <Divider sx={{ mb: 1 }} />
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
              ) : todaysList.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No appointments scheduled for today.
                </Typography>
              ) : (
                <List dense>
                  {todaysList.map((apt) => (
                    <ListItem key={apt._id} disablePadding divider>
                      <ListItemButton
                        onClick={() => setDrawerPatient(apt.patient?._id || null)}
                        sx={{ py: 1 }}
                      >
                        <Box sx={{ width: 64, flexShrink: 0, textAlign: 'center' }}>
                          <Typography variant="body2" fontWeight={600}>{apt.time || '--:--'}</Typography>
                        </Box>
                        <ListItemText
                          primary={apt.patient?.name || 'Unknown patient'}
                          secondary={apt.reason || ''}
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                        <Chip
                          label={apt.status}
                          color={statusColors[apt.status]}
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            advanceStatus(apt);
                          }}
                          sx={{ cursor: 'pointer' }}
                        />
                        {apt.patient?._id && (
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); setDrawerPatient(apt.patient._id); }}
                            sx={{ ml: 1 }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        )}
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Patient queue kanban */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Patient Queue</Typography>
              {queueColumns.map((col) => (
                <Box key={col} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2" color="text.secondary">{col}</Typography>
                    <Chip label={counts[col]} size="small" color={statusColors[col]} variant="outlined" />
                  </Box>
                  <Divider sx={{ mb: 1 }} />
                  {appointments.filter((a) => a.status === col).length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ pl: 1, py: 0.5 }}>—</Typography>
                  ) : (
                    appointments
                      .filter((a) => a.status === col)
                      .map((apt) => (
                        <Box
                          key={apt._id}
                          sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 2,
                            p: 1,
                            mb: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {apt.patient?.name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {apt.time ? apt.time : ''}{apt.reason ? ` · ${apt.reason}` : ''}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={0.5}>
                            {apt.patient?._id && (
                              <IconButton size="small" onClick={() => setDrawerPatient(apt.patient._id)}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            )}
                            {col !== 'Completed' && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => advanceStatus(apt)}
                                sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: 12 }}
                              >
                                Advance
                              </Button>
                            )}
                            {col === 'Completed' && (
                              <Button
                                size="small"
                                variant={apt.prescription ? 'outlined' : 'contained'}
                                color={apt.prescription ? 'success' : 'primary'}
                                startIcon={<EditNoteIcon sx={{ fontSize: 16 }} />}
                                onClick={() => setPrescriptionApt(apt)}
                                sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: 12 }}
                              >
                                {apt.prescription ? 'Edit Rx' : 'Write Rx'}
                              </Button>
                            )}
                          </Stack>
                        </Box>
                      ))
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <PatientHistoryDrawer
        patientId={drawerPatient}
        open={Boolean(drawerPatient)}
        onClose={() => setDrawerPatient(null)}
      />

      <PrescriptionDialog
        open={Boolean(prescriptionApt)}
        appointment={prescriptionApt}
        onClose={() => setPrescriptionApt(null)}
        onSaved={fetchAppointments}
      />
    </Box>
  );
};

export default DoctorDashboard;