import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import api from '../api/axios';

const statusColors = {
  Waiting: 'warning',
  'In Consultation': 'info',
  Completed: 'success',
  Cancelled: 'error',
};

const PatientHistoryDrawer = ({ patientId, open, onClose }) => {
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patientId || !open) return;
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        // Patient detail (includes medicalNotes on the model)
        const { data: pRes } = await api.get(`/patients/${patientId}`);
        if (cancelled) return;
        setPatient(pRes.data || pRes);

        // Appointments for this patient. Try server-side patient filter first;
        // fall back to client-side filtering if the backend ignores the param.
        let apts = [];
        try {
          const { data: aRes } = await api.get('/appointments', {
            params: { patient: patientId, limit: 100 },
          });
          apts = aRes.data || [];
          const filtered = apts.filter(
            (a) => a.patient?._id === patientId || a.patient === patientId
          );
          if (filtered.length > 0) apts = filtered;
        } catch {
          apts = [];
        }
        if (!cancelled) setAppointments(apts);
      } catch {
        if (!cancelled) {
          setPatient(null);
          setAppointments([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [patientId, open]);

  const notes = patient?.medicalNotes || [];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 420, md: 460 } } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          <Typography variant="h6">Patient History</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </Box>
      <Divider />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : !patient ? (
        <Box sx={{ p: 3 }}><Typography color="text.secondary">Unable to load patient.</Typography></Box>
      ) : (
        <Box sx={{ p: 2, overflow: 'auto' }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>{patient.name}</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              {patient.age && <Chip label={`${patient.age} yrs`} size="small" variant="outlined" />}
              {patient.gender && <Chip label={patient.gender} size="small" variant="outlined" />}
              {patient.bloodGroup && <Chip label={patient.bloodGroup} size="small" variant="outlined" />}
            </Box>
            {patient.phone && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{patient.phone}</Typography>
            )}
          </Box>

          <Divider sx={{ my: 1.5 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CalendarMonthIcon fontSize="small" color="action" />
            <Typography variant="subtitle2" fontWeight={600}>Recent Visits</Typography>
          </Box>
          {appointments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No appointments on record.</Typography>
          ) : (
            <List dense sx={{ mb: 2 }}>
              {appointments.slice(0, 15).map((apt) => (
                <ListItem key={apt._id} disableGutters>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" component="span">
                          {apt.date ? new Date(apt.date).toLocaleDateString() : '—'}
                        </Typography>
                        <Chip
                          label={apt.status}
                          color={statusColors[apt.status]}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={apt.reason || apt.time || ''}
                  />
                </ListItem>
              ))}
            </List>
          )}

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Medical Notes</Typography>
          {notes.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No notes recorded.</Typography>
          ) : (
            <List dense>
              {notes.map((n, i) => (
                <ListItem key={i} disableGutters>
                  <ListItemText
                    primary={n.note}
                    secondary={n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}
    </Drawer>
  );
};

export default PatientHistoryDrawer;