import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Tooltip from '@mui/material/Tooltip';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { getSocket } from '../socket/socket';

// §3.2 (OQ#3=Option B): 'Confirmed' added to match the backend enum. A
// confirmed appointment is one staff has accepted from the Waiting queue —
// render it as 'info' (distinct from the yellow Waiting badge).
const statusColors = { Waiting: 'warning', Confirmed: 'info', 'In Consultation': 'info', Completed: 'success', Cancelled: 'error' };
const statuses = ['Waiting', 'Confirmed', 'In Consultation', 'Completed', 'Cancelled'];

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ patient: '', date: '', time: '', status: 'Waiting', reason: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/appointments', { params });
      setAppointments(data.data);
      setTotal(data.pagination.total);
    } catch (err) { toast.error('Failed to load appointments'); }
    setLoading(false);
  }, [page, statusFilter]);

  const filteredAppointments = appointments.filter((apt) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      apt.patient?.name?.toLowerCase().includes(term) ||
      apt.reason?.toLowerCase().includes(term) ||
      apt.status?.toLowerCase().includes(term)
    );
  });

  const fetchPatients = async () => {
    try {
      const { data } = await api.get('/patients?limit=100');
      setPatients(data.data);
    } catch (err) { /* ignore */ }
  };

  useEffect(() => { fetchAppointments(); fetchPatients(); }, [fetchAppointments]);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.on('appointment:updated', () => fetchAppointments());
      socket.on('appointment:created', () => fetchAppointments());
      socket.on('appointment:deleted', () => fetchAppointments());
      return () => {
        socket.off('appointment:updated');
        socket.off('appointment:created');
        socket.off('appointment:deleted');
      };
    }
  }, [fetchAppointments]);

  const handleSubmit = async () => {
    if (!form.patient || !form.date || !form.time) {
      toast.error('Patient, date and time are required');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/appointments/${editing._id}`, form);
        toast.success('Appointment updated');
      } else {
        await api.post('/appointments', form);
        toast.success('Appointment created');
      }
      setDialogOpen(false);
      setEditing(null);
      setForm({ patient: '', date: '', time: '', status: 'Waiting', reason: '', notes: '' });
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (apt) => {
    setEditing(apt);
    // Stored dates are UTC midnight; build the edit date from UTC components
    // so the input shows the original calendar day in every timezone.
    const d = apt.date ? new Date(apt.date) : null;
    const dateStr = d
      ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
      : '';
    setForm({
      patient: apt.patient?._id || '',
      date: dateStr,
      time: apt.time, status: apt.status, reason: apt.reason || '', notes: apt.notes || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this appointment?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      toast.success('Appointment deleted');
      fetchAppointments();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      toast.success(`Status changed to ${status}`);
      fetchAppointments();
    } catch (err) { toast.error('Failed to update status'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Appointments</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setForm({ patient: '', date: '', time: '', status: 'Waiting', reason: '', notes: '' }); setDialogOpen(true); }}>
          New Appointment
        </Button>
      </Box>

      <Card>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }} sx={{ minWidth: 200 }} />
          <TextField size="small" select label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150 }}>
            <MenuItem value="">All</MenuItem>
            {statuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={24} /></TableCell></TableRow>
              ) : filteredAppointments.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center">No appointments found</TableCell></TableRow>
              ) : (
                filteredAppointments.map((apt) => (
                  <TableRow key={apt._id} hover>
                    <TableCell>
                      <Tooltip title={apt.displayId ? 'Click to copy' : 'No code yet'} placement="top">
                        <Box
                          component="code"
                          onClick={() => apt.displayId && navigator.clipboard?.writeText(apt.displayId)}
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: 12,
                            cursor: apt.displayId ? 'pointer' : 'default',
                            color: apt.displayId ? 'text.primary' : 'text.disabled',
                            '&:hover': apt.displayId ? { color: 'primary.main' } : undefined,
                          }}
                        >
                          {apt.displayId || '—'}
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{apt.patient?.name || 'N/A'}</TableCell>
                    <TableCell>{new Date(apt.date).toLocaleDateString()}</TableCell>
                    <TableCell>{apt.time}</TableCell>
                    <TableCell>{apt.reason}</TableCell>
                    <TableCell>
                      <Chip label={apt.status} color={statusColors[apt.status]} size="small" onClick={() => {
                        const idx = statuses.indexOf(apt.status);
                        if (idx < statuses.length - 2) handleStatusChange(apt._id, statuses[idx + 1]);
                      }} sx={{ cursor: 'pointer' }} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleEdit(apt)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(apt._id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={10} rowsPerPageOptions={[10]} />
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Appointment' : 'New Appointment'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField select fullWidth label="Patient" value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} required>
                {patients.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Date"
                value={form.date ? dayjs(form.date) : null}
                onChange={(newValue) => setForm({ ...form, date: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                minDate={dayjs().startOf('day')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    slotProps: { input: { startAdornment: <InputAdornment position="start"><CalendarMonthIcon color="action" /></InputAdornment> } }
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TimePicker
                label="Time"
                value={form.time ? dayjs(form.time, 'HH:mm') : null}
                onChange={(newValue) => setForm({ ...form, time: newValue ? newValue.format('HH:mm') : '' })}
                ampm={false}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    slotProps: { input: { startAdornment: <InputAdornment position="start"><AccessTimeIcon color="action" /></InputAdornment> } }
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField select fullWidth label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {statuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Notes" multiline rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : (editing ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Appointments;
